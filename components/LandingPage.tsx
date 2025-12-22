import React, { useState, useEffect, useRef } from 'react';
import { 
  GlobeAltIcon, ArrowRightIcon, CpuChipIcon, SparklesIcon, ServerStackIcon, 
  ShieldCheckIcon, SpeakerWaveIcon, SpeakerXMarkIcon, MapIcon, ChartBarIcon,
  BoltIcon, EyeIcon, CloudIcon, SignalIcon, PlayIcon, CameraIcon
} from '@heroicons/react/24/outline';
import { Navbar } from './Navbar';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const FeatureCard: React.FC<{ icon: React.FC<any>, title: string, description: string, step: string, delay?: number }> = ({ 
  icon: Icon, title, description, step, delay = 0 
}) => (
  <div className="relative pl-16 group" style={{ animationDelay: `${delay}ms` }}>
    <div className="absolute left-0 top-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-400/20 flex items-center justify-center backdrop-blur-sm group-hover:border-cyan-400/60 transition-all duration-500 group-hover:scale-110">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <Icon className="w-5 h-5 text-cyan-400 relative z-10 group-hover:scale-110 transition-transform duration-300" />
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-saffron to-orange-600 text-white flex items-center justify-center text-xs font-bold font-mono shadow-lg shadow-saffron/30">
        {step}
      </div>
    </div>
    <div className="space-y-3">
      <h3 className="text-xl font-bold font-tech mb-2 text-white group-hover:text-cyan-300 transition-colors duration-300">{title}</h3>
      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">{description}</p>
      <div className="w-12 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-[-20px] group-hover:translate-x-0"></div>
    </div>
  </div>
);

