import React, { useState, useEffect } from 'react';
import { 
  collection, query, where, orderBy, 
  addDoc, serverTimestamp, doc, getDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import './CommentSection.css';

const CommentSection = ({ postId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState({});

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const commentsQuery = query(
          collection(db, 'posts', postId, 'comments'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(commentsQuery);
        const commentsData = [];
        const authorIds = new Set();

        querySnapshot.forEach((doc) => {
          const comment = { id: doc.id, ...doc.data() };
          commentsData.push(comment);
          authorIds.add(comment.authorId);
        });

        setComments(commentsData);

        // Fetch author details
        const authorsData = {};
        for (const authorId of authorIds) {
          const authorDoc = await getDoc(doc(db, 'users', authorId));
          if (authorDoc.exists()) {
            authorsData[authorId] = authorDoc.data();
          }
        }
        setAuthors(authorsData);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      const commentRef = await addDoc(collection(db, 'posts', postId, 'comments'), {
        authorId: currentUser.uid,
        content: newComment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update comments count in post
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      // Add to local state
      setComments(prev => [{
        id: commentRef.id,
        authorId: currentUser.uid,
        content: newComment.trim(),
        createdAt: new Date()
      }, ...prev]);

      // Add author to local cache if not already present
      if (!authors[currentUser.uid]) {
        const authorDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (authorDoc.exists()) {
          setAuthors(prev => ({
            ...prev,
            [currentUser.uid]: authorDoc.data()
          }));
        }
      }

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  if (loading) {
    return <div className="comment-section loading">Loading comments...</div>;
  }

  return (
    <div className="comment-section">
      <form onSubmit={handleSubmit} className="comment-form">
        <img 
          src={currentUser?.profilePhoto || placeholderUser} 
          alt="Profile" 
          className="comment-author-avatar"
        />
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          disabled={!currentUser}
        />
        <button 
          type="submit" 
          disabled={!newComment.trim() || !currentUser}
        >
          Post
        </button>
      </form>

      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <img 
                src={authors[comment.authorId]?.profilePhoto || placeholderUser} 
                alt={authors[comment.authorId]?.name || 'User'} 
                className="comment-author-avatar"
              />
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-author">
                    {authors[comment.authorId]?.name || 'User'}
                  </span>
                  <span className="comment-time">
                    {new Date(comment.createdAt?.toDate()).toLocaleString()}
                  </span>
                </div>
                <p>{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;