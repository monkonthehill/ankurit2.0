import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Grid, Paper, Input } from '@mui/material';
import '../../pages/Products/ProductPage.css';
import { useUser } from '../../firebase/UserProvider';

const ProductForm = ({ onSubmit, initialData, onCancel }) => {
  const { currentUser } = useUser();
  const [product, setProduct] = useState(initialData || {
    name: '',
    description: '',
    price: '',
    location: '',
    imageUrl: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!product.name.trim()) newErrors.name = 'Name is required';
    if (!product.description.trim()) newErrors.description = 'Description is required';
    if (!product.location.trim()) newErrors.location = 'Location is required';
    if (!product.price || isNaN(product.price) || product.price <= 0) {
      newErrors.price = 'Valid price is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...product,
        price: Number(product.price),
        sellerId: currentUser.uid
      });
    }
  };

  const onUploadSuccess = (res) => {
    setProduct(prev => ({ ...prev, imageUrl: res.filePath }));
    setIsUploading(false);
  };

  const onUploadError = (err) => {
    console.error('Upload error:', err);
    setIsUploading(false);
  };

  const onUploadStart = () => {
    setIsUploading(true);
  };

  return (
    <Paper elevation={3} className="form-container">
      <Typography variant="h6" className="form-title">
        {initialData ? 'Edit Product' : 'Add New Product'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} className="product-form">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Product Name"
              name="name"
              value={product.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
              className="form-input"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={product.description}
              onChange={handleChange}
              multiline
              rows={4}
              error={!!errors.description}
              helperText={errors.description}
              required
              className="form-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Price (₹)"
              name="price"
              type="number"
              value={product.price}
              onChange={handleChange}
              error={!!errors.price}
              helperText={errors.price}
              required
              className="form-input"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              name="location"
              value={product.location}
              onChange={handleChange}
              error={!!errors.location}
              helperText={errors.location}
              required
              className="form-input"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" className="image-upload-label">
              Product Image
            </Typography>
            {product.imageUrl ? (
              <Box className="image-preview-container">
                <Button
                  variant="outlined"
                  color="error"
                  className="remove-image-btn"
                  onClick={() => setProduct(prev => ({ ...prev, imageUrl: '' }))}
                >
                  Remove Image
                </Button>
              </Box>
            ) : (
              <Box>
                <label htmlFor="product-image-upload">
                  <Input
                    accept="image/*"
                    id="product-image-upload"
                    type="file"
                    className="file-input"
                  />
                  <Button
                    variant="outlined"
                    component="span"
                    disabled={isUploading}
                    className="upload-btn"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </label>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} className="form-actions">
            {onCancel && (
              <Button 
                variant="outlined" 
                onClick={onCancel}
                className="cancel-btn"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              className="submit-btn"
              disabled={isUploading}
            >
              {initialData ? 'Update Product' : 'Add Product'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProductForm;