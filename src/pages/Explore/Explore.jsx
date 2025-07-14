import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, db } from '../../firebase/firebase';
import { 
  collection, 
  doc, 
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  FiHeart, 
  FiMessageSquare, 
  FiShare2, 
  FiMoreVertical, 
  FiTrash2, 
  FiEdit,
  FiImage,
  FiX,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { 
  FaHeart, 
  FaRegComment, 
  FaComment, 
  FaShareSquare,
  FaRegLaughSquint,
  FaRegSadTear,
  FaRegSurprise
} from 'react-icons/fa';
import { RiDislikeFill, RiDislikeLine } from 'react-icons/ri';
import { IoMdSend } from 'react-icons/io';
import { BiLike, BiSolidLike } from 'react-icons/bi';
import ImageUploader from '../../components/ImageKit/PostImages';
import './Explore.css';
import { useNavigate } from 'react-router-dom';

const Explore = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostText, setNewPostText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [followingUsers, setFollowingUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('following');
  const [commentText, setCommentText] = useState('');
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostText, setEditPostText] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(null);
  const [comments, setComments] = useState({});
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showReactions, setShowReactions] = useState(null);
  const [sharePostId, setSharePostId] = useState(null);
  const commentRef = useRef(null);
  const postsEndRef = useRef(null);
  const observer = useRef();

  // Reactions configuration
  const reactions = [
    { name: 'like', icon: <BiLike size={24} />, activeIcon: <BiSolidLike size={24} />, color: '#1877f2' },
    { name: 'love', icon: <FaHeart size={20} />, activeIcon: <FaHeart size={20} />, color: '#f3425f' },
    { name: 'laugh', icon: <FaRegLaughSquint size={20} />, activeIcon: <FaRegLaughSquint size={20} />, color: '#f7b928' },
    { name: 'sad', icon: <FaRegSadTear size={20} />, activeIcon: <FaRegSadTear size={20} />, color: '#f7b928' },
    { name: 'wow', icon: <FaRegSurprise size={20} />, activeIcon: <FaRegSurprise size={20} />, color: '#f7b928' }
  ];
  const navigate = useNavigate();
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', newMode ? 'enabled' : 'disabled');
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'enabled') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Set up intersection observer for infinite scroll
  const lastPostRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMorePosts) {
        loadMorePosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMorePosts]);

  // Auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchFollowingUsers(user.uid);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchFollowingUsers = async (userId) => {
    try {
      const followingSnapshot = await getDocs(collection(db, 'users', userId, 'following'));
      const followingIds = followingSnapshot.docs.map(doc => doc.id);
      setFollowingUsers(followingIds);
    } catch (error) {
      console.error('Error fetching following users:', error);
    }
  };

  const fetchPosts = useCallback(async (userId) => {
    try {
      let postsQuery;
      const postsLimit = 10;
      
      if (activeTab === 'following' && followingUsers.length > 0) {
        postsQuery = query(
          collection(db, 'posts'),
          where('userId', 'in', [...followingUsers, userId]),
          orderBy('timestamp', 'desc'),
          limit(postsLimit)
        );
      } else {
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('timestamp', 'desc'),
          limit(postsLimit)
        );
      }

      const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
        if (snapshot.empty) {
          setHasMorePosts(false);
          return;
        }

        const postsData = await Promise.all(snapshot.docs.map(async (doc) => {
          const post = doc.data();
          const userDoc = await getDoc(post.userRef);
          const userData = userDoc.data();
          
          // Check all reaction types
          const userReactions = {};
          reactions.forEach(reaction => {
            userReactions[reaction.name] = post[`${reaction.name}s`]?.includes(userId) || false;
          });
          
          const commentsSnapshot = await getDocs(collection(db, 'posts', doc.id, 'comments'));
          const commentsCount = commentsSnapshot.size;
          
          const reportsSnapshot = await getDocs(collection(db, 'posts', doc.id, 'reports'));
          const reportsCount = reportsSnapshot.size;

          return {
            id: doc.id,
            ...post,
            userData,
            ...userReactions,
            commentsCount,
            reportsCount,
            timestamp: post.timestamp?.toDate() || new Date()
          };
        }));

        setPosts(postsData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMorePosts(snapshot.docs.length === postsLimit);
      });

      // Return cleanup function
      return () => unsubscribe();

    } catch (error) {
      console.error('Error fetching posts:', error);
      setHasMorePosts(false);
      // Return no-op function
      return () => {};
    }
  }, [activeTab, followingUsers]);

  // Fetch posts when tab or user changes
  useEffect(() => {
    let unsubscribe = () => {};

    if (currentUser) {
      unsubscribe = fetchPosts(currentUser.uid);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser, activeTab, fetchPosts]);

  const loadMorePosts = async () => {
    if (!lastVisible || !hasMorePosts) return;

    try {
      setLoading(true);
      let postsQuery;
      const postsLimit = 10;
      
      if (activeTab === 'following' && followingUsers.length > 0) {
        postsQuery = query(
          collection(db, 'posts'),
          where('userId', 'in', [...followingUsers, currentUser.uid]),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(postsLimit)
        );
      } else {
        postsQuery = query(
          collection(db, 'posts'),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisible),
          limit(postsLimit)
        );
      }

      const snapshot = await getDocs(postsQuery);
      if (snapshot.empty) {
        setHasMorePosts(false);
        return;
      }

      const newPosts = await Promise.all(snapshot.docs.map(async (doc) => {
        const post = doc.data();
        const userDoc = await getDoc(post.userRef);
        const userData = userDoc.data();
        
        const userReactions = {};
        reactions.forEach(reaction => {
          userReactions[reaction.fullName] = post[`${reaction.fullName}s`]?.includes(currentUser.uid) || false;
        });
        
        const commentsSnapshot = await getDocs(collection(db, 'posts', doc.id, 'comments'));
        const commentsCount = commentsSnapshot.size;

        return {
          id: doc.id,
          ...post,
          userData,
          ...userReactions,
          commentsCount,
          timestamp: post.timestamp?.toDate() || new Date()
        };
      }));

      setPosts(prev => [...prev, ...newPosts]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMorePosts(snapshot.docs.length === postsLimit);
    } catch (error) {
      console.error('Error loading more posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadComplete = (url) => {
    setImageUrl(url);
  };

  const createPost = async () => {
    if (!newPostText.trim() && !imageUrl) {
      alert("Please add text or an image to create a post");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, 'posts'), {
        text: newPostText || "Shared an image",
        imageUrl: imageUrl || null,
        userId: currentUser.uid,
        userRef: doc(db, 'users', currentUser.uid),
        userData: {
          name: userData.Name || userData.fullName,
          username: userData.username,
          profilePhoto: userData.profilePhoto
        },
        likes: [],
        loves: [],
        laughs: [],
        sads: [],
        wows: [],
        commentsCount: 0,
        reportsCount: 0,
        timestamp: serverTimestamp()
      });

      setNewPostText('');
      setImageUrl('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleReaction = async (postId, reactionType, alreadyReacted) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'posts', postId);
      const reactionField = `${reactionType}s`;
      
      // Remove all other reactions first
      const updateData = {};
      reactions.forEach(r => {
        if (r.name !== reactionType) {
          updateData[`${r.name}s`] = arrayRemove(currentUser.uid);
        }
      });

      if (alreadyReacted) {
        await updateDoc(postRef, {
          ...updateData,
          [reactionField]: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(postRef, {
          ...updateData,
          [reactionField]: arrayUnion(currentUser.uid)
        });
      }

    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const commentsQuery = query(
        collection(db, 'posts', postId, 'comments'),
        orderBy('timestamp', 'asc')
      );
      
      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }));
        
        setComments(prev => ({
          ...prev,
          [postId]: commentsData
        }));
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching comments:', error);
      return () => {};
    }
  };

  const addComment = async (postId) => {
    if (!commentText.trim() || !currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: commentText,
        userId: currentUser.uid,
        userRef: doc(db, 'users', currentUser.uid),
        userName: userData.name || userData.fullName,
        userProfile: userData.profilePhoto,
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: (posts.find(p => p.id === postId)?.commentsCount || 0) + 1
      });

      setCommentText('');
      
      if (commentRef.current) {
        commentRef.current.scrollTop = commentRef.current.scrollHeight;
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const reportPost = async (postId, reason = "Inappropriate content") => {
    if (!currentUser) return;

    try {
      const reportQuery = query(
        collection(db, 'posts', postId, 'reports'),
        where('userId', '==', currentUser.uid)
      );
      const reportSnapshot = await getDocs(reportQuery);

      if (reportSnapshot.empty) {
        await addDoc(collection(db, 'posts', postId, 'reports'), {
          userId: currentUser.uid,
          userRef: doc(db, 'users', currentUser.uid),
          reason,
          timestamp: serverTimestamp()
        });

        const postRef = doc(db, 'posts', postId);
        const currentReports = (posts.find(p => p.id === postId)?.reportsCount || 0) + 1;
        
        await updateDoc(postRef, {
          reportsCount: currentReports
        });

        if (currentReports >= 10) {
          await updateDoc(postRef, {
            hidden: true
          });
          alert('Post has been hidden due to multiple reports.');
        } else {
          alert('Post reported successfully.');
        }

        setShowReportDialog(null);
      } else {
        alert('You have already reported this post.');
      }
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  };

  const deletePost = async (postId) => {
    if (!currentUser) return;

    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists() && postDoc.data().userId === currentUser.uid) {
        await deleteDoc(doc(db, 'posts', postId));
      } else {
        alert('You can only delete your own posts.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const sharePost = async (postId) => {
    if (!currentUser) return;

    try {
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (!postDoc.exists()) {
        alert('Post not found');
        return;
      }

      const post = postDoc.data();
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, 'posts'), {
        text: `Shared post: ${post.text || ''}`,
        imageUrl: post.imageUrl || null,
        originalPostId: postId,
        userId: currentUser.uid,
        userRef: doc(db, 'users', currentUser.uid),
        userData: {
          name: userData.name || userData.fullName,
          username: userData.username,
          profilePhoto: userData.profilePhoto
        },
        likes: [],
        loves: [],
        laughs: [],
        sads: [],
        wows: [],
        commentsCount: 0,
        timestamp: serverTimestamp()
      });

      setSharePostId(null);
      alert('Post shared successfully!');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const startEditingPost = (postId, text) => {
    setEditingPostId(postId);
    setEditPostText(text);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditPostText('');
  };

  const saveEditedPost = async (postId) => {
    if (!editPostText.trim()) return;

    try {
      await updateDoc(doc(db, 'posts', postId), {
        text: editPostText
      });
      
      setEditingPostId(null);
      setEditPostText('');
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const toggleComments = async (postId) => {
    if (activeCommentPost === postId) {
      setActiveCommentPost(null);
    } else {
      setActiveCommentPost(postId);
      if (!comments[postId]) {
        await fetchComments(postId);
      }
    }
  };

  const getTotalReactions = (post) => {
    return reactions.reduce((total, reaction) => {
      return total + (post[`${reaction.name}s`]?.length || 0);
    }, 0);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    
    <div className="explore-container">
      <div className="explore-header">
        <h1>Ankurit Community</h1>
        <div className="header-actions">
          <div className="tabs">
            <button 
              className={activeTab === 'following' ? 'active' : ''}
              onClick={() => setActiveTab('following')}
            >
              Following
            </button>
            <button 
              className={activeTab === 'all' ? 'active' : ''}
              onClick={() => setActiveTab('all')}
            >
              Discover
            </button>
          </div>
          <button 
            className="dark-mode-toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
        </div>
      </div>

      {currentUser && (
        <div className="create-post">
          <div className="post-input">
            <img 
              src={currentUser.photoURL || '/default-profile.png'} 
              alt="Profile" 
              className="profile-pic"
            />
            <input
              type="text"
              placeholder="What's on your mind?"
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createPost()}
            />
          </div>
          
          {imageUrl && (
            <div className="image-preview">
              <img src={imageUrl} alt="Preview" />
              <button 
                className="remove-image"
                onClick={() => setImageUrl('')}
              >
                <FiX />
              </button>
            </div>
          )}
          
          <div className="post-actions">
            <div className="file-upload">
              <ImageUploader
                userId={currentUser.uid}
                type="post"
                onUploadComplete={handleImageUploadComplete}
                label="Photo"
                required={false}
              />
            </div>
            
            <button 
              className="post-button"
              onClick={createPost}
              disabled={!newPostText.trim() && !imageUrl}
            >
              Post
            </button>
          </div>
        </div>
      )}

      <div className="posts-list">
        {posts.length === 0 ? (
          <div className="no-posts">
            <p>{activeTab === 'following' ? 
              "You're not following anyone yet or they haven't posted anything." : 
              "No posts available. Be the first to post!"}
            </p>
          </div>
        ) : (
          posts.map((post, index) => (
            <div 
              key={post.id} 
              className={`post ${post.hidden ? 'hidden-post' : ''}`}
              ref={index === posts.length - 1 ? lastPostRef : null}
            >
              {post.hidden && (
                <div className="hidden-post-message">
                  This post has been hidden due to multiple reports
                </div>
              )}
              
              {!post.hidden && (
                <>
                  <div className="post-header">
<div className="user-info">
  <img 
    src={post.userData?.profilePhoto || '/default-profile.png'}
    alt="Profile" 
    className="profile-pic"
  />
  <div 
    className="user-name-wrapper"
    onClick={() => navigate(`/profile/${post.userId}`)}
    style={{ cursor: 'pointer' }}
  >
    <h3>{post.userData?.fullName || 'User'}</h3>
    <p className="username">@{post.userData?.username || 'user'}</p>
  </div>
</div>
                    
                    {currentUser?.uid === post.userId ? (
                      <div className="post-options">
                        <button 
                          className="edit-button"
                          onClick={() => startEditingPost(post.id, post.text)}
                        >
                          <FiEdit />
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => deletePost(post.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ) : (
                      <div className="post-options">
                        <button 
                          className="report-button"
                          onClick={() => setShowReportDialog(post.id)}
                        >
                          <FiMoreVertical />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingPostId === post.id ? (
                    <div className="edit-post">
                      <textarea
                        value={editPostText}
                        onChange={(e) => setEditPostText(e.target.value)}
                        rows="3"
                      />
                      <div className="edit-actions">
                        <button 
                          className="cancel-button"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </button>
                        <button 
                          className="save-button"
                          onClick={() => saveEditedPost(post.id)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="post-content">
                        {post.originalPostId && (
                          <div className="shared-post-header">
                            <FiShare2 /> Shared Post
                          </div>
                        )}
                        <p>{post.text}</p>
                        {post.imageUrl && (
                          <div className="post-image">
                            <img src={post.imageUrl} alt="Post" />
                          </div>
                        )}
                      </div>
                      
                      <div className="post-footer">
                        <div className="post-stats">
                          <div className="reactions-count">
                            {getTotalReactions(post) > 0 && (
                              <>
                                <div className="reactions-preview">
                                  {reactions.map(reaction => (
                                    post[`${reaction.name}s`]?.length > 0 && (
                                      <div 
                                        key={reaction.name} 
                                        className="reaction-preview"
                                        style={{ color: reaction.color }}
                                      >
                                        {reaction.activeIcon}
                                      </div>
                                    )
                                  ))}
                                </div>
                                <span>{getTotalReactions(post)}</span>
                              </>
                            )}
                          </div>
                          <span>{post.commentsCount || 0} comments</span>
                          <span>{formatDate(post.timestamp)}</span>
                        </div>
                        
                        <div className="post-actions">
                          <div className="reaction-container">
                            <button 
                              className={`like-button ${post.like ? 'active' : ''}`}
                              onClick={() => handleReaction(post.id, 'like', post.like)}
                              onMouseEnter={() => setShowReactions(post.id)}
                            >
                              {post.like ? <BiSolidLike /> : <BiLike />}
                              <span>Like</span>
                            </button>
                            {showReactions === post.id && (
                              <div 
                                className="reactions-options"
                                onMouseLeave={() => setShowReactions(null)}
                              >
                                {reactions.map(reaction => (
                                  <button
                                    key={reaction.name}
                                    className={`reaction-option ${post[reaction.name] ? 'active' : ''}`}
                                    onClick={() => {
                                      handleReaction(post.id, reaction.name, post[reaction.name]);
                                      setShowReactions(null);
                                    }}
                                    style={{ color: reaction.color }}
                                    title={reaction.name.charAt(0).toUpperCase() + reaction.name.slice(1)}
                                  >
                                    {post[reaction.name] ? reaction.activeIcon : reaction.icon}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <button 
                            className={`comment-button ${activeCommentPost === post.id ? 'active' : ''}`}
                            onClick={() => toggleComments(post.id)}
                          >
                            <FaRegComment />
                            <span>Comment</span>
                          </button>
                          
                          <button 
                            className="share-button"
                            onClick={() => setSharePostId(sharePostId === post.id ? null : post.id)}
                          >
                            <FaShareSquare />
                            <span>Share</span>
                          </button>
                        </div>
                        
                        {sharePostId === post.id && (
                          <div className="share-dialog">
                            <p>Share this post to your timeline?</p>
                            <div className="share-actions">
                              <button 
                                className="cancel-share"
                                onClick={() => setSharePostId(null)}
                              >
                                Cancel
                              </button>
                              <button 
                                className="confirm-share"
                                onClick={() => sharePost(post.id)}
                              >
                                Share
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {activeCommentPost === post.id && (
                          <div className="comments-section">
                            <div className="comments-list" ref={commentRef}>
                              {comments[post.id]?.length > 0 ? (
                                comments[post.id].map(comment => (
                                  <div key={comment.id} className="comment">
                                    <img 
                                      src={comment.userProfile || '/default-profile.png'} 
                                      alt="Profile" 
                                      className="comment-profile-pic"
                                    />
                                    <div className="comment-content">
                                      <div className="comment-header">
                                        <span className="comment-username">{comment.userName}</span>
                                        <span className="comment-time">{formatDate(comment.timestamp)}</span>
                                      </div>
                                      <p>{comment.text}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="no-comments">No comments yet</div>
                              )}
                            </div>
                            <div className="add-comment">
                              <img 
                                src={currentUser?.photoURL || '/default-profile.png'} 
                                alt="Profile" 
                                className="profile-pic"
                              />
                              <div className="comment-input-container">
                                <input
                                  type="text"
                                  placeholder="Write a comment..."
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                                />
                                <button 
                                  className="send-button"
                                  onClick={() => addComment(post.id)}
                                  disabled={!commentText.trim()}
                                >
                                  <IoMdSend />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
              
              {showReportDialog === post.id && (
                <div className="report-dialog">
                  <div className="report-dialog-content">
                    <h3>Report Post</h3>
                    <p>Why are you reporting this post?</p>
                    <div className="report-options">
                      <button onClick={() => reportPost(post.id, "Spam")}>Spam</button>
                      <button onClick={() => reportPost(post.id, "Inappropriate content")}>Inappropriate</button>
                      <button onClick={() => reportPost(post.id, "Misinformation")}>Misinformation</button>
                      <button onClick={() => reportPost(post.id, "Other")}>Other</button>
                    </div>
                    <button 
                      className="cancel-report"
                      onClick={() => setShowReportDialog(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {loading && posts.length > 0 && (
          <div className="loading-more">
            <div className="spinner"></div>
          </div>
        )}
      </div>

      <button 
        className="mobile-post-button"
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      >
        <FiEdit />
      </button>
    </div>
  );
};

export default Explore;