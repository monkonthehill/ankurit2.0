// src/services/productService.js
import { getDatabase, ref, push, set, remove, query, orderByChild, equalTo, get } from "firebase/database";

const db = getDatabase();

export const addProduct = async (productData, userId) => {
  try {
    const productsRef = ref(db, 'products');
    const newProductRef = push(productsRef);
    
    const productWithMetadata = {
      ...productData,
      sellerId: userId,
      createdAt: Date.now()
    };
    
    await set(newProductRef, productWithMetadata);
    return { id: newProductRef.key, ...productWithMetadata };
  } catch (error) {
    console.error("Error adding product: ", error);
    throw error;
  }
};

export const deleteProduct = async (productId, userId) => {
  try {
    const productRef = ref(db, `products/${productId}`);
    const snapshot = await get(productRef);
    
    if (!snapshot.exists()) {
      throw new Error("Product not found");
    }
    
    const productData = snapshot.val();
    
    if (productData.sellerId !== userId) {
      throw new Error("You can only delete your own products");
    }
    
    await remove(productRef);
  } catch (error) {
    console.error("Error deleting product: ", error);
    throw error;
  }
};

export const fetchProducts = async (filters = {}) => {
  try {
    let productsQuery = ref(db, 'products');
    
    // Apply filters
    if (filters.sellerId) {
      productsQuery = query(productsQuery, orderByChild('sellerId'), equalTo(filters.sellerId));
    }
    
    const snapshot = await get(productsQuery);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const products = [];
    snapshot.forEach((childSnapshot) => {
      products.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // Apply additional filters that can't be done in the query
    let filteredProducts = [...products];
    
    if (filters.minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice);
    }
    
    if (filters.maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice);
    }
    
    if (filters.location) {
      filteredProducts = filteredProducts.filter(p => 
        p.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    if (filters.searchTerm) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    
    return filteredProducts;
  } catch (error) {
    console.error("Error fetching products: ", error);
    throw error;
  }
};