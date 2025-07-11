import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import Footer from '../../components/Homepage/Footer';
import './ProductPage.css';
import premiumBadge from '../../assets/images/premium-account.png';

const ProductGallery = () => {
  const navigate = useNavigate();
  
  // Product data states
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [categories, setCategories] = useState({
    fruits: false,
    vegetables: false,
    flowers: false,
    herbs: false,
    trees: false,
    others: false
  });
  const [sellerTypes, setSellerTypes] = useState({
    farmer: false,
    verified: false,
    trusted: false
  });
  const [dateRange, setDateRange] = useState('all');
  
  // Seller information state
  const [sellers, setSellers] = useState({});
  const productsPerPage = 12;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const database = getDatabase();
        const productsRef = ref(database, 'products');
        
        onValue(productsRef, async (snapshot) => {
          const productsData = [];
          const sellersData = {};
          
          snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            
            // Process image URL - handles both direct URLs and ImageKit paths
            const processImageUrl = (url) => {
              if (!url) return null;
              
              // If it's already a full URL (http/https) or data URI
              if (/^https?:\/\//.test(url) || /^data:image\//.test(url)) {
                return url;
              }
              
              // If it's an ImageKit path (starts with / or doesn't start with http)
              if (url.startsWith('/') || !url.startsWith('http')) {
                return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
              }
              
              // Default return null if format not recognized
              return null;
            };

            // Handle both imageUrl (single) and imageUrls (array) cases
            let imageUrls = [];
            if (product.imageUrls && Array.isArray(product.imageUrls)) {
              imageUrls = product.imageUrls.map(url => processImageUrl(url)).filter(Boolean);
            } else if (product.imageUrl) {
              const processedUrl = processImageUrl(product.imageUrl);
              if (processedUrl) imageUrls = [processedUrl];
            }

            productsData.push({ 
              id: childSnapshot.key, 
              ...product,
              imageUrls, // Normalized image URLs array
              timestamp: product.timestamp || product.createdAt || 0
            });
          });

          // Fetch seller info for all unique sellers
          const uniqueSellerIds = [...new Set(productsData.map(p => p.sellerId))];
          await Promise.all(uniqueSellerIds.map(async (sellerId) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', sellerId));
              if (userDoc.exists()) {
                sellersData[sellerId] = {
                  name: userDoc.data().fullName || userDoc.data().name || 'Unknown Seller',
                  username: userDoc.data().username,
                  phoneNumber: userDoc.data().phoneNumber,
                  plan: userDoc.data().plan || 'free',
                  isFarmer: userDoc.data().userType === 'farmer',
                  isVerified: userDoc.data().isVerified || false,
                  isTrusted: userDoc.data().isTrusted || false,
                  profilePhoto: userDoc.data().profilePhoto || userDoc.data().photoURL
                };
              }
            } catch (error) {
              console.error(`Error fetching seller ${sellerId}:`, error);
            }
          }));

          setProducts(productsData);
          setFilteredProducts(productsData);
          setSellers(sellersData);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    const applyFilters = () => {
      let results = [...products];
      
      // Price filter
      results = results.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
      
      // Category filter
      const activeCategories = Object.keys(categories).filter(c => categories[c]);
      if (activeCategories.length > 0) {
        results = results.filter(p => 
          p.category && activeCategories.includes(p.category.toLowerCase().replace(/ /g, ''))
        );
      }
      
      // Seller type filter
      const activeSellerTypes = Object.keys(sellerTypes).filter(t => sellerTypes[t]);
      if (activeSellerTypes.length > 0) {
        results = results.filter(p => {
          const seller = sellers[p.sellerId];
          if (!seller) return false;
          
          return (
            (sellerTypes.farmer && seller.isFarmer) ||
            (sellerTypes.verified && seller.isVerified) ||
            (sellerTypes.trusted && seller.isTrusted)
          );
        });
      }
      
      // Date filter
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      
      results = results.filter(p => {
        switch(dateRange) {
          case '7days': return now - p.timestamp <= sevenDays;
          case '30days': return now - p.timestamp <= thirtyDays;
          default: return true;
        }
      });
      
      setFilteredProducts(results);
      setCurrentPage(1);
    };

    applyFilters();
  }, [products, priceRange, categories, sellerTypes, dateRange, sellers]);

  // Pagination effect
  useEffect(() => {
    const indexOfLast = currentPage * productsPerPage;
    const indexOfFirst = indexOfLast - productsPerPage;
    setDisplayedProducts(filteredProducts.slice(indexOfFirst, indexOfLast));
  }, [filteredProducts, currentPage]);

  const handlePriceChange = (e, index) => {
    const newPriceRange = [...priceRange];
    newPriceRange[index] = parseInt(e.target.value);
    setPriceRange(newPriceRange);
  };

  const toggleCategory = (category) => {
    setCategories({
      ...categories,
      [category]: !categories[category]
    });
  };

  const toggleSellerType = (type) => {
    setSellerTypes({
      ...sellerTypes,
      [type]: !sellerTypes[type]
    });
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const setPricePreset = (min, max) => {
    setPriceRange([min, max]);
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setCategories({
      fruits: false,
      vegetables: false,
      flowers: false,
      herbs: false,
      trees: false,
      others: false
    });
    setSellerTypes({
      farmer: false,
      verified: false,
      trusted: false
    });
    setDateRange('all');
  };

  const handleShare = (productId) => {
    const url = `${window.location.origin}/product/${productId}`;
    if (navigator.share) {
      navigator.share({ title: 'Check this plant on Ankurit', url });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  const paginate = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <div className="product-gallery-container">
      <div className="product-gallery">
        <div className="gallery-header">
          <h2>Plant Collection</h2>
          <button 
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Filters'}
          </button>
        </div>

        <div className="gallery-content">
          <div className={`desktop-filters ${showFilters ? 'mobile-visible' : ''}`}>
            <div className="filter-section">
              <h4>Price Range</h4>
              <div className="price-range">
                <div className="range-inputs">
                  <input 
                    type="range" 
                    min="0" 
                    max="10000" 
                    value={priceRange[0]} 
                    onChange={(e) => handlePriceChange(e, 0)}
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="10000" 
                    value={priceRange[1]} 
                    onChange={(e) => handlePriceChange(e, 1)}
                  />
                </div>
                <div className="range-values">
                  <span>₹{priceRange[0].toLocaleString()}</span>
                  <span>₹{priceRange[1].toLocaleString()}</span>
                </div>
              </div>
              
              <div className="price-presets">
                <button 
                  className={priceRange[0] === 0 && priceRange[1] === 499 ? 'active' : ''}
                  onClick={() => setPricePreset(0, 499)}
                >
                  Below ₹499
                </button>
                <button 
                  className={priceRange[0] === 500 && priceRange[1] === 1499 ? 'active' : ''}
                  onClick={() => setPricePreset(500, 1499)}
                >
                  ₹500 - ₹1499
                </button>
                <button 
                  className={priceRange[0] === 1500 && priceRange[1] === 2499 ? 'active' : ''}
                  onClick={() => setPricePreset(1500, 2499)}
                >
                  ₹1500 - ₹2499
                </button>
                <button 
                  className={priceRange[0] === 2500 && priceRange[1] === 4999 ? 'active' : ''}
                  onClick={() => setPricePreset(2500, 4999)}
                >
                  ₹2500 - ₹4999
                </button>
                <button 
                  className={priceRange[0] === 5000 && priceRange[1] === 10000 ? 'active' : ''}
                  onClick={() => setPricePreset(5000, 10000)}
                >
                  Above ₹5000
                </button>
              </div>
            </div>
            
            <div className="filter-section">
              <h4>Category</h4>
              <div className="filter-options">
                {Object.entries({
                  fruits: 'Fruits',
                  vegetables: 'Vegetables',
                  flowers: 'Flowers',
                  herbs: 'Herbs',
                  trees: 'Trees',
                  others: 'Others'
                }).map(([key, label]) => (
                  <button
                    key={key}
                    className={`filter-option ${categories[key] ? 'active' : ''}`}
                    onClick={() => toggleCategory(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="filter-section">
              <h4>Seller Type</h4>
              <div className="filter-options">
                <button
                  className={`filter-option ${sellerTypes.farmer ? 'active' : ''}`}
                  onClick={() => toggleSellerType('farmer')}
                >
                  Farmer
                </button>
                <button
                  className={`filter-option ${sellerTypes.verified ? 'active' : ''}`}
                  onClick={() => toggleSellerType('verified')}
                >
                  KYC Verified
                </button>
                <button
                  className={`filter-option ${sellerTypes.trusted ? 'active' : ''}`}
                  onClick={() => toggleSellerType('trusted')}
                >
                  Trusted
                </button>
              </div>
            </div>
            
            <div className="filter-section">
              <h4>Date Added</h4>
              <div className="filter-options column">
                <button
                  className={`filter-option ${dateRange === 'all' ? 'active' : ''}`}
                  onClick={() => handleDateRangeChange('all')}
                >
                  All Time
                </button>
                <button
                  className={`filter-option ${dateRange === '7days' ? 'active' : ''}`}
                  onClick={() => handleDateRangeChange('7days')}
                >
                  Last 7 Days
                </button>
                <button
                  className={`filter-option ${dateRange === '30days' ? 'active' : ''}`}
                  onClick={() => handleDateRangeChange('30days')}
                >
                  Last 30 Days
                </button>
              </div>
            </div>
            
            <button className="clear-filters" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>
          
          <div className="products-container">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading plants...</p>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {displayedProducts.length > 0 ? (
                    displayedProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        seller={sellers[product.sellerId]}
                        onShare={() => handleShare(product.id)}
                        onClick={() => navigate(`/product/${product.id}`)}
                      />
                    ))
                  ) : (
                    <div className="no-results">
                      <img src="/no-results.svg" alt="No results" />
                      <p>No plants match your filters</p>
                      <button onClick={clearFilters}>Clear Filters</button>
                    </div>
                  )}
                </div>

                {filteredProducts.length > productsPerPage && (
                  <div className="pagination">
                    <button 
                      onClick={() => paginate(currentPage - 1)} 
                      disabled={currentPage === 1}
                    >
                      &lt; Previous
                    </button>
                    {[...Array(Math.ceil(filteredProducts.length / productsPerPage))].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => paginate(i + 1)}
                        className={currentPage === i + 1 ? 'active' : ''}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      onClick={() => paginate(currentPage + 1)} 
                      disabled={currentPage === Math.ceil(filteredProducts.length / productsPerPage)}
                    >
                      Next &gt;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Your existing ProductCard component remains the same
const ProductCard = ({ product, seller, onShare, onClick }) => {
  const navigate = useNavigate();

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    if (!seller?.phoneNumber) {
      alert('Seller has not shared contact info');
      return;
    }
    const number = seller.phoneNumber.replace(/\D/g, '');
    const message = `Hi ${seller.name}, I'm interested in ${product.name} (₹${product.price})`;
    window.open(`https://wa.me/91${number}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleChat = (e) => {
    e.stopPropagation();
    navigate(`/messages/${product.sellerId}`);
  };

  const handleSellerClick = (e) => {
    e.stopPropagation();
    navigate(`/profile/${product.sellerId}`);
  };

  return (
    <div className="product-card" onClick={onClick}>
<div className="product-image-container">
  <img 
    src={product.imageUrls?.[0] || '/placeholder-plant.jpg'} 
    alt={product.name}
    onError={(e) => e.target.src = '/placeholder-plant.jpg'}
  />
  <button className="share-button" onClick={(e) => {
    e.stopPropagation();
    onShare();
  }}>
    <svg viewBox="0 0 24 24">
      <path d="M18 16.08c-.7 0-1.3.27-1.77.72l-7.12-4.11c.05-.15.09-.31.09-.47 0-.16-.04-.32-.09-.47l7.12-4.11c.47.45 1.07.72 1.77.72 1.54 0 2.8-1.26 2.8-2.8 0-1.54-1.26-2.8-2.8-2.8-1.54 0-2.8 1.26-2.8 2.8 0 .16.04.32.09.47l-7.12 4.11c-.47-.45-1.07-.72-1.77-.72-1.54 0-2.8 1.26-2.8 2.8 0 1.54 1.26 2.8 2.8 2.8.7 0 1.3-.27 1.77-.72l7.12 4.11c-.05.15-.09.31-.09.47 0 1.54 1.26 2.8 2.8 2.8 1.54 0 2.8-1.26 2.8-2.8 0-1.54-1.26-2.8-2.8-2.8z"/>
    </svg>
  </button>
</div>

      <div className="product-details">
        <h3>{product.name}</h3>
        <p className="price">₹{product.price?.toLocaleString()}</p>

        <div className="seller-info" onClick={handleSellerClick}>
          <img 
            src={seller?.profilePhoto || '/default-avatar.jpg'} 
            alt={seller?.name}
            className="seller-avatar"
          />
          <div className="seller-details">
            <div className="seller-name">
              {seller?.name}
              {seller?.plan !== 'free' && (
                <img src={premiumBadge} alt="Premium" className="premium-badge" />
              )}
            </div>
            <div className="seller-username">@{seller?.username || 'seller'}</div>
          </div>
        </div>

        <div className="product-actions">
          <button className="whatsapp-button" onClick={handleWhatsApp}>
            <svg viewBox="0 0 24 24">
              <path fill="currentColor" d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zm-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.264 8.264 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.183 8.183 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.51-1.38-1.77-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43s.17-.25.25-.41c.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.4-.42-.56-.43-.14 0-.3-.01-.47-.01-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.38 1.01 2.54.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.18-.5 1.62-.94.45-.45.67-.87.74-1.01.08-.14.06-.26.01-.36z"/>
            </svg>
            WhatsApp
          </button>
          <button className="chat-button" onClick={handleChat}>
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;