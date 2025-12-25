import express from 'express';
const router = express.Router();
import { 
  indiaStatesData, 
  getStateByCode, 
  getStatesByType, 
  getAllStates, 
  getAllUnionTerritories,
  searchStatesByName,
  getTrafficHotspotsByState,
  getAllTrafficHotspots,
  getStatesInBounds
} from '../data/indiaStatesData.js';

// Get all states and union territories
router.get('/', (req, res) => {
  try {
    const { type, search, bounds } = req.query;
    
    let result = indiaStatesData;
    
    // Filter by type if specified
    if (type) {
      const filteredStates = getStatesByType(type);
      result = Object.fromEntries(filteredStates);
    }
    
    // Search functionality
    if (search) {
      const searchResults = searchStatesByName(search);
      result = Object.fromEntries(searchResults);
    }
    
    // Filter by geographical bounds
    if (bounds) {
      try {
        const boundsObj = JSON.parse(bounds);
        const statesInBounds = getStatesInBounds(boundsObj);
        result = Object.fromEntries(statesInBounds);
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid bounds format. Expected JSON with north, south, east, west properties' 
        });
      }
    }
    
    res.json({
      success: true,
      count: Object.keys(result).length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch states data',
      message: error.message 
    });
  }
});

// Get all states only
router.get('/states', (req, res) => {
  try {
    const states = getAllStates();
    res.json({
      success: true,
      count: states.length,
      data: Object.fromEntries(states)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch states',
      message: error.message 
    });
  }
});

// Get all union territories only
router.get('/union-territories', (req, res) => {
  try {
    const unionTerritories = getAllUnionTerritories();
    res.json({
      success: true,
      count: unionTerritories.length,
      data: Object.fromEntries(unionTerritories)
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch union territories',
      message: error.message 
    });
  }
});

// Get state by name or code
router.get('/:identifier', (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by name first
    let stateData = indiaStatesData[identifier];
    let stateName = identifier;
    
    // If not found by name, try by code
    if (!stateData) {
      const stateByCode = getStateByCode(identifier.toUpperCase());
      if (stateByCode) {
        [stateName, stateData] = stateByCode;
      }
    }
    
    if (!stateData) {
      return res.status(404).json({ 
        success: false, 
        error: 'State or Union Territory not found',
        identifier: identifier
      });
    }
    
    res.json({
      success: true,
      name: stateName,
      data: stateData
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch state data',
      message: error.message 
    });
  }
});

// Get major cities for a specific state
router.get('/:identifier/cities', (req, res) => {
  try {
    const { identifier } = req.params;
    const { limit, minPopulation } = req.query;
    
    // Find state data
    let stateData = indiaStatesData[identifier];
    let stateName = identifier;
    
    if (!stateData) {
      const stateByCode = getStateByCode(identifier.toUpperCase());
      if (stateByCode) {
        [stateName, stateData] = stateByCode;
      }
    }
    
    if (!stateData) {
      return res.status(404).json({ 
        success: false, 
        error: 'State or Union Territory not found' 
      });
    }
    
    let cities = stateData.majorCities;
    
    // Filter by minimum population if specified
    if (minPopulation) {
      cities = cities.filter(city => city.population >= parseInt(minPopulation));
    }
    
    // Limit results if specified
    if (limit) {
      cities = cities.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      state: stateName,
      count: cities.length,
      data: cities
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch cities data',
      message: error.message 
    });
  }
});

// Get traffic hotspots for a specific state
router.get('/:identifier/traffic-hotspots', (req, res) => {
  try {
    const { identifier } = req.params;
    const { severity, type } = req.query;
    
    // Find state data
    let stateData = indiaStatesData[identifier];
    let stateName = identifier;
    
    if (!stateData) {
      const stateByCode = getStateByCode(identifier.toUpperCase());
      if (stateByCode) {
        [stateName, stateData] = stateByCode;
      }
    }
    
    if (!stateData) {
      return res.status(404).json({ 
        success: false, 
        error: 'State or Union Territory not found' 
      });
    }
    
    let hotspots = stateData.trafficHotspots;
    
    // Filter by severity if specified
    if (severity) {
      hotspots = hotspots.filter(hotspot => 
        hotspot.severity.toLowerCase() === severity.toLowerCase()
      );
    }
    
    // Filter by type if specified
    if (type) {
      hotspots = hotspots.filter(hotspot => 
        hotspot.type.toLowerCase() === type.toLowerCase()
      );
    }
    
    res.json({
      success: true,
      state: stateName,
      count: hotspots.length,
      data: hotspots
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch traffic hotspots',
      message: error.message 
    });
  }
});

// Get all traffic hotspots across India
router.get('/traffic-hotspots/all', (req, res) => {
  try {
    const { severity, type, state } = req.query;
    
    let hotspots = getAllTrafficHotspots();
    
    // Filter by severity if specified
    if (severity) {
      hotspots = hotspots.filter(hotspot => 
        hotspot.severity.toLowerCase() === severity.toLowerCase()
      );
    }
    
    // Filter by type if specified
    if (type) {
      hotspots = hotspots.filter(hotspot => 
        hotspot.type.toLowerCase() === type.toLowerCase()
      );
    }
    
    // Filter by state if specified
    if (state) {
      hotspots = hotspots.filter(hotspot => 
        hotspot.state.toLowerCase().includes(state.toLowerCase()) ||
        hotspot.stateCode.toLowerCase() === state.toLowerCase()
      );
    }
    
    res.json({
      success: true,
      count: hotspots.length,
      data: hotspots
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch all traffic hotspots',
      message: error.message 
    });
  }
});

// Search states and cities
router.get('/search/:term', (req, res) => {
  try {
    const { term } = req.params;
    const { includeStates = true, includeCities = true } = req.query;
    
    const results = {
      states: [],
      cities: []
    };
    
    if (includeStates === 'true') {
      const stateResults = searchStatesByName(term);
      results.states = stateResults.map(([name, data]) => ({
        name,
        code: data.code,
        capital: data.capital,
        type: data.type,
        coordinates: data.coordinates
      }));
    }
    
    if (includeCities === 'true') {
      const searchTerm = term.toLowerCase();
      Object.entries(indiaStatesData).forEach(([stateName, stateData]) => {
        const matchingCities = stateData.majorCities.filter(city =>
          city.name.toLowerCase().includes(searchTerm)
        );
        
        matchingCities.forEach(city => {
          results.cities.push({
            ...city,
            state: stateName,
            stateCode: stateData.code
          });
        });
      });
    }
    
    res.json({
      success: true,
      searchTerm: term,
      totalResults: results.states.length + results.cities.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Search failed',
      message: error.message 
    });
  }
});

// Get statistics about Indian states
router.get('/stats/overview', (req, res) => {
  try {
    const states = getAllStates();
    const unionTerritories = getAllUnionTerritories();
    const allHotspots = getAllTrafficHotspots();
    
    // Calculate total population and area
    let totalPopulation = 0;
    let totalArea = 0;
    let totalCities = 0;
    
    Object.values(indiaStatesData).forEach(state => {
      totalPopulation += state.population;
      totalArea += state.area;
      totalCities += state.majorCities.length;
    });
    
    // Traffic hotspot statistics
    const hotspotStats = {
      total: allHotspots.length,
      bySeverity: {
        HIGH: allHotspots.filter(h => h.severity === 'HIGH').length,
        MEDIUM: allHotspots.filter(h => h.severity === 'MEDIUM').length,
        LOW: allHotspots.filter(h => h.severity === 'LOW').length
      },
      byType: {}
    };
    
    // Count hotspots by type
    allHotspots.forEach(hotspot => {
      hotspotStats.byType[hotspot.type] = (hotspotStats.byType[hotspot.type] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: {
        totalStates: states.length,
        totalUnionTerritories: unionTerritories.length,
        totalPopulation,
        totalArea,
        totalMajorCities: totalCities,
        trafficHotspots: hotspotStats,
        largestStateByArea: Object.entries(indiaStatesData)
          .reduce((max, [name, data]) => data.area > max.area ? { name, area: data.area } : max, { area: 0 }),
        mostPopulousState: Object.entries(indiaStatesData)
          .reduce((max, [name, data]) => data.population > max.population ? { name, population: data.population } : max, { population: 0 })
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate statistics',
      message: error.message 
    });
  }
});

export default router;