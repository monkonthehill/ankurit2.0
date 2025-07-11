import { useState, useEffect } from 'react';
import { plantCategories, popularVarieties } from './plantsData';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import './PreOrder.css';

const PreOrder = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(plantCategories);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedVariety, setSelectedVariety] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    whatsapp: '',
    address: '',
    deliveryDate: '',
    shareInfo: false
  });
  const [orderQuantities, setOrderQuantities] = useState({});
  const [orderPrices, setOrderPrices] = useState({});

  // Filter plants by active category and search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      if (activeCategory === 'all') {
        setFilteredCategories(plantCategories);
      } else {
        const filtered = plantCategories.filter(category => 
          category.id === activeCategory
        );
        setFilteredCategories(filtered);
      }
      return;
    }

    const results = plantCategories
      .filter(category => activeCategory === 'all' || category.id === activeCategory)
      .map(category => {
        const matchingPlants = category.plants.filter(plant =>
          plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plant.varieties.some(variety => 
            variety.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
        return {...category, plants: matchingPlants};
      })
      .filter(category => category.plants.length > 0);

    setFilteredCategories(results);
  }, [searchTerm, activeCategory]);

  // Handle adding to cart
  const handleAddToCart = (variety) => {
    setSelectedVariety(variety);
    setCart(prev => {
      const existingItem = prev.find(item => 
        item.variety.name === variety.name && 
        item.plant.id === selectedPlant.id
      );
      if (existingItem) {
        return prev.map(item =>
          item.variety.name === variety.name && item.plant.id === selectedPlant.id
            ? { ...item, quantity: (item.quantity || 0) + 1 }
            : item
        );
      }
      return [...prev, { plant: selectedPlant, variety, quantity: 1 }];
    });
    setOrderQuantities(prev => ({
      ...prev,
      [`${selectedPlant.id}-${variety.name}`]: (prev[`${selectedPlant.id}-${variety.name}`] || 0) + 1
    }));
    setOrderPrices(prev => ({
      ...prev,
      [`${selectedPlant.id}-${variety.name}`]: prev[`${selectedPlant.id}-${variety.name}`] || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.name || !formData.mobile || !formData.address || !formData.deliveryDate) {
        alert('Please fill all required fields');
        return;
      }

      const orderDetails = cart.map(item => ({
        plantName: item.plant.name,
        varietyName: item.variety.name,
        quantity: orderQuantities[`${item.plant.id}-${item.variety.name}`] || 1,
        proposedPrice: orderPrices[`${item.plant.id}-${item.variety.name}`] || '0'
      }));

      const orderDoc = {
        customerId: auth.currentUser?.uid || 'guest',
        customerName: formData.name,
        mobileNumber: formData.mobile,
        whatsappNumber: formData.whatsapp || formData.mobile,
        deliveryAddress: formData.address,
        deliveryDate: formData.deliveryDate,
        shareInfo: formData.shareInfo,
        orderDetails,
        createdAt: serverTimestamp(),
        status: 'pending',
        supplierId: null,
        trackingInfo: null,
        supplierNotes: null
      };

      const docRef = await addDoc(collection(db, 'pre-orders'), orderDoc);

      setFormData({
        name: '',
        mobile: '',
        whatsapp: '',
        address: '',
        deliveryDate: '',
        shareInfo: false
      });
      setCart([]);
      setOrderQuantities({});
      setOrderPrices({});
      setShowForm(false);
      setShowCart(false);
      setShowThankYou(true);
      
      setTimeout(() => {
        setShowThankYou(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(`Error submitting order: ${error.message}`);
    }
  };

  return (
    <div className="pre-order-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <img 
            src={require('./pre-order.png')} 
            alt="Pre-order plants" 
            className="hero-image"
          />
          <h1>Pre-Order Your Plants</h1>
          <p>Secure your plants in advance from trusted nurseries across the region</p>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search for plants (e.g., Apple, Tomato)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-btn">
              <i className="fas fa-search"></i>
            </button>
            {searchTerm && (
              <button 
                className="clear-btn"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="featured-categories">
          <h2>Browse Categories</h2>
          <div className="category-toggles">
            <button 
              className={`category-toggle ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All Plants
            </button>
            {plantCategories.map(category => (
              <button
                key={category.id}
                className={`category-toggle ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Display plants based on active category */}
          {filteredCategories.length > 0 ? (
            <div className="plants-grid">
              {filteredCategories.flatMap(category => 
                category.plants.map(plant => (
                  <div 
                    key={plant.id} 
                    className="plant-card"
                    onClick={() => setSelectedPlant(plant)}
                  >
                    <img src={plant.image} alt={plant.name} />
                    <h4>{plant.name}</h4>
                    <p>{plant.varieties.length} varieties available</p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <p>No plants found matching your search.</p>
          )}

          <h2>Popular Varieties</h2>
          <div className="varieties-grid">
            {popularVarieties.map(variety => (
              <div key={variety.name} className="variety-card">
                <img src={variety.image} alt={variety.name} />
                <h4>{variety.name}</h4>
                <p>{variety.orders} orders this month</p>
                <button 
                  className="pre-order-btn"
                  onClick={() => {
                    const plant = plantCategories.flatMap(c => c.plants).find(p => 
                      p.varieties.some(v => v.name === variety.name)
                    );
                    if (plant) {
                      setSelectedPlant(plant);
                      const varietyObj = plant.varieties.find(v => v.name === variety.name);
                      if (varietyObj) {
                        handleAddToCart(varietyObj);
                      }
                    }
                  }}
                >
                  Pre-Order
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Plant Varieties Modal */}
        {selectedPlant && (
          <div className="modal-overlay">
            <div className="plant-modal">
              <button className="close-btn" onClick={() => setSelectedPlant(null)}>
                &times;
              </button>
              <h2>{selectedPlant.name} Varieties</h2>
              <div className="varieties-list">
                {selectedPlant.varieties.map(variety => (
                  <div key={variety.name} className="variety-item">
                    <img src={variety.image} alt={variety.name} />
                    <div className="variety-info">
                      <h4>{variety.name}</h4>
                      <button 
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(variety)}
                      >
                        Add to Pre-Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Cart Sidebar */}
        <div className={`cart-sidebar ${showCart ? 'open' : ''}`}>
          <div className="cart-header">
            <h3>Your Pre-Order Cart</h3>
            <button className="close-cart" onClick={() => setShowCart(false)}>
              &times;
            </button>
          </div>
          {cart.length > 0 ? (
            <>
              <div className="cart-items">
                {cart.map((item, index) => (
                  <div key={index} className="cart-item">
                    <img src={item.variety.image} alt={item.variety.name} />
                    <div className="item-details">
                      <h4>{item.variety.name}</h4>
                      <p>{item.plant.name}</p>
                      <div className="quantity-control">
                        <button 
                          onClick={() => setCart(prev => 
                            prev.map(cartItem => 
                              cartItem.variety.name === item.variety.name && 
                              cartItem.plant.id === item.plant.id
                                ? { ...cartItem, quantity: Math.max(1, cartItem.quantity - 1) }
                                : cartItem
                            )
                          )}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          onClick={() => setCart(prev => 
                            prev.map(cartItem => 
                              cartItem.variety.name === item.variety.name && 
                              cartItem.plant.id === item.plant.id
                                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                                : cartItem
                            )
                          )}
                        >
                          +
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Proposed price"
                        value={orderPrices[`${item.plant.id}-${item.variety.name}`] || ''}
                        onChange={(e) => setOrderPrices(prev => ({
                          ...prev,
                          [`${item.plant.id}-${item.variety.name}`]: e.target.value
                        }))}
                      />
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => setCart(prev => 
                        prev.filter(cartItem => 
                          !(cartItem.variety.name === item.variety.name && 
                          cartItem.plant.id === item.plant.id)
                        )
                      )}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button 
                className="checkout-btn"
                onClick={() => {
                  setShowCart(false);
                  setShowForm(true);
                }}
              >
                Proceed to Pre-Order
              </button>
            </>
          ) : (
            <p className="empty-cart">Your cart is empty</p>
          )}
        </div>

        {/* Cart Button */}
        <button 
          className="cart-button"
          onClick={() => setShowCart(true)}
        >
          <i className="fas fa-shopping-cart"></i>
          {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
        </button>

        {/* Order Form Modal */}
        {showForm && (
          <div className="form-overlay">
            <div className="order-form">
              <h2>Complete Your Pre-Order</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Address *</label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Date Needed By *</label>
                  <input
                    type="date"
                    required
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                  />
                </div>
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="share-info"
                    checked={formData.shareInfo}
                    onChange={(e) => setFormData({...formData, shareInfo: e.target.checked})}
                  />
                  <label htmlFor="share-info">
                    I agree to share my contact information with the nurseries to facilitate this order
                  </label>
                </div>
                <div className="form-actions">
                  <button 
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Submit Pre-Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Thank You Popup */}
        {showThankYou && (
          <div className="thank-you-popup">
            <div className="popup-content">
              <img 
                src={require('./popup.png')} 
                alt="Thank you" 
                className="popup-image"
              />
              <h2>Thank You for Your Pre-Order!</h2>
              <p>We will contact our nursery owners about your request and will call you within the next 2 working days for confirmation.</p>
              <button 
                className="close-popup"
                onClick={() => setShowThankYou(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreOrder;