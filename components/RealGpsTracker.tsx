import React, { useState, useEffect, useCallback } from 'react';
import { UserLocation } from '../types';
import { realGpsService, GpsError } from '../services/realGpsService';
import { 
  MapPinIcon, 
  SignalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

interface RealGpsTrackerProps {
  onLocationUpdate: (location: UserLocation) => void;
  onError?: (error: GpsError) => void;
  autoStart?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const RealGpsTracker: React.FC<RealGpsTrackerProps> = ({
  onLocationUpdate,
  onError,
  autoStart = false,
  showDetails = true,
  className = ''
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null);
  const [gpsError, setGpsError] = useState<GpsError | null>(null);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);

  // Handle location updates
  const handleLocationUpdate = useCallback((location: UserLocation) => {
    setCurrentLocation(location);
    setAccuracy(location.accuracy);
    setSpeed(location.speed || null);
    setGpsError(null);
    onLocationUpdate(location);
  }, [onLocationUpdate]);

  // Handle GPS errors
  const handleGpsError = useCallback((error: GpsError) => {
    setGpsError(error);
    setIsTracking(false);
    onError?.(error);
  }, [onError]);

  // Check permission status
  const checkPermission = useCallback(async () => {
    try {
      const permissionState = await realGpsService.requestPermission();
      setPermission(permissionState);
      return permissionState;
    } catch (error) {
      console.warn('Permission check failed:', error);
      return 'prompt';
    }
  }, []);

  // Start GPS tracking
  const startTracking = useCallback(async () => {
    try {
      // Check permission first
      const permissionState = await checkPermission();
      
      if (permissionState === 'denied') {
        setGpsError({
          code: 1,
          message: 'Location permission denied',
          type: 'PERMISSION_DENIED'
        });
        return;
      }

      // Get initial position
      const initialLocation = await realGpsService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
      
      handleLocationUpdate(initialLocation);

      // Start continuous tracking
      realGpsService.startWatching({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      });

      setIsTracking(true);
      setGpsError(null);
    } catch (error) {
      handleGpsError(error as GpsError);
    }
  }, [checkPermission, handleLocationUpdate, handleGpsError]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    realGpsService.stopWatching();
    setIsTracking(false);
  }, []);

  // Toggle tracking
  const toggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  // Setup GPS service listeners
  useEffect(() => {
    const unsubscribeLocation = realGpsService.onLocationUpdate(handleLocationUpdate);
    const unsubscribeError = realGpsService.onError(handleGpsError);

    return () => {
      unsubscribeLocation();
      unsubscribeError();
    };
  }, [handleLocationUpdate, handleGpsError]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      startTracking();
    }

    return () => {
      if (autoStart) {
        stopTracking();
      }
    };
  }, [autoStart, startTracking, stopTracking]);

  // Check initial permission
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Format location for display
  const formatLocation = (location: UserLocation) => {
    return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
  };

  // Format time since last update
  const formatTimeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Get status color based on GPS state
  const getStatusColor = () => {
    if (gpsError) return 'text-red-400 bg-red-400/20 border-red-400/50';
    if (isTracking) return 'text-green-400 bg-green-400/20 border-green-400/50';
    return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
  };

  // Get accuracy color
  const getAccuracyColor = (acc: number) => {
    if (acc <= 5) return 'text-green-400';
    if (acc <= 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`bg-gray-900/95 backdrop-blur-sm border border-gray-600 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPinIcon className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-white">Real GPS Tracker</span>
        </div>
        
        <button
          onClick={toggleTracking}
          disabled={permission === 'denied'}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
            isTracking
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600 disabled:cursor-not-allowed'
          }`}
        >
          {isTracking ? 'Stop' : 'Start'} GPS
        </button>
      </div>

      {/* Status Indicator */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()} mb-3`}>
        {gpsError ? (
          <ExclamationTriangleIcon className="w-4 h-4" />
        ) : isTracking ? (
          <SignalIcon className="w-4 h-4 animate-pulse" />
        ) : (
          <GlobeAltIcon className="w-4 h-4" />
        )}
        
        <span className="text-sm font-medium">
          {gpsError ? `Error: ${gpsError.message}` :
           isTracking ? 'GPS Active' :
           'GPS Inactive'}
        </span>
      </div>

      {/* Permission Status */}
      {permission && (
        <div className="mb-3">
          <div className={`flex items-center gap-2 text-sm ${
            permission === 'granted' ? 'text-green-400' :
            permission === 'denied' ? 'text-red-400' :
            'text-yellow-400'
          }`}>
            {permission === 'granted' ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4" />
            )}
            <span>Permission: {permission}</span>
          </div>
        </div>
      )}

      {/* Location Details */}
      {showDetails && currentLocation && (
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400">Coordinates:</span>
              <div className="text-white font-mono text-xs">
                {formatLocation(currentLocation)}
              </div>
            </div>
            
            <div>
              <span className="text-gray-400">Accuracy:</span>
              <div className={`font-medium ${accuracy ? getAccuracyColor(accuracy) : 'text-gray-400'}`}>
                {accuracy ? `±${Math.round(accuracy)}m` : 'Unknown'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-gray-400">Speed:</span>
              <div className="text-white font-medium">
                {speed ? `${Math.round(speed)} km/h` : '0 km/h'}
              </div>
            </div>
            
            <div>
              <span className="text-gray-400">Last Update:</span>
              <div className="text-white font-medium flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {formatTimeSince(currentLocation.timestamp)}
              </div>
            </div>
          </div>

          {currentLocation.altitude && (
            <div>
              <span className="text-gray-400">Altitude:</span>
              <span className="text-white font-medium ml-2">
                {Math.round(currentLocation.altitude)}m
              </span>
            </div>
          )}

          {currentLocation.heading !== undefined && (
            <div>
              <span className="text-gray-400">Heading:</span>
              <span className="text-white font-medium ml-2">
                {Math.round(currentLocation.heading)}°
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Details */}
      {gpsError && (
        <div className="mt-3 p-2 bg-red-900/30 border border-red-600/30 rounded text-sm">
          <div className="text-red-400 font-medium">GPS Error</div>
          <div className="text-red-300">{gpsError.message}</div>
          {gpsError.type === 'PERMISSION_DENIED' && (
            <div className="text-red-200 text-xs mt-1">
              Please enable location permissions in your browser settings
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!isTracking && !gpsError && (
        <div className="mt-3 text-xs text-gray-400">
          Click "Start GPS" to begin real-time location tracking
        </div>
      )}
    </div>
  );
};