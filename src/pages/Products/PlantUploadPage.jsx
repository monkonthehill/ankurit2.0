import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, set } from "firebase/database";
import { auth } from '../../firebase/firebase';
import ImageUploader from '../../components/ImageKit/PlantImage';
import { FiX, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { FaSpinner, FaCheckCircle, FaLeaf } from 'react-icons/fa';
import './PlantUploadPage.css';

const PlantUploadPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [imageUrls, setImageUrls] = useState(Array(5).fill(null));

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    location: '',
    category: '',
    plantType: '',
    age: '',
    healthStatus: 'Healthy',
    stock: '1',
    careLevel: 'Easy',
    sunlightRequirements: 'Partial Sun',
  });

  const plantCategories = [
    'Indoor Plants', 
    'Outdoor Plants',
    'Flowering Plants',
    'Succulents & Cacti',
    'Herbs',
    'Vegetable Plants',
    'Fruit Plants',
    'Bonsai',
    'Rare Plants'
  ];

  const plantTypes = ['Seedling', 'Young Plant', 'Mature Plant', 'Cutting', 'Seeds'];
  const healthStatuses = ['Healthy', 'Recovering', 'Pest-Free', 'Disease-Free'];
  const careLevels = ['Easy', 'Moderate', 'Difficult'];
  const sunlightRequirements = [
    'Full Sun', 
    'Partial Sun', 
    'Shade', 
    'Indirect Light',
    'Low Light'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (url, index) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = url;
    setImageUrls(newImageUrls);
  };

  const removeImage = (index) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = null;
    setImageUrls(newImageUrls);
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.category)) {
      alert('Please provide plant name and category');
      return;
    }
    if (step === 2 && !formData.price) {
      alert('Please enter a price');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.location) {
      alert('Please provide your location');
      return;
    }
    
    const filteredImages = imageUrls.filter(url => url !== null);
    if (filteredImages.length === 0) {
      alert('Please upload at least one image');
      return;
    }
    
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      // Initialize Realtime Database
      const db = getDatabase();
      const productsRef = ref(db, 'products');
      
      // Create a new product reference
      const newProductRef = push(productsRef);
      
      const productData = {
        ...formData,
        id: newProductRef.key,
        imageUrl: filteredImages[0], // Main image
        images: filteredImages,
        sellerId: user.uid,
        createdAt: Date.now(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      };

      // Write to database
      await set(newProductRef, productData);
      
      // Also add reference to user's products
      const userProductRef = ref(db, `users/${user.uid}/products/${newProductRef.key}`);
      await set(userProductRef, true);
      
      setSuccess(true);
      setTimeout(() => navigate('/my-plants'), 2000);
    } catch (error) {
      console.error("Error adding product:", error);
      alert(`Failed to list product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="form-step">
            <h2><FaLeaf /> Basic Plant Information</h2>
            
            <div className="form-group">
              <label>Plant Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Monstera Deliciosa"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Category <span className="required">*</span></label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select category</option>
                  {plantCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Plant Type</label>
                <select
                  name="plantType"
                  value={formData.plantType}
                  onChange={handleInputChange}
                >
                  <option value="">Select type</option>
                  {plantTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your plant (size, special features, etc.)"
                rows="3"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="form-step">
            <h2><FaLeaf /> Pricing & Details</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Price (₹) <span className="required">*</span></label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Price per plant"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Available Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="Number available"
                  min="1"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Plant Age</label>
                <input
                  type="text"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="e.g., 1 year old"
                />
              </div>
              
              <div className="form-group">
                <label>Health Status</label>
                <select
                  name="healthStatus"
                  value={formData.healthStatus}
                  onChange={handleInputChange}
                >
                  {healthStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Care Level</label>
                <select
                  name="careLevel"
                  value={formData.careLevel}
                  onChange={handleInputChange}
                >
                  {careLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Sunlight Requirements</label>
                <select
                  name="sunlightRequirements"
                  value={formData.sunlightRequirements}
                  onChange={handleInputChange}
                >
                  {sunlightRequirements.map(light => (
                    <option key={light} value={light}>{light}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="form-step">
            <h2><FaLeaf /> Location & Images</h2>
            
            <div className="form-group">
              <label>Your Location <span className="required">*</span></label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, State"
                required
              />
            </div>
            
            <div className="image-upload-section">
              <h3>Plant Photos</h3>
              <p>Upload clear photos (up to 5 images). First image will be the main display.</p>
              
              <div className="image-grid">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div key={index} className="image-upload-container">
                    {imageUrls[index] ? (
                      <div className="image-preview-item">
                        <img src={imageUrls[index]} alt={`Plant ${index + 1}`} />
                        <button 
                          type="button" 
                          className="remove-image-btn"
                          onClick={() => removeImage(index)}
                        >
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <ImageUploader
                        onUploadComplete={(url) => handleImageUpload(url, index)}
                        label={`Upload Image ${index + 1}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="plant-upload-container">
      {success ? (
        <div className="success-message">
          <FaCheckCircle className="success-icon" />
          <h2>Plant Listed Successfully!</h2>
          <p>Your plant has been added to the store.</p>
        </div>
      ) : (
        <>
          <h1><FaLeaf /> List Your Plant</h1>
          <p className="subtitle">Share your beautiful plants with our community</p>
          
          <div className="progress-steps">
            {[1, 2, 3].map((stepNumber) => (
              <div 
                key={stepNumber} 
                className={`step ${stepNumber === step ? 'active' : ''} ${stepNumber < step ? 'completed' : ''}`}
              >
                <div className="step-number">{stepNumber}</div>
                <div className="step-label">
                  {stepNumber === 1 && 'Basic Info'}
                  {stepNumber === 2 && 'Details'}
                  {stepNumber === 3 && 'Media'}
                </div>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSubmit}>
            {renderStep()}
            
            <div className="form-actions">
              {step > 1 && (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={prevStep}
                  disabled={loading}
                >
                  <FiChevronLeft /> Back
                </button>
              )}
              
              {step < 3 ? (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={loading}
                >
                  Next <FiChevronRight />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="spinner" /> Listing...
                    </>
                  ) : (
                    'List Plant'
                  )}
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default PlantUploadPage;