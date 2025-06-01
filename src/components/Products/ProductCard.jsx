import React, { useState } from 'react';
// Assuming 'lucide-react' icons are available and relevant for other parts if needed
// import { Phone, MessageSquare } from 'lucide-react'; // Removed as buttons are removed

const ProductCard = ({ product, sellerName, isVerified, isTrusted, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Process image URLs for ImageKit (or other CDN if product.imageUrls is relative)
  const processImageUrl = (url) => {
    if (!url) return null;
    if (url.includes('http') || url.includes('data:image')) return url;
    // Assuming 'ankurit' is your ImageKit ID
    return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
  };

  const handleNextImage = (e) => {
    e.stopPropagation(); // Prevent card click when navigating images
    setCurrentImageIndex(prev =>
      prev === product.imageUrls.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = (e) => {
    e.stopPropagation(); // Prevent card click when navigating images
    setCurrentImageIndex(prev =>
      prev === 0 ? product.imageUrls.length - 1 : prev - 1
    );
  };

  const currentImageUrl = product.imageUrls?.length > currentImageIndex
    ? processImageUrl(product.imageUrls[currentImageIndex]) // Process image URL here
    : null;

  return (
    <div className="product-card" onClick={onClick}>
      <div className="product-image-container">
        {currentImageUrl ? (
          <>
            <img
              src={currentImageUrl}
              alt={product.name}
              loading="lazy"
              onError={(e) => {
                e.target.src = '/placeholder-plant.jpg'; // Fallback image
                e.target.onerror = null; // Prevent infinite loop
              }}
            />
            {product.imageUrls.length > 1 && (
              <>
                <button
                  className="image-nav-button prev"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                >
                  &lt;
                </button>
                <button
                  className="image-nav-button next"
                  onClick={handleNextImage}
                  aria-label="Next image"
                >
                  &gt;
                </button>
                <div className="image-counter">
                  {currentImageIndex + 1}/{product.imageUrls.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="image-placeholder">
            <span>No Image Available</span>
          </div>
        )}
      </div>
      <div className="product-details">
        <h3 title={product.name}>{product.name}</h3> {/* Add title for full name on hover */}
        <p className="price">₹{product.price?.toLocaleString() || 'N/A'}</p>
        {product.category && (
          <span className="product-category">{product.category}</span>
        )}
        <p className="description">
          {product.description?.length > 100
            ? `${product.description.substring(0, 100)}...`
            : product.description || 'No description available'}
        </p>
        <div className="product-meta">
          <div className="seller-info">
            <span className="seller">Sold by: {sellerName}</span>
            <div className="seller-badges">
              {isVerified && <span className="badge verified">Verified</span>}
              {isTrusted && <span className="badge trusted">Trusted</span>}
            </div>
          </div>
          <span className="location">{product.location || 'Location not specified'}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;