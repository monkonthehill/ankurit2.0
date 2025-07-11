import React, { useState, useEffect } from 'react';
import ImageKit from 'imagekit-javascript';
import { FiUpload, FiImage, FiCheckCircle, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import  styles from'./PostImages.module.css';

const ImageUploader = ({ 
  userId, 
  type, 
  currentImageUrl, 
  onUploadComplete,
  label = 'Select Image',
  required = false
}) => {
  const [auth, setAuth] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState(currentImageUrl || '');
  const [status, setStatus] = useState('idle'); // idle | ready | uploading | success | error
  const [progress, setProgress] = useState(0);

  const AUTH_ENDPOINT = 'https://post-auth-server.onrender.com/auth';
  const PUBLIC_KEY = 'public_UawdJYg9ff40G+Q3om1F06YWSIc=';
  const URL_ENDPOINT = 'https://ik.imagekit.io/ankurit2';

  useEffect(() => {
    const fetchAuthParams = async () => {
      try {
        setStatus('loading');
        const res = await fetch(AUTH_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();
        if (data.success) {
          setAuth(data);
          setStatus('idle');
        } else {
          throw new Error('Failed to get auth params');
        }
      } catch (err) {
        console.error('Error fetching auth params:', err);
        setStatus('auth-error');
      }
    };

    fetchAuthParams();

    // Clean up preview URL when component unmounts
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, []);

  useEffect(() => {
    if (currentImageUrl) {
      setUploadedUrl(currentImageUrl);
      setStatus('success');
    }
  }, [currentImageUrl]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Validate file type
    if (!selected.type.match('image.*')) {
      setStatus('error');
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (5MB max)
    if (selected.size > 5 * 1024 * 1024) {
      setStatus('error');
      alert('Image size should be less than 5MB');
      return;
    }

    // Clear previous preview if exists
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus('ready');
  };

  const handleUpload = () => {
    if (!file || !auth) return;

    const imagekit = new ImageKit({
      publicKey: PUBLIC_KEY,
      urlEndpoint: URL_ENDPOINT,
      authenticationEndpoint: AUTH_ENDPOINT
    });

    setStatus('uploading');
    setProgress(0);

    // Simulate progress (real progress would come from actual upload events)
    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 10 : prev));
    }, 300);

    imagekit.upload(
      {
        file,
        fileName: `${type}_${userId}_${Date.now()}_${file.name}`,
        folder: '/ankurit_uploads',
        useUniqueFileName: true,
        ...auth
      },
      (err, result) => {
        clearInterval(interval);
        
        if (err) {
          console.error('Upload error:', err);
          setStatus('error');
          setProgress(0);
        } else {
          setProgress(100);
          setUploadedUrl(result.url);
          setStatus('success');
          onUploadComplete(result.url);
          setTimeout(() => setProgress(0), 2000);
        }
      }
    );
  };

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview('');
    setUploadedUrl('');
    setStatus('idle');
    onUploadComplete(''); // Notify parent that image was removed
  };

  return (
    <div className={styles.container}>
    <div className="image-uploader-container">
      <div className="uploader-controls">
        <label className="file-input-label">
          <input 
            type="file" 
            onChange={handleFileChange} 
            accept="image/*" 
            className="file-input"
          />
          <div className="file-input-button">
            <FiUpload className="upload-icon" />
            <span>{uploadedUrl ? 'Change Image' : label}</span>
            {required && <span className="required">*</span>}
          </div>
        </label>

        {(status === 'ready' || status === 'uploading') && (
          <button 
            onClick={handleUpload} 
            className="upload-button"
            disabled={status === 'uploading'}
          >
            <FiUpload className="button-icon" />
            {status === 'uploading' ? 'Uploading...' : 'Upload'}
          </button>
        )}

        {(status === 'success' && uploadedUrl) && (
          <button 
            onClick={handleRemove}
            className="remove-button"
          >
            <FiTrash2 className="button-icon" />
            Remove
          </button>
        )}
      </div>

      {status === 'uploading' && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <div className="progress-text">Uploading... {progress}%</div>
        </div>
      )}

      {(preview || uploadedUrl) && (
        <div className="image-preview-container">
          <div className="preview-header">Image Preview</div>
          <img 
            src={preview || uploadedUrl} 
            alt="Preview" 
            className="preview-image" 
          />
        </div>
      )}

      {status === 'auth-error' && (
        <div className="error-message">
          <FiAlertCircle className="error-icon" />
          <span>Failed to connect to upload service</span>
        </div>
      )}

      {status === 'error' && (
        <div className="error-message">
          <FiAlertCircle className="error-icon" />
          <span>Upload failed. Please try again.</span>
        </div>
      )}

      {status === 'success' && (
        <div className="success-message">
          <FiCheckCircle className="success-icon" />
          <span>Image successfully uploaded</span>
        </div>
      )}
    </div>
    </div>
  );
};

export default ImageUploader;