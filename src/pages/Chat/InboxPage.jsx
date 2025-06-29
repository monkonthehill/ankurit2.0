import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import { FiSearch, FiChevronLeft } from 'react-icons/fi';
import placeholderUser from '../../assets/images/images.jpeg';
import './InboxPage.css';

const InboxPage = () => {
  const [chats, setChats] = useState([]);
  const [userDataCache, setUserDataCache] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();
  const { chatId } = useParams();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchUserData = async (userId) => {
    if (userDataCache[userId]) return userDataCache[userId];
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = {
          id: userId,
          name: userDoc.data().name || userDoc.data().displayName || 'User',
          profilePhoto: userDoc.data().profilePhoto || placeholderUser,
          lastSeen: userDoc.data().lastSeen || 'Online'
        };
        setUserDataCache(prev => ({ ...prev, [userId]: userData }));
        return userData;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
    
    return {
      id: userId,
      name: 'User',
      profilePhoto: placeholderUser,
      lastSeen: 'Online'
    };
  };

  useEffect(() => {
    if (!currentUser) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatsData = await Promise.all(snapshot.docs.map(async doc => {
        const chat = { id: doc.id, ...doc.data() };
        const otherParticipantId = getOtherParticipant(chat.participants);
        const userData = await fetchUserData(otherParticipantId);
        
        return {
          ...chat,
          otherParticipant: userData,
          formattedTime: formatTime(chat.updatedAt?.toDate()),
          previewText: getPreviewText(chat.lastMessage, chat.lastSender, currentUser.uid)
        };
      }));
      
      setChats(chatsData);
      
      if (isMobileView && chatsData.length > 0 && !chatId) {
        navigate(`/inbox/${chatsData[0].id}`);
      }
    });

    return () => unsubscribe();
  }, [currentUser, isMobileView, chatId, navigate]);

  const getOtherParticipant = (participants) => {
    if (!participants || !Array.isArray(participants)) return null;
    return participants.find(uid => uid !== currentUser?.uid);
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPreviewText = (lastMessage, lastSender, currentUserId) => {
    if (!lastMessage) return 'No messages yet';
    const isYou = lastSender === currentUserId;
    return isYou ? `You: ${lastMessage}` : lastMessage;
  };

  const filteredChats = chats.filter(chat => {
    return chat.otherParticipant.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleBackToList = () => {
    navigate('/inbox');
  };

  const getImageKitUrl = (url) => {
    if (!url) return placeholderUser;
    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
  };

  return (
    <div className="inbox-container">
      {/* Chat List Sidebar */}
      <div className={`chat-list-container ${isMobileView && chatId ? 'hidden' : ''}`}>
        <div className="chat-list-header">
          <h2>Chats</h2>
          <div className="search-container2">
            <FiSearch className="search-icon2" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="chat-list">
          {filteredChats.length === 0 ? (
            <div className="no-chats">
              {searchTerm ? 'No matching chats found' : 'No messages yet. Start a conversation!'}
            </div>
          ) : (
            filteredChats.map(chat => (
              <Link 
                to={`/inbox/${chat.id}`} 
                key={chat.id} 
                className={`chat-item ${chat.id === chatId ? 'active' : ''}`}
              >
                <div className="chat-avatar">
                  <img 
                    src={getImageKitUrl(chat.otherParticipant.profilePhoto)} 
                    alt={chat.otherParticipant.name}
                    onError={(e) => { e.target.src = placeholderUser; }}
                  />
                </div>
                <div className="chat-content">
                  <div className="chat-header">
                    <span className="chat-name">{chat.otherParticipant.name}</span>
                    <span className="chat-time">{chat.formattedTime}</span>
                  </div>
                  <div className="chat-preview">
                    <p className="last-message">{chat.previewText}</p>
                    {chat.unreadCount > 0 && (
                      <span className="unread-badge">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Chat Room Area */}
      <div className={`chat-room-area ${isMobileView && !chatId ? 'hidden' : ''}`}>
        {isMobileView && chatId && (
          <button className="back-button" onClick={handleBackToList}>
            <FiChevronLeft /> Back
          </button>
        )}
        {chatId ? (
          <Outlet context={{ userDataCache }} />
        ) : (
          <div className="no-chat-selected">
            <div className="welcome-message">
              <h3>WhatsApp Web</h3>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;