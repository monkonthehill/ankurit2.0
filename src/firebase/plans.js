// firebase/plans.js
import { db, updateDoc, doc, serverTimestamp } from './firebase';

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    duration: 15, // in days
    listableProducts: 3,
    benefits: [
      "List up to 3 products",
      "Basic marketplace visibility",
      "Valid for 15 days",
      "Access to community support"
    ]
  },
  basic: {
    id: "basic",
    name: "Basic – ₹15",
    price: 15,
    duration: 15,
    listableProducts: 10,
    benefits: [
      "List up to 10 products",
      "Improved profile visibility",
      "15-day access period",
      "Standard support included"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro – ₹99",
    price: 99,
    duration: 30,
    listableProducts: 50,
    benefits: [
      "List up to 50 products",
      "Priority placement in search results",
      "Monthly subscription",
      "Email and live chat support"
    ]
  },
  golden: {
    id: "golden",
    name: "Golden Farmer – ₹200",
    price: 200,
    duration: 100, // Can adjust this to 30 if 100 is a placeholder
    listableProducts: Infinity,
    benefits: [
      "Unlimited product listings",
      "Profile and product advertisement across platform",
      "High-priority search placement",
      "Exclusive 'Golden Farmer' profile badge",
      "24/7 priority customer support"
    ]
  }
};


export const updateUserPlan = async (userId, planId) => {
  try {
    const plan = PLANS[planId];
    if (!plan) throw new Error("Invalid plan ID");

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      plan: planId,
      planData: {
        ...plan,
        subscribedAt: serverTimestamp(),
        expiresAt: new Date(new Date().getTime() + plan.duration * 24 * 60 * 60 * 1000)
      }
    });
    return true;
  } catch (error) {
    console.error("Error updating user plan:", error);
    throw error;
  }
};

export const getAvailablePlans = () => {
  return Object.values(PLANS);
};