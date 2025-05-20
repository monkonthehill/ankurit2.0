import React from 'react';
import PropTypes from 'prop-types';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Avatar,
  Button,
  Chip
} from '@mui/material';
import { IKImage } from 'imagekitio-react';
import CallIcon from '@mui/icons-material/Call';
import ChatIcon from '@mui/icons-material/Chat';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product, isFeatured = false }) => {
  const navigate = useNavigate();

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    }).replace(/\s/g, ' ');
  };

  const handleProductClick = () => {
    navigate(`/product-detail/${product.id}`);
  };

  return (
    <Card 
      className={`product-card ${isFeatured ? 'featured' : ''}`}
      onClick={handleProductClick}
    >
      {isFeatured && (
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
              height: 160,
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
      
      <CardContent className="product-content">
        <Typography className="product-date" variant="caption">
          {formatDate(product.createdAt)}
        </Typography>
        
        <Typography className="product-title" variant="h6" component="h3">
          {product.name || 'Product'} for sale in {product.location || 'Location'}
        </Typography>
        
        <Typography className="product-price" variant="h5">
          ₹{product.price ? product.price.toLocaleString('en-IN') : '0'}
        </Typography>
        
        {product.description && (
          <Typography className="product-description" variant="body2">
            {product.description.length > 50 
              ? `${product.description.substring(0, 50)}...` 
              : product.description}
          </Typography>
        )}
        
        <Box className="product-seller">
          <Avatar 
            src={product.sellerPhotoURL} 
            className="seller-avatar"
            alt={product.sellerName || 'Seller'}
          />
          <Typography className="seller-name">
            {product.sellerName || 'Seller'}
          </Typography>
          {product.isVerified && (
            <Chip
              icon={<VerifiedIcon fontSize="small" />}
              label="Verified"
              size="small"
              className="verified-badge"
            />
          )}
        </Box>
        
        <Box className="product-actions">
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<CallIcon />}
            onClick={(e) => e.stopPropagation()}
          >
            Call
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<ChatIcon />}
            onClick={(e) => e.stopPropagation()}
          >
            Chat
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.number,
    location: PropTypes.string,
    createdAt: PropTypes.number,
    imageUrl: PropTypes.string,
    sellerName: PropTypes.string,
    sellerPhotoURL: PropTypes.string,
    isVerified: PropTypes.bool,
  }).isRequired,
  isFeatured: PropTypes.bool
};

ProductCard.defaultProps = {
  isFeatured: false
};

export default ProductCard;