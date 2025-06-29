import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp  // Added this import
} from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiAlertTriangle } from 'react-icons/fi';
import placeholderUser from '../../assets/images/images.jpeg';
import styles from './Chatinbox.module.css';

const ChatInbox = () => {
  const [chats, setChats] = useState([]);
  const [usersData, setUsersData] = useState({});
  const [loading, setLoading] = useState(true);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatsData = [];
      const usersToFetch = new Set();

      // Process all chats
      for (const doc of snapshot.docs) {
        const chat = { id: doc.id, ...doc.data() };
        chatsData.push(chat);
        const otherUserId = getOtherParticipant(chat.participants);
        if (otherUserId) usersToFetch.add(otherUserId);
      }

      // Fetch user data in parallel
      const usersData = {};
      const userFetchPromises = Array.from(usersToFetch).map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            usersData[userId] = {
              name: userDoc.data().name || userDoc.data().displayName || 'User',
              photo: userDoc.data().profilePhoto || placeholderUser
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
      setChats(chatsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, navigate]);

  const getOtherParticipant = (participants) => {
    return participants.find(uid => uid !== currentUser?.uid);
  };

  const getImageKitUrl = (url) => {
    if (!url) return placeholderUser;
    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
  };

  const markAsRead = async (chatId) => {
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`lastSeen.${currentUser.uid}`]: serverTimestamp()
      });
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  };

  if (loading) {
    return (
      <div className={styles.chatInboxContainer}>
        <div className={styles.header}>
          <h2><FiMessageSquare className={styles.icon} /> Your Messages</h2>
        </div>
        <div className={styles.noChats}>Loading messages...</div>
      </div>
    );
  }

  return (
    <div className={styles.chatInboxContainer}>
      <div className={styles.header}>
        <h2><FiMessageSquare className={styles.icon} /> Your Messages</h2>
      </div>
      
      {chats.length === 0 ? (
        <div className={styles.noChats}>No messages yet. Start a conversation!</div>
      ) : (
        <div className={styles.chatList}>
          {chats.map(chat => {
            const otherUserId = getOtherParticipant(chat.participants);
            const userData = usersData[otherUserId] || { 
              name: 'User', 
              photo: placeholderUser 
            };
            const isYourMessage = chat.lastSender === currentUser.uid;
            const hasUnread = !isYourMessage && 
                             (!chat.lastSeen || !chat.lastSeen[currentUser.uid] || 
                              (chat.lastSeen[currentUser.uid] && chat.updatedAt && 
                               chat.lastSeen[currentUser.uid].toDate() < chat.updatedAt.toDate()));

            return (
              <Link 
                to={`/messages/${otherUserId}`} 
                key={chat.id} 
                className={styles.chatItem}
                onClick={() => markAsRead(chat.id)}
              >
                <img
                  src={getImageKitUrl(userData.photo)}
                  alt={userData.name}
                  className={styles.userAvatar}
                  onError={(e) => {
                    e.target.src = placeholderUser;
                  }}
                />
                <div className={styles.chatContent}>
                  <h3 className={styles.userName}>{userData.name}</h3>
                  <p className={styles.lastMessage}>
                    {isYourMessage && <span className={styles.youPrefix}>You: </span>}
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
                <div>
                  <div className={styles.chatTime}>
                    {chat.updatedAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {hasUnread && <div className={styles.unreadIndicator} />}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className={styles.privacyNotice}>
        <strong><FiAlertTriangle className={styles.icon} /> Privacy Notice</strong>
        <p>All conversations are recorded for safety and may be reviewed in case of reports. 
        Please maintain respectful communication and avoid sharing sensitive information.</p>
      </div>
    </div>
  );
};

export default ChatInbox;