import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue } from 'firebase/database'; // Removed unnecessary query, orderByChild, startAt, endAt
import { Search, X } from 'lucide-react';
import ProductCard from '../Products/ProductCard'; // Reuse your ProductCard component
import './SearchPage.css';

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize search query from URL params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
      // Removed direct call to performSearch here to avoid double-fetching
      // The useEffect below will handle it
    }
  }, [location.search]);

  // Effect to perform search whenever searchQuery changes
  useEffect(() => {
    // Debounce the search to prevent too many Firebase calls
    const handler = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // Adjust debounce time as needed (e.g., 300ms)

    return () => {
      clearTimeout(handler); // Clear timeout if searchQuery changes before delay
    };
  }, [searchQuery]); // Dependency array: run effect when searchQuery changes

  const performSearch = (queryText) => { // Renamed parameter for clarity
    if (!queryText.trim()) {
      setSearchResults([]);
      setLoading(false); // Ensure loading is false if query is empty
      return;
    }

    setLoading(true);
    const database = getDatabase();
    const productsRef = ref(database, 'products');

    onValue(productsRef, (snapshot) => {
      const results = [];
      snapshot.forEach((childSnapshot) => {
        const product = childSnapshot.val();
        if (product.name && product.name.toLowerCase().includes(queryText.toLowerCase())) {
          results.push({ id: childSnapshot.key, ...product });
        }
      });

      setSearchResults(results);
      setLoading(false);

      // Add to recent searches only when results are found and query is submitted (optional: for instant search, you might add it on every valid search)
      // For now, let's keep it tied to explicit search or non-empty instant results
      if (results.length > 0) {
        // You might want to consider when to add to recent searches for instant search.
        // If adding for every instant search, it might fill up quickly.
        // A common pattern is to add only when the user *selects* a result or presses Enter.
        // For simplicity, let's keep adding it if there are results from any search.
        addRecentSearch(queryText);
      }
    });
  };

  const addRecentSearch = (queryText) => { // Renamed parameter
    setRecentSearches(prev => {
      const newSearches = [queryText, ...prev.filter(item => item !== queryText)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
      return newSearches;
    });
  };

  const handleSearchSubmit = (e) => { // Renamed for clarity - this is for form submission
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    // The useEffect will pick up searchQuery change and call performSearch
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    navigate('/search');
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  return (
    <div className="search-page">
      <div className="search-header">
        <form onSubmit={handleSearchSubmit} className="search-bar"> {/* Updated onSubmit handler */}
          <button type="submit" className="search-button" aria-label="Search">
            <Search size={20} />
          </button>
          <input
            type="text"
            placeholder="Search for plants, tools, nurseries..."
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

      <div className="search-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Searching...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <h3>Search Results</h3>
            <div className="search-results">
              {searchResults.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => navigate(`/product/${product.id}`)}
                />
              ))}
            </div>
          </>
        ) : searchQuery ? (
          <div className="no-results">
            <p>No results found for "{searchQuery}"</p>
            <p>Try different keywords</p>
          </div>
        ) : (
          <div className="search-suggestions">
            <h3>Recent Searches</h3>
            {recentSearches.length > 0 ? (
              <ul className="recent-searches">
                {recentSearches.map((search, index) => (
                  <li key={index} onClick={() => setSearchQuery(search)} tabIndex="0"> {/* Added tabIndex for accessibility */}
                    {search}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Your recent searches will appear here</p>
            )}

            <h3>Popular Categories</h3>
            <div className="category-tags">
              <span onClick={() => setSearchQuery('Indoor Plants')} tabIndex="0">Indoor Plants</span>
              <span onClick={() => setSearchQuery('Flowering Plants')} tabIndex="0">Flowering Plants</span>
              <span onClick={() => setSearchQuery('Gardening Tools')} tabIndex="0">Gardening Tools</span>
              <span onClick={() => setSearchQuery('Organic Fertilizers')} tabIndex="0">Organic Fertilizers</span>
              <span onClick={() => setSearchQuery('Succulents')} tabIndex="0">Succulents</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;