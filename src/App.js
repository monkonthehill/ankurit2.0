import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Homepage from './pages/Homepage';

import './App.css';

function App() {
  return (
    <Router>
      <Navbar /> {/* Always visible, on all routes */}

      <Routes>
        <Route path="/" element={<Homepage />} />
        {/* Add more routes here */}
      </Routes>
    </Router>
  );
}

export default App;
