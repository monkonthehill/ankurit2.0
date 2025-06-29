import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  auth,
  db,
  database,
  ref, 
  get, 
  remove,
  onAuthStateChanged,
  query as rtdbQuery,
  orderByChild,
  equalTo,
  logout
} from '../../firebase/firebase';
import { FiMessageSquare } from 'react-icons/fi';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query as firestoreQuery,
  where,
  getDocs
} from 'firebase/firestore';
import placeholderUser from '../../assets/images/images.jpeg';
import placeholderCover from '../../assets/images/images.jpeg';
import placeholderProduct from '../../assets/images/cute-leaf-cartoon-illustration-removebg-preview.png';
import { 
  FiEdit, 
  FiShare2, 
  FiMoreVertical, 
  FiInstagram, 
  FiYoutube, 
  FiUserPlus, 
  FiUserCheck,
  FiMail,
  FiX
} from 'react-icons/fi';
import { FaCheck, FaRegCheckCircle, FaStar } from 'react-icons/fa';
import { IoMdLogOut } from 'react-icons/io';
import './ProfilePage.css';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowPopup, setShowFollowPopup] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFollowersPopup, setShowFollowersPopup] = useState(false);
  const [showFollowingPopup, setShowFollowingPopup] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [showReportPopup, setShowReportPopup] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileUser({ 
          id: uid,
          name: userData.name || userData.displayName || 'User',
          profilePhotoUrl: userData.profilePhoto || placeholderUser,
          coverPhotoUrl: userData.coverPhoto || placeholderCover,
          bio: userData.bio || '',
          businessName: userData.businessName,
          location: userData.location,
          gstNumber: userData.gstNumber,
          plan: userData.plan,
          planData: userData.planData,
          sellerVerified: userData.sellerVerified || false,
          instagram: userData.instagram,
          youtube: userData.youtube
        });

        // Get follower counts and lists
        await fetchFollowData(uid);
      } else {
        const userRef = ref(database, `users/${uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          setProfileUser({ 
            id: uid,
            ...snapshot.val(),
            profilePhotoUrl: snapshot.val().profilePhoto || placeholderUser,
            coverPhotoUrl: snapshot.val().coverPhoto || placeholderCover
          });
        } else {
          setProfileUser({
            id: uid,
            name: 'User',
            profilePhotoUrl: placeholderUser,
            coverPhotoUrl: placeholderCover
          });
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setProfileUser({
        id: uid,
        name: 'User',
        profilePhotoUrl: placeholderUser,
        coverPhotoUrl: placeholderCover
      });
    }
  };

  const fetchFollowData = async (uid) => {
    try {
      // Get follower count and list
      const followersQuery = firestoreQuery(
        collection(db, 'users', uid, 'followers')
      );
      const followersSnapshot = await getDocs(followersQuery);
      setFollowerCount(followersSnapshot.size);
      
      // Get following count and list
      const followingQuery = firestoreQuery(
        collection(db, 'users', uid, 'following')
      );
      const followingSnapshot = await getDocs(followingQuery);
      setFollowingCount(followingSnapshot.size);

      // Only fetch detailed user data if popup is open
      if (showFollowersPopup || showFollowingPopup) {
        const followers = [];
        const following = [];
        
        // Get detailed follower data
        for (const followerDoc of followersSnapshot.docs) {
          const userDoc = await getDoc(doc(db, 'users', followerDoc.id));
          if (userDoc.exists()) {
            followers.push({
              id: followerDoc.id,
              ...userDoc.data()
            });
          }
        }
        
        // Get detailed following data
        for (const followingDoc of followingSnapshot.docs) {
          const userDoc = await getDoc(doc(db, 'users', followingDoc.id));
          if (userDoc.exists()) {
            following.push({
              id: followingDoc.id,
              ...userDoc.data()
            });
          }
        }
        
        setFollowersList(followers);
        setFollowingList(following);
      }
    } catch (error) {
      console.error("Error fetching follow data", error);
    }
  };

const fetchProducts = async (sellerId) => {
  try {
    console.log("Fetching products for seller:", sellerId); // Debug log
    
    // Try Realtime Database first
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);

    if (snapshot.exists()) {
      const productsData = snapshot.val();
      const productsArray = [];
      
      // Convert object to array and filter by sellerId
      for (const productId in productsData) {
        const product = productsData[productId];
        if (product.sellerId === sellerId) {
          productsArray.push({
            id: productId,
            ...product
          });
        }
      }
      
      console.log("Fetched products:", productsArray); // Debug log
      setProducts(productsArray);
    } else {
      console.log("No products found in RTDB");
      setProducts([]);
    }
  } catch (error) {
    console.error("Error fetching products from RTDB:", error);
    setProducts([]);
  }
};

  const checkFollowStatus = async (currentUserId, profileUserId) => {
    try {
      const followDoc = await getDoc(
        doc(db, 'users', profileUserId, 'followers', currentUserId)
      );
      setIsFollowing(followDoc.exists());
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      if (isFollowing) {
        // Unfollow
        await deleteDoc(
          doc(db, 'users', userId, 'followers', currentUser.uid)
        );
        await deleteDoc(
          doc(db, 'users', currentUser.uid, 'following', userId)
        );
        setFollowerCount(prev => prev - 1);
      } else {
        // Follow
        await setDoc(
          doc(db, 'users', userId, 'followers', currentUser.uid),
          { timestamp: new Date() }
        );
        await setDoc(
          doc(db, 'users', currentUser.uid, 'following', userId),
          { timestamp: new Date() }
        );
        setFollowerCount(prev => prev + 1);

        // Create notification
        await setDoc(doc(collection(db, 'notifications')), {
          userId: userId,
          type: 'follow',
          fromUserId: currentUser.uid,
          fromUserName: currentUser.displayName || currentUser.email,
          read: false,
          timestamp: new Date()
        });
      }
      setIsFollowing(!isFollowing);
      setShowFollowPopup(true);
      setTimeout(() => setShowFollowPopup(false), 2000);
      await fetchFollowData(userId);
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        // Delete from Firestore if exists
        try {
          await deleteDoc(doc(db, 'products', productId));
        } catch (firestoreError) {
          console.log("No Firestore product to delete");
        }
        
        // Delete from Realtime Database
        await remove(ref(database, `products/${productId}`));
        
        setProducts(products.filter(product => product.id !== productId));
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleReportUser = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!reportReason || reportDescription.length < 10) {
      alert('Please select a reason and provide a detailed description (at least 10 characters)');
      return;
    }

    try {
      await setDoc(doc(collection(db, 'reports')), {
        reporterId: currentUser.uid,
        reportedUserId: userId,
        reason: reportReason,
        description: reportDescription,
        status: 'pending',
        timestamp: new Date()
      });

      alert('Thank you for your report. We will review it shortly.');
      setShowReportPopup(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const profileId = userId || user.uid;
        await fetchUserData(profileId);
        await fetchProducts(profileId);
        if (userId && userId !== user.uid) {
          await checkFollowStatus(user.uid, userId);
        }
      } else if (userId) {
        await fetchUserData(userId);
        await fetchProducts(userId);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [userId, navigate]);

  useEffect(() => {
    if (showFollowersPopup || showFollowingPopup) {
      fetchFollowData(userId || currentUser?.uid);
    }
  }, [showFollowersPopup, showFollowingPopup]);

  const renderPlanBadge = () => {
    if (!profileUser?.plan) return null;
    
    return (
      <span className={`plan-badge ${profileUser.plan === 'golden' ? 'golden' : 'basic'}`}>
        {profileUser.plan === 'golden' ? (
          <FaStar style={{ color: 'gold' }} />
        ) : (
          <FaCheck />
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="not-found">
        <h2>User not found</h2>
        <p>The profile you're looking for doesn't exist or may have been removed.</p>
        <Link to="/" className="btn btn-primary">Go Home</Link>
      </div>
    );
  }

  const isOwnProfile = currentUser && currentUser.uid === (userId || currentUser.uid);
  const getImageKitUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
  };

  return (
    <div className="profile-container">
      {/* Cover Photo */}
      <div className="cover-photo-container">
        <img 
          src={getImageKitUrl(profileUser.coverPhotoUrl) || placeholderCover} 
          alt="Cover" 
          className="cover-photo"
          onError={(e) => {
            e.target.src = placeholderCover;
          }}
        />
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-info">
          <div className="avatar-container">
            <img 
              src={getImageKitUrl(profileUser.profilePhotoUrl) || placeholderUser} 
              alt="Profile" 
              className="profile-avatar"
              onError={(e) => {
                e.target.src = placeholderUser;
              }}
            />
            {profileUser.sellerVerified && (
              <div className="verified-badge">
                <FaRegCheckCircle />
              </div>
            )}
          </div>
          
          <div className="profile-details">
            <h1 className="profile-name">
              {profileUser.name}
              {renderPlanBadge()}
            </h1>
            
            {profileUser.bio && <p className="profile-bio">{profileUser.bio}</p>}
            
            <div className="profile-stats">
              <span>{products.length} Products</span>
              <span>•</span>
              <span 
                className="clickable-stat"
                onClick={() => setShowFollowersPopup(true)}
              >
                {followerCount} Followers
              </span>
              <span>•</span>
              <span 
                className="clickable-stat"
                onClick={() => setShowFollowingPopup(true)}
              >
                {followingCount} Following
              </span>
            </div>
            
            <div className="social-links">
              {profileUser.instagram && (
                <a href={profileUser.instagram} target="_blank" rel="noopener noreferrer">
                  <FiInstagram />
                </a>
              )}
              {profileUser.youtube && (
                <a href={profileUser.youtube} target="_blank" rel="noopener noreferrer">
                  <FiYoutube />
                </a>
              )}
              {!isOwnProfile && currentUser && (
                <Link to={`/messages/${profileUser.id}`} className="message-link">
                  <FiMail />
                </Link>
              )}
            </div>
          </div>
        </div>
<div className="profile-actions">
  {isOwnProfile ? (
    <>
      <Link to="/profile_setup" className="btn btn-edit">
        <FiEdit /> Edit Profile
      </Link>
      <Link to="/add-product" className="btn btn-primary">
        Add Product
      </Link>
      {/* Updated to match your routes - Inbox button */}
      <Link to="/messages" className="btn btn-chat">
        <FiMessageSquare /> Inbox
      </Link>
      <button className="btn btn-logout" onClick={handleLogout}>
        <IoMdLogOut /> Logout
      </button>
    </>
  ) : (
    <>
      <button 
        className={`btn ${isFollowing ? 'btn-following' : 'btn-follow'}`}
        onClick={handleFollow}
      >
        {isFollowing ? <FiUserCheck /> : <FiUserPlus />}
        {isFollowing ? 'Following' : 'Follow'}
      </button>
      {/* Updated to match your routes - Chat Now button */}
      <Link 
        to={`/messages/${profileUser.id}`} 
        className="btn btn-chat"
      >
        <FiMessageSquare /> Chat Now
      </Link>
      <button className="btn btn-share">
        <FiShare2 /> Share
      </button>
      <div className="more-options">
        <button className="btn btn-more" onClick={() => setShowOptions(!showOptions)}>
          <FiMoreVertical />
        </button>
        {showOptions && (
          <div className="options-dropdown">
            <button 
              className="btn btn-report"
              onClick={() => {
                setShowOptions(false);
                setShowReportPopup(true);
              }}
            >
              Report User
            </button>
          </div>
        )}
      </div>
    </>
  )}
        </div>
      </div>

      {/* User Details Section */}
      <div className="user-details-section">
        <div className="details-card">
          <h3>Seller Information</h3>
          {profileUser.businessName && (
            <div className="detail-item">
              <strong>Business Name:</strong> {profileUser.businessName}
            </div>
          )}
          {profileUser.location && (
            <div className="detail-item">
              <strong>Location:</strong> {profileUser.location}
            </div>
          )}
          {profileUser.gstNumber && (
            <div className="detail-item">
              <strong>GST Number:</strong> {profileUser.gstNumber}
            </div>
          )}
          {profileUser.planData && (
            <div className="detail-item">
              <strong>Membership:</strong> {profileUser.planData.name}
              {profileUser.planData.expiresAt && (
                <span> (Expires: {new Date(profileUser.planData.expiresAt).toLocaleDateString()})</span>
              )}
              {isOwnProfile && (
                <Link to="/plans" className="btn btn-renew">
                  Renew Plan
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products Section */}
      <div className="products-section">
        <h2>Listed Products</h2>
        
        {products.length === 0 ? (
          <div className="empty-products">
            <img src={placeholderProduct} alt="No products" />
            <p>{isOwnProfile ? "You haven't uploaded any products yet" : "This user hasn't listed any products yet"}</p>
            {isOwnProfile && (
              <Link to="/add-product" className="btn btn-primary">
                Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => {
              const imageSrc = getImageKitUrl(product.imageUrl);

              return (
                <div key={product.id} className="product-card">
                  <img 
                    src={imageSrc || placeholderProduct} 
                    alt={product.name} 
                    className="product-image"
                    onClick={() => navigate(`/product/${product.id}`)}
                    onError={(e) => {
                      e.target.src = placeholderProduct;
                    }}
                  />
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-price">₹{product.price?.toLocaleString() || '0'}</p>
                    <p className="product-location">{product.location}</p>
                  </div>
                  {isOwnProfile && (
                    <button 
                      className="btn btn-delete"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow Popup */}
      {showFollowPopup && (
        <div className="follow-popup">
          {isFollowing ? 'You are now following this seller' : 'You have unfollowed this seller'}
        </div>
      )}

      {/* Followers Popup */}
      {showFollowersPopup && (
        <div className="follow-popup-modal">
          <div className="follow-popup-content">
            <div className="follow-popup-header">
              <h3>Followers</h3>
              <button onClick={() => setShowFollowersPopup(false)}>
                <FiX />
              </button>
            </div>
            <div className="follow-list">
              {followersList.length > 0 ? (
                followersList.map(user => (
                  <div key={user.id} className="follow-item">
                    <img 
                      src={getImageKitUrl(user.profilePhotoUrl) || placeholderUser} 
                      alt={user.name}
                      onError={(e) => {
                        e.target.src = placeholderUser;
                      }}
                    />
                    <span>{user.name}</span>
                    {currentUser && currentUser.uid !== user.id && (
                      <button 
                        className="btn btn-follow-small"
                        onClick={() => {
                          // Implement follow/unfollow logic here
                        }}
                      >
                        {followingList.some(u => u.id === user.id) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>No followers yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Popup */}
      {showFollowingPopup && (
        <div className="follow-popup-modal">
          <div className="follow-popup-content">
            <div className="follow-popup-header">
              <h3>Following</h3>
              <button onClick={() => setShowFollowingPopup(false)}>
                <FiX />
              </button>
            </div>
            <div className="follow-list">
              {followingList.length > 0 ? (
                followingList.map(user => (
                  <div key={user.id} className="follow-item">
                    <img 
                      src={getImageKitUrl(user.profilePhotoUrl) || placeholderUser} 
                      alt={user.name}
                      onError={(e) => {
                        e.target.src = placeholderUser;
                      }}
                    />
                    <span>{user.name}</span>
                    {currentUser && currentUser.uid !== user.id && (
                      <button 
                        className="btn btn-follow-small"
                        onClick={() => {
                          // Implement follow/unfollow logic here
                        }}
                      >
                        {followersList.some(u => u.id === user.id) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p>Not following anyone yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Popup */}
      {showReportPopup && (
        <div className="report-popup-modal">
          <div className="report-popup-content">
            <div className="report-popup-header">
              <h3>Report User</h3>
              <button onClick={() => setShowReportPopup(false)}>
                <FiX />
              </button>
            </div>
            <div className="report-form">
              <label>Reason for reporting:</label>
              <select 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                <option value="Spam">Spam</option>
                <option value="Fraud">Fraud</option>
                <option value="Inappropriate profile picture">Inappropriate profile picture</option>
                <option value="This user is threatening me">This user is threatening me</option>
                <option value="This user is insulting me">This user is insulting me</option>
                <option value="Other">Other</option>
              </select>

              <label>Description (min 10 characters):</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide details about your report"
                maxLength="500"
              />
              <div className="character-count">
                {reportDescription.length} / 500
              </div>

              <div className="report-actions">
                <button 
                  className="btn btn-cancel"
                  onClick={() => setShowReportPopup(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-submit"
                  onClick={handleReportUser}
                  disabled={!reportReason || reportDescription.length < 10}
                >
                  Send Complaint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;