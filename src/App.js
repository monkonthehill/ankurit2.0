import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './firebase/UserProvider';
import AuthChecker from './firebase/Authchecker';
import { IKContext } from 'imagekitio-react';
import Navbar from './components/Navbar';
import Homepage from './pages/HomePage/Homepage';
import AuthPage from './pages/Auth/AuthPage';
import ProfilePage from './pages/Profile/ProfilePage';
import ProfileSetupPage from './pages/Profile/ProfileSetupPage';
import ProductsPage from './pages/Products/ProductsPage';
import SearchPage from './components/Homepage/SearchPage';
import Pricing from './pages/Pricing/pricing';
import ProductDetailPage from './pages/Products/ProductDetailPage';
import ChatRoom from './pages/Chat/Chatroom';
import ChatInbox from './pages/Chat/Chatinbox';
import InboxPage from './pages/Chat/InboxPage';
import NotificationPage from './pages/Notification/NotificationPage';
import Explore from './pages/Explore/Explore';
import Support from './pages/Support/Support';
import AboutUs from './pages/Support/AboutUs';
import PreOrder from './pages/Pre-Order/PreOrder';
import PlantUpload from './pages/Products/PlantUploadPage';
import Helpsupport from './pages/Support/help-support'
import Legalpolicy from './pages/Support/legal-policy';
import './App.css';

// ImageKit Configuration
const imageKitConfig = {
  urlEndpoint: process.env.REACT_APP_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/ankurit',
  publicKey: process.env.REACT_APP_IMAGEKIT_PUBLIC_KEY || 'public_3Pd8+8b9G0fq9ZWATOe4pmquWyI=',
  authenticationEndpoint: process.env.REACT_APP_IMAGEKIT_AUTH_ENDPOINT || 'https://imagekit-auth-server-ib8y.onrender.com/auth'
};

function App() {
  return (
    <Router>
      <IKContext
        urlEndpoint={imageKitConfig.urlEndpoint}
        publicKey={imageKitConfig.publicKey}
        authenticationEndpoint={imageKitConfig.authenticationEndpoint}
      >
        <UserProvider>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/legal-privacy" element={< Legalpolicy />} />
            <Route path="/help-support" element={< Helpsupport />} />
            
            {/* Profile Routes */}
            <Route path="/profile" element={
              <AuthChecker requireAuth requireProfileComplete>
                <ProfilePage />
              </AuthChecker>
            } />
            <Route path="/profile/:userId" element={
              <AuthChecker requireAuth={false}>
                <ProfilePage />
              </AuthChecker>
            } />
            <Route path="/profile_setup" element={
              <AuthChecker requireAuth requireProfileComplete={false}>
                <ProfileSetupPage />
              </AuthChecker>
            } />
            
            {/* Protected Routes - Require Auth AND Completed Profile */}
            <Route path="/messages" element={
              <AuthChecker requireAuth requireProfileComplete>
                <ChatInbox />
              </AuthChecker>
            } />
            <Route path="/inbox" element={
              <AuthChecker requireAuth requireProfileComplete>
                <InboxPage />
              </AuthChecker>
            } />
            <Route path="/messages/:receiverId" element={
              <AuthChecker requireAuth requireProfileComplete>
                <ChatRoom />
              </AuthChecker>
            } />
            <Route path="/notification" element={
              <AuthChecker requireAuth requireProfileComplete>
                <NotificationPage />
              </AuthChecker>
            } />
            <Route path="/add-product" element={
              <AuthChecker requireAuth requireProfileComplete>
                <PlantUpload />
              </AuthChecker>
            } />
            <Route path="/products" element={
              <AuthChecker requireAuth requireProfileComplete>
                <ProductsPage />
              </AuthChecker>
            } />
            <Route path="/plans" element={
              <AuthChecker requireAuth requireProfileComplete>
                <Pricing />
              </AuthChecker>
            } />
            <Route path="/explore" element={
              <AuthChecker requireAuth requireProfileComplete>
                <Explore />
              </AuthChecker>
            } />
            <Route path="/support" element={
              <AuthChecker requireAuth requireProfileComplete>
                <Support />
              </AuthChecker>
            } />
            <Route path="/pre-order" element={
              <AuthChecker requireAuth requireProfileComplete>
                <PreOrder/>
              </AuthChecker>
            } />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UserProvider>
      </IKContext>
    </Router>
  );
}

export default App;