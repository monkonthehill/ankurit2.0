import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, getDoc, doc, setDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from '../../firebase/firebase';
import ImageUploader from '../../components/ImageKit/ImageUploader';
import './ProfileSetupPage.css';

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
    }
  });
  const [loading, setLoading] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().isProfileCompleted) {
          // Edit mode - prefill form with existing data
          setUserData({
            ...userDoc.data(),
            email: user.email,
            termsAgreed: {
              stage1: true,
              stage2: true,
              stage3: true,
              stage4: true
            }
          });
        } else {
          // New profile setup
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
    
    if (name.startsWith('termsAgreed')) {
      const stage = name.split('.')[1];
      setUserData(prev => ({
        ...prev,
        termsAgreed: {
          ...prev.termsAgreed,
          [stage]: checked
        }
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
        // Check if it's the current user's username
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
        isProfileCompleted: true,
        updatedAt: serverTimestamp()
      };

      if (!userData.createdAt) {
        userDataToSave.createdAt = serverTimestamp();
      }

      await setDoc(userDocRef, userDataToSave, { merge: true });
      
      setSuccess('Profile saved successfully!');
      setTimeout(() => {
        navigate('/profile');
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
    <div className="profile-setup-container">
      <div className="progress-container">
        <div className="progress-bar">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div 
                className={`progress-step ${currentStep >= step ? 'active' : ''}`}
                onClick={() => currentStep > step && setCurrentStep(step)}
              >
                {step}
              </div>
              {step < 4 && <div className={`progress-line ${currentStep > step ? 'active' : ''}`}></div>}
            </React.Fragment>
          ))}
        </div>
        <div className="step-titles">
          <span className={currentStep === 1 ? 'active' : ''}>Basic Info</span>
          <span className={currentStep === 2 ? 'active' : ''}>Photos</span>
          <span className={currentStep === 3 ? 'active' : ''}>Business</span>
          <span className={currentStep === 4 ? 'active' : ''}>KYC</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        {currentStep === 1 && (
          <div className="form-step">
            <h2>Basic Information</h2>
            <div className="form-group">
              <label htmlFor="fullName">Full Name*</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={userData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username*</label>
              <div className="username-input-container">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={userData.username}
                  onChange={handleChange}
                  onBlur={checkUsernameAvailability}
                  required
                />
                {usernameChecking && <span className="checking-indicator">Checking...</span>}
                {usernameAvailable === true && <span className="availability-indicator available">✓ Available</span>}
                {usernameAvailable === false && <span className="availability-indicator taken">✗ Taken</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={userData.email}
                onChange={handleChange}
                readOnly
              />
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number*</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={userData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group checkbox-group">
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
          </div>
        )}

        {currentStep === 2 && (
          <div className="form-step">
            <h2>Profile Photos</h2>
            
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

            <div className="form-group checkbox-group">
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
          </div>
        )}

        {currentStep === 3 && (
          <div className="form-step">
            <h2>Business Information</h2>
            
            <div className="form-group">
              <label htmlFor="businessName">Business Name*</label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={userData.businessName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="businessAddress">Business Address*</label>
              <textarea
                id="businessAddress"
                name="businessAddress"
                value={userData.businessAddress}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="billingCycle">Billing Cycle</label>
              <select
                id="billingCycle"
                name="billingCycle"
                value={userData.billingCycle}
                onChange={handleChange}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
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
          </div>
        )}

        {currentStep === 4 && (
          <div className="form-step">
            <h2>Optional KYC Information</h2>
            
            <div className="form-group">
              <label htmlFor="gstNumber">GST Number</label>
              <input
                type="text"
                id="gstNumber"
                name="gstNumber"
                value={userData.gstNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pan">PAN</label>
              <input
                type="text"
                id="pan"
                name="pan"
                value={userData.pan}
                onChange={handleChange}
              />
            </div>

            <div className="form-group checkbox-group">
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
          </div>
        )}

        <div className="form-navigation">
          {currentStep > 1 && (
            <button type="button" onClick={prevStep} className="btn secondary">
              Back
            </button>
          )}
          
          {currentStep < 4 ? (
            <button type="button" onClick={nextStep} className="btn primary">
              Next
            </button>
          ) : (
            <button type="submit" className="btn primary">
              {userData.isProfileCompleted ? 'Update Profile' : 'Complete Setup'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileSetupForm;