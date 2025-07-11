import React, { useState, useEffect } from 'react';
import { 
  FiHeart, FiMessageSquare, FiShare2, FiMoreVertical, 
  FiTrash2, FiFlag, FiUserPlus, FiUserCheck 
} from 'react-icons/fi';
import { 
  doc, getDoc, setDoc, deleteDoc, 
  collection, query, where, getDocs,
  increment, updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import CommentSection from './CommentSection';
import './Post.css';

const Post = ({ post, currentUser, onDelete }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [dislikesCount, setDislikesCount] = useState(post.dislikesCount);
  const [showComments, setShowComments] = useState(false);
  const [author, setAuthor] = useState(null);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  // Check if current user has liked/disliked the post
  useEffect(() => {
    const checkInteractions = async () => {
      if (!currentUser) return;

      const likeDoc = await getDoc(doc(db, 'posts', post.id, 'likes', currentUser.uid));
      setIsLiked(likeDoc.exists());

      const dislikeDoc = await getDoc(doc(db, 'posts', post.id, 'dislikes', currentUser.uid));
      setIsDisliked(dislikeDoc.exists());

      // Check if following author
      if (post.authorId !== currentUser.uid) {
        const followDoc = await getDoc(doc(db, 'users', post.authorId, 'followers', currentUser.uid));
        setIsFollowingAuthor(followDoc.exists());
      }

      // Fetch author details
      const authorDoc = await getDoc(doc(db, 'users', post.authorId));
      if (authorDoc.exists()) {
        setAuthor(authorDoc.data());
      }
    };

    checkInteractions();
  }, [post, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return;

    const likeRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
    const dislikeRef = doc(db, 'posts', post.id, 'dislikes', currentUser.uid);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (isLiked) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: increment(-1) });
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        // Like
        await setDoc(likeRef, { timestamp: new Date() });
        await updateDoc(postRef, { likesCount: increment(1) });
        setLikesCount(prev => prev + 1);
        setIsLiked(true);

        // Remove dislike if exists
        if (isDisliked) {
          await deleteDoc(dislikeRef);
          await updateDoc(postRef, { dislikesCount: increment(-1) });
          setDislikesCount(prev => prev - 1);
          setIsDisliked(false);
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleDislike = async () => {
    if (!currentUser) return;

    const dislikeRef = doc(db, 'posts', post.id, 'dislikes', currentUser.uid);
    const likeRef = doc(db, 'posts', post.id, 'likes', currentUser.uid);
    const postRef = doc(db, 'posts', post.id);

    try {
      if (isDisliked) {
        // Remove dislike
        await deleteDoc(dislikeRef);
        await updateDoc(postRef, { dislikesCount: increment(-1) });
        setDislikesCount(prev => prev - 1);
        setIsDisliked(false);
      } else {
        // Dislike
        await setDoc(dislikeRef, { timestamp: new Date() });
        await updateDoc(postRef, { dislikesCount: increment(1) });
        setDislikesCount(prev => prev + 1);
        setIsDisliked(true);

        // Remove like if exists
        if (isLiked) {
          await deleteDoc(likeRef);
          await updateDoc(postRef, { likesCount: increment(-1) });
          setLikesCount(prev => prev - 1);
          setIsLiked(false);
        }
      }
    } catch (error) {
      console.error('Error updating dislike:', error);
    }
  };

  const handleFollowAuthor = async () => {
    if (!currentUser || post.authorId === currentUser.uid) return;

    try {
      if (isFollowingAuthor) {
        // Unfollow
        await deleteDoc(doc(db, 'users', post.authorId, 'followers', currentUser.uid));
        await deleteDoc(doc(db, 'users', currentUser.uid, 'following', post.authorId));
      } else {
        // Follow
        await setDoc(doc(db, 'users', post.authorId, 'followers', currentUser.uid), {
          timestamp: new Date()
        });
        await setDoc(doc(db, 'users', currentUser.uid, 'following', post.authorId), {
          timestamp: new Date()
        });
      }
      setIsFollowingAuthor(!isFollowingAuthor);
    } catch (error) {
      console.error('Error updating follow status:', error);
    }
  };

  const handleReport = async (reason) => {
    if (!currentUser) return;

    try {
      // Add report
      await setDoc(doc(collection(db, 'posts', post.id, 'reports')), {
        reporterId: currentUser.uid,
        reason,
        timestamp: new Date()
      });

      // Update reports count
      await updateDoc(doc(db, 'posts', post.id), {
        reportsCount: increment(1)
      });

      // Check if reports reached threshold (10)
      const postDoc = await getDoc(doc(db, 'posts', post.id));
      if (postDoc.data().reportsCount >= 9) { // We just added 1, so check for 9
        await deleteDoc(doc(db, 'posts', post.id));
        if (onDelete) onDelete(post.id);
      }

      alert('Thank you for reporting this post. Our team will review it.');
    } catch (error) {
      console.error('Error reporting post:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'posts', post.id));
        if (onDelete) onDelete(post.id);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  if (!author) return null;

  return (
    <div className="post-container">
      <div className="post-header">
        <div className="post-author">
          <img 
            src={author.profilePhoto || placeholderUser} 
            alt={author.name} 
            className="post-author-avatar"
          />
          <div className="post-author-info">
            <h4>{author.name}</h4>
            <p className="post-time">{new Date(post.createdAt?.toDate()).toLocaleString()}</p>
          </div>
        </div>

        <div className="post-actions-menu">
          {currentUser?.uid === post.authorId ? (
            <button 
              className="post-delete-btn"
              onClick={handleDelete}
            >
              <FiTrash2 />
            </button>
          ) : (
            <>
              <button 
                className={`follow-btn ${isFollowingAuthor ? 'following' : ''}`}
                onClick={handleFollowAuthor}
              >
                {isFollowingAuthor ? <FiUserCheck /> : <FiUserPlus />}
                {isFollowingAuthor ? 'Following' : 'Follow'}
              </button>
              <button 
                className="post-options-btn"
                onClick={() => setShowOptions(!showOptions)}
              >
                <FiMoreVertical />
              </button>
              
              {showOptions && (
                <div className="post-options-dropdown">
                  <button 
                    className="report-option"
                    onClick={() => {
                      setShowOptions(false);
                      handleReport('Inappropriate content');
                    }}
                  >
                    <FiFlag /> Report Post
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="post-content">
        <p>{post.content}</p>
        {post.imageUrl && (
          <div className="post-image">
            <img src={post.imageUrl} alt="Post" />
          </div>
        )}
      </div>

      <div className="post-stats">
        <span>{likesCount} Likes</span>
        <span>{dislikesCount} Dislikes</span>
        <span>{post.commentsCount} Comments</span>
        <span>{post.sharesCount} Shares</span>
      </div>

      <div className="post-interactions">
        <button 
          className={`interaction-btn like ${isLiked ? 'active' : ''}`}
          onClick={handleLike}
        >
          <FiHeart /> Like
        </button>
        <button 
          className={`interaction-btn dislike ${isDisliked ? 'active' : ''}`}
          onClick={handleDislike}
        >
          <FiHeart /> Dislike
        </button>
        <button 
          className="interaction-btn comment"
          onClick={() => setShowComments(!showComments)}
        >
          <FiMessageSquare /> Comment
        </button>
        <button className="interaction-btn share">
          <FiShare2 /> Share
        </button>
      </div>

      {showComments && (
        <CommentSection 
          postId={post.id} 
          currentUser={currentUser} 
        />
      )}
    </div>
  );
};

export default Post;