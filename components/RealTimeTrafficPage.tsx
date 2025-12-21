import React, { useState, useEffect } from 'react';
import { RealTimeTraffic } from './RealTimeTraffic';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { 
  GlobeAltIcon, 
  MapIcon, 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface RealTimeTrafficPageProps {
  onNavigate: (page: string) => void;
}

export const RealTimeTrafficPage: React.FC<RealTimeTrafficPageProps> = ({ onNavigate }) => {
  const [selectedCity, setSelectedCity] = useState('Bangalore');
  const [multiCityData, setMultiCityData] = useState<any>(null);
  const [isLoadingMultiCity, setIsLoadingMultiCity] = useState(false);

  const cities = [
    'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune'
  ];

  // Fetch multi-city data
  const fetchMultiCityData = async () => {
    setIsLoadingMultiCity(true);
    try {
      const response = await fetch('/api/traffic/realtime/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cities })
      });
      
      if (response.ok) {
        const data = await response.json();
        setMultiCityData(data);
      }
    } catch (error) {
      console.error('Failed to fetch multi-city data:', error);
    } finally {
      setIsLoadingMultiCity(false);
    }
  };

  useEffect(() => {
    fetchMultiCityData();
    const interval = setInterval(fetchMultiCityData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleTrafficUpdate = (data: any) => {
    // Update multi-city data when individual city updates
    if (multiCityData) {
      setMultiCityData((prev: any) => ({
        ...prev,
        [selectedCity]: data
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-saffron via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-saffron/30">
              <GlobeAltIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-tech text-white">
                Real-Time Traffic Intelligence
              </h1>
              <p className="text-gray-400">Live traffic data from multiple sources across India</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => onNavigate('DASHBOARD')}
              className="text-cyan-400 hover:text-cyan-300"
            >
              <MapIcon className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="ghost"
              onClick={() => onNavigate('LANDING')}
              className="text-gray-400 hover:text-white"
            >
              ← Back
            </Button>
          </div>
        </div>

        {/* City Selector */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-sm font-medium text-gray-400">Select City:</span>
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => (
              <Button
                key={city}
                variant={selectedCity === city ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCity(city)}
                className={selectedCity === city ? '' : 'text-gray-400 hover:text-white'}
              >
                {city}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Multi-City Overview */}
        <Card variant="cyber" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ChartBarIcon className="w-5 h-5 text-cyan-400" />
              Multi-City Traffic Overview
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMultiCityData}
              disabled={isLoadingMultiCity}
              className="text-cyan-400 hover:text-cyan-300"
            >
              <ArrowPathIcon className={`w-4 h-4 mr-1 ${isLoadingMultiCity ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </div>

          {multiCityData ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cities.map((city) => {
                const data = multiCityData[city];
                if (!data) return null;

                return (
                  <div
                    key={city}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedCity === city
                        ? 'border-cyan-400/50 bg-cyan-400/5'
                        : 'border-white/10 bg-surface/30 hover:border-white/20'
                    }`}
                    onClick={() => setSelectedCity(city)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-white">{city}</h3>
                      <div className={`px-2 py-1 rounded text-xs font-mono ${
                        data.congestionLevel >= 80 ? 'bg-red-500/20 text-red-400' :
                        data.congestionLevel >= 60 ? 'bg-orange-500/20 text-orange-400' :
                        data.congestionLevel >= 40 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {data.congestionLevel}%
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Speed:</span>
                        <span className="text-white">{data.currentSpeed} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Incidents:</span>
                        <span className={data.incidents?.length > 0 ? 'text-red-400' : 'text-green-400'}>
                          {data.incidents?.length || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Source:</span>
                        <span className="text-cyan-400 font-mono text-xs">
                          {data.source?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 w-full bg-gray-700 rounded-full h-1">
                      <div 
                        className={`h-1 rounded-full transition-all duration-500 ${
                          data.congestionLevel >= 80 ? 'bg-red-400' :
                          data.congestionLevel >= 60 ? 'bg-orange-400' :
                          data.congestionLevel >= 40 ? 'bg-yellow-400' : 'bg-green-400'
                        }`}
                        style={{ width: `${data.congestionLevel}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ArrowPathIcon className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
              <p className="text-gray-400">Loading multi-city traffic data...</p>
            </div>
          )}
        </Card>

        {/* Detailed View for Selected City */}
        <RealTimeTraffic
          city={selectedCity}
          onTrafficUpdate={handleTrafficUpdate}
          autoRefresh={true}
          refreshInterval={30000}
        />

        {/* API Information */}
        <Card variant="cyber" className="p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
            Data Sources & API Information
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-3">Supported Traffic APIs</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-gray-300">TomTom Traffic API</span>
                  <span className="text-xs text-gray-500">(Primary)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                  <span className="text-gray-300">Mapbox Traffic API</span>
                  <span className="text-xs text-gray-500">(Secondary)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-gray-300">HERE Traffic API</span>
                  <span className="text-xs text-gray-500">(Tertiary)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-gray-300">Simulated Data</span>
                  <span className="text-xs text-gray-500">(Fallback)</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-3">Features</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-cyan-400" />
                  <span>Real-time traffic speed and congestion</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                  <span>Live incident detection and reporting</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-4 h-4 text-green-400" />
                  <span>Historical traffic pattern analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapIcon className="w-4 h-4 text-purple-400" />
                  <span>Multi-city traffic monitoring</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-yellow-300 text-sm">
              <strong>Note:</strong> To use real traffic APIs, add your API keys to the backend .env.local file:
              TOMTOM_API_KEY, MAPBOX_API_KEY, HERE_API_KEY, or GOOGLE_MAPS_API_KEY.
              Without API keys, the system will use intelligent simulated data based on time patterns.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};