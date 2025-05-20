import { IKImage } from 'imagekitio-react';
import PremiumBadge from './PremiumBadge';
import './ProfileHeader.css';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../firebase/firebase'; // Update path
import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

const ProfileHeader = ({ userData, isPremium, onPhotoChange }) => {
  const navigate = useNavigate();

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${process.env.REACT_APP_IMAGEKIT_URL}${path}`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleEditProfile = () => {
    navigate('/profile-setup');
  };

  return (
    <div className="profile-header-container">
      {/* Action Buttons */}
      <div className="action-buttons-container">
        <Button 
          variant="contained" 
          startIcon={<EditIcon />}
          onClick={handleEditProfile}
          className="edit-profile-btn"
        >
          Edit Profile
        </Button>
        <Button 
          variant="contained" 
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          className="logout-btn"
        >
          Logout
        </Button>
      </div>

      {/* Cover Photo */}
      <div className="cover-photo-container">
        {userData?.coverPhotoUrl ? (
          <IKImage
            path={userData.coverPhotoUrl}
            transformation={[{ height: 300, width: 1200 }]}
            loading="lazy"
            className="cover-photo"
            alt="Cover"
          />
        ) : (
          <div className="cover-photo-placeholder"></div>
        )}
        
        {/* Cover Photo Upload Button */}
        <button 
          className="camera-btn cover-upload-btn"
          onClick={() => document.getElementById('cover-upload-input')?.click()}
        >
          <CameraAltIcon />
        </button>
        <input
          id="cover-upload-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => onPhotoChange('coverPhotoUrl', e.target.files[0])}
        />
      </div>
      
      {/* Profile Info Section */}
      <div className="profile-info-section">
        <div className="avatar-container">
          {userData?.profilePhotoUrl ? (
            <IKImage
              path={userData.profilePhotoUrl}
              transformation={[{ height: 120, width: 120 }]}
              loading="lazy"
              className="profile-avatar"
              alt="Profile"
            />
          ) : (
            <div className="avatar-placeholder">
              {userData?.name?.charAt(0) || 'U'}
            </div>
          )}
          
          {/* Profile Photo Upload Button */}
          <button 
            className="camera-btn avatar-upload-btn"
            onClick={() => document.getElementById('avatar-upload-input')?.click()}
          >
            <CameraAltIcon fontSize="small" />
          </button>
          <input
            id="avatar-upload-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => onPhotoChange('profilePhotoUrl', e.target.files[0])}
          />
          
          {isPremium && <PremiumBadge />}
        </div>
        
        <div className="user-meta">
          <h1 className="user-name">{userData?.name || 'Anonymous User'}</h1>
          <p className="user-location">
            <i className="fas fa-map-marker-alt"></i> {userData?.location || 'Location not specified'}
          </p>
          {userData?.bio && <p className="user-bio">{userData.bio}</p>}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;