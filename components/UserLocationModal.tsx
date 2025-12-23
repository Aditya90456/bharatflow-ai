import React, { useState, useEffect } from 'react';
import { UserLocation, VehicleType } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { RealGpsTracker } from './RealGpsTracker';
import { realGpsService } from '../services/realGpsService';
import { 
  MapPinIcon, 
  UserIcon, 
  TruckIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface UserLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, location: UserLocation, vehicleType: VehicleType) => void;
  currentCity: string;
}

export const UserLocationModal: React.FC<UserLocationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentCity
}) => {
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [locationMethod, setLocationMethod] = useState<'gps' | 'manual' | 'random'>('gps');
  const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);

  // City center coordinates for fallback
  const cityCoordinates = {
    'Bangalore': { lat: 12.9716, lng: 77.5946 },
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Delhi': { lat: 28.6139, lng: 77.2090 },
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Hyderabad': { lat: 17.3850, lng: 78.4867 },
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Pune': { lat: 18.5204, lng: 73.8567 }
  };

  const vehicleIcons = {
    CAR: TruckIcon,
    AUTO: TruckIcon,
    BUS: TruckIcon,
    POLICE: TruckIcon
  };

  const vehicleLabels = {
    CAR: 'Car',
    AUTO: 'Auto Rickshaw',
    BUS: 'Bus',
    POLICE: 'Police Vehicle'
  };

  // Request GPS location
  const requestGPSLocation = () => {
    setGpsStatus('requesting');
    
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          id: 'gps-location-' + Date.now(),
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
          speed: position.coords.speed || undefined,
          heading: position.coords.heading || undefined,
          altitude: position.coords.altitude || undefined
        };
        
        setCurrentLocation(location);
        setGpsStatus('success');
      },
      (error) => {
        console.error('GPS Error:', error);
        setGpsStatus('error');
        
        // Fallback to city center
        const cityCoords = cityCoordinates[currentCity as keyof typeof cityCoordinates] || cityCoordinates['Bangalore'];
        const fallbackLocation: UserLocation = {
          id: 'fallback-location-' + Date.now(),
          lat: cityCoords.lat,
          lng: cityCoords.lng,
          accuracy: 1000, // Low accuracy for fallback
          timestamp: Date.now()
        };
        
        setCurrentLocation(fallbackLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Generate random location in current city
  const generateRandomLocation = () => {
    const cityCoords = cityCoordinates[currentCity as keyof typeof cityCoordinates] || cityCoordinates['Bangalore'];
    
    // Add some random offset within city bounds (roughly 10km radius)
    const offsetLat = (Math.random() - 0.5) * 0.1; // ~11km
    const offsetLng = (Math.random() - 0.5) * 0.1; // ~11km
    
    const location: UserLocation = {
      id: 'random-location-' + Date.now(),
      lat: cityCoords.lat + offsetLat,
      lng: cityCoords.lng + offsetLng,
      accuracy: Math.random() * 20 + 5, // 5-25 meters
      timestamp: Date.now(),
      speed: Math.random() * 60, // 0-60 km/h
      heading: Math.random() * 360
    };
    
    setCurrentLocation(location);
  };

  // Handle manual location input
  const handleManualLocation = () => {
    const lat = parseFloat(manualLocation.lat);
    const lng = parseFloat(manualLocation.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid latitude and longitude values');
      return;
    }
    
    const location: UserLocation = {
      id: 'manual-location-' + Date.now(),
      lat,
      lng,
      accuracy: 10, // Assume good accuracy for manual input
      timestamp: Date.now()
    };
    
    setCurrentLocation(location);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (!currentLocation) {
      alert('Please set your location');
      return;
    }
    
    onSubmit(name.trim(), currentLocation, vehicleType);
    onClose();
    
    // Reset form
    setName('');
    setVehicleType('CAR');
    setLocationMethod('gps');
    setManualLocation({ lat: '', lng: '' });
    setGpsStatus('idle');
    setCurrentLocation(null);
  };

  // Auto-request GPS on modal open
  useEffect(() => {
    if (isOpen && locationMethod === 'gps' && gpsStatus === 'idle') {
      requestGPSLocation();
    }
  }, [isOpen, locationMethod]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Your Location">
      <div className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <UserIcon className="w-4 h-4 inline mr-2" />
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Vehicle Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Vehicle Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(vehicleLabels) as VehicleType[]).map((type) => {
              const Icon = vehicleIcons[type];
              return (
                <button
                  key={type}
                  onClick={() => setVehicleType(type)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    vehicleType === type
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{vehicleLabels[type]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <MapPinIcon className="w-4 h-4 inline mr-2" />
            Location Method
          </label>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setLocationMethod('gps')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                locationMethod === 'gps'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <CpuChipIcon className="w-4 h-4 inline mr-1" />
              Real GPS
            </button>
            <button
              onClick={() => setLocationMethod('manual')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                locationMethod === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setLocationMethod('random')}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                locationMethod === 'random'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Random in {currentCity}
            </button>
          </div>

          {/* Real GPS Tracker */}
          {locationMethod === 'gps' && (
            <div className="space-y-3">
              <RealGpsTracker
                onLocationUpdate={(location) => {
                  setCurrentLocation(location);
                  setGpsStatus('success');
                }}
                onError={(error) => {
                  console.error('GPS Error:', error);
                  setGpsStatus('error');
                  
                  // Fallback to city center
                  const cityCoords = cityCoordinates[currentCity as keyof typeof cityCoordinates] || cityCoordinates['Bangalore'];
                  const fallbackLocation: UserLocation = {
                    id: 'fallback-location-' + Date.now(),
                    lat: cityCoords.lat,
                    lng: cityCoords.lng,
                    accuracy: 1000,
                    timestamp: Date.now()
                  };
                  
                  setCurrentLocation(fallbackLocation);
                }}
                autoStart={false}
                showDetails={true}
                className="w-full"
              />
            </div>
          )}

          {/* Manual Location Entry */}
          {locationMethod === 'manual' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={manualLocation.lat}
                    onChange={(e) => setManualLocation(prev => ({ ...prev, lat: e.target.value }))}
                    placeholder="12.9716"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={manualLocation.lng}
                    onChange={(e) => setManualLocation(prev => ({ ...prev, lng: e.target.value }))}
                    placeholder="77.5946"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <button
                onClick={handleManualLocation}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                Set Manual Location
              </button>
              
              {currentLocation && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="text-sm">
                    Location set: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Random Location */}
          {locationMethod === 'random' && (
            <div className="space-y-3">
              <button
                onClick={generateRandomLocation}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
              >
                <GlobeAltIcon className="w-4 h-4 inline mr-2" />
                Generate Random Location in {currentCity}
              </button>
              
              {currentLocation && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="text-sm">
                    Random location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !currentLocation}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
          >
            Add My Location
          </Button>
          <Button
            onClick={onClose}
            variant="secondary"
            className="px-6"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
};