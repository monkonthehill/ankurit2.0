import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiUserPlus, 
  FiCheck, 
  FiClock,
  FiBell,
  FiX
} from 'react-icons/fi';
import placeholderUser from '../../assets/images/images.jpeg';
import './Notification.css';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersData, setUsersData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const fetchNotifications = async () => {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', auth.currentUser.uid),
        where('type', '!=', 'message'),
        orderBy('type'),
        orderBy('timestamp', 'desc')
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const notificationsData = [];
        const usersToFetch = new Set();

        for (const doc of snapshot.docs) {
          const notification = {
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
          };
          notificationsData.push(notification);
          
          if (notification.fromUserId) {
            usersToFetch.add(notification.fromUserId);
          }
        }

        // Fetch user data for all senders
        const usersData = {};
        const userFetchPromises = Array.from(usersToFetch).map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              usersData[userId] = {
                name: userDoc.data().name || userDoc.data().displayName || 'User',
                photo: userDoc.data().profilePhoto || userDoc.data().photoURL || placeholderUser
              };
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            usersData[userId] = {
              name: 'User',
              photo: placeholderUser
            };
          }
        });

        await Promise.all(userFetchPromises);
        setUsersData(usersData);
        setNotifications(notificationsData);
        setLoading(false);

        // Mark all unread notifications as read
        const markAsReadPromises = notificationsData
          .filter(notification => !notification.read)
          .map(async (notification) => {
            const notificationRef = doc(db, 'notifications', notification.id);
            await updateDoc(notificationRef, { read: true });
          });
        
        await Promise.all(markAsReadPromises);
      });

      return unsubscribe;
    };

    fetchNotifications();
  }, [navigate]);

  const getImageKitUrl = (url) => {
    if (!url) return placeholderUser;
    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    
    if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    return 'just now';
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return <FiUserPlus className="notification-icon follow" />;
      default:
        return <FiBell className="notification-icon default" />;
    }
  };

  const getNotificationMessage = (notification) => {
    const user = usersData[notification.fromUserId] || { name: 'Someone' };
    
    switch (notification.type) {
      case 'follow':
        return `${user.name} started following you`;
      default:
        return notification.message || 'New notification';
    }
  };

  const handleNotificationClick = async (notification, e) => {
    if (e && e.target.closest('.delete-notification')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'notifications', notification.id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }

    if (notification.type === 'follow' && notification.fromUserId) {
      navigate(`/profile/${notification.fromUserId}`);
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  if (loading) {
    return (
      <div className="notification-container">
        <div className="notification-header">
          <h2><FiBell /> Notifications</h2>
        </div>
        <div className="loading-notifications">
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="notification-container">
      <div className="notification-header">
        <h2><FiBell /> Notifications</h2>
        {notifications.length > 0 && (
          <button 
            className="clear-all-btn"
            onClick={async () => {
              const deletePromises = notifications.map(notification => 
                deleteDoc(doc(db, 'notifications', notification.id))
              );
              await Promise.all(deletePromises);
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="no-notifications">
          <FiCheck className="no-notifications-icon" />
          <p>You're all caught up!</p>
          <p>No new notifications</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map(notification => {
            const user = usersData[notification.fromUserId] || { name: 'Someone', photo: placeholderUser };
            
            return (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={(e) => handleNotificationClick(notification, e)}
              >
                <div className="notification-avatar">
                  <img
                    src={getImageKitUrl(user.photo)}
                    alt={user.fullName || user.name}
                    onError={(e) => {
                      e.target.src = placeholderUser;
                    }}
                  />
                  <div className="notification-icon-container">
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                <div className="notification-content">
                  <p className="notification-message">
                    {getNotificationMessage(notification)}
                  </p>
                  <div className="notification-time">
                    <FiClock className="time-icon" />
                    {formatTimeAgo(notification.timestamp)}
                  </div>
                </div>
                <button 
                  className="delete-notification"
                  onClick={(e) => handleDeleteNotification(notification.id, e)}
                  title="Delete notification"
                >
                  <FiX />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notification;