const InteractiveGlobe: React.FC<{ isQuietMode: boolean }> = ({ isQuietMode }) => {
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  
  const cities = [
    { name: 'Delhi', code: 'DEL', lat: 28.6, lng: 77.2, size: 8, traffic: 85, color: '#ef4444' },
    { name: 'Mumbai', code: 'MUM', lat: 19.0, lng: 72.8, size: 8, traffic: 92, color: '#f59e0b' },
    { name: 'Bangalore', code: 'BLR', lat: 12.9, lng: 77.6, size: 10, traffic: 78, color: '#22c55e' },
    { name: 'Kolkata', code: 'KOL', lat: 22.5, lng: 88.3, size: 6, traffic: 88, color: '#f59e0b' },
    { name: 'Chennai', code: 'CHE', lat: 13.0, lng: 80.2, size: 6, traffic: 82, color: '#f59e0b' },
    { name: 'Hyderabad', code: 'HYD', lat: 17.4, lng: 78.5, size: 7, traffic: 75, color: '#22c55e' },
    { name: 'Pune', code: 'PUN', lat: 18.5, lng: 73.9, size: 6, traffic: 80, color: '#f59e0b' },
  ];

  const getTrafficColor = (traffic: number) => {
    if (traffic > 85) return '#ef4444'; // Red
    if (traffic > 70) return '#f59e0b'; // Amber
    return '#22c55e'; // Green
  };

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center group">
      <style>{`
        .globe-container { 
          perspective: 1200px; 
          transform-style: preserve-3d;
        }
        .globe {
          width: 400px; height: 400px;
          transform-style: preserve-3d;
          animation: ${!isQuietMode ? 'rotate-globe 60s linear infinite' : 'none'};
          transition: transform 0.3s ease;
        }
        .globe:hover {
          animation-play-state: paused;
        }
        @keyframes rotate-globe { 
          from { transform: rotateY(0deg) rotateX(15deg); } 
          to { transform: rotateY(360deg) rotateX(15deg); } 
        }
        .globe-sphere {
          position: absolute; inset: 0;
          border-radius: 50%;
          background: 
            radial-gradient(circle at 30% 30%, rgba(6,182,212,0.6), transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(255,153,51,0.4), transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(34,197,94,0.3), transparent 70%);
          box-shadow: 
            inset 0 0 30px rgba(6,182,212,0.3),
            inset 0 0 60px rgba(0,0,0,0.4),
            0 0 80px rgba(6,182,212,0.2),
            0 0 120px rgba(6,182,212,0.1);
          border: 1px solid rgba(6,182,212,0.2);
        }
        .globe-point {
          position: absolute;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10;
        }
        .globe-point:hover {
          transform: translateX(-50%) translateY(-50%) translate3d(var(--x), var(--y), var(--z)) scale(1.5) !important;
          z-index: 20;
        }
        .city-tooltip {
          position: absolute;
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(6,182,212,0.3);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12px;
          color: white;
          pointer-events: none;
          z-index: 30;
          transform: translate(-50%, -120%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .city-tooltip.visible {
          opacity: 1;
        }
        .traffic-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid;
          animation: ${!isQuietMode ? 'pulse-ring 2s infinite' : 'none'};
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      
      <div className="globe-container">
        <div className="globe" ref={globeRef}>
          <div className="globe-sphere"></div>
          
          {/* Grid lines for more realistic globe effect */}
          <div className="absolute inset-0 rounded-full border border-cyan-400/10"></div>
          <div className="absolute inset-4 rounded-full border border-cyan-400/5"></div>
          <div className="absolute inset-8 rounded-full border border-cyan-400/5"></div>
          
          {cities.map((city, i) => {
            const phi = (90 - city.lat) * (Math.PI / 180);
            const theta = (city.lng + 180) * (Math.PI / 180);
            const x = -200 * Math.sin(phi) * Math.cos(theta);
            const y = 200 * Math.cos(phi);
            const z = 200 * Math.sin(phi) * Math.sin(theta);
            const isVisible = z > -100; // Only show cities on the visible side
            
            return (
              <div key={i} className="relative">
                <div 
                  className="globe-point" 
                  style={{
                    width: city.size, 
                    height: city.size,
                    left: '50%', 
                    top: '50%',
                    transform: `translateX(-50%) translateY(-50%) translate3d(${x}px, ${y}px, ${z}px)`,
                    background: getTrafficColor(city.traffic),
                    boxShadow: `0 0 ${city.size * 2}px ${getTrafficColor(city.traffic)}`,
                    opacity: isVisible ? 1 : 0.3,
                    animation: `${!isQuietMode ? `pulse-glow ${2 + Math.random()*2}s infinite` : 'none'}`
                  } as React.CSSProperties}
                  onMouseEnter={() => setHoveredCity(city.code)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  {/* Traffic intensity ring */}
                  <div 
                    className="traffic-ring"
                    style={{
                      width: city.size * 2,
                      height: city.size * 2,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      borderColor: getTrafficColor(city.traffic),
                      animationDelay: `${i * 0.5}s`
                    }}
                  />
                  
                  {/* City tooltip */}
                  <div className={`city-tooltip ${hoveredCity === city.code ? 'visible' : ''}`}>
                    <div className="font-bold text-cyan-400">{city.name}</div>
                    <div className="text-xs text-gray-300">Traffic: {city.traffic}%</div>
                    <div className="text-xs" style={{ color: getTrafficColor(city.traffic) }}>
                      {city.traffic > 85 ? 'Heavy' : city.traffic > 70 ? 'Moderate' : 'Light'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Globe controls */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button className="p-2 rounded-lg bg-black/50 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors">
          <EyeIcon className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-lg bg-black/50 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors">
          <PlayIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [isQuietMode, setIsQuietMode] = useState(false);
  const [currentStats, setCurrentStats] = useState({
    activeCities: 7,
    vehiclesTracked: 2847,
    avgSpeedImprovement: 34,
    co2Reduction: 28
  });

  // Simulate real-time stats updates
  useEffect(() => {
    if (isQuietMode) return;
    
    const interval = setInterval(() => {
      setCurrentStats(prev => ({
        activeCities: prev.activeCities,
        vehiclesTracked: prev.vehiclesTracked + Math.floor(Math.random() * 10) - 5,
        avgSpeedImprovement: Math.max(25, Math.min(45, prev.avgSpeedImprovement + (Math.random() - 0.5) * 2)),
        co2Reduction: Math.max(20, Math.min(35, prev.co2Reduction + (Math.random() - 0.5) * 1))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isQuietMode]);

  const StatCard: React.FC<{ 
    icon: React.FC<any>, 
    value: string | number, 
    label: string, 
    trend?: string,
    color?: string 
  }> = ({ icon: Icon, value, label, trend, color = 'cyan' }) => (
    <div className="relative group">
      <div className={`p-6 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-${color}-400/20 backdrop-blur-sm hover:border-${color}-400/60 transition-all duration-500 hover:scale-105`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
          {trend && (
            <div className={`text-xs px-2 py-1 rounded-full bg-${color}-500/20 text-${color}-400 font-mono`}>
              {trend}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className={`text-3xl font-bold font-mono text-${color}-400`}>{value}</div>
          <div className="text-sm text-gray-400 font-tech">{label}</div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-${color}-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      </div>
    </div>
  );

  return (
    <div className="bg-background text-white font-sans overflow-x-hidden selection:bg-accent selection:text-black">
      
      {/* Navigation */}
      <Navbar onNavigate={onNavigate} />
      
      {/* --- AMBIENT BACKGROUND FX --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="animated-grid opacity-70"></div>
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] ${!isQuietMode ? 'animate-pulse' : ''}`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-saffron/10 rounded-full blur-[100px] ${!isQuietMode ? 'animate-pulse' : ''}`} style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* --- HERO SECTION --- */}
      <main className="relative min-h-screen flex items-center justify-center p-6 z-10 overflow-hidden pt-20">
        
        <button 
          onClick={() => setIsQuietMode(!isQuietMode)}
          className="absolute top-6 right-6 z-20 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          title={isQuietMode ? "Enable Animations" : "Disable Animations (Quiet Mode)"}
        >
          {isQuietMode ? <SpeakerXMarkIcon className="w-5 h-5 text-gray-400"/> : <SpeakerWaveIcon className="w-5 h-5 text-accent" />}
        </button>

        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8" style={{ animationDuration: '1s' }}>
            <div className="flex items-center gap-4">
               <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-br from-saffron to-red-600 rounded-xl blur opacity-60"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-saffron to-red-600 rounded-xl flex items-center justify-center border border-white/10">
                     <GlobeAltIcon className="w-8 h-8 text-white" />
                  </div>
               </div>
               <h1 className="text-4xl font-tech font-bold tracking-[0.15em] text-white leading-tight">
                 BHARAT<span className="text-saffron">FLOW</span>
               </h1>
             </div>
            
            <h2 className="text-5xl md:text-7xl font-bold font-tech tracking-tight leading-[1.05]">
              India's First AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron via-white to-green-500">Traffic Digital Twin</span>
            </h2>
            
            <p className="text-lg text-gray-400 max-w-lg leading-relaxed border-l-2 border-accent pl-6">
               A next-generation command center featuring a real-time LHT physics simulation, managed by Gemini 2.5 AI to optimize traffic flow for India's Smart Cities.
            </p>

            {/* Real-time stats preview */}
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-black/30 border border-cyan-400/20 backdrop-blur-sm">
                <div className="text-2xl font-bold font-mono text-cyan-400">{currentStats.vehiclesTracked.toLocaleString()}</div>
                <div className="text-xs text-gray-400 font-tech">VEHICLES TRACKED</div>
              </div>
              <div className="p-4 rounded-xl bg-black/30 border border-green-400/20 backdrop-blur-sm">
                <div className="text-2xl font-bold font-mono text-green-400">{currentStats.avgSpeedImprovement.toFixed(1)}%</div>
                <div className="text-xs text-gray-400 font-tech">SPEED IMPROVEMENT</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => onNavigate('DASHBOARD')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold font-tech text-lg rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center gap-3 group translate-y-0 hover:-translate-y-1"
              >
                <span>Launch Neural Grid</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={() => onNavigate('TRAFFIC_DASHBOARD')}
                className="px-8 py-4 bg-gradient-to-r from-saffron to-orange-600 text-white font-bold font-tech text-lg rounded-xl hover:from-orange-400 hover:to-red-500 transition-all shadow-[0_0_20px_rgba(251,146,60,0.3)] hover:shadow-[0_0_40px_rgba(251,146,60,0.5)] flex items-center gap-3 group translate-y-0 hover:-translate-y-1"
              >
                <ChartBarIcon className="w-5 h-5" />
                <span>Traffic Intelligence</span>
              </button>
              
              <button 
                onClick={() => onNavigate('REAL_TRAFFIC')}
                className="px-8 py-4 bg-black/30 border border-white/20 text-white font-bold font-tech text-lg rounded-xl hover:bg-white/10 hover:border-white/40 transition-all flex items-center gap-3 group"
              >
                <MapIcon className="w-5 h-5" />
                <span>Live Traffic</span>
              </button>
            </div>
          </div>
          
          <div className="hidden lg:block animate-in fade-in" style={{ animationName: 'zoom-in-90', animationDuration: '1s' }}>
            <InteractiveGlobe isQuietMode={isQuietMode} />
          </div>
        </div>
      </main>

      {/* --- LIVE STATS DASHBOARD --- */}
      <section className="py-16 relative z-10 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-tech mb-4 text-white">Live System Performance</h2>
            <p className="text-gray-400">Real-time metrics from active BharatFlow deployments</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={GlobeAltIcon} 
              value={currentStats.activeCities} 
              label="ACTIVE CITIES" 
              trend="+2 this month"
              color="cyan"
            />
            <StatCard 
              icon={CameraIcon} 
              value={currentStats.vehiclesTracked.toLocaleString()} 
              label="VEHICLES TRACKED" 
              trend="Live"
              color="green"
            />
            <StatCard 
              icon={BoltIcon} 
              value={`${currentStats.avgSpeedImprovement.toFixed(1)}%`} 
              label="SPEED IMPROVEMENT" 
              trend="+12% vs baseline"
              color="yellow"
            />
            <StatCard 
              icon={CloudIcon} 
              value={`${currentStats.co2Reduction.toFixed(1)}%`} 
              label="CO₂ REDUCTION" 
              trend="Environmental impact"
              color="emerald"
            />
          </div>
        </div>
      </section>

      {/* --- PROBLEM / SOLUTION --- */}
      <section className="py-24 relative z-10 bg-surface border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-tech mb-4 text-white">From Gridlock to Grid Flow</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">Our system transforms chaotic urban arteries into intelligent, self-optimizing networks.</p>
            
            <div className="mt-16 grid md:grid-cols-2 gap-8 items-center">
                <div className="p-8 rounded-2xl bg-black/30 border border-red-500/20 text-left">
                    <h3 className="text-2xl font-tech font-bold text-red-400 mb-4">The Chaos</h3>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex items-start gap-3"><span className="text-red-500 mt-1">●</span><span>Static, pre-timed signals causing unnecessary stops and idling.</span></li>
                        <li className="flex items-start gap-3"><span className="text-red-500 mt-1">●</span><span>Inability to adapt to real-time events like accidents or VIP movement.</span></li>
                        <li className="flex items-start gap-3"><span className="text-red-500 mt-1">●</span><span>Increased carbon emissions and fuel wastage from constant stop-go traffic.</span></li>
                    </ul>
                </div>
                <div className="p-8 rounded-2xl bg-black/30 border border-green-500/20 text-left">
                    <h3 className="text-2xl font-tech font-bold text-green-400 mb-4">The Order</h3>
                    <ul className="space-y-3 text-gray-400">
                        <li className="flex items-start gap-3"><span className="text-green-500 mt-1">●</span><span>Dynamic signal phasing that creates "green waves" for smoother commutes.</span></li>
                        <li className="flex items-start gap-3"><span className="text-green-500 mt-1">●</span><span>AI-powered predictive analysis to anticipate and mitigate congestion.</span></li>
                        <li className="flex items-start gap-3"><span className="text-green-500 mt-1">●</span><span>Up to 40% reduction in travel time and a significant drop in urban pollution.</span></li>
                    </ul>
                </div>
            </div>
        </div>
      </section>
      
      {/* --- HOW IT WORKS --- */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
               <h2 className="text-4xl md:text-5xl font-bold font-tech mb-4">A 3-Step Intelligence Cycle</h2>
               <p className="text-lg text-gray-400">BharatFlow operates on a continuous loop of data collection, AI analysis, and real-time action.</p>
            </div>
            
            <div className="relative flex flex-col gap-24">
              {/* Connecting Line */}
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-surfaceHighlight via-accent to-surfaceHighlight hidden md:block"></div>

              <FeatureCard 
                step="01" 
                icon={ServerStackIcon} 
                title="SENSE: The Digital Twin" 
                description="We create a high-fidelity, real-time physics simulation of your city's road network, processing thousands of data points per second to understand the live traffic pulse."
              />
              <FeatureCard 
                step="02" 
                icon={SparklesIcon} 
                title="ANALYZE: The Gemini Core" 
                description="Our powerful Gemini 2.5 AI model analyzes the complete traffic snapshot, identifying current bottlenecks and suggesting optimal signal timings with superhuman speed."
              />
              <FeatureCard 
                step="03" 
                icon={CpuChipIcon} 
                title="ACT: Grid Optimization" 
                description="AI-recommended signal timings are securely relayed to the traffic grid. Changes are made in milliseconds, creating a responsive system that adapts faster than traffic can build."
              />
            </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 relative z-10 bg-surface border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <ShieldCheckIcon className="w-16 h-16 text-accent mx-auto mb-6 opacity-50" />
            <h2 className="text-4xl md:text-5xl font-bold font-tech mb-6">Take Command of The Grid</h2>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
                Access the secure command dashboard to view a live digital twin of a major Indian city. This is a restricted, high-security government terminal.
            </p>
            <button 
                onClick={() => onNavigate('DASHBOARD')}
                className="px-10 py-5 bg-accent text-black font-bold font-tech text-xl rounded-lg hover:bg-cyan-300 transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] flex items-center gap-3 group translate-y-0 hover:-translate-y-1 mx-auto"
              >
                <span>Authorize & Launch</span>
                <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
            </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-black/30 py-12 text-center text-xs text-gray-600 font-mono">
         <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
            <div className="flex items-center gap-2 opacity-50">
               <GlobeAltIcon className="w-4 h-4" />
               <span>BHARATFLOW AI SYSTEMS</span>
            </div>
            <div className="flex gap-8">
               <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
               <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
               <a href="#" className="hover:text-white transition-colors">Contact Support</a>
            </div>
            <p>© 2024 A Government of India Smart City Initiative.</p>
         </div>
      </footer>
    </div>
  );
};