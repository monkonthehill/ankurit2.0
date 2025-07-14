import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  auth,
  db,
  database,
  ref, 
  get, 
  remove,
  onAuthStateChanged,
  logout
} from '../../firebase/firebase';
import { 
  FiMessageSquare, 
  FiEdit, 
  FiShare2, 
  FiMoreVertical, 
  FiInstagram, 
  FiYoutube, 
  FiUserPlus, 
  FiUserCheck,
  FiMail,
  FiX,
  FiMapPin,
  FiHeart,
  FiTrash2
} from 'react-icons/fi';
import { 
  FaCheck, 
  FaRegCheckCircle, 
  FaStar, 
  FaMapMarkerAlt,
  FaLock,
  FaLockOpen,
  FaRegComment,
  FaHeart
} from 'react-icons/fa';
import { IoMdLogOut, IoMdSend } from 'react-icons/io';
import { BiLike, BiSolidLike } from 'react-icons/bi';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import placeholderUser from '../../assets/images/images.jpeg';
import placeholderCover from '../../assets/images/images.jpeg';
import placeholderProduct from '../../assets/images/cute-leaf-cartoon-illustration-removebg-preview.png';
import { 
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  query as firestoreQuery,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import './ProfilePage.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom location marker icon
const locationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Distance calculation utility
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1); // Distance in km
};

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [lastVisiblePost, setLastVisiblePost] = useState(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
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
  const [distance, setDistance] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showReactions, setShowReactions] = useState(null);

  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userObj = { 
          id: uid,
          name: userData.fullName || userData.displayName || 'User',
          profilePhotoUrl: userData.profilePhoto || placeholderUser,
          coverPhotoUrl: userData.coverPhoto || placeholderCover,
          bio: userData.bio || '',
          businessName: userData.businessName,
          location: userData.locationName || userData.location,
          gstNumber: userData.gstNumber,
          plan: userData.plan,
          planData: userData.planData,
          sellerVerified: userData.sellerVerified || false,
          instagram: userData.instagram,
          youtube: userData.youtube,
          lat: userData.lat,
          lng: userData.lng,
          locationShared: userData.locationShared || false
        };

        setProfileUser(userObj);
        await fetchFollowData(uid);
        
        // Calculate distance if viewing another user's profile
        if (currentUser && uid !== currentUser.uid && userData.lat && userData.lng) {
          calculateUserDistance(userData.lat, userData.lng);
        }
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

      // Fetch detailed user data for followers and following
      const followers = [];
      const following = [];
      
      // Get detailed follower data
      for (const followerDoc of followersSnapshot.docs) {
        const userDoc = await getDoc(doc(db, 'users', followerDoc.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          followers.push({
            id: followerDoc.id,
            name: userData.name || userData.fullName || 'User',
            profilePhotoUrl: userData.profilePhoto || placeholderUser,
            ...userData
          });
        }
      }
      
      // Get detailed following data
      for (const followingDoc of followingSnapshot.docs) {
        const userDoc = await getDoc(doc(db, 'users', followingDoc.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          following.push({
            id: followingDoc.id,
            name: userData.name || userData.fullName || 'User',
            profilePhotoUrl: userData.profilePhoto || placeholderUser,
            ...userData
          });
        }
      }
      
      setFollowersList(followers);
      setFollowingList(following);
    } catch (error) {
      console.error("Error fetching follow data", error);
    }
  };

  const fetchProducts = async (sellerId) => {
    try {
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
        
        setProducts(productsArray);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products from RTDB:", error);
      setProducts([]);
    }
  };

  const fetchPosts = async (userId, loadMore = false) => {
    if (loadingPosts) return;
    
    setLoadingPosts(true);
    try {
      let postsQuery;
      if (loadMore && lastVisiblePost) {
        postsQuery = firestoreQuery(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          startAfter(lastVisiblePost),
          limit(5)
        );
      } else {
        postsQuery = firestoreQuery(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc'),
          limit(5)
        );
      }

      const snapshot = await getDocs(postsQuery);
      if (snapshot.empty) {
        if (loadMore) {
          setHasMorePosts(false);
        }
        return;
      }

      const postsData = await Promise.all(snapshot.docs.map(async (doc) => {
        const post = doc.data();
        const userDoc = await getDoc(post.userRef);
        const userData = userDoc.data();
        
        const commentsSnapshot = await getDocs(collection(db, 'posts', doc.id, 'comments'));
        const commentsCount = commentsSnapshot.size;

        return {
          id: doc.id,
          ...post,
          userData,
          commentsCount,
          timestamp: post.timestamp?.toDate() || new Date()
        };
      }));

      setPosts(prev => loadMore ? [...prev, ...postsData] : postsData);
      setLastVisiblePost(snapshot.docs[snapshot.docs.length - 1]);
      setHasMorePosts(snapshot.docs.length === 5);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleLike = async (postId, alreadyLiked) => {
    if (!currentUser) return;

    try {
      const postRef = doc(db, 'posts', postId);
      
      if (alreadyLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(currentUser.uid)
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(currentUser.uid)
        });
      }
      
      // Refresh posts
      await fetchPosts(userId || currentUser.uid);
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const addComment = async (postId) => {
    if (!commentText.trim() || !currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();

      await addDoc(collection(db, 'posts', postId, 'comments'), {
        text: commentText,
        userId: currentUser.uid,
        userRef: doc(db, 'users', currentUser.uid),
        userName: userData.name || userData.fullName,
        userProfile: userData.profilePhoto,
        timestamp: serverTimestamp()
      });

      // Update comments count
      await updateDoc(doc(db, 'posts', postId), {
        commentsCount: increment(1)
      });

      setCommentText('');
      await fetchPosts(userId || currentUser.uid);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const deletePost = async (postId) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteDoc(doc(db, 'posts', postId));
        setPosts(posts.filter(post => post.id !== postId));
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const calculateUserDistance = (lat, lng) => {
    if (!currentUser?.lat || !currentUser?.lng) return;
    
    setLocationLoading(true);
    try {
      const dist = calculateDistance(
        currentUser.lat,
        currentUser.lng,
        lat,
        lng
      );
      setDistance(dist);
    } catch (error) {
      console.error("Error calculating distance:", error);
    } finally {
      setLocationLoading(false);
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

  const formatDate = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch current user's data including location
        const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
        const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
        
        setCurrentUser({
          ...user,
          lat: currentUserData.lat,
          lng: currentUserData.lng,
          locationShared: currentUserData.locationShared || false
        });

        const profileId = userId || user.uid;
        await fetchUserData(profileId);
        await fetchProducts(profileId);
        await fetchPosts(profileId);
        
        if (userId && userId !== user.uid) {
          await checkFollowStatus(user.uid, userId);
        }
      } else if (userId) {
        // Viewing profile as guest
        await fetchUserData(userId);
        await fetchProducts(userId);
        await fetchPosts(userId);
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
  }, [showFollowersPopup, showFollowingPopup, userId, currentUser?.uid]);

  const getImageKitUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
  };

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

  const LocationCard = () => {
    if (!profileUser?.locationShared && !profileUser?.location) return null;

    return (
      <div className="location-card">
        <div className="location-header">
          <FiMapPin className="location-icon" />
          <h3>Business Location</h3>
          {profileUser.locationShared ? (
            <span className="privacy-badge shared">
              <FaLockOpen /> Shared
            </span>
          ) : (
            <span className="privacy-badge private">
              <FaLock /> Private
            </span>
          )}
        </div>

        {profileUser.locationShared && profileUser.lat && profileUser.lng ? (
          <>
            <div className="map-container">
              <MapContainer
                center={[profileUser.lat, profileUser.lng]}
                zoom={13}
                className="location-map"
                dragging={false}
                touchZoom={false}
                zoomControl={false}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker 
                  position={[profileUser.lat, profileUser.lng]}
                  icon={locationIcon}
                >
                  <Popup>
                    {profileUser.businessName || profileUser.name}'s Location
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            <div className="location-footer">
              <p className="location-note">
                <FaMapMarkerAlt /> This location is shared for B2B plant transactions
              </p>
              
              {!isOwnProfile && distance && (
                <div className="distance-indicator">
                  <div className="distance-value">
                    {distance} km away
                  </div>
                  <div className="distance-bar">
                    <div 
                      className="distance-progress"
                      style={{ width: `${Math.min(100, 100 - (distance / 100) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="location-text">
            {profileUser.location || 'Location not specified'}
          </div>
        )}
      </div>
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
          
          <LocationCard />
          
          {profileUser.gstNumber && (
            <div className="detail-item">
              <strong>GST Number:</strong> {profileUser.gstNumber}
            </div>
          )}
          
          {profileUser.planData && (
            <div className="detail-item plan-info">
              <strong>Membership:</strong> 
              <span className={`plan-name ${profileUser.plan}`}>
                {profileUser.planData.name}
              </span>
              {profileUser.planData.expiresAt && (
                <span className="plan-expiry">
                  (Expires: {new Date(profileUser.planData.expiresAt).toLocaleDateString()})
                </span>
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

      {/* Posts Section */}
      <div className="posts-section">
        <h2>Posts</h2>
        
        {posts.length === 0 ? (
          <div className="empty-posts">
            <p>{isOwnProfile ? "You haven't made any posts yet" : "This user hasn't posted anything yet"}</p>
            {isOwnProfile && (
              <Link to="/Explore" className="btn btn-primary">
                Create Your First Post
              </Link>
            )}
          </div>
        ) : (
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <img 
                    src={getImageKitUrl(post.userData?.profilePhoto) || placeholderUser} 
                    alt={post.userData?.name} 
                    className="post-author-avatar"
                  />
                  <div className="post-author-info">
                    <h4>{post.userData?.name}</h4>
                    <span className="post-time">{formatDate(post.timestamp)}</span>
                  </div>
                  {isOwnProfile && (
                    <button 
                      className="post-delete-btn"
                      onClick={() => deletePost(post.id)}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
                
                <div className="post-content">
                  {post.text && <p className="post-text">{post.text}</p>}
                  {post.imageUrl && (
                    <img 
                      src={getImageKitUrl(post.imageUrl)} 
                      alt="Post" 
                      className="post-image"
                      onError={(e) => {
                        e.target.src = placeholderProduct;
                      }}
                    />
                  )}
                </div>
                
                <div className="post-stats">
                  <span>{post.likes?.length || 0} likes</span>
                  <span>{post.commentsCount || 0} comments</span>
                </div>
                
                <div className="post-actions">
                  <button 
                    className={`post-action-btn ${post.likes?.includes(currentUser?.uid) ? 'active' : ''}`}
                    onClick={() => handleLike(post.id, post.likes?.includes(currentUser?.uid))}
                  >
                    {post.likes?.includes(currentUser?.uid) ? <FaHeart style={{ color: '#f3425f' }} /> : <FiHeart />}
                    <span>Like</span>
                  </button>
                  
                  <button 
                    className="post-action-btn"
                    onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                  >
                    <FaRegComment />
                    <span>Comment</span>
                  </button>
                  
                  <button className="post-action-btn">
                    <FiShare2 />
                    <span>Share</span>
                  </button>
                </div>
                
                {activeCommentPost === post.id && (
                  <div className="post-comment-section">
                    <div className="comment-input-container">
                      <img 
                        src={currentUser?.photoURL || placeholderUser} 
                        alt="You" 
                        className="comment-user-avatar"
                      />
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                      />
                      <button 
                        className="comment-send-btn"
                        onClick={() => addComment(post.id)}
                        disabled={!commentText.trim()}
                      >
                        <IoMdSend />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {hasMorePosts && (
              <button 
                className="load-more-btn"
                onClick={() => fetchPosts(userId || currentUser?.uid, true)}
                disabled={loadingPosts}
              >
                {loadingPosts ? 'Loading...' : 'Load More Posts'}
              </button>
            )}
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
                    <div 
                      className="follow-user-info"
                      onClick={() => {
                        setShowFollowersPopup(false);
                        navigate(`/profile/${user.id}`);
                      }}
                    >
                      <img 
                        src={getImageKitUrl(user.profilePhotoUrl) || placeholderUser} 
                        alt={user.name}
                        onError={(e) => {
                          e.target.src = placeholderUser;
                        }}
                      />
                      <span>{user.name}</span>
                    </div>
                    {currentUser && currentUser.uid !== user.id && (
                      followingList.some(u => u.id === user.id) ? (
                        <Link 
                          to={`/messages/${user.id}`}
                          className="btn btn-message-small"
                        >
                          <FiMessageSquare /> Message
                        </Link>
                      ) : (
                        <button 
                          className="btn btn-follow-small"
                          onClick={async () => {
                            await setDoc(
                              doc(db, 'users', user.id, 'followers', currentUser.uid),
                              { timestamp: new Date() }
                            );
                            await setDoc(
                              doc(db, 'users', currentUser.uid, 'following', user.id),
                              { timestamp: new Date() }
                            );
                            await fetchFollowData(userId);
                          }}
                        >
                          <FiUserPlus /> Follow Back
                        </button>
                      )
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
                    <div 
                      className="follow-user-info"
                      onClick={() => {
                        setShowFollowingPopup(false);
                        navigate(`/profile/${user.id}`);
                      }}
                    >
                      <img 
                        src={getImageKitUrl(user.profilePhotoUrl) || placeholderUser} 
                        alt={user.name}
                        onError={(e) => {
                          e.target.src = placeholderUser;
                        }}
                      />
                      <span>{user.name}</span>
                    </div>
                    {currentUser && currentUser.uid !== user.id && (
                      <Link 
                        to={`/messages/${user.id}`}
                        className="btn btn-message-small"
                      >
                        <FiMessageSquare /> Message
                      </Link>
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