import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ref, get, query as rtdbQuery, orderByChild, limitToLast, equalTo } from 'firebase/database';
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp,
  collection,
  query as firestoreQuery,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { auth, db, database } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  FaHeart, 
  FaRegHeart, 
  FaArrowLeft,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaStar
} from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import premiumBadge from '../../assets/images/premium-account.png';
import placeholderImage from './placeholder-product.jpg';
import styles from './ProductDetailPage.module.css';
import Footer from '../../components/Homepage/Footer';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const negotiationFormRef = useRef(null);
  const reviewFormRef = useRef(null);
  
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showNegotiation, setShowNegotiation] = useState(false);
  const [buyerPrice, setBuyerPrice] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [formErrors, setFormErrors] = useState({
    negotiation: '',
    review: ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const processImageUrl = (url) => {
    if (!url) return placeholderImage;
    if (url.includes('http') || url.includes('data:image')) return url;
    return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    try {
      let date;
      
      // Handle Firebase Timestamp objects
      if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } 
      // Handle numeric timestamps (milliseconds since epoch)
      else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      }
      // Handle string timestamps
      else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      }
      // Handle Date objects directly
      else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        return 'Unknown date';
      }

      // Validate the date
      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }

      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productRef = ref(database, `products/${productId}`);
        const snapshot = await get(productRef);
        
        if (!snapshot.exists()) {
          throw new Error('Product not found');
        }

        const productData = snapshot.val();
        let imageUrls = [];
        
        if (productData.imageUrls && Array.isArray(productData.imageUrls)) {
          imageUrls = productData.imageUrls
            .map(url => processImageUrl(url))
            .filter(url => url !== null);
        } else if (productData.imageUrl) {
          const processedUrl = processImageUrl(productData.imageUrl);
          if (processedUrl) imageUrls = [processedUrl];
        }

        const productWithImages = {
          id: productId,
          ...productData,
          imageUrls: imageUrls.length ? imageUrls : [placeholderImage]
        };

        setProduct(productWithImages);
        
        if (productData.sellerId) {
          const sellerDoc = await getDoc(doc(db, 'users', productData.sellerId));
          if (sellerDoc.exists()) {
            setSeller({
              ...sellerDoc.data(),
              id: productData.sellerId,
              name: sellerDoc.data().name || sellerDoc.data().fullName || 'Seller',
              profilePhoto: sellerDoc.data().profilePhoto || sellerDoc.data().photoURL || placeholderImage
            });
          }
        }
        
        if (productData.sellerId) {
          const relatedQuery = rtdbQuery(
            ref(database, 'products'),
            orderByChild('sellerId'),
            equalTo(productData.sellerId),
            limitToLast(4)
          );
          const relatedSnapshot = await get(relatedQuery);
          if (relatedSnapshot.exists()) {
            setRelatedProducts(
              Object.entries(relatedSnapshot.val())
                .filter(([id]) => id !== productId)
                .map(([id, product]) => ({
                  id,
                  ...product,
                  imageUrls: (product.imageUrls || [product.imageUrl])
                    .map(processImageUrl)
                    .filter(url => url) || [placeholderImage]
                }))
            );
          }
        }

        if (productData.category) {
          const similarQuery = rtdbQuery(
            ref(database, 'products'),
            orderByChild('category'),
            equalTo(productData.category),
            limitToLast(4)
          );
          const similarSnapshot = await get(similarQuery);
          if (similarSnapshot.exists()) {
            setSimilarProducts(
              Object.entries(similarSnapshot.val())
                .filter(([id]) => id !== productId)
                .map(([id, product]) => ({
                  id,
                  ...product,
                  imageUrls: (product.imageUrls || [product.imageUrl])
                    .map(processImageUrl)
                    .filter(url => url) || [placeholderImage]
                }))
            );
          }
        }

        const reviewsQuery = firestoreQuery(
          collection(db, 'reviews'),
          where('productId', '==', productId),
          orderBy('createdAt', 'desc')
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        setReviews(reviewsSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        })));

      } catch (error) {
        console.error('Error fetching product:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setCurrentUser({
          ...user,
          ...userDoc.data()
        });
        
        if (productId) {
          const wishlistRef = doc(db, 'users', user.uid, 'wishlist', productId);
          const wishlistDoc = await getDoc(wishlistRef);
          setIsWishlisted(wishlistDoc.exists());
        }
      } else {
        setCurrentUser(null);
      }
    });

    fetchProduct();
    return () => unsubscribe();
  }, [productId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setCurrentUser({
          ...user,
          ...userDoc.data()
        });
        
        if (product) {
          const wishlistRef = doc(db, 'users', user.uid, 'wishlist', productId);
          const wishlistDoc = await getDoc(wishlistRef);
          setIsWishlisted(wishlistDoc.exists());
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, [productId, product]);

  const toggleWishlist = async () => {
    if (!currentUser) {
      alert('Please sign in to add to wishlist');
      return;
    }

    try {
      const wishlistRef = doc(db, 'users', currentUser.uid, 'wishlist', productId);
      
      if (isWishlisted) {
        await deleteDoc(wishlistRef);
        setIsWishlisted(false);
      } else {
        await setDoc(wishlistRef, {
          productId,
          addedAt: new Date(),
          productData: {
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrls?.[0] || '',
            location: product.location
          }
        });
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      alert('Failed to update wishlist. Please try again.');
    }
  };

  const handleNegotiate = () => {
    if (!currentUser) {
      alert('Please sign in to negotiate price');
      return;
    }
    setShowNegotiation(true);
    setBuyerPrice(product.price.toString());
    setFormErrors({ ...formErrors, negotiation: '' });
  };

  const validateNegotiation = () => {
    if (!buyerPrice || isNaN(buyerPrice)) {
      setFormErrors({ ...formErrors, negotiation: 'Please enter a valid price' });
      return false;
    }
    if (parseFloat(buyerPrice) >= product.price) {
      setFormErrors({ ...formErrors, negotiation: 'Your offer should be lower than the current price' });
      return false;
    }
    return true;
  };

  const submitNegotiation = async (e) => {
    e.preventDefault();
    if (!validateNegotiation()) return;
    
    try {
      navigate(`/messages/${seller.id}`, {
        state: {
          prefillMessage: `Hi ${seller.name}, I'm interested in your product "${product.name}" (₹${product.price}). I'd like to negotiate the price to ₹${buyerPrice}. Here's the link to the product: ${window.location.href}`
        }
      });
    } catch (error) {
      console.error('Error submitting negotiation:', error);
      alert('Failed to start negotiation. Please try again.');
    }
  };

  const validateReview = () => {
    if (!newReview.comment.trim()) {
      setFormErrors({ ...formErrors, review: 'Please enter your review' });
      return false;
    }
    if (newReview.comment.length > 500) {
      setFormErrors({ ...formErrors, review: 'Review must be less than 500 characters' });
      return false;
    }
    return true;
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    
    if (!currentUser) {
      alert('Please sign in to submit a review');
      setIsSubmittingReview(false);
      return;
    }

    if (!newReview.comment.trim()) {
      setFormErrors({ ...formErrors, review: 'Review comment cannot be empty' });
      setIsSubmittingReview(false);
      return;
    }

    try {
      const reviewData = {
        productId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split('@')[0],
        userPhoto: currentUser.photoURL || placeholderImage,
        rating: Number(newReview.rating),
        comment: newReview.comment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const reviewRef = doc(db, 'reviews', `${productId}_${currentUser.uid}`);
      await setDoc(reviewRef, reviewData);

      setReviews(prev => [
        ...prev.filter(r => r.id !== `${productId}_${currentUser.uid}`),
        {
          id: `${productId}_${currentUser.uid}`,
          ...reviewData,
          createdAt: new Date() // Use current date for immediate UI update
        }
      ]);

      setNewReview({ rating: 5, comment: '' });
      setFormErrors({ ...formErrors, review: '' });

    } catch (error) {
      console.error('Review submission error:', error);
      setFormErrors({ 
        ...formErrors, 
        review: error.message || 'Failed to submit review' 
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === product.imageUrls.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? product.imageUrls.length - 1 : prev - 1
    );
  };

  const handleWhatsApp = () => {
    if (!seller?.phoneNumber) {
      alert('Seller has not shared contact info');
      return;
    }
    const number = seller.phoneNumber.replace(/\D/g, '');
    const message = `Hi ${seller.name}, I'm interested in ${product.name} (₹${product.price})`;
    window.open(`https://wa.me/91${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer} aria-live="polite">
        <div className={styles.loadingSpinner}></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Product</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FaArrowLeft /> Back to Products
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.notFoundContainer}>
        <h2>Product Not Found</h2>
        <p>The product you're looking for doesn't exist or may have been removed.</p>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FaArrowLeft /> Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button 
        className={styles.backButton} 
        onClick={() => navigate(-1)}
        aria-label="Go back to previous page"
      >
        <FaArrowLeft /> Back to Products
      </button>

      {/* Product Gallery */}
      <section className={styles.gallerySection} aria-labelledby="product-gallery-heading">
        <h2 id="product-gallery-heading" className="visually-hidden">Product Images</h2>
        <div className={styles.mainImageContainer}>
          <img 
            src={product.imageUrls[currentImageIndex]} 
            alt={product.name}
            className={styles.mainImage}
            onClick={() => window.open(product.imageUrls[currentImageIndex], '_blank')}
            onError={(e) => {
              e.target.src = placeholderImage;
              e.target.onerror = null;
            }}
          />
          
          {product.imageUrls.length > 1 && (
            <>
              <button 
                className={`${styles.navButton} ${styles.prevButton}`}
                onClick={handlePrevImage}
                aria-label="Previous image"
              >
                &lt;
              </button>
              <button 
                className={`${styles.navButton} ${styles.nextButton}`}
                onClick={handleNextImage}
                aria-label="Next image"
              >
                &gt;
              </button>
              <div className={styles.imageCounter}>
                {currentImageIndex + 1}/{product.imageUrls.length}
              </div>
            </>
          )}
        </div>

        {product.imageUrls.length > 1 && (
          <div className={styles.thumbnailContainer} role="list">
            {product.imageUrls.map((url, index) => (
              <button
                key={index}
                className={`${styles.thumbnailButton} ${index === currentImageIndex ? styles.active : ''}`}
                onClick={() => setCurrentImageIndex(index)}
                aria-label={`View image ${index + 1} of ${product.imageUrls.length}`}
                role="listitem"
              >
                <img
                  src={url}
                  alt=""
                  className={styles.thumbnail}
                  onError={(e) => {
                    e.target.src = placeholderImage;
                    e.target.onerror = null;
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Product Details */}
      <section className={styles.detailsSection} aria-labelledby="product-details-heading">
        <div className={styles.productHeader}>
          <h1 id="product-details-heading">{product.name}</h1>
          <div className={styles.priceContainer}>
            <span className={styles.price}>₹{product.price?.toLocaleString('en-IN')}</span>
            <button 
              className={`${styles.wishlistButton} ${isWishlisted ? styles.active : ''}`}
              onClick={toggleWishlist}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlisted ? <FaHeart /> : <FaRegHeart />}
              {isWishlisted ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className={styles.metaInfo}>
          <div className={styles.metaItem}>
            <MdLocationOn className={styles.metaIcon} aria-hidden="true" />
            <span>{product.location || 'Location not specified'}</span>
          </div>
          <div className={styles.metaItem}>
            <span>Posted on: {formatDate(product.createdAt || product.timestamp)}</span>
          </div>
          {product.category && (
            <div className={styles.metaItem}>
              <span>Category: {product.category}</span>
            </div>
          )}
        </div>

        <div className={styles.descriptionSection}>
          <h2>Description</h2>
          <p>{product.description || 'No description provided'}</p>
        </div>

        <div className={styles.specifications}>
          <h2>Plant Specifications</h2>
          <div className={styles.specGrid}>
            <div className={styles.specItem}>
              <span>Plant Type</span>
              <strong>{product.plantType || 'Not specified'}</strong>
            </div>
            <div className={styles.specItem}>
              <span>Pot Size</span>
              <strong>{product.potSize || 'Not specified'}</strong>
            </div>
            <div className={styles.specItem}>
              <span>Height</span>
              <strong>{product.height || 'Not specified'}</strong>
            </div>
            <div className={styles.specItem}>
              <span>Sunlight</span>
              <strong>{product.sunlight || 'Not specified'}</strong>
            </div>
            <div className={styles.specItem}>
              <span>Quantity</span>
              <strong>{product.quantity || '1'}</strong>
            </div>
          </div>
        </div>

        {/* Location Map */}
        {seller?.lat && seller?.lng && (
          <div className={styles.locationSection}>
            <h2>Seller Location</h2>
            <div className={styles.mapContainer}>
              <MapContainer
                center={[seller.lat, seller.lng]}
                zoom={13}
                className={styles.map}
                aria-label="Seller location map"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[seller.lat, seller.lng]}>
                  <Popup>
                    {seller.name}'s Location
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            {currentUser?.lat && currentUser?.lng && (
              <div className={styles.distanceInfo}>
                <FaMapMarkerAlt aria-hidden="true" />
                <span>Approx. {calculateDistance(
                  currentUser.lat,
                  currentUser.lng,
                  seller.lat,
                  seller.lng
                )} km from your location</span>
              </div>
            )}
          </div>
        )}

        {/* Price Negotiation */}
        <div className={styles.negotiationSection}>
          <button 
            className={styles.negotiateButton}
            onClick={handleNegotiate}
            aria-expanded={showNegotiation}
            aria-controls="negotiationForm"
          >
            Negotiate Price
          </button>
          
          {showNegotiation && (
            <form 
              id="negotiationForm"
              ref={negotiationFormRef}
              onSubmit={submitNegotiation}
              className={styles.negotiationModal}
              noValidate
            >
              <div className={styles.negotiationContent}>
                <h3>Price Negotiation</h3>
                <p>Seller's Price: ₹{product.price?.toLocaleString('en-IN')}</p>
                
                <div className={styles.priceInput}>
                  <label htmlFor="buyerPrice">Your Offer Price (₹):</label>
                  <input
                    type="number"
                    id="buyerPrice"
                    name="buyerPrice"
                    value={buyerPrice}
                    onChange={(e) => setBuyerPrice(e.target.value)}
                    min="1"
                    step="1"
                    required
                    aria-required="true"
                    aria-invalid={!!formErrors.negotiation}
                    aria-describedby="priceError"
                  />
                  {formErrors.negotiation && (
                    <p id="priceError" className={styles.errorText}>{formErrors.negotiation}</p>
                  )}
                </div>
                
                <div className={styles.negotiationButtons}>
                  <button 
                    type="button"
                    className={styles.cancelButton}
                    onClick={() => setShowNegotiation(false)}
                    aria-label="Cancel negotiation"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className={styles.submitButton}
                    disabled={!buyerPrice || parseFloat(buyerPrice) >= product.price}
                    aria-label="Submit price negotiation"
                  >
                    Ask Seller
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Seller Information */}
      {seller && (
        <section className={styles.sellerSection} aria-labelledby="seller-info-heading">
          <h2 id="seller-info-heading">Seller Information</h2>
          <div className={styles.sellerCard}>
            <div className={styles.sellerHeader}>
              <img
                src={seller.profilePhoto}
                alt={`Profile of ${seller.name}`}
                className={styles.sellerAvatar}
                onError={(e) => {
                  e.target.src = placeholderImage;
                  e.target.onerror = null;
                }}
              />
              <div className={styles.sellerInfo}>
                <h3>
                  {seller.name}
                  {(seller.plan === 'golden' || seller.plan === 'nursery') && (
                    <img 
                      src={premiumBadge} 
                      alt="Premium seller" 
                      className={styles.premiumBadge}
                    />
                  )}
                </h3>
                <p className={styles.sellerMeta}>
                  Member since {formatDate(seller.createdAt?.toDate?.() || seller.createdAt)}
                </p>
                <div className={styles.sellerBadges}>
                  {seller.isVerified && (
                    <span className={styles.verifiedBadge}>
                      <span className="visually-hidden">Verified</span>
                      <span aria-hidden="true">✓ Verified</span>
                    </span>
                  )}
                  {seller.isTrusted && (
                    <span className={styles.trustedBadge}>
                      <span className="visually-hidden">Trusted</span>
                      <span aria-hidden="true">★ Trusted</span>
                    </span>
                  )}
                  {seller.userType === 'farmer' && (
                    <span className={styles.farmerBadge}>
                      <span className="visually-hidden">Farmer</span>
                      <span aria-hidden="true">🌱 Farmer</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.sellerContact}>
              <button 
                className={styles.chatButton}
                onClick={() => navigate(`/messages/${seller.id}`)}
                aria-label={`Chat with ${seller.name}`}
              >
                Chat with Seller
              </button>
              {seller.phoneNumber && (
                <button 
                  className={styles.whatsappButton}
                  onClick={handleWhatsApp}
                  aria-label={`Contact ${seller.name} via WhatsApp`}
                >
                  <FaWhatsapp aria-hidden="true" /> WhatsApp
                </button>
              )}
            </div>

            <div className={styles.sellerNotice}>
              <p>Please don't spam or misuse the seller's contact information. Violations may lead to account suspension.</p>
            </div>

            <Link 
              to={`/profile/${seller.id}`} 
              className={styles.viewProfile}
              aria-label={`View full profile of ${seller.name}`}
            >
              View Full Profile
            </Link>
          </div>
        </section>
      )}

      {/* Product Reviews */}
      <section className={styles.reviewsSection} aria-labelledby="reviews-heading">
        <h2 id="reviews-heading">Product Reviews</h2>
        
        {reviews.length > 0 ? (
          <div className={styles.reviewsList} role="list">
            {reviews.map(review => {
              const safeDate = review.createdAt ? formatDate(review.createdAt) : 'Unknown date';
              const dateTime = review.createdAt instanceof Date ? review.createdAt.toISOString() : '';
              
              return (
                <article key={review.id} className={styles.reviewItem} role="listitem">
                  <div className={styles.reviewHeader}>
                    <img
                      src={review.userPhoto}
                      alt={`Profile of ${review.userName}`}
                      className={styles.reviewerAvatar}
                      onError={(e) => {
                        e.target.src = placeholderImage;
                        e.target.onerror = null;
                      }}
                    />
                    <div>
                      <h4>{review.userName}</h4>
                      <div className={styles.reviewRating} aria-label={`Rated ${review.rating} out of 5`}>
                        {[...Array(5)].map((_, i) => (
                          <FaStar 
                            key={i} 
                            className={i < review.rating ? styles.starFilled : styles.starEmpty}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <p className={styles.reviewDate}>
                        <time dateTime={dateTime}>
                          {safeDate}
                        </time>
                      </p>
                    </div>
                  </div>
                  <p className={styles.reviewComment}>{review.comment}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className={styles.noReviews}>No reviews yet. Be the first to review!</p>
        )}

        {currentUser && (
          <form 
            ref={reviewFormRef}
            onSubmit={submitReview}
            className={styles.reviewForm}
            noValidate
            aria-labelledby="write-review-heading"
          >
            <h3 id="write-review-heading">Write a Review</h3>
            <div className={styles.ratingInput}>
              <label id="ratingLabel">Rating:</label>
              <div 
                className={styles.stars} 
                role="radiogroup"
                aria-labelledby="ratingLabel"
              >
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.starButton} ${star <= newReview.rating ? styles.selected : ''}`}
                    onClick={() => setNewReview({...newReview, rating: star})}
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    aria-checked={star === newReview.rating}
                    role="radio"
                  >
                    <FaStar 
                      className={star <= newReview.rating ? styles.starFilled : styles.starEmpty}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.commentInput}>
              <label htmlFor="reviewComment">Your Review:</label>
              <textarea
                id="reviewComment"
                name="reviewComment"
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                placeholder="Share your experience with this product..."
                required
                aria-required="true"
                aria-invalid={!!formErrors.review}
                aria-describedby="reviewError"
                rows="4"
              />
              {formErrors.review && (
                <p id="reviewError" className={styles.errorText}>{formErrors.review}</p>
              )}
            </div>
            <button 
              type="submit" 
              className={styles.submitReview}
              aria-label="Submit your review"
            >
              Submit Review
            </button>
          </form>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className={styles.relatedProducts} aria-labelledby="related-products-heading">
          <h2 id="related-products-heading">More from this Seller</h2>
          <div className={styles.productsGrid} role="list">
            {relatedProducts.map(product => (
              <article 
                key={product.id} 
                className={styles.productCard}
                onClick={() => navigate(`/product/${product.id}`)}
                role="listitem"
              >
                <img
                  src={product.imageUrls[0]}
                  alt=""
                  className={styles.productImage}
                  onError={(e) => {
                    e.target.src = placeholderImage;
                    e.target.onerror = null;
                  }}
                />
                <div className={styles.productInfo}>
                  <h3>{product.name}</h3>
                  <p className={styles.productPrice}>₹{product.price?.toLocaleString('en-IN')}</p>
                  <p className={styles.productLocation}>
                    <MdLocationOn aria-hidden="true" /> {product.location || 'Not specified'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <section className={styles.similarProducts} aria-labelledby="similar-products-heading">
          <h2 id="similar-products-heading">Similar Plants You Might Like</h2>
          <div className={styles.productsGrid} role="list">
            {similarProducts.map(product => (
              <article 
                key={product.id} 
                className={styles.productCard}
                onClick={() => navigate(`/product/${product.id}`)}
                role="listitem"
              >
                <img
                  src={product.imageUrls[0]}
                  alt=""
                  className={styles.productImage}
                  onError={(e) => {
                    e.target.src = placeholderImage;
                    e.target.onerror = null;
                  }}
                />
                <div className={styles.productInfo}>
                  <h3>{product.name}</h3>
                  <p className={styles.productPrice}>₹{product.price?.toLocaleString('en-IN')}</p>
                  <p className={styles.productLocation}>
                    <MdLocationOn aria-hidden="true" /> {product.location || 'Not specified'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;