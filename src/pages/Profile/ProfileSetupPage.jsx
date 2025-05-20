import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ProfileHeader from '../../components/ProfileSetup/ProfileHeader';
import BasicInfoForm from '../../components/ProfileSetup/FarmDetailsForm';
import FarmDetailsForm from '../../components/ProfileSetup/FarmDetailsForm';
import { Box, Typography, CircularProgress, Paper, Stepper, Step, StepLabel } from '@mui/material';
import { styled } from '@mui/system';

const steps = ['Basic Information', 'Farm Details'];

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2, 0),
  backgroundColor: '#f5f5f5',
  borderRadius: '15px',
  border: '1px solid #e0e0e0',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
}));

const ProfileSetupPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState({
    fullName: '',
    contact: '',
    email: '',
    bio: '',
    profilePhotoUrl: '',
    coverPhotoUrl: '',
    crops: '',
    farmSize: '',
    irrigationType: '',
    location: '',
    isProfileCompleted: false
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setProfileData(userDoc.data());
        } else {
          // Initialize with email if available
          setProfileData(prev => ({
            ...prev,
            email: currentUser.email || '',
            name: currentUser.displayName || ''
          }));
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        lastUpdated: new Date(),
        isProfileCompleted: true
      });
      // Handle successful update
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6">Please sign in to access your profile</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold', textAlign: 'center', mb: 4 }}>
        {profileData.isProfileCompleted ? 'Edit Your Farming Profile' : 'Complete Your Farming Profile'}
      </Typography>
      
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <ProfileHeader 
        profilePhotoUrl={profileData.profilePhotoUrl} 
        coverPhotoUrl={profileData.coverPhotoUrl} 
        onPhotoChange={(type, url) => setProfileData(prev => ({
          ...prev,
          [type === 'profile' ? 'profilePhotoUrl' : 'coverPhotoUrl']: url
        }))}
      />

      <StyledPaper elevation={3}>
        {activeStep === 0 ? (
          <BasicInfoForm 
            profileData={profileData} 
            handleChange={handleChange} 
            handleNext={handleNext}
          />
        ) : (
          <FarmDetailsForm 
            profileData={profileData} 
            handleChange={handleChange} 
            handleBack={handleBack}
            handleSubmit={handleSubmit}
            loading={loading}
          />
        )}
      </StyledPaper>
    </Box>
  );
};

export default ProfileSetupPage;