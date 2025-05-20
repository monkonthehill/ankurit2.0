import React from 'react';
import PropTypes from 'prop-types';
import { 
  Box, 
  Typography, 
  Divider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Checkbox,
  FormControlLabel,
  Collapse,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import './ProductFilter.css';

const categories = [
  'Fruits', 'Grains', 'Nuts & Dry Fruits', 'Oil & Oilseeds',
  'Pulses', 'Spices', 'Sweeteners', 'Vegetables', 'Others'
];

const locations = [
  'Gujarat', 'Maharashtra', 'Tamil Nadu', 'Uttar Pradesh',
  'Rajasthan', 'Madhya Pradesh', 'Delhi', 'Karnataka'
];

const ProductFilters = ({ filters, setFilters }) => {
  const [expandedSections, setExpandedSections] = React.useState({
    category: true,
    location: true,
    type: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: '',
      location: '',
      type: 'all',
      featured: false
    });
  };

  return (
    <Box className="filters-container">
      <Typography variant="h6" className="filters-header">
        Filters
      </Typography>
      <Divider className="filters-divider" />
      
      {/* Type Filter */}
      <Box className="filter-section">
        <Box 
          className="filter-section-header"
          onClick={() => toggleSection('type')}
        >
          <Typography variant="subtitle1">Type</Typography>
          {expandedSections.type ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
        <Collapse in={expandedSections.type}>
          <Box className="filter-options">
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.type === 'all'}
                  onChange={() => handleFilterChange('type', 'all')}
                />
              }
              label="All"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.type === 'seller'}
                  onChange={() => handleFilterChange('type', 'seller')}
                />
              }
              label="Sellers"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={filters.type === 'buyer'}
                  onChange={() => handleFilterChange('type', 'buyer')}
                />
              }
              label="Buyers"
            />
          </Box>
        </Collapse>
      </Box>
      
      {/* Category Filter */}
      <Box className="filter-section">
        <Box 
          className="filter-section-header"
          onClick={() => toggleSection('category')}
        >
          <Typography variant="subtitle1">Category</Typography>
          {expandedSections.category ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
        <Collapse in={expandedSections.category}>
          <Box className="filter-options">
            <FormControl fullWidth size="small">
              <InputLabel>Select Category</InputLabel>
              <Select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label="Select Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Collapse>
      </Box>
      
      {/* Location Filter */}
      <Box className="filter-section">
        <Box 
          className="filter-section-header"
          onClick={() => toggleSection('location')}
        >
          <Typography variant="subtitle1">Location</Typography>
          {expandedSections.location ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
        <Collapse in={expandedSections.location}>
          <Box className="filter-options">
            <FormControl fullWidth size="small">
              <InputLabel>Select Location</InputLabel>
              <Select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                label="Select Location"
              >
                <MenuItem value="">All Locations</MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location} value={location}>{location}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Collapse>
      </Box>
      
      {/* Featured Filter */}
      <Box className="filter-section">
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.checked)}
            />
          }
          label="Featured Only"
        />
      </Box>
      
      <Button
        variant="outlined"
        fullWidth
        onClick={resetFilters}
        className="reset-filters-btn"
      >
        Reset Filters
      </Button>
    </Box>
  );
};

ProductFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired
};

export default ProductFilters;