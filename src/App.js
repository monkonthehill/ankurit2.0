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
            <Route path="/" element={<Homepage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />
            
            {/* Profile Routes */}
            <Route path="/profile" element={<AuthChecker><ProfilePage /></AuthChecker>} />
            <Route path="/profile/:userId" element={<AuthChecker requireAuth={false}><ProfilePage /></AuthChecker>} />
            <Route path="/profile_setup" element={<AuthChecker><ProfileSetupPage /></AuthChecker>} />
            
            {/* Chat/Messaging Routes - Two different inbox systems */}
            <Route path="/messages" element={<AuthChecker><ChatInbox /></AuthChecker>} />
            <Route path="/inbox" element={<AuthChecker><InboxPage /></AuthChecker>} />
            <Route path="/messages/:receiverId" element={<AuthChecker><ChatRoom /></AuthChecker>} />
            
            {/* Other Routes */}
            <Route path="/products" element={<AuthChecker><ProductsPage /></AuthChecker>} />
            <Route path="/plans" element={<AuthChecker><Pricing /></AuthChecker>} />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UserProvider>
      </IKContext>
    </Router>
  );
}

export default App;