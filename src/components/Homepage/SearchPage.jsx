import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { Search, X, User, Leaf } from 'lucide-react';
import ProductCard from '../Products/ProductCard';
import placeholderUser from '../../assets/images/images.jpeg';
import './SearchPage.css';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Safe fuzzy match function with null checks
  const fuzzyMatch = (str, query) => {
    if (!str || !query) return false;
    try {
      const strLower = String(str).toLowerCase();
      const queryLower = String(query).toLowerCase();
      
      let queryIndex = 0;
      for (let i = 0; i < strLower.length && queryIndex < queryLower.length; i++) {
        if (strLower[i] === queryLower[queryIndex]) {
          queryIndex++;
        }
      }
      return queryIndex === queryLower.length;
    } catch (e) {
      console.error("Error in fuzzy matching:", e);
      return false;
    }
  };

  // Initialize search query from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [location.search]);

  // Debounced search effect with cleanup
  useEffect(() => {
    let isMounted = true;
    let productsListener = null;
    let searchTimer = null;

    const performSearch = async (queryText) => {
      if (!queryText?.trim()) {
        if (isMounted) {
          setSearchResults({ products: [], users: [] });
          setLoading(false);
        }
        return;
      }

      if (isMounted) setLoading(true);

      try {
        // Search products from Realtime DB
        const db = getDatabase();
        const productsRef = ref(db, 'products');
        
        if (productsListener) {
          off(productsRef, 'value', productsListener);
        }

        productsListener = onValue(productsRef, (snapshot) => {
          if (!isMounted) return;
          
          const productResults = [];
          snapshot.forEach((childSnapshot) => {
            try {
              const product = childSnapshot.val();
              if (product?.name && fuzzyMatch(product.name, queryText)) {
                productResults.push({ 
                  id: childSnapshot.key, 
                  ...product 
                });
              }
            } catch (e) {
              console.error("Error processing product:", e);
            }
          });

          setSearchResults(prev => ({ ...prev, products: productResults }));
        });

        // Search users from Firestore
        const firestore = getFirestore();
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const userResults = [];
        usersSnapshot.forEach(doc => {
          try {
            const user = doc.data();
            if (user?.username && fuzzyMatch(user.username, queryText)) {
              userResults.push({ 
                id: doc.id, 
                ...user 
              });
            }
          } catch (e) {
            console.error("Error processing user:", e);
          }
        });

        if (isMounted) {
          setSearchResults(prev => ({ ...prev, users: userResults }));
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    searchTimer = setTimeout(() => {
      if (searchQuery?.trim()) {
        performSearch(searchQuery);
      } else if (isMounted) {
        setSearchResults({ products: [], users: [] });
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(searchTimer);
      const db = getDatabase();
      const productsRef = ref(db, 'products');
      if (productsListener) {
        off(productsRef, 'value', productsListener);
      }
    };
  }, [searchQuery]);

  // Recent searches management with safe parsing
  useEffect(() => {
    const loadRecentSearches = () => {
      try {
        const savedSearches = localStorage.getItem('recentSearches');
        if (savedSearches) {
          const parsed = JSON.parse(savedSearches);
          if (Array.isArray(parsed)) {
            setRecentSearches(parsed.filter(item => 
              item?.query && typeof item.query === 'string'
            ));
          }
        }
      } catch (e) {
        console.error("Error loading recent searches:", e);
        localStorage.removeItem('recentSearches');
      }
    };

    loadRecentSearches();
  }, []);

  const addRecentSearch = (queryText) => {
    if (!queryText?.trim()) return;
    
    setRecentSearches(prev => {
      try {
        const existingIndex = prev.findIndex(item => 
          item?.query && 
          typeof item.query === 'string' &&
          item.query.toLowerCase() === queryText.toLowerCase()
        );
        
        const newSearches = existingIndex >= 0
          ? [
              prev[existingIndex],
              ...prev.slice(0, existingIndex),
              ...prev.slice(existingIndex + 1)
            ]
          : [
              { query: String(queryText), timestamp: Date.now() },
              ...prev
            ].slice(0, 5);
        
        localStorage.setItem('recentSearches', JSON.stringify(newSearches));
        return newSearches;
      } catch (e) {
        console.error("Error adding recent search:", e);
        return prev;
      }
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery?.trim()) return;
    addRecentSearch(searchQuery);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ products: [], users: [] });
    navigate('/search');
  };

  const filteredResults = useMemo(() => {
    if (activeTab === 'products') return { ...searchResults, users: [] };
    if (activeTab === 'users') return { ...searchResults, products: [] };
    return searchResults;
  }, [searchResults, activeTab]);

  const hasResults = filteredResults.products.length > 0 || filteredResults.users.length > 0;

  return (
    <div className="search-page">
      <div className="search-header">
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <button type="submit" className="search-button" aria-label="Search">
            <Search size={20} />
          </button>
          <input
            type="text"
            placeholder="Search for plants, tools, or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            aria-label="Search input"
          />
          {searchQuery && (
            <button type="button" onClick={clearSearch} className="clear-button" aria-label="Clear search">
              <X size={20} />
            </button>
          )}
        </form>
      </div>

      {searchQuery ? (
        <div className="search-content">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Searching...</p>
            </div>
          ) : (
            <>
              <div className="search-tabs">
                <button
                  className={activeTab === 'all' ? 'active' : ''}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button
                  className={activeTab === 'products' ? 'active' : ''}
                  onClick={() => setActiveTab('products')}
                >
                  <Leaf size={16} /> Products
                </button>
                <button
                  className={activeTab === 'users' ? 'active' : ''}
                  onClick={() => setActiveTab('users')}
                >
                  <User size={16} /> People
                </button>
              </div>

              {hasResults ? (
                <>
                  {filteredResults.products.length > 0 && (
                    <div className="results-section">
                      <h3>Products</h3>
                      <div className="search-results">
                        {filteredResults.products.map(product => (
                          <ProductCard
                            key={product?.id || Math.random()}
                            product={product}
                            onClick={() => {
                              addRecentSearch(searchQuery);
                              navigate(`/product/${product?.id}`);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredResults.users.length > 0 && (
                    <div className="results-section">
                      <h3>People</h3>
                      <div className="user-results">
                        {filteredResults.users.map(user => (
                          <div
                            key={user?.id || Math.random()}
                            className="user-card"
                            onClick={() => {
                              addRecentSearch(searchQuery);
                              navigate(`/profile/${user?.id}`);
                            }}
                          >
                            <img
                              src={user?.profilePhoto || placeholderUser}
                              alt={user?.name || user?.username || 'User'}
                              className="user-avatar"
                              onError={(e) => {
                                e.target.src = placeholderUser;
                              }}
                            />
                            <div className="user-info">
                              <h4>{user?.name || user?.username || 'User'}</h4>
                              {user?.username && <p className="username">@{user.username}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-results">
                  <p>No results found for "{searchQuery}"</p>
                  <p>Try different keywords</p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="search-suggestions">
          {recentSearches.length > 0 && (
            <>
              <h3>Recent Searches</h3>
              <ul className="recent-searches">
                {recentSearches.map((search, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      if (search?.query) {
                        setSearchQuery(search.query);
                        navigate(`/search?q=${encodeURIComponent(search.query)}`);
                      }
                    }}
                  >
                    {search?.query || ''}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3>Popular Categories</h3>
          <div className="category-tags">
            {['Indoor Plants', 'Flowering Plants', 'Gardening Tools', 'Organic Fertilizers', 'Succulents'].map(category => (
              <span
                key={category}
                onClick={() => {
                  setSearchQuery(category);
                  navigate(`/search?q=${encodeURIComponent(category)}`);
                }}
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;