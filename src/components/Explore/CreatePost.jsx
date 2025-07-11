import React, { useState } from 'react';
import { FiImage, FiSend } from 'react-icons/fi';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../../firebase/firebase';
import ImageUploader from '../ImageKit/PostImages';
import './CreatePost.css';

const CreatePost = ({ currentUser }) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl) return;

    try {
      await addDoc(collection(db, 'posts'), {
        authorId: currentUser.uid,
        content: content.trim(),
        imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likesCount: 0,
        dislikesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        reportsCount: 0
      });

      setContent('');
      setImageUrl('');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div className="create-post-container">
      <form onSubmit={handleSubmit}>
        <div className="post-input-container">
          <img 
            src={currentUser.profilePhoto || placeholderUser} 
            alt="Profile" 
            className="post-author-avatar"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your farming thoughts..."
            rows="3"
          />
        </div>

        {imageUrl && (
          <div className="post-image-preview">
            <img src={imageUrl} alt="Post preview" />
            <button 
              type="button" 
              className="remove-image-btn"
              onClick={() => setImageUrl('')}
            >
              ×
            </button>
          </div>
        )}

        <div className="post-actions">
          <div className="action-buttons">
            <label className="image-upload-label">
              <FiImage className="icon" />
              <ImageUploader
                userId={currentUser.uid}
                type="post"
                onUploadComplete={(url) => {
                  setImageUrl(url);
                  setIsUploading(false);
                }}
                onUploadStart={() => setIsUploading(true)}
                label=""
              />
            </label>
          </div>

          <button 
            type="submit" 
            className="post-submit-btn"
            disabled={(!content.trim() && !imageUrl) || isUploading}
          >
            <FiSend className="icon" />
            Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;