import React from 'react';
import { Box, Avatar, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import ImageUploadComponent from './ImageUploadComponent';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Typography from '@mui/material/Typography';

const CoverPhotoContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '200px',
  borderRadius: '15px 15px 0 0',
  overflow: 'hidden',
  backgroundColor: '#e8f5e9',
  backgroundImage: 'linear-gradient(to bottom, #a5d6a7, #81c784)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(8),
}));

const ProfilePhotoContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: '-64px',
  left: '50%',
  transform: 'translateX(-50%)',
  border: '4px solid white',
  borderRadius: '50%',
  backgroundColor: 'white',
}));

const ProfileHeader = ({ profilePhotoUrl, coverPhotoUrl, onPhotoChange }) => {
  return (
    <Box sx={{ position: 'relative', mb: 8 }}>
      <CoverPhotoContainer>
        {coverPhotoUrl ? (
          <img 
            src={coverPhotoUrl} 
            alt="Cover" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Typography variant="h6" color="textSecondary">
            Upload a cover photo
          </Typography>
        )}
        <Box sx={{ position: 'absolute', bottom: 16, right: 16 }}>
          <ImageUploadComponent 
            onUpload={(url) => onPhotoChange('cover', url)}
            buttonComponent={
              <IconButton color="primary" sx={{ backgroundColor: 'white' }}>
                <CameraAltIcon />
              </IconButton>
            }
          />
        </Box>
      </CoverPhotoContainer>
      
      <ProfilePhotoContainer>
        <Avatar
          src={profilePhotoUrl}
          sx={{ width: 120, height: 120 }}
        />
        <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
          <ImageUploadComponent 
            onUpload={(url) => onPhotoChange('profile', url)}
            buttonComponent={
              <IconButton color="primary" sx={{ backgroundColor: 'white' }}>
                <CameraAltIcon fontSize="small" />
              </IconButton>
            }
          />
        </Box>
      </ProfilePhotoContainer>
    </Box>
  );
};

export default ProfileHeader;