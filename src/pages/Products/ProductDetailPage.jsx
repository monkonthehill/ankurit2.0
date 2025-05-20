import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Button, 
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import { IKImage } from 'imagekitio-react';
import CallIcon from '@mui/icons-material/Call';
import ChatIcon from '@mui/icons-material/Chat';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import { getDatabase, ref, get } from 'firebase/database';
import { app } from '../../firebaseConfig';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const db = getDatabase(app);
        const productRef = ref(db, `products/${productId}`);
        const snapshot = await get(productRef);
        
        if (snapshot.exists()) {
          setProduct({
            id: productId,
            ...snapshot.val()
          });
        } else {
          setError('Product not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    }).replace(/\s/g, ' ');
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="error-container">
        <Typography variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box className="product-detail-container">
      <Paper elevation={3} className="product-detail-card">
        {product.isFeatured && (
          <Box className="featured-badge">
            <StarIcon fontSize="small" />
            <Typography variant="caption">Featured</Typography>
          </Box>
        )}
        
        <Box className="product-image-container">
          {product.imageUrl ? (
            <IKImage
              path={product.imageUrl.startsWith('/') ? product.imageUrl.substring(1) : product.imageUrl}
              transformation={[{
                height: 400,
                width: '100%',
                quality: 'auto',
                format: 'auto',
                crop: 'fill'
              }]}
              loading="lazy"
              className="product-image"
              alt={product.name || 'Product image'}
            />
          ) : (
            <Box className="product-image-placeholder">
              <Typography variant="body2">No Image Available</Typography>
            </Box>
          )}
        </Box>
        
        <Box className="product-info-container">
          <Typography className="product-date" variant="caption">
            Posted on: {formatDate(product.createdAt)}
          </Typography>
          
          <Typography className="product-title" variant="h4">
            {product.name}
          </Typography>
          
          <Typography className="product-price" variant="h3">
            ₹{product.price ? product.price.toLocaleString('en-IN') : '0'}
          </Typography>
          
          {product.category && (
            <Chip label={product.category} className="product-category" />
          )}
          
          <Divider className="product-divider" />
          
          <Typography className="product-description" variant="body1">
            {product.description || 'No description available'}
          </Typography>
          
          <Box className="product-location">
            <Typography variant="subtitle1">Location:</Typography>
            <Typography>{product.location}</Typography>
          </Box>
          
          <Divider className="product-divider" />
          
          <Box className="seller-info">
            <Typography variant="h6">Seller Information</Typography>
            <Box className="seller-details">
              <Avatar 
                src={product.sellerPhotoURL} 
                className="seller-avatar"
                alt={product.sellerName || 'Seller'}
              />
              <Box>
                <Typography className="seller-name">
                  {product.sellerName || 'Seller'}
                </Typography>
                {product.isVerified && (
                  <Box className="verified-info">
                    <VerifiedIcon fontSize="small" />
                    <Typography variant="caption">Verified Seller</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
          
          <Box className="product-actions">
            <Button 
              variant="contained" 
              size="large" 
              startIcon={<CallIcon />}
              className="call-button"
            >
              Call Seller
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              startIcon={<ChatIcon />}
              className="chat-button"
            >
              Chat with Seller
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProductDetailPage;