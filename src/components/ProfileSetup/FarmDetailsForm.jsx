import React from 'react';
import { Button, TextField, Grid, Typography, Box } from '@mui/material';

const FarmDetailsForm = ({ profileData, handleChange, handleBack, handleSubmit, loading }) => {
  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', mb: 3 }}>
        Farm Information
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Main Crops"
            name="crops"
            value={profileData.crops}
            onChange={handleChange}
            variant="outlined"
            placeholder="e.g., Wheat, Rice, Vegetables"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Farm Size (acres)"
            name="farmSize"
            type="number"
            value={profileData.farmSize}
            onChange={handleChange}
            variant="outlined"
            InputProps={{ inputProps: { min: 0, step: 0.01 } }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            select
            label="Irrigation Type"
            name="irrigationType"
            value={profileData.irrigationType}
            onChange={handleChange}
            variant="outlined"
            SelectProps={{
              native: true,
            }}
          >
            <option value="">Select irrigation type</option>
            <option value="Drip">Drip Irrigation</option>
            <option value="Sprinkler">Sprinkler Irrigation</option>
            <option value="Flood">Flood Irrigation</option>
            <option value="Rainfed">Rainfed</option>
            <option value="Other">Other</option>
          </TextField>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          onClick={handleBack}
          variant="outlined"
          sx={{ color: '#2e7d32', borderColor: '#2e7d32' }}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: '#2e7d32',
            '&:hover': { backgroundColor: '#1b5e20' }
          }}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </Box>
    </form>
  );
};

export default FarmDetailsForm;