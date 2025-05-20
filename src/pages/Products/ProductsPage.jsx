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
  const productsPerPage = 9;
  
  // Filter states
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [plantTypes, setPlantTypes] = useState({
    indoor: false,
    outdoor: false,
    succulent: false,
    flowering: false
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const database = getDatabase();
        const productsRef = ref(database, 'products');
        
        onValue(productsRef, async (snapshot) => {
          const productsData = [];
          snapshot.forEach((childSnapshot) => {
            const product = childSnapshot.val();
            // Process image URLs
            if (product.imageUrls) {
              product.imageUrls = product.imageUrls.map(url => 
                url && !url.includes('ik.imagekit.io') ? `https://ik.imagekit.io/ankurit${url}` : url
              );
            } else if (product.imageUrl) {
              product.imageUrls = [
                product.imageUrl && !product.imageUrl.includes('ik.imagekit.io') 
                  ? `https://ik.imagekit.io/ankurit${product.imageUrl}` 
                  : product.imageUrl
              ];
            } else {
              product.imageUrls = [];
            }
            productsData.push({ id: childSnapshot.key, ...product });
          });
          
          setProducts(productsData);
          setFilteredProducts(productsData);
          
          // Fetch seller names
          const names = {};
          for (const product of productsData) {
            if (!names[product.sellerId]) {
              try {
                const userDoc = await getDoc(doc(db, 'users', product.sellerId));
                if (userDoc.exists()) {
                  names[product.sellerId] = userDoc.data().fullName || userDoc.data().name || 'Unknown Seller';
                } else {
                  names[product.sellerId] = 'Unknown Seller';
                }
              } catch (error) {
                console.error(`Error fetching seller ${product.sellerId}:`, error);
                names[product.sellerId] = 'Unknown Seller';
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
  }, [priceRange, plantTypes, products]);

  useEffect(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    setDisplayedProducts(filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct));
  }, [filteredProducts, currentPage]);

  const applyFilters = () => {
    let filtered = [...products];
    
    // Price filter
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );
    
    // Plant type filter
    const selectedPlantTypes = Object.keys(plantTypes).filter(type => plantTypes[type]);
    if (selectedPlantTypes.length > 0) {
      filtered = filtered.filter(product => 
        product.type && selectedPlantTypes.includes(product.type.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handlePriceChange = (e, index) => {
    const newPriceRange = [...priceRange];
    newPriceRange[index] = parseInt(e.target.value);
    setPriceRange(newPriceRange);
  };

  const togglePlantType = (type) => {
    setPlantTypes({
      ...plantTypes,
      [type]: !plantTypes[type]
    });
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setPlantTypes({
      indoor: false,
      outdoor: false,
      succulent: false,
      flowering: false
    });
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
          {/* Desktop Filters - Always visible on desktop */}
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
            </div>
            
            <div className="filter-section">
              <h4>Plant Type</h4>
              <div className="filter-options">
                {Object.keys(plantTypes).map(type => (
                  <button
                    key={type}
                    className={`filter-option ${plantTypes[type] ? 'active' : ''}`}
                    onClick={() => togglePlantType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <button className="clear-filters" onClick={clearFilters}>
              Clear All Filters
            </button>
          </div>
          
          {/* Products Grid */}
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
                        sellerName={sellerNames[product.sellerId] || 'Unknown Seller'}
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
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

const ProductCard = ({ product, sellerName, onClick }) => {
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

  return (
    <div className="product-card" onClick={onClick}>
      <div className="product-image-container">
        {product.imageUrls && product.imageUrls.length > 0 ? (
          <>
            <img 
              src={product.imageUrls[currentImageIndex]} 
              alt={product.name}
              loading="lazy"
              onError={(e) => {
                e.target.src = '/placeholder-plant.jpg';
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
          <div className="image-placeholder">No Image</div>
        )}
      </div>
      <div className="product-details">
        <h3>{product.name}</h3>
        <p className="price">₹{product.price?.toLocaleString() || 'N/A'}</p>
        <p className="description">{product.description?.length > 100 
          ? `${product.description.substring(0, 100)}...` 
          : product.description}</p>
        <div className="product-meta">
          <p className="seller">Sold by: {sellerName}</p>
          <p className="location">{product.location}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;