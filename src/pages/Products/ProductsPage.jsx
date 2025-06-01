import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import Footer from '../../components/Homepage/Footer';
import './ProductPage.css';

const ProductGallery = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sellerNames, setSellerNames] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [categories, setCategories] = useState({
    fruits: false,
    grains: false,
    nutsAndDryFruits: false,
    oilAndOilseeds: false,
    pulses: false,
    spices: false,
    sweeteners: false,
    vegetables: false,
    others: false
  });
  const [sellerTypes, setSellerTypes] = useState({
    farmer: false,
    verified: false,
    trusted: false
  });
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const database = getDatabase();
        const productsRef = ref(database, 'products');
        
        onValue(productsRef, async (snapshot) => {
          const productsData = [];
          snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            
            const processImageUrl = (url) => {
              if (!url) return null;
              if (url.includes('http') || url.includes('data:image')) return url;
              return `https://ik.imagekit.io/ankurit${url.startsWith('/') ? url : `/${url}`}`;
            };

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
              imageUrls,
              timestamp: product.timestamp || 0
            });
          });
          
          setProducts(productsData);
          setFilteredProducts(productsData);
          
          const names = {};
          for (const product of productsData) {
            if (!names[product.sellerId]) {
              try {
                const userDoc = await getDoc(doc(db, 'users', product.sellerId));
                if (userDoc.exists()) {
                  names[product.sellerId] = {
                    name: userDoc.data().fullName || userDoc.data().name || 'Unknown Seller',
                    isFarmer: userDoc.data().userType === 'farmer',
                    isVerified: userDoc.data().isVerified || false,
                    isTrusted: userDoc.data().isTrusted || false
                  };
                } else {
                  names[product.sellerId] = {
                    name: 'Unknown Seller',
                    isFarmer: false,
                    isVerified: false,
                    isTrusted: false
                  };
                }
              } catch (error) {
                console.error(`Error fetching seller ${product.sellerId}:`, error);
                names[product.sellerId] = {
                  name: 'Unknown Seller',
                  isFarmer: false,
                  isVerified: false,
                  isTrusted: false
                };
              }
            }
          }
          setSellerNames(names);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [priceRange, categories, sellerTypes, dateRange, products]);

  useEffect(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    setDisplayedProducts(filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct));
  }, [filteredProducts, currentPage]);

  const applyFilters = () => {
    let filtered = [...products];
    
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    const selectedCategories = Object.keys(categories).filter(cat => categories[cat]);
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product => 
        product.category && selectedCategories.includes(product.category.toLowerCase().replace(/ /g, ''))
      );
    }
    
    const selectedSellerTypes = Object.keys(sellerTypes).filter(type => sellerTypes[type]);
    if (selectedSellerTypes.length > 0) {
      filtered = filtered.filter(product => {
        const seller = sellerNames[product.sellerId];
        if (!seller) return false;
        
        return (
          (sellerTypes.farmer && seller.isFarmer) ||
          (sellerTypes.verified && seller.isVerified) ||
          (sellerTypes.trusted && seller.isTrusted)
        );
      });
    }
    
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    filtered = filtered.filter(product => {
      const productDate = product.timestamp;
      
      switch(dateRange) {
        case '7days':
          return now - productDate <= sevenDays;
        case '14days':
          return now - productDate <= fourteenDays;
        case '30days':
          return now - productDate <= thirtyDays;
        default:
          return true;
      }
    });
    
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

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
      grains: false,
      nutsAndDryFruits: false,
      oilAndOilseeds: false,
      pulses: false,
      spices: false,
      sweeteners: false,
      vegetables: false,
      others: false
    });
    setSellerTypes({
      farmer: false,
      verified: false,
      trusted: false
    });
    setDateRange('all');
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
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
                  grains: 'Grains',
                  nutsAndDryFruits: 'Nuts & Dry Fruits',
                  oilAndOilseeds: 'Oil & Oilseeds',
                  pulses: 'Pulses',
                  spices: 'Spices',
                  sweeteners: 'Sweeteners',
                  vegetables: 'Vegetables',
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
                  className={`filter-option ${dateRange === '14days' ? 'active' : ''}`}
                  onClick={() => handleDateRangeChange('14days')}
                >
                  Last 14 Days
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
                        sellerName={sellerNames[product.sellerId]?.name || 'Unknown Seller'}
                        isVerified={sellerNames[product.sellerId]?.isVerified || false}
                        isTrusted={sellerNames[product.sellerId]?.isTrusted || false}
                        onClick={() => handleProductClick(product.id)}
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
                    
                    {Array.from({ length: Math.ceil(filteredProducts.length / productsPerPage) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => paginate(index + 1)}
                        className={currentPage === index + 1 ? 'active' : ''}
                      >
                        {index + 1}
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

const ProductCard = ({ product, sellerName, isVerified, isTrusted, onClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === product.imageUrls.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => 
      prev === 0 ? product.imageUrls.length - 1 : prev - 1
    );
  };

  const currentImageUrl = product.imageUrls?.length > currentImageIndex 
    ? product.imageUrls[currentImageIndex]
    : null;

  return (
    <div className="product-card" onClick={onClick}>
      <div className="product-image-container">
        {currentImageUrl ? (
          <>
            <img 
              src={currentImageUrl} 
              alt={product.name}
              loading="lazy"
              onError={(e) => {
                e.target.src = '/placeholder-plant.jpg';
                e.target.onerror = null;
              }}
            />
            {product.imageUrls.length > 1 && (
              <>
                <button 
                  className="image-nav-button prev"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                >
                  &lt;
                </button>
                <button 
                  className="image-nav-button next"
                  onClick={handleNextImage}
                  aria-label="Next image"
                >
                  &gt;
                </button>
                <div className="image-counter">
                  {currentImageIndex + 1}/{product.imageUrls.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="image-placeholder">
            <span>No Image Available</span>
          </div>
        )}
      </div>
      <div className="product-details">
        <h3>{product.name}</h3>
        <p className="price">₹{product.price?.toLocaleString() || 'N/A'}</p>
        {product.category && (
          <span className="product-category">{product.category}</span>
        )}
        <p className="description">
          {product.description?.length > 100 
            ? `${product.description.substring(0, 100)}...` 
            : product.description || 'No description available'}
        </p>
        <div className="product-meta">
          <div className="seller-info">
            <span className="seller">Sold by: {sellerName}</span>
            <div className="seller-badges">
              {isVerified && <span className="badge verified">Verified</span>}
              {isTrusted && <span className="badge trusted">Trusted</span>}
            </div>
          </div>
          <span className="location">{product.location || 'Location not specified'}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;