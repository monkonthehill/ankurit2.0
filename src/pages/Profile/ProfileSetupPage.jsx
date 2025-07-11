import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, getDoc, doc, setDoc, collection, query, where, getDocs, serverTimestamp } from '../../firebase/firebase';
import ImageUploader from '../../components/ImageKit/ImageUploader';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ProfileSetupPage.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ProfileSetupForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    profilePhoto: '',
    coverPhoto: '',
    businessName: '',
    businessAddress: '',
    gstNumber: '',
    pan: '',
    followers: [],
    following: [],
    wishlist: [],
    reviews: [],
    billingCycle: 'monthly',
    isProfileCompleted: false,
    termsAgreed: {
      stage1: false,
      stage2: false,
      stage3: false,
      stage4: false
    },
    // New address fields
    village: '',
    tehsil: '',
    district: '',
    state: '',
    locationName: '',
    lat: null,
    lng: null,
    locationShared: false
  });
  const [loading, setLoading] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState('');
  const navigate = useNavigate();

useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (user) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserData({
          ...userData,
          email: user.email,
          termsAgreed: {
            stage1: true,
            stage2: true,
            stage3: true,
            stage4: true
          }
        });

        // If username exists and is valid, mark it as available
        if (userData.username) {
          setUsernameAvailable(true);
        }
      } else {
        setUserData(prev => ({
          ...prev,
          email: user.email,
          followers: [],
          following: [],
          wishlist: [],
          reviews: []
        }));
      }
      setLoading(false);
    } else {
      navigate('/login');
    }
  });

  return () => unsubscribe();
}, [navigate]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

     if (name === 'username' && usernameAvailable === true) {
    return;
  }
    
    if (name.startsWith('termsAgreed')) {
      const stage = name.split('.')[1];
      setUserData(prev => ({
        ...prev,
        termsAgreed: {
          ...prev.termsAgreed,
          [stage]: checked
        }
      }));
    } else if (name === 'locationShared') {
      setUserData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setUserData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleImageUpload = (type, url) => {
    setUserData(prev => ({
      ...prev,
      [type]: url
    }));
  };

  const checkUsernameAvailability = async () => {
    if (!userData.username) {
      setUsernameAvailable(null);
      return;
    }

    if (userData.username.length < 4) {
      setUsernameAvailable(false);
      setError('Username must be at least 4 characters');
      return;
    }

    setUsernameChecking(true);
    setError('');

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', userData.username));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setUsernameAvailable(true);
      } else {
        const currentUser = auth.currentUser;
        const userDoc = querySnapshot.docs[0];
        if (userDoc.id === currentUser.uid) {
          setUsernameAvailable(true);
        } else {
          setUsernameAvailable(false);
          setError('Username is already taken');
        }
      }
    } catch (err) {
      setError('Error checking username availability');
      console.error(err);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleFindLocation = async () => {
    if (!userData.village || !userData.district || !userData.state) {
      setMapError('Please fill in village, district, and state');
      return;
    }

    setMapLoading(true);
    setMapError('');

    try {
      const queryString = `${userData.village}, ${userData.tehsil}, ${userData.district}, ${userData.state}, India`.replace(/ ,/g, ',');
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryString)}&format=json`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Location not found');
      }
      
      const firstResult = data[0];
      setUserData(prev => ({
        ...prev,
        lat: parseFloat(firstResult.lat),
        lng: parseFloat(firstResult.lon),
        locationName: firstResult.display_name
      }));
    } catch (err) {
      setMapError(err.message || 'Failed to find location');
      console.error('Geocoding error:', err);
    } finally {
      setMapLoading(false);
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!userData.fullName || !userData.username || !userData.phoneNumber) {
          setError('Please fill in all required fields');
          return false;
        }
        if (!userData.termsAgreed.stage1) {
          setError('You must agree to the terms to proceed');
          return false;
        }
        if (usernameAvailable !== true) {
          setError('Please choose a valid username');
          return false;
        }
        return true;
      case 2:
        if (!userData.profilePhoto && !userData.coverPhoto) {
          setError('Please upload at least one photo');
          return false;
        }
        if (!userData.termsAgreed.stage2) {
          setError('You must agree to the terms to proceed');
          return false;
        }
        return true;
      case 3:
        if (!userData.businessName || !userData.businessAddress) {
          setError('Please fill in all required fields');
          return false;
        }
        if (!userData.termsAgreed.stage3) {
          setError('You must agree to the terms to proceed');
          return false;
        }
        return true;
      case 4:
        if (!userData.termsAgreed.stage4) {
          setError('You must agree to the terms to proceed');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateStep(currentStep)) return;

  try {
    const user = auth.currentUser;
    if (!user) {
      navigate('/login');
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDataToSave = {
      ...userData,
      isProfileCompleted: true, // This marks the profile as complete
      updatedAt: serverTimestamp()
    };

    if (!userData.createdAt) {
      userDataToSave.createdAt = serverTimestamp();
    }

    await setDoc(userDocRef, userDataToSave, { merge: true });
    
    setSuccess('Profile saved successfully!');
    setTimeout(() => {
      navigate('/');
    }, 1500);
  } catch (err) {
    setError('Error saving profile: ' + err.message);
    console.error(err);
  }
};

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="setup-container">
      <div className="step-tracker">
        {[1, 2, 3, 4].map((step) => (
          <div 
            key={step}
            className={`step-bubble ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}
            onClick={() => currentStep > step && setCurrentStep(step)}
          >
            <div className="step-content">
              <span className="step-number">{step}</span>
              <span className="step-label">
                {step === 1 && 'Basic'}
                {step === 2 && 'Photos'}
                {step === 3 && 'Business'}
                {step === 4 && 'KYC'}
              </span>
            </div>
          </div>
        ))}
        <div className="progress-bar" style={{ width: `${(currentStep - 1) * 33.33}%` }}></div>
      </div>

      <div className="form-card">
        {error && <div className="alert-message error">{error}</div>}
        {success && <div className="alert-message success">{success}</div>}

        <form onSubmit={handleSubmit} className="form-content">
          {currentStep === 1 && (
            <>
              <h2 className="form-title">Basic Information</h2>
              <div className="input-grid">
                <div className="input-group">
                  <label>Full Name*</label>
                  <input
                    type="text"
                    name="fullName"
                    value={userData.fullName}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>Username*</label>
                  <div className="input-with-feedback">
                    <input
                      type="text"
                      name="username"
                      value={userData.username}
                      onChange={handleChange}
                      onBlur={checkUsernameAvailability}
                      required
                      className="input-field"
                    />
                    {usernameChecking && <span className="input-status checking">Checking...</span>}
                    {usernameAvailable === true && <span className="input-status available">✓ Available</span>}
                    {usernameAvailable === false && <span className="input-status unavailable">✗ Taken</span>}
                  </div>
                </div>

                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    readOnly
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>Phone Number*</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={userData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                {/* New Address Fields */}
                <div className="input-group">
                  <label>Village*</label>
                  <input
                    type="text"
                    name="village"
                    value={userData.village}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>Tehsil</label>
                  <input
                    type="text"
                    name="tehsil"
                    value={userData.tehsil}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>District*</label>
                  <input
                    type="text"
                    name="district"
                    value={userData.district}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>State*</label>
                  <input
                    type="text"
                    name="state"
                    value={userData.state}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              {/* Location Finder */}
              <div className="location-section">
                <button 
                  type="button" 
                  onClick={handleFindLocation}
                  disabled={mapLoading}
                  className="location-button"
                >
                  {mapLoading ? 'Finding...' : 'Find My Location on Map'}
                </button>
                {mapError && <div className="map-error">{mapError}</div>}

                {userData.lat && userData.lng && (
                  <div className="map-container">
                    <div className="map-wrapper">
                      <MapContainer
                        center={[userData.lat, userData.lng]}
                        zoom={13}
                        style={{ height: '200px', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[userData.lat, userData.lng]}>
                          <Popup>{userData.locationName}</Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                    <div className="location-note">
                      We use this location to help users find nearby nurseries. You may choose to keep it private.
                    </div>
                    <div className="checkbox-group">
                      <input
                        type="checkbox"
                        id="locationShared"
                        name="locationShared"
                        checked={userData.locationShared}
                        onChange={handleChange}
                      />
                      <label htmlFor="locationShared">
                        I allow Ankurit to show this location on my public profile.
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="terms1"
                  name="termsAgreed.stage1"
                  checked={userData.termsAgreed.stage1}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="terms1">I agree to the terms and conditions for this stage</label>
              </div>
            </>
          )}

          {/* Rest of your steps (2, 3, 4) remain unchanged */}
          {currentStep === 2 && (
            <>
              <h2 className="form-title">Profile Photos</h2>
              
              <div className="photo-upload-section">
                <div className="photo-upload-group">
                  <label>Profile Photo</label>
                  <ImageUploader
                    userId={auth.currentUser?.uid}
                    type="profile"
                    currentImageUrl={userData.profilePhoto}
                    onUploadComplete={(url) => handleImageUpload('profilePhoto', url)}
                    label="Upload Profile Photo"
                  />
                </div>

                <div className="photo-upload-group">
                  <label>Cover Photo</label>
                  <ImageUploader
                    userId={auth.currentUser?.uid}
                    type="cover"
                    currentImageUrl={userData.coverPhoto}
                    onUploadComplete={(url) => handleImageUpload('coverPhoto', url)}
                    label="Upload Cover Photo"
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="terms2"
                  name="termsAgreed.stage2"
                  checked={userData.termsAgreed.stage2}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="terms2">I agree to the terms and conditions for this stage</label>
              </div>
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="form-title">Business Information</h2>
              
              <div className="input-grid">
                <div className="input-group">
                  <label>Business Name*</label>
                  <input
                    type="text"
                    name="businessName"
                    value={userData.businessName}
                    onChange={handleChange}
                    required
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>Business Address*</label>
                  <textarea
                    name="businessAddress"
                    value={userData.businessAddress}
                    onChange={handleChange}
                    required
                    className="input-field"
                    rows="4"
                  />
                </div>

                <div className="input-group">
                  <label>Billing Cycle</label>
                  <select
                    name="billingCycle"
                    value={userData.billingCycle}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="terms3"
                  name="termsAgreed.stage3"
                  checked={userData.termsAgreed.stage3}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="terms3">I agree to the terms and conditions for this stage</label>
              </div>
            </>
          )}

          {currentStep === 4 && (
            <>
              <h2 className="form-title">Optional KYC Information</h2>
              
              <div className="input-grid">
                <div className="input-group">
                  <label>GST Number</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={userData.gstNumber}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div className="input-group">
                  <label>PAN</label>
                  <input
                    type="text"
                    name="pan"
                    value={userData.pan}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="terms4"
                  name="termsAgreed.stage4"
                  checked={userData.termsAgreed.stage4}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="terms4">I agree to the terms and conditions for this stage</label>
              </div>
            </>
          )}

          <div className="form-actions">
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={prevStep} 
                className="action-btn secondary"
              >
                ← Back
              </button>
            )}
            
            {currentStep < 4 ? (
              <button 
                type="button" 
                onClick={nextStep} 
                className="action-btn primary"
              >
                Continue →
              </button>
            ) : (
              <button 
                type="submit" 
                className="action-btn submit"
              >
                {userData.isProfileCompleted ? 'Update Profile' : 'Complete Setup'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupForm;