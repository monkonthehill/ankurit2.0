import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import './pricing.css'; // Assuming you have a CSS file for styling
const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planExpiry, setPlanExpiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const fetchUserPlan = async () => {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setCurrentPlan(docSnap.data().plan || null);
          setPlanExpiry(docSnap.data().expiryDate?.toDate() || null);
        }
      }
      setLoading(false);
    };

    fetchUserPlan();
  }, [auth.currentUser]);

  const calculateExpiryDate = () => {
    const now = new Date();
    if (billingCycle === 'monthly') {
      return new Date(now.setMonth(now.getMonth() + 1));
    } else {
      return new Date(now.setFullYear(now.getFullYear() + 1));
    }
  };

  const handlePlanSelect = async (plan) => {
    if (!auth.currentUser) {
      alert('Please sign in to select a plan');
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const expiryDate = calculateExpiryDate();
      
      await setDoc(userRef, { 
        plan,
        planPurchased: serverTimestamp(),
        billingCycle,
        expiryDate
      }, { merge: true });
      
      setCurrentPlan(plan);
      setPlanExpiry(expiryDate);
      setSelectedPlan(plan);
      setShowPopup(true);
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Failed to update plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedPlan(null);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getPlanDuration = () => {
    return billingCycle === 'monthly' ? '1 month' : '1 year';
  };

  const getPlanPrice = (plan) => {
    switch(plan) {
      case 'free': return '₹0';
      case 'nursery': return billingCycle === 'monthly' ? '₹99' : '₹950';
      case 'golden': return billingCycle === 'monthly' ? '₹200' : '₹1900';
      default: return '';
    }
  };

  return (
    <div className="pricing-page">
      <header className="hero-section">
        <h1>Flexible Plans for Every Grower</h1>
        <p>Choose the right plan to grow your nursery.</p>
      </header>

      {currentPlan && currentPlan !== 'free' && planExpiry && (
        <div className="plan-expiry-banner">
          Your {currentPlan} plan is active until {formatDate(planExpiry)}
        </div>
      )}

      <div className="billing-toggle">
        <button
          className={billingCycle === 'monthly' ? 'active' : ''}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button
          className={billingCycle === 'yearly' ? 'active' : ''}
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly
        </button>
        <span className={`slider ${billingCycle}`}></span>
      </div>

      <div className="pricing-cards">
        {/* Free Plan */}
        <div className={`pricing-card ${currentPlan === 'free' ? 'current-plan' : ''}`}>
          <h3>Free Plan</h3>
          <div className="price">
            {getPlanPrice('free')} <span>/month</span>
          </div>
          <ul>
            <li>3 listings only</li>
            <li>Basic visibility</li>
            <li>Community support</li>
          </ul>
          {currentPlan === 'free' ? (
            <button className="current-button" disabled>
              Your Current Plan
            </button>
          ) : (
            <button onClick={() => handlePlanSelect('free')}>Select Plan</button>
          )}
        </div>

        {/* Nursery Plan (Highlighted) */}
        <div className={`pricing-card featured ${currentPlan === 'nursery' ? 'current-plan' : ''}`}>
          <div className="popular-badge">Most Popular</div>
          <h3>Nursery Plan</h3>
          <div className="price">
            {getPlanPrice('nursery')} <span>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
          </div>
          <ul>
            <li>Unlimited listings</li>
            <li>1-month standard promotion</li>
            <li>Priority support</li>
            <li>Basic analytics</li>
          </ul>
          {currentPlan === 'nursery' ? (
            <button className="current-button" disabled>
              Your Current Plan
            </button>
          ) : (
            <button onClick={() => handlePlanSelect('nursery')}>Select Plan</button>
          )}
        </div>

        {/* Golden Farmer */}
        <div className={`pricing-card ${currentPlan === 'golden' ? 'current-plan' : ''}`}>
          <h3>Golden Farmer</h3>
          <div className="price">
            {getPlanPrice('golden')} <span>/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
          </div>
          <ul>
            <li>Profile badge</li>
            <li>Homepage boost</li>
            <li>Verification</li>
            <li>24/7 premium support</li>
            <li>Advanced analytics</li>
          </ul>
          {currentPlan === 'golden' ? (
            <button className="current-button" disabled>
              Your Current Plan
            </button>
          ) : (
            <button onClick={() => handlePlanSelect('golden')}>Select Plan</button>
          )}
        </div>
      </div>

      <div className="feature-table">
        <h2>Plan Comparison</h2>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Free</th>
              <th>Nursery</th>
              <th>Golden Farmer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Listings</td>
              <td>3</td>
              <td>Unlimited</td>
              <td>Unlimited</td>
            </tr>
            <tr>
              <td>Support</td>
              <td>Community</td>
              <td>Priority</td>
              <td>24/7 Premium</td>
            </tr>
            <tr>
              <td>Visibility</td>
              <td>Basic</td>
              <td>Standard Promotion</td>
              <td>Homepage Boost</td>
            </tr>
            <tr>
              <td>Verification</td>
              <td>✗</td>
              <td>✗</td>
              <td>✓</td>
            </tr>
            <tr>
              <td>Analytics</td>
              <td>✗</td>
              <td>Basic</td>
              <td>Advanced</td>
            </tr>
            <tr>
              <td>Price</td>
              <td>Free</td>
              <td>{getPlanPrice('nursery')}/{billingCycle === 'monthly' ? 'mo' : 'yr'}</td>
              <td>{getPlanPrice('golden')}/{billingCycle === 'monthly' ? 'mo' : 'yr'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-item">
          <h3>How do I upgrade my plan?</h3>
          <p>Simply select the plan you want from the options above and follow the prompts. Your changes will take effect immediately.</p>
        </div>
        <div className="faq-item">
          <h3>Can I cancel my plan anytime?</h3>
          <p>Yes, you can downgrade to the Free plan at any time from your account settings.</p>
        </div>
        <div className="faq-item">
          <h3>What payment methods do you accept?</h3>
          <p>We accept all major credit cards, debit cards, UPI, and net banking.</p>
        </div>
        <div className="faq-item">
          <h3>Is there a discount for yearly billing?</h3>
          <p>Yes! Choosing yearly billing gives you 2 months free compared to monthly billing.</p>
        </div>
        <div className="faq-item">
          <h3>What happens when my plan expires?</h3>
          <p>Your account will automatically revert to the Free plan if you don't renew. You'll receive reminders before expiry.</p>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to grow your nursery with Ankurit?</h2>
        <button className="cta-button">Get Started with Ankurit</button>
      </div>

      {showPopup && (
        <div className="purchase-popup">
          <div className="popup-content">
            <button className="close-popup" onClick={closePopup}>×</button>
            <div className="popup-icon">🎉</div>
            <h3>Plan Activated Successfully!</h3>
            <p>
              You've successfully subscribed to the <strong>{selectedPlan}</strong> plan 
              with <strong>{getPlanDuration()}</strong> billing.
            </p>
            <div className="plan-details">
              <p><strong>Plan:</strong> {selectedPlan}</p>
              <p><strong>Price:</strong> {getPlanPrice(selectedPlan)}/{billingCycle === 'monthly' ? 'month' : 'year'}</p>
              <p><strong>Billing Cycle:</strong> {billingCycle}</p>
              <p><strong>Activation Date:</strong> {formatDate(new Date())}</p>
              <p><strong>Expiry Date:</strong> {formatDate(planExpiry)}</p>
            </div>
            <button className="popup-button" onClick={closePopup}>
              Start Using Ankurit
            </button>
          </div>
          <div className="popup-overlay" onClick={closePopup}></div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;