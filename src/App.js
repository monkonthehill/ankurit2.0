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
import './App.css';


const imageKitConfig = {
  urlEndpoint: process.env.REACT_APP_IMAGEKIT_URL || 'https://ik.imagekit.io/ankurit/',
  publicKey: process.env.REACT_APP_IMAGEKIT_PUBLIC_KEY || 'public_3Pd8+8b9G0fq9ZWATOe4pmquWyI=',
  authenticationEndpoint: process.env.REACT_APP_IMAGEKIT_AUTH_ENDPOINT || 'https://imagekit-auth-server-ib8y.onrender.com'
};

if (!imageKitConfig.urlEndpoint) {
  throw new Error('ImageKit urlEndpoint is required');
}

function App() {
  return (
    <IKContext
      publicKey={imageKitConfig.publicKey}
      urlEndpoint={imageKitConfig.urlEndpoint}
      authenticationEndpoint={imageKitConfig.authenticationEndpoint}
    >
      <Router>
        <UserProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route
              path="/search"
              element={
                <AuthChecker requireAuth={false}>
                  <SearchPage />
                </AuthChecker>
              }
            />
            <Route
              path="/auth"
              element={
                <AuthChecker requireAuth={false}>
                  <AuthPage />
                </AuthChecker>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthChecker>
                  <ProfilePage />
                </AuthChecker>
              }
            />
              <Route
    path="/farmer/:userId"
    element={
      <AuthChecker requireAuth={false}>
        <ProfilePage />
      </AuthChecker>
    }
  />
            <Route
              path="/profile-setup"
              element={
                <AuthChecker>
                  <ProfileSetupPage />
                </AuthChecker>
              }
            />
            <Route
              path="/products"
              element={
                <AuthChecker>
                  <ProductsPage />
                </AuthChecker>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </UserProvider>
      </Router>
    </IKContext>
  );
}

export default App;
