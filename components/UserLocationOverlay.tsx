import React from 'react';
import { SimulatedUser, Coordinates } from '../types';
import { 
  UserIcon, 
  TruckIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface UserLocationOverlayProps {
  users: SimulatedUser[];
  canvasWidth: number;
  canvasHeight: number;
  onUserSelect?: (userId: string) => void;
  selectedUserId?: string | null;
  latLngToCanvas: (lat: number, lng: number) => Coordinates;
}

export const UserLocationOverlay: React.FC<UserLocationOverlayProps> = ({
  users,
  canvasWidth,
  canvasHeight,
  onUserSelect,
  selectedUserId,
  latLngToCanvas
}) => {
  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'CAR':
      case 'POLICE':
        return TruckIcon;
      case 'AUTO':
      case 'BUS':
        return TruckIcon;
      default:
        return TruckIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MOVING':
        return 'text-green-400 bg-green-400/20 border-green-400/50';
      case 'STOPPED':
        return 'text-red-400 bg-red-400/20 border-red-400/50';
      case 'WAITING':
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      case 'ARRIVED':
        return 'text-blue-400 bg-blue-400/20 border-blue-400/50';
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return '0 km/h';
    return `${Math.round(speed)} km/h`;
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {users.map((user) => {
        const canvasPos = latLngToCanvas(user.location.lat, user.location.lng);
        
        // Skip if position is outside canvas
        if (canvasPos.x < 0 || canvasPos.x > canvasWidth || canvasPos.y < 0 || canvasPos.y > canvasHeight) {
          return null;
        }

        const VehicleIcon = getVehicleIcon(user.vehicleType);
        const statusColor = getStatusColor(user.status);
        const isSelected = selectedUserId === user.id;

        return (
          <div
            key={user.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={{
              left: canvasPos.x,
              top: canvasPos.y,
            }}
          >
            {/* User Marker */}
            <div
              onClick={() => onUserSelect?.(user.id)}
              className={`relative cursor-pointer transition-all duration-200 ${
                isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-40'
              }`}
            >
              {/* Accuracy Circle */}
              <div
                className="absolute rounded-full border border-blue-300/30 bg-blue-300/10"
                style={{
                  width: Math.max(20, Math.min(100, user.location.accuracy / 2)),
                  height: Math.max(20, Math.min(100, user.location.accuracy / 2)),
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />

              {/* Main User Icon */}
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg transition-all ${statusColor}`}>
                <VehicleIcon className="w-5 h-5" />
              </div>

              {/* Status Indicator */}
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-gray-800 ${
                user.status === 'MOVING' ? 'bg-green-400 animate-pulse' :
                user.status === 'STOPPED' ? 'bg-red-400' :
                user.status === 'WAITING' ? 'bg-yellow-400 animate-pulse' :
                'bg-blue-400'
              }`} />

              {/* Direction Indicator (for moving users) */}
              {user.status === 'MOVING' && user.location.heading !== undefined && (
                <div
                  className="absolute w-6 h-1 bg-green-400 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'left center',
                    transform: `translate(-50%, -50%) rotate(${user.location.heading}deg)`,
                  }}
                />
              )}
            </div>

            {/* User Info Popup */}
            {isSelected && (
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm border border-gray-600 rounded-lg p-3 min-w-64 shadow-xl z-50">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-white">{user.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                    {user.status}
                  </span>
                </div>

                {/* Location Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPinIcon className="w-4 h-4" />
                    <span>
                      {user.location.lat.toFixed(4)}, {user.location.lng.toFixed(4)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <VehicleIcon className="w-4 h-4" />
                    <span>{user.vehicleType}</span>
                    {user.location.speed !== undefined && (
                      <span className="text-green-400">• {formatSpeed(user.location.speed)}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-gray-300">
                    <ClockIcon className="w-4 h-4" />
                    <span>Updated: {formatTime(user.location.timestamp)}</span>
                  </div>

                  {user.location.accuracy && (
                    <div className="text-xs text-gray-400">
                      Accuracy: ±{Math.round(user.location.accuracy)}m
                    </div>
                  )}
                </div>

                {/* Journey Info */}
                {user.journey && (
                  <div className="mt-3 pt-2 border-t border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">Journey</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Distance:</span>
                        <span className="text-white">{Math.round(user.journey.distanceRemaining)}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Speed:</span>
                        <span className="text-white">{formatSpeed(user.journey.currentSpeed)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">ETA:</span>
                        <span className="text-white">{formatTime(user.journey.estimatedArrival)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Route Visualization */}
                {user.route && user.route.length > 0 && (
                  <div className="mt-2 text-xs text-blue-400">
                    Route: {user.route.length} waypoints remaining
                  </div>
                )}
              </div>
            )}

            {/* Name Label */}
            {!isSelected && (
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white whitespace-nowrap">
                {user.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};