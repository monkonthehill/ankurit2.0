import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ref, get, query as rtdbQuery, orderByChild, limitToLast, equalTo } from 'firebase/database';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, database } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FaHeart, FaRegHeart, FaSearchPlus, FaArrowLeft, FaPhone, FaEnvelope } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import styles from './ProductDetailPage.module.css';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactForm, setContactForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    allowContact: true
  });

  const processImageUrl = (url) => {
    if (!url) return null;
    if (url.includes('http') || url.includes('data:image')) return url;
    // Ensure proper ImageKit URL formatting
    return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
  };

  // Fetch product data
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
        
        // Process image URLs
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
          imageUrls: imageUrls.length ? imageUrls : ['/placeholder-plant.jpg']
        };

        setProduct(productWithImages);
        
        // Fetch seller data if sellerId exists
        if (productData.sellerId && typeof productData.sellerId === 'string') {
          try {
            const sellerDoc = await getDoc(doc(db, 'users', productData.sellerId));
            if (sellerDoc.exists()) {
              setSeller(sellerDoc.data());
            }
          } catch (sellerError) {
            console.error('Error fetching seller:', sellerError);
          }
        }
        
        // Fetch related products (same seller)
        if (productData.sellerId) {
          const productsQuery = rtdbQuery(
            ref(database, 'products'),
            orderByChild('sellerId'),
            equalTo(productData.sellerId),
            limitToLast(4)
          );
          const relatedSnapshot = await get(productsQuery);
          
          if (relatedSnapshot.exists()) {
            const relatedProductsData = [];
            relatedSnapshot.forEach((childSnapshot) => {
              if (childSnapshot.key !== productId) {
                const relatedProduct = childSnapshot.val();
                let relatedImageUrls = [];
                
                if (relatedProduct.imageUrls && Array.isArray(relatedProduct.imageUrls)) {
                  relatedImageUrls = relatedProduct.imageUrls
                    .map(url => processImageUrl(url))
                    .filter(url => url !== null);
                } else if (relatedProduct.imageUrl) {
                  const processedUrl = processImageUrl(relatedProduct.imageUrl);
                  if (processedUrl) relatedImageUrls = [processedUrl];
                }
                
                relatedProductsData.push({
                  id: childSnapshot.key,
                  ...relatedProduct,
                  imageUrls: relatedImageUrls.length ? relatedImageUrls : ['/placeholder-plant.jpg']
                });
              }
            });
            setRelatedProducts(relatedProductsData);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Check auth state and wishlist status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && product) {
        try {
          const wishlistRef = doc(db, 'users', user.uid, 'wishlist', productId);
          const wishlistDoc = await getDoc(wishlistRef);
          setIsWishlisted(wishlistDoc.exists());
        } catch (error) {
          console.error('Error checking wishlist:', error);
        }
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

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send this data to your backend or Firebase function
    console.log('Contact form submitted:', contactForm);
    alert('Your details have been shared with the seller. They will contact you soon.');
    setShowContactForm(false);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    try {
      const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const handleNextImage = (e) => {
    e?.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === product.imageUrls.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = (e) => {
    e?.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === 0 ? product.imageUrls.length - 1 : prev - 1
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Product</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Back to Products
        </button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="not-found-container">
        <h2>Product Not Found</h2>
        <p>The product you're looking for doesn't exist or may have been removed.</p>
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Back to Products
        </button>
      </div>
    );
  }

return (
  <div className={styles.productDetailContainer}>
    <button className={styles.backButton} onClick={() => navigate(-1)}>
      <FaArrowLeft /> Back to Products
    </button>

    <div className={styles.productHeader}>
      <h1>{product.name}</h1>
    </div>

    <div className={styles.productMain}>
      <div className={styles.productGallery}>
        <div className={styles.mainImage} onClick={() => setShowImageZoom(true)}>
          <img 
            src={product.imageUrls[currentImageIndex]} 
            alt={product.name}
            onError={(e) => {
              e.target.src = '/placeholder-plant.jpg';
              e.target.onerror = null;
            }}
          />
          <button className={styles.zoomBtn}>
            <FaSearchPlus />
          </button>
        </div>

        {product.imageUrls.length > 1 && (
          <div className={styles.thumbnailContainer}>
            {product.imageUrls.map((url, index) => (
              <div 
                key={index}
                className={`${styles.thumbnail} ${index === currentImageIndex ? styles.active : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img 
                  src={url} 
                  alt={`${product.name} thumbnail ${index + 1}`}
                  onError={(e) => {
                    e.target.src = '/placeholder-plant.jpg';
                    e.target.onerror = null;
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {showImageZoom && (
          <div className={styles.imageZoomModal} onClick={() => setShowImageZoom(false)}>
            <img 
              src={product.imageUrls[currentImageIndex]} 
              alt={product.name}
              onError={(e) => {
                e.target.src = '/placeholder-plant.jpg';
                e.target.onerror = null;
              }}
            />
            {product.imageUrls.length > 1 && (
              <>
                <button 
                  className={`${styles.imageNavButton} ${styles.prev}`}
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                >
                  &lt;
                </button>
                <button 
                  className={`${styles.imageNavButton} ${styles.next}`}
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
        )}
      </div>

      <div className={styles.productInfo}>
        <div className={styles.productMeta}>
          <div className={styles.metaItem}>
            <span>Location</span>
            <strong><MdLocationOn /> {product.location || 'Not specified'}</strong>
          </div>
          <div className={styles.metaItem}>
            <span>Posted on</span>
            <strong>{formatDate(product.createdAt || product.timestamp)}</strong>
          </div>
          {product.category && (
            <div className={styles.metaItem}>
              <span>Category</span>
              <strong>{product.category}</strong>
            </div>
          )}
        </div>

        <div className={styles.productDescription}>
          <h2>Description</h2>
          <p>{product.description || 'No description available'}</p>
          
          <div className={styles.productSpecs}>
            <h3>Plant Details</h3>
            <ul>
              <li>Plant Type: {product.plantType || 'N/A'}</li>
              <li>Pot Size: {product.potSize || 'N/A'}</li>
              <li>Height: {product.height || 'N/A'}</li>
              <li>Sunlight Requirements: {product.sunlight || 'N/A'}</li>
              {product.quantity && <li>Available Quantity: {product.quantity}</li>}
            </ul>
          </div>
        </div>

        <div className={styles.productActions}>
          <div className={styles.priceSection}>
            <h3>₹{product.price?.toLocaleString('en-IN') || 'N/A'}</h3>
          </div>
          <div className={styles.actionButtons}>
            <button 
              className={`${styles.wishlistBtn} ${isWishlisted ? styles.active : ''}`}
              onClick={toggleWishlist}
            >
              {isWishlisted ? <FaHeart /> : <FaRegHeart />}
              {isWishlisted ? 'Wishlisted' : 'Wishlist'}
            </button>
            <button 
              className={styles.contactBtn}
              onClick={() => setShowContactForm(true)}
            >
              Contact Seller
            </button>
          </div>
        </div>

        {seller && (
          <div className={styles.sellerInfo}>
            <h3>Seller Information</h3>
            <div className={styles.sellerDetails}>
              <div className={styles.sellerMeta}>
                <p>Posted by <strong>{seller.name || seller.fullName || 'Seller'}</strong></p>
                <p>Member since {formatDate(seller.createdAt?.toDate?.() || seller.createdAt)}</p>
                <div className={styles.sellerBadges}>
                  {seller.isVerified && <span className={styles.badgeVerified}>Verified</span>}
                  {seller.isTrusted && <span className={styles.badgeTrusted}>Trusted</span>}
                  {seller.userType === 'farmer' && <span className={styles.badgeFarmer}>Farmer</span>}
                </div>
              </div>
              <Link to={`/profile/${product.sellerId}`} className={styles.viewProfile}>
                View Profile
              </Link>
            </div>
            <div className={styles.sellerContact}>
              {seller.phone && (
                <a href={`tel:${seller.phone}`} className={styles.contactMethod}>
                  <FaPhone /> Call Seller
                </a>
              )}
              {seller.email && (
                <a href={`mailto:${seller.email}`} className={styles.contactMethod}>
                  <FaEnvelope /> Email Seller
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    {showContactForm && (
      <div className={styles.contactModal}>
        <div className={styles.contactFormContainer}>
          <button 
            className={styles.closeModal}
            onClick={() => setShowContactForm(false)}
          >
            &times;
          </button>
          <h3>CONTACT SELLER</h3>
          <p>Fill the form just once to get faster responses. We will share your details with the seller.</p>
          <form onSubmit={handleContactSubmit}>
            <div className={styles.formGroup}>
              <label>Full Name *</label>
              <input
                type="text"
                value={contactForm.fullName}
                onChange={(e) => setContactForm({...contactForm, fullName: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Email Address *</label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Mobile Number *</label>
              <div className={styles.phoneInput}>
                <select defaultValue="+91">
                  <option value="+91">+91 (India)</option>
                </select>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit phone number"
                />
              </div>
            </div>
            <div className={styles.formCheck}>
              <input
                type="checkbox"
                checked={contactForm.allowContact}
                onChange={(e) => setContactForm({...contactForm, allowContact: e.target.checked})}
                id="allowContact"
              />
              <label htmlFor="allowContact">I am ok to be contacted by other advertisers too</label>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn}>Request Callback</button>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowContactForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {relatedProducts.length > 0 && (
      <div className={styles.relatedProducts}>
        <h2>Similar Plants from this Seller</h2>
        <div className={styles.productsGrid}>
          {relatedProducts.map((item) => (
            <div className={styles.productCard} key={item.id} onClick={() => navigate(`/product/${item.id}`)}>
              <div className={styles.productImage}>
                <img 
                  src={item.imageUrls[0]} 
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = '/placeholder-plant.jpg';
                    e.target.onerror = null;
                  }}
                />
              </div>
              <div className={styles.productDetails}>
                <h3>{item.name}</h3>
                <p className={styles.price}>₹{item.price?.toLocaleString('en-IN') || 'N/A'}</p>
                <p className={styles.location}><MdLocationOn /> {item.location || 'Not specified'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);
};

export default ProductDetailPage;