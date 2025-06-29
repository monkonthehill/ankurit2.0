import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase/firebase';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  getDocs,
  getDoc,
  limit,
  where
} from 'firebase/firestore';
import { FiChevronLeft, FiMoreVertical, FiTrash2, FiUser } from 'react-icons/fi';
import placeholderUser from '../../assets/images/images.jpeg';
import styles from './Chatroom.module.css';

const ChatRoom = () => {
  const { receiverId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || !receiverId) return;

    const fetchOtherUser = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', receiverId));
        if (userDoc.exists()) {
          setOtherUser({
            id: receiverId,
            name: userDoc.data().name || userDoc.data().displayName || 'User',
            profilePhoto: userDoc.data().profilePhoto || placeholderUser
          });
        } else {
          setOtherUser({
            id: receiverId,
            name: 'User',
            profilePhoto: placeholderUser
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setOtherUser({
          id: receiverId,
          name: 'User',
          profilePhoto: placeholderUser
        });
      }
    };

    fetchOtherUser();

    const ids = [currentUser.uid, receiverId].sort();
    const generatedChatId = ids.join('_');
    setChatId(generatedChatId);

    const chatRef = doc(db, 'chats', generatedChatId);
    setDoc(chatRef, {
      participants: ids,
      lastMessage: '',
      lastSender: '',
      updatedAt: serverTimestamp()
    }, { merge: true });

    const cleanupOldMessages = async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 6);
     
      const messagesRef = collection(db, 'chats', generatedChatId, 'messages');
      const oldMessagesQuery = query(
        messagesRef,
        where('createdAt', '<', cutoffDate),
        limit(100)
      );

      const snapshot = await getDocs(oldMessagesQuery);
      snapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });
    };

    cleanupOldMessages();
  }, [currentUser, receiverId]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || !currentUser) return;

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        createdAt: serverTimestamp()
      });

      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        lastMessage: newMessage,
        lastSender: currentUser.uid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSendMessage(e);
    }
  };

  const handleDeleteChat = async () => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
       
        const deletePromises = messagesSnapshot.docs.map(async (doc) => {
          await deleteDoc(doc.ref);
        });
       
        await Promise.all(deletePromises);
       
        await deleteDoc(doc(db, 'chats', chatId));
       
        navigate('/messages');
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    }
  };

  const getImageKitUrl = (url) => {
    if (!url) return placeholderUser;
    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
  };

  return (
    <div className={styles.chatRoomContainer}>
      <div className={styles.chatHeader}>
        <button className={styles.backButton} onClick={() => navigate('/messages')}>
          <FiChevronLeft />
        </button>
       
        <div className={styles.userInfo} onClick={() => navigate(`/profile/${otherUser?.id}`)}>
          <img
            src={getImageKitUrl(otherUser?.profilePhoto)}
            alt={otherUser?.name}
            className={styles.userAvatar}
            onError={(e) => {
              e.target.src = placeholderUser;
            }}
          />
          <div className={styles.userDetails}>
            <h3>{otherUser?.name}</h3>
            <p className={styles.status}>Online</p>
          </div>
        </div>
       
        <div className={styles.chatActions}>
          <button className={styles.moreButton} onClick={() => setShowOptions(!showOptions)}>
            <FiMoreVertical />
          </button>
         
          {showOptions && (
            <div className={styles.optionsDropdown}>
              <button onClick={() => navigate(`/profile/${otherUser?.id}`)}>
                <FiUser /> View Profile
              </button>
              <button onClick={handleDeleteChat} className={styles.deleteButton}>
                <FiTrash2 /> Delete Chat
              </button>
            </div>
          )}
        </div>
      </div>
     
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <p className={styles.noMessages}>
            No messages yet. Start the conversation with {otherUser?.name}!
          </p>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`${styles.message} ${message.senderId === currentUser?.uid ? styles.sent : styles.received}`}
            >
              {message.senderId !== currentUser?.uid && (
                <img
                  src={getImageKitUrl(otherUser?.profilePhoto)}
                  alt={otherUser?.name}
                  className={styles.messageAvatar}
                  onError={(e) => {
                    e.target.src = placeholderUser;
                  }}
                />
              )}
              <div className={styles.messageContent}>
                <p>{message.text}</p>
                <span className={styles.messageTime}>
                  {message.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className={styles.messageForm}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Message ${otherUser?.name || 'User'}...`}
        />
        <button type="submit" disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;