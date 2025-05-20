import { useState, useEffect } from "react";
import { 
  Menu, X, User, Home, Search, ShoppingBasket, LogIn, 
  Sparkles, Compass, Leaf, Shield, HelpCircle, ShoppingCart 
} from "lucide-react";
import logo from "./logo.png";
import './Navbar.css';
import { useUser } from "../firebase/UserProvider"; // Adjust the import path as needed

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPlaceholder, setSearchPlaceholder] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useUser();

  const placeholders = [
    "Search for plants... ",
    "Find local nurseries... ",
    "Look for gardening tools... ",
    "Discover seasonal flowers... "
  ];

  // Cycle through placeholders
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    const interval = setInterval(() => {
      setSearchPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        {/* Centered Logo */}
        <div className="mobile-logo-container">
          <a href="/">
            <img src={logo} alt="Ankurit Logo" className="logo" />
          </a>
        </div>

        {/* Search Bar */}
        <div className="mobile-search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder={placeholders[searchPlaceholder]} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Desktop Navbar */}
      <header className="desktop-navbar">
        {/* Logo */}
        <div className="logo-container">
          <a href="/">
            <img src={logo} alt="Ankurit Logo" className="logo" />
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul>
            <li>
              <a href="/">
                <Home size={16} className="nav-icon" />
                Home
              </a>
            </li>
            <li>
              <a href="/products">
                <ShoppingBasket size={16} className="nav-icon" />
                Products
              </a>
            </li>
            <li>
              <a href="/explore">
                <Compass size={16} className="nav-icon" />
                Explore
              </a>
            </li>
            <li>
              <a href="/plans">
                <Shield size={16} className="nav-icon" />
                Plans
              </a>
            </li>
          </ul>
        </nav>

        {/* Search and User Actions */}
        <div className="search-user-container">
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder={placeholders[searchPlaceholder]} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {user ? (
            <a href="/profile" className="user-profile">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="user-avatar" />
              ) : (
                <User size={20} />
              )}
              <span>My Account</span>
            </a>
          ) : (
            <a href="/auth" className="login-button">
              <LogIn size={16} />
              <span>Login</span>
            </a>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <a href="/" className="mobile-nav-item">
          <Home size={22} className="nav-icon" />
          <span>Home</span>
        </a>
        
        <a href="/products" className="mobile-nav-item">
          <ShoppingCart size={22} className="nav-icon" />
          <span>Products</span>
        </a>

        {/* Centered Menu Button */}
        <button 
          className="mobile-nav-item menu-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X size={24} className="menu-icon" />
          ) : (
            <Menu size={24} className="menu-icon" />
          )}
          <span>Menu</span>
        </button>

        <a href="/plans" className="mobile-nav-item plans-button">
          <div className="glowing-icon">
            <Sparkles size={18} />
          </div>
          <span>Plans</span>
        </a>

        {/* Login Button in Bottom Right */}
        {user ? (
          <a href="/profile" className="mobile-nav-item login-nav-item">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="user-avatar-small" />
            ) : (
              <User size={22} className="nav-icon" />
            )}
            <span>Profile</span>
          </a>
        ) : (
          <a href="/auth" className="mobile-nav-item login-nav-item">
            <LogIn size={22} className="nav-icon" />
            <span>Login</span>
          </a>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isOpen ? 'active' : ''}`}>
        <div className="mobile-menu-content">
          <div className="mobile-menu-header">
            <div className="user-greeting">
              {user ? (
                <>
                  <div className="user-avatar">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="user-avatar-img" />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div>
                    <h3>Welcome Back, {user.displayName || 'User'}!</h3>
                    <p>Premium Member</p>
                  </div>
                </>
              ) : (
                <h3>Hello Gardener!</h3>
              )}
            </div>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="mobile-search-wrapper">
            <div className="mobile-search-container">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder={placeholders[searchPlaceholder]} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <ul className="mobile-menu-links">
            <li>
              <a href="/">
                <Home size={18} className="link-icon" />
                <span>Home</span>
              </a>
            </li>
            <li>
              <a href="/products">
                <ShoppingBasket size={18} className="link-icon" />
                <span>Products</span>
              </a>
            </li>
            <li>
              <a href="/explore">
                <Compass size={18} className="link-icon" />
                <span>Explore</span>
              </a>
            </li>
            <li>
              <a href="/plans">
                <Sparkles size={18} className="link-icon" />
                <span>Premium Plans</span>
              </a>
            </li>
            <li>
              <a href="/support">
                <HelpCircle size={18} className="link-icon" />
                <span>Support</span>
              </a>
            </li>
            <li>
              <a href="/gardening-tips">
                <Leaf size={18} className="link-icon" />
                <span>Gardening Tips</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Navbar;