import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileDetails from '../../components/Profile/ProfileDetails';
import ProfileStats from '../../components/Profile/ProfileStats';
import LoadingSpinner from '../../LoadingSpiner';
import './ProfilePage.css';

const ProfilePage = () => {
  const { uid } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userRef = doc(db, 'users', uid || auth.currentUser?.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setError('User not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [uid]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="profile-page">
      <ProfileHeader 
        userData={userData} 
        isPremium={userData?.premiumMember || false} 
      />
      <div className="profile-content">
        <ProfileDetails userData={userData} />
        <ProfileStats userData={userData} />
      </div>
    </div>
  );
};

export default ProfilePage;