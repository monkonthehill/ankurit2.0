import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  auth,
  db,
  database,
  doc,
  getDoc,
  ref,
  get,
  query as firestoreQuery,
  where,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  orderByChild,
  equalTo,
  query as rtdbQuery,
  serverTimestamp,
  logout,
  remove,
  deleteDoc
} from '../../firebase/firebase';
import { 
  FaStar, 
  FaWhatsapp, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaEnvelope, 
  FaUserCheck, 
  FaEdit,
  FaThumbsUp,
  FaThumbsDown,
  FaTrash,
  FaSignOutAlt
} from 'react-icons/fa';
import './ProfilePage.css';

const ProfilePage = () => {
  const { userId: routeUserId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    sort: 'newest',
    availability: 'all'
  });
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    title: ''
  });

  // Get user ID directly from Firebase auth
  const currentUserId = auth.currentUser?.uid;
  const profileUserId = routeUserId || currentUserId;
  const isPersonalProfile = !routeUserId;

  console.log('Current User ID:', currentUserId);
  console.log('Profile User ID:', profileUserId);

  const getImageUrl = (path) => {
    if (!path || typeof path !== 'string') return null;
    const cleanPath = path.trim().replace(/^\//, '');
    return cleanPath ? `https://ik.imagekit.io/ankurit/${cleanPath}` : null;
  };

  useEffect(() => {
    if (!profileUserId && isPersonalProfile) {
      navigate('/auth');
      return;
    }

    if (!profileUserId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch profile data
        const profileRef = doc(db, 'users', profileUserId);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          throw new Error('Profile not found');
        }
        
        const profileData = profileSnap.data();
        setProfile({
          ...profileData,
          coverPhotoUrl: getImageUrl(profileData.coverPhotoUrl),
          profilePhotoUrl: getImageUrl(profileData.profilePhotoUrl)
        });

        // 2. Fetch products
        const productsRef = ref(database, 'products');
        const productsQuery = rtdbQuery(
          productsRef,
          orderByChild('sellerId'),
          equalTo(profileUserId)
        );
        
        const productsSnapshot = await get(productsQuery);
        const productsData = productsSnapshot.exists() 
          ? Object.entries(productsSnapshot.val()).map(([id, data]) => ({
              id,
              ...data,
              imageUrl: getImageUrl(data?.imageUrl)
            }))
          : [];
        setProducts(productsData);

        // 3. Fetch reviews
        const reviewsQuery = firestoreQuery(
          collection(db, 'reviews'),
          where('farmerId', '==', profileUserId)
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        setReviews(reviewsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })));

      } catch (err) {
        console.error('Error loading profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileUserId, navigate, isPersonalProfile]);

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  // Filter and sort products
  const filteredProducts = products.filter(product => {
    return (
      (filters.category === '' || product?.category === filters.category) &&
      (filters.availability === 'all' || 
       (filters.availability === 'inStock' && product?.stock > 0) ||
       (filters.availability === 'outOfStock' && product?.stock <= 0))
    );
  }).sort((a, b) => {
    const aPrice = a?.price || 0;
    const bPrice = b?.price || 0;
    const aRating = a?.rating || 0;
    const bRating = b?.rating || 0;
    const aCreated = a?.createdAt || 0;
    const bCreated = b?.createdAt || 0;

    if (filters.sort === 'priceLow') return aPrice - bPrice;
    if (filters.sort === 'priceHigh') return bPrice - aPrice;
    if (filters.sort === 'popular') return bRating - aRating;
    return bCreated - aCreated;
  });

  // Handle product deletion
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await remove(ref(database, `products/${productId}`));
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  // Handle review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      alert('Please login to submit a review');
      return;
    }

    try {
      const reviewData = {
        ...newReview,
        farmerId: profileUserId,
        reviewerId: currentUserId,
        reviewerName: auth.currentUser.displayName || 'Anonymous',
        reviewerPhoto: auth.currentUser.photoURL || '',
        createdAt: serverTimestamp(),
        likes: [],
        dislikes: [],
        helpfulCount: 0
      };

      const docRef = await addDoc(collection(db, 'reviews'), reviewData);
      setReviews([...reviews, { 
        id: docRef.id, 
        ...reviewData,
        createdAt: new Date() 
      }]);
      setNewReview({ rating: 5, comment: '', title: '' });
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  // Handle review reactions
  const handleReaction = async (reviewId, reactionType) => {
    if (!currentUserId) {
      alert('Please login to react to reviews');
      return;
    }

    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const review = reviews.find(r => r.id === reviewId);
      
      if (reactionType === 'like') {
        if (review.likes?.includes(currentUserId)) {
          await updateDoc(reviewRef, {
            likes: review.likes.filter(id => id !== currentUserId),
            helpfulCount: review.helpfulCount > 0 ? review.helpfulCount - 1 : 0
          });
        } else {
          await updateDoc(reviewRef, {
            likes: [...(review.likes || []), currentUserId],
            dislikes: (review.dislikes || []).filter(id => id !== currentUserId),
            helpfulCount: review.helpfulCount + 1
          });
        }
      } else if (reactionType === 'dislike') {
        if (review.dislikes?.includes(currentUserId)) {
          await updateDoc(reviewRef, {
            dislikes: review.dislikes.filter(id => id !== currentUserId)
          });
        } else {
          await updateDoc(reviewRef, {
            dislikes: [...(review.dislikes || []), currentUserId],
            likes: (review.likes || []).filter(id => id !== currentUserId),
            helpfulCount: review.helpfulCount > 0 ? review.helpfulCount - 1 : 0
          });
        }
      }

      setReviews(reviews.map(r => {
        if (r.id === reviewId) {
          const updatedReview = { ...r };
          if (reactionType === 'like') {
            if (updatedReview.likes?.includes(currentUserId)) {
              updatedReview.likes = updatedReview.likes.filter(id => id !== currentUserId);
              updatedReview.helpfulCount = Math.max(0, updatedReview.helpfulCount - 1);
            } else {
              updatedReview.likes = [...(updatedReview.likes || []), currentUserId];
              updatedReview.dislikes = (updatedReview.dislikes || []).filter(id => id !== currentUserId);
              updatedReview.helpfulCount = updatedReview.helpfulCount + 1;
            }
          } else if (reactionType === 'dislike') {
            if (updatedReview.dislikes?.includes(currentUserId)) {
              updatedReview.dislikes = updatedReview.dislikes.filter(id => id !== currentUserId);
            } else {
              updatedReview.dislikes = [...(updatedReview.dislikes || []), currentUserId];
              updatedReview.likes = (updatedReview.likes || []).filter(id => id !== currentUserId);
              updatedReview.helpfulCount = Math.max(0, updatedReview.helpfulCount - 1);
            }
          }
          return updatedReview;
        }
        return r;
      }));
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout(auth);
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="error-container">
        <p>Profile not found</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="farmer-profile-container">
      <header className="profile-header">
        <div className="cover-photo-container">
          {profile.coverPhotoUrl ? (
            <img 
              src={profile.coverPhotoUrl} 
              alt="Cover" 
              className="cover-photo"
              onError={(e) => e.target.style.display = 'none'}
            />
          ) : (
            <div className="cover-photo-placeholder">
              {profile.name || 'User'}
            </div>
          )}
          {isPersonalProfile && (
            <>
              <Link to="/profile-setup" className="edit-profile-button">
                <FaEdit /> Edit Profile
              </Link>
              <button className="logout-button" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </>
          )}
        </div>
        
        <div className="profile-info-container">
          <div className="profile-photo-container">
            {profile.profilePhotoUrl ? (
              <img 
                src={profile.profilePhotoUrl} 
                alt="Profile"
                className="profile-photo"
                onError={(e) => e.target.style.display = 'none'}
              />
            ) : (
              <div className="profile-photo-placeholder">
                {profile.name?.charAt(0) || 'U'}
              </div>
            )}
            {profile.isVerified && (
              <span className="verification-badge">
                <FaUserCheck />
              </span>
            )}
          </div>
          
          <div className="profile-details">
            <h1>{profile.name}</h1>
            <div className="location">
              <FaMapMarkerAlt /> {profile.location || 'Location not specified'}
            </div>
            
            {reviews.length > 0 && (
              <div className="rating">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <FaStar 
                      key={star} 
                      className={star <= Math.round(averageRating) ? 'filled' : 'empty'} 
                    />
                  ))}
                </div>
                <span>({reviews.length} reviews)</span>
              </div>
            )}
            
            <div className="contact-buttons">
              {profile.contact && (
                <>
                  <a href={`tel:${profile.contact}`} className="contact-button">
                    <FaPhone /> Call
                  </a>
                  <a 
                    href={`https://wa.me/${profile.contact}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="contact-button whatsapp"
                  >
                    <FaWhatsapp /> WhatsApp
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="profile-main">
        <nav className="profile-tabs">
          <button 
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            Products ({products.length})
          </button>
          <button 
            className={activeTab === 'about' ? 'active' : ''}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button 
            className={activeTab === 'reviews' ? 'active' : ''}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({reviews.length})
          </button>
        </nav>

        {activeTab === 'products' && (
          <div className="products-tab">
            <div className="filters-desktop">
              <div className="filter-group">
                <label>Category</label>
                <select 
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                >
                  <option value="">All Categories</option>
                  <option value="plants">Plants</option>
                  <option value="seeds">Seeds</option>
                  <option value="tools">Tools & Equipment</option>
                  <option value="fertilizers">Fertilizers</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Availability</label>
                <select 
                  value={filters.availability}
                  onChange={(e) => setFilters({...filters, availability: e.target.value})}
                >
                  <option value="all">All</option>
                  <option value="inStock">In Stock</option>
                  <option value="outOfStock">Out of Stock</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Sort By</label>
                <select 
                  value={filters.sort}
                  onChange={(e) => setFilters({...filters, sort: e.target.value})}
                >
                  <option value="newest">Newest</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map(product => (
                  <div key={product.id} className="product-card">
                    <div className="product-image-container">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="product-image"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <div className="product-image-placeholder">No Image</div>
                      )}
                      {product.stock <= 0 && (
                        <div className="out-of-stock-badge">Out of Stock</div>
                      )}
                      {isPersonalProfile && (
                        <div className="product-actions">
                          <button 
                            className="edit-button"
                            onClick={() => navigate(`/edit-product/${product.id}`)}
                          >
                            Edit
                          </button>
                          <button 
                            className="delete-button"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <div className="product-category">{product.category}</div>
                      <div className="product-price">₹{product.price?.toLocaleString('en-IN')}</div>
                      {product.rating > 0 && (
                        <div className="product-rating">
                          <FaStar className="filled" /> {product.rating.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-products">
                <p>No products found matching your filters</p>
                <button onClick={() => setFilters({
                  category: '',
                  sort: 'newest',
                  availability: 'all'
                })}>
                  Reset Filters
                </button>
                {isPersonalProfile && (
                  <button 
                    className="add-product-button"
                    onClick={() => navigate('/add-product')}
                  >
                    Add New Product
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="about-tab">
            <section className="bio-section">
              <h2>About {profile.name}</h2>
              <p>{profile.bio || 'No bio provided yet.'}</p>
            </section>
            
            <div className="about-details-grid">
              <div className="detail-card">
                <h3>Contact Information</h3>
                {profile.email && <p><FaEnvelope /> {profile.email}</p>}
                {profile.contact && <p><FaPhone /> {profile.contact}</p>}
              </div>
              
              <div className="detail-card">
                <h3>Farm Details</h3>
                {profile.farmSize && <p>Farm Size: {profile.farmSize} acres</p>}
                {profile.crops && <p>Main Crops: {profile.crops}</p>}
                {profile.irrigationType && <p>Irrigation: {profile.irrigationType}</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="reviews-tab">
            <div className="reviews-summary">
              <div className="average-rating">
                <h2>{averageRating.toFixed(1)}</h2>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(star => (
                    <FaStar 
                      key={star} 
                      className={star <= Math.round(averageRating) ? 'filled' : 'empty'} 
                    />
                  ))}
                </div>
                <p>{reviews.length} reviews</p>
              </div>
            </div>
            
            {!isPersonalProfile && currentUserId && (
              <div className="add-review-form">
                <h3>Write a Review</h3>
                <form onSubmit={handleReviewSubmit}>
                  <div className="form-group">
                    <label>Rating</label>
                    <div className="rating-input">
                      {[1, 2, 3, 4, 5].map(star => (
                        <FaStar 
                          key={star}
                          className={star <= newReview.rating ? 'filled' : 'empty'}
                          onClick={() => setNewReview({...newReview, rating: star})}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Title</label>
                    <input 
                      type="text" 
                      value={newReview.title}
                      onChange={(e) => setNewReview({...newReview, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Your Review</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-review-button">
                    Submit Review
                  </button>
                </form>
              </div>
            )}
            
            <div className="review-list">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {review.reviewerPhoto ? (
                            <img 
                              src={review.reviewerPhoto} 
                              alt={review.reviewerName}
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          ) : (
                            review.reviewerName?.charAt(0) || 'A'
                          )}
                        </div>
                        <div>
                          <h4>{review.reviewerName || 'Anonymous'}</h4>
                          <div className="review-rating">
                            {[1, 2, 3, 4, 5].map(star => (
                              <FaStar 
                                key={star} 
                                className={star <= review.rating ? 'filled' : 'empty'} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="review-date">
                        {review.createdAt?.toLocaleDateString() || 'Unknown date'}
                      </div>
                    </div>
                    <div className="review-content">
                      <h5>{review.title}</h5>
                      <p>{review.comment}</p>
                    </div>
                    <div className="review-actions">
                      <button 
                        className={`like-button ${review.likes?.includes(currentUserId) ? 'active' : ''}`}
                        onClick={() => handleReaction(review.id, 'like')}
                        disabled={!currentUserId}
                      >
                        <FaThumbsUp /> {review.likes?.length || 0}
                      </button>
                      <button 
                        className={`dislike-button ${review.dislikes?.includes(currentUserId) ? 'active' : ''}`}
                        onClick={() => handleReaction(review.id, 'dislike')}
                        disabled={!currentUserId}
                      >
                        <FaThumbsDown /> {review.dislikes?.length || 0}
                      </button>
                      {isPersonalProfile && (
                        <button 
                          className="delete-review-button"
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this review?')) {
                              try {
                                await deleteDoc(doc(db, 'reviews', review.id));
                                setReviews(reviews.filter(r => r.id !== review.id));
                              } catch (error) {
                                console.error('Error deleting review:', error);
                              }
                            }
                          }}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-reviews">
                  <p>No reviews yet. {!isPersonalProfile && currentUserId && 'Be the first to review!'}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;