import React from 'react';
import { Button, TextField, Grid, Typography, Box } from '@mui/material';

const BasicInfoForm = ({ profileData, handleChange, handleNext }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    handleNext();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', mb: 3 }}>
        Personal Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            label="Full Name"
            name="fullName"
            value={profileData.fullName}
            onChange={handleChange}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={profileData.email}
            onChange={handleChange}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            label="Contact Number"
            name="contact"
            value={profileData.contact}
            onChange={handleChange}
            variant="outlined"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Bio"
            name="bio"
            value={profileData.bio}
            onChange={handleChange}
            variant="outlined"
            multiline
            rows={3}
            placeholder="Tell us about yourself and your farming experience..."
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Location"
            name="location"
            value={profileData.location}
            onChange={handleChange}
            variant="outlined"
            placeholder="Village/Town, District, State"
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          type="submit"
          variant="contained"
          sx={{
            backgroundColor: '#2e7d32',
            '&:hover': { backgroundColor: '#1b5e20' }
          }}
        >
          Next: Farm Details
        </Button>
      </Box>
    </form>
  );
};

export default BasicInfoForm;