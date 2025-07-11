import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, orderBy, 
  onSnapshot, limit, getDocs 
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import Post from './Post';
import './PostsFeed.css';

const PostsFeed = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingPosts, setFollowingPosts] = useState([]);
  const [otherPosts, setOtherPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);

  useEffect(() => {
    if (!currentUser) {
      // Show all posts if not logged in
      const unsubscribe = onSnapshot(
        query(collection(db, 'posts'), orderBy('createdAt', 'desc')),
        (snapshot) => {
          const postsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPosts(postsData);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }

    // First get who the user is following
    const fetchFollowing = async () => {
      const followingQuery = query(
        collection(db, 'users', currentUser.uid, 'following')
      );
      const followingSnapshot = await getDocs(followingQuery);
      const ids = followingSnapshot.docs.map(doc => doc.id);
      setFollowingIds(ids);
    };

    fetchFollowing();

    // Then set up listeners for posts from followed users and others
    const unsubscribeFollowing = onSnapshot(
      query(
        collection(db, 'posts'),
        where('authorId', 'in', followingIds.length > 0 ? followingIds : ['']),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFollowingPosts(postsData);
      }
    );

    const unsubscribeOthers = onSnapshot(
      query(
        collection(db, 'posts'),
        where('authorId', 'not-in', followingIds.length > 0 ? [...followingIds, currentUser.uid] : ['']),
        orderBy('createdAt', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setOtherPosts(postsData);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeFollowing();
      unsubscribeOthers();
    };
  }, [currentUser, followingIds]);

  const handleDeletePost = (postId) => {
    setFollowingPosts(prev => prev.filter(post => post.id !== postId));
    setOtherPosts(prev => prev.filter(post => post.id !== postId));
  };

  if (loading) {
    return <div className="posts-feed loading">Loading posts...</div>;
  }

  return (
    <div className="posts-feed">
      {currentUser && followingPosts.length === 0 && otherPosts.length === 0 && (
        <div className="no-posts">
          <h3>No posts yet</h3>
          <p>Follow other farmers to see their posts, or create your own!</p>
        </div>
      )}

      {!currentUser && posts.length === 0 && (
        <div className="no-posts">
          <h3>No posts yet</h3>
          <p>Sign in to create your first post!</p>
        </div>
      )}

      {/* Show posts from followed users first */}
      {followingPosts.map(post => (
        <Post 
          key={post.id} 
          post={post} 
          currentUser={currentUser}
          onDelete={handleDeletePost}
        />
      ))}

      {/* Then show posts from others */}
      {otherPosts.map(post => (
        <Post 
          key={post.id} 
          post={post} 
          currentUser={currentUser}
          onDelete={handleDeletePost}
        />
      ))}

      {/* Fallback for non-logged in users */}
      {!currentUser && posts.map(post => (
        <Post 
          key={post.id} 
          post={post} 
          currentUser={currentUser}
          onDelete={handleDeletePost}
        />
      ))}
    </div>
  );
};

export default PostsFeed;