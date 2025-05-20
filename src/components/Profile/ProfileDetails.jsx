import './ProfileDetails.css';

const ProfileDetails = ({ userData }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not available';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-details">
      <h2 className="section-title">Personal Information</h2>
      
      <div className="details-grid">
        <div className="detail-item">
          <span className="detail-label">Full Name:</span>
          <span className="detail-value">{userData?.fullName || 'Not provided'}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Email:</span>
          <span className="detail-value">{userData?.email || 'Not provided'}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Contact:</span>
          <span className="detail-value">{userData?.contact || 'Not provided'}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Aadhar Number:</span>
          <span className="detail-value">{userData?.aadharNumber || 'Not provided'}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Member Since:</span>
          <span className="detail-value">{formatDate(userData?.createdAt)}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Last Updated:</span>
          <span className="detail-value">{formatDate(userData?.lastUpdated)}</span>
        </div>
      </div>
      
      <h2 className="section-title">Farm Information</h2>
      
      <div className="details-grid">
        <div className="detail-item">
          <span className="detail-label">Farm Size:</span>
          <span className="detail-value">
            {userData?.farmSize ? `${userData.farmSize} acres` : 'Not provided'}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Irrigation Type:</span>
          <span className="detail-value">{userData?.irrigationType || 'Not provided'}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Primary Crops:</span>
          <span className="detail-value">{userData?.crops || 'Not provided'}</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetails;