import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { StatusIndicator } from './ui/StatusIndicator';
import { AnimatedCounter } from './ui/AnimatedCounter';
import { StatusBadge } from './ui/StatusBadge';
import { AiSearchBar } from './enhanced/AiSearchBar';
import { NotificationSystem } from './enhanced/NotificationSystem';
import { EnhancedStatsCard } from './enhanced/EnhancedStatsCard';
import { cn } from './utils/cn';

interface TrafficJam {
  id: string;
  location: string;
  severity: 'LIGHT' | 'MODERATE' | 'HEAVY' | 'SEVERE';
  estimatedDuration: number;
  affectedVehicles: number;
  cause: string;
  recommendation: string;
  confidence: number;
}

interface TrafficStats {
  totalVehicles: number;
  avgSpeed: number;
  congestionLevel: number;
  activeIncidents: number;
  jamsDetected: number;
  aiAnalysisStatus: 'active' | 'inactive' | 'error';
}

interface LLMAnalysis {
  jamDetected: boolean;
  severity: string;
  confidence: number;
  analysis: string;
  detectedJams: TrafficJam[];
  predictions: {
    nextHourTrend: string;
    estimatedClearTime: number;
    alternativeRoutes: string[];
  };
}

const ModernDashboard: React.FC = () => {
  const [trafficStats, setTrafficStats] = useState<TrafficStats>({
    totalVehicles: 0,
    avgSpeed: 0,
    congestionLevel: 0,
    activeIncidents: 0,
    jamsDetected: 0,
    aiAnalysisStatus: 'inactive'
  });

  const [llmAnalysis, setLlmAnalysis] = useState<LLMAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Bangalore');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch traffic data and perform LLM analysis
  const performTrafficAnalysis = useCallback(async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      // Simulate fetching traffic data
      const trafficData = {
        congestionLevel: Math.floor(Math.random() * 100),
        avgSpeed: Math.floor(Math.random() * 60) + 10,
        incidents: Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => ({
          id: `incident-${i}`,
          type: 'accident',
          severity: 'medium'
        }))
      };

      // Simulate GPS data
      const gpsData = Array.from({ length: Math.floor(Math.random() * 50) + 20 }, (_, i) => ({
        id: `vehicle-${i}`,
        lat: 12.9716 + (Math.random() - 0.5) * 0.1,
        lng: 77.5946 + (Math.random() - 0.5) * 0.1,
        speed: Math.floor(Math.random() * 80),
        timestamp: Date.now()
      }));

      // Call LLM jam detection service
      const response = await fetch('/api/llm/detect-jams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: selectedCity,
          trafficData,
          gpsData
        })
      });

      if (response.ok) {
        const analysis = await response.json();
        setLlmAnalysis(analysis);
        
        // Update traffic stats
        setTrafficStats(prev => ({
          ...prev,
          totalVehicles: gpsData.length,
          avgSpeed: trafficData.avgSpeed,
          congestionLevel: trafficData.congestionLevel,
          activeIncidents: trafficData.incidents.length,
          jamsDetected: analysis.detectedJams.length,
          aiAnalysisStatus: 'active'
        }));

        // Add notifications for new jams
        if (analysis.detectedJams.length > 0) {
          const newNotifications = analysis.detectedJams.map(jam => ({
            id: jam.id,
            type: 'warning',
            title: `${jam.severity} Traffic Jam Detected`,
            message: `${jam.location}: ${jam.cause}`,
            timestamp: Date.now(),
            action: {
              label: 'View Details',
              onClick: () => handleJamDetails(jam.id)
            }
          }));
          setNotifications(prev => [...newNotifications, ...prev].slice(0, 10));
        }
      } else {
        setTrafficStats(prev => ({ ...prev, aiAnalysisStatus: 'error' }));
      }
    } catch (error) {
      console.error('Traffic analysis failed:', error);
      setTrafficStats(prev => ({ ...prev, aiAnalysisStatus: 'error' }));
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedCity, isAnalyzing]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(performTrafficAnalysis, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, performTrafficAnalysis]);

  // Initial load
  useEffect(() => {
    performTrafficAnalysis();
  }, [selectedCity]);

  const handleJamDetails = (jamId: string) => {
    const jam = llmAnalysis?.detectedJams.find(j => j.id === jamId);
    if (jam) {
      alert(`Jam Details:\nLocation: ${jam.location}\nSeverity: ${jam.severity}\nCause: ${jam.cause}\nRecommendation: ${jam.recommendation}`);
    }
  };

  const handleSearchQuery = async (query: string) => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          context: {
            currentCity: selectedCity,
            userRole: 'traffic_controller',
            activeIncidents: trafficStats.activeIncidents,
            currentTrafficStats: trafficStats
          }
        })
      });

      if (response.ok) {
        const results = await response.json();
        console.log('Search results:', results);
        // Handle search results display
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'SEVERE': return 'text-red-600 bg-red-100';
      case 'HEAVY': return 'text-orange-600 bg-orange-100';
      case 'MODERATE': return 'text-yellow-600 bg-yellow-100';
      case 'LIGHT': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'WORSENING': return '📈';
      case 'IMPROVING': return '📉';
      case 'STABLE_HIGH': return '⚠️';
      case 'STABLE_MODERATE': return '⚡';
      default: return '✅';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">BharatFlow AI Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time traffic management powered by AI</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Bangalore">Bangalore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Chennai">Chennai</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
            
            <Button
              onClick={performTrafficAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  🔄 Refresh Analysis
                </>
              )}
            </Button>
            
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              {autoRefresh ? '⏸️ Pause' : '▶️ Auto'}
            </Button>
          </div>
        </div>

        {/* AI Search Bar */}
        <AiSearchBar
          onSearch={handleSearchQuery}
          placeholder={`Search traffic data for ${selectedCity}...`}
          suggestions={[
            'Show me traffic jams in the city',
            'Find the most congested intersections',
            'What are the current incidents?',
            'Predict traffic for next hour'
          ]}
        />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedStatsCard
            title="Active Vehicles"
            value={<AnimatedCounter value={trafficStats.totalVehicles} />}
            icon="🚗"
            trend={{ value: 12, isPositive: true }}
            subtitle="Currently tracked"
          />
          
          <EnhancedStatsCard
            title="Average Speed"
            value={<><AnimatedCounter value={trafficStats.avgSpeed} /> km/h</>}
            icon="⚡"
            trend={{ value: 8, isPositive: trafficStats.avgSpeed > 30 }}
            subtitle="City-wide average"
          />
          
          <EnhancedStatsCard
            title="Congestion Level"
            value={<><AnimatedCounter value={trafficStats.congestionLevel} />%</>}
            icon="🚦"
            trend={{ value: 5, isPositive: trafficStats.congestionLevel < 50 }}
            subtitle="Real-time analysis"
          />
          
          <EnhancedStatsCard
            title="AI Analysis"
            value={
              <StatusIndicator 
                status={trafficStats.aiAnalysisStatus}
                labels={{ active: 'Active', inactive: 'Inactive', error: 'Error' }}
              />
            }
            icon="🤖"
            subtitle="LLM jam detection"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Traffic Jams Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    AI-Detected Traffic Jams
                  </h2>
                  <StatusBadge 
                    status={llmAnalysis?.jamDetected ? 'warning' : 'success'}
                    text={`${llmAnalysis?.detectedJams.length || 0} Active`}
                  />
                </div>

                {llmAnalysis?.detectedJams.length ? (
                  <div className="space-y-4">
                    {llmAnalysis.detectedJams.map((jam) => (
                      <div
                        key={jam.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleJamDetails(jam.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={cn(
                                'px-2 py-1 rounded-full text-xs font-medium',
                                getSeverityColor(jam.severity)
                              )}>
                                {jam.severity}
                              </span>
                              <span className="text-sm text-gray-500">
                                Confidence: {Math.round(jam.confidence * 100)}%
                              </span>
                            </div>
                            <h3 className="font-medium text-gray-900 mb-1">
                              {jam.location}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {jam.cause}
                            </p>
                            <p className="text-sm text-blue-600">
                              💡 {jam.recommendation}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>🚗 {jam.affectedVehicles} vehicles</div>
                            <div>⏱️ {jam.estimatedDuration} min</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Traffic Jams Detected
                    </h3>
                    <p className="text-gray-600">
                      AI analysis shows smooth traffic flow across the city
                    </p>
                  </div>
                )}

                {/* AI Analysis Summary */}
                {llmAnalysis && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">
                      🤖 AI Analysis Summary
                    </h4>
                    <p className="text-blue-800 text-sm mb-3">
                      {llmAnalysis.analysis}
                    </p>
                    {llmAnalysis.predictions && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          {getTrendIcon(llmAnalysis.predictions.nextHourTrend)}
                          <span className="text-blue-700">
                            Next Hour: {llmAnalysis.predictions.nextHourTrend.replace('_', ' ')}
                          </span>
                        </span>
                        {llmAnalysis.predictions.estimatedClearTime > 0 && (
                          <span className="text-blue-700">
                            ⏰ Clear in: {llmAnalysis.predictions.estimatedClearTime} min
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Notifications Panel */}
          <div>
            <NotificationSystem
              notifications={notifications}
              onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
              onClearAll={() => setNotifications([])}
            />
          </div>
        </div>

        {/* Alternative Routes */}
        {llmAnalysis?.predictions?.alternativeRoutes?.length > 0 && (
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🛣️ Recommended Alternative Routes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {llmAnalysis.predictions.alternativeRoutes.map((route, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-600">🗺️</span>
                      <span className="font-medium">{route}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Alternative route to avoid congested areas
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ModernDashboard;