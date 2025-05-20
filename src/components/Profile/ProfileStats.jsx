import './ProfileStats.css';

const ProfileStats = ({ userData }) => {
  // You can add actual stats here based on your database structure
  const stats = [
    { label: 'Years of Experience', value: userData?.bio?.match(/\d+/) ? userData.bio.match(/\d+/)[0] : 'N/A' },
    { label: 'Crops Grown', value: userData?.crops ? userData.crops.split(',').length : 0 },
    { label: 'Farm Size', value: userData?.farmSize ? `${userData.farmSize} acres` : 'N/A' },
    { label: 'Completed Projects', value: '5' }, // Example static value
  ];

  return (
    <div className="profile-stats">
      <h2 className="section-title">Farm Statistics</h2>
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileStats;