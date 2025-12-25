import express from 'express';
import realTrafficService from '../services/realTrafficService.js';

const router = express.Router();

// Get real-time traffic data for a specific location
router.get('/location', async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Missing required parameters: lat, lng' });
    }

    const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const trafficData = await realTrafficService.getTrafficByLocation(location, parseInt(radius));
    
    res.json(trafficData);
  } catch (error) {
    console.error('Get traffic by location error:', error);
    res.status(500).json({ error: 'Failed to fetch traffic data for location' });
  }
});

// Get traffic incidents in an area
router.get('/incidents', async (req, res) => {
  try {
    const { lat, lng, radius = 10000, severity } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Missing required parameters: lat, lng' });
    }

    const location = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const incidents = await realTrafficService.getTrafficIncidents(location, parseInt(radius), severity);
    
    res.json(incidents);
  } catch (error) {
    console.error('Get traffic incidents error:', error);
    res.status(500).json({ error: 'Failed to fetch traffic incidents' });
  }
});

// Get traffic service status
router.get('/status', async (req, res) => {
  try {
    const status = await realTrafficService.getServiceStatus();
    res.json(status);
  } catch (error) {
    console.error('Get traffic service status error:', error);
    res.status(500).json({ error: 'Failed to get traffic service status' });
  }
});

export default router;