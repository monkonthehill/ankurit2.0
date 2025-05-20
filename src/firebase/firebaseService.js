import { getDatabase, ref, query, orderByChild, get, limitToLast } from 'firebase/database';
import { app } from './firebase'; // Your Firebase config file

const db = getDatabase(app);

export const fetchProducts = async (filters = {}, page = 1, pageSize = 15) => {
  try {
    let productsRef = ref(db, 'products');
    
    // Apply filters if needed
    if (filters.category) {
      productsRef = query(productsRef, orderByChild('category'), equalTo(filters.category));
    }
    
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      const products = [];
      snapshot.forEach((childSnapshot) => {
        products.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });
      
      // Simple pagination (for production, use query-based pagination)
      const startIndex = (page - 1) * pageSize;
      const paginatedProducts = products.slice(startIndex, startIndex + pageSize);
      
      return {
        products: paginatedProducts,
        totalPages: Math.ceil(products.length / pageSize)
      };
    }
    return { products: [], totalPages: 0 };
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};