import React, { useState, useEffect, useRef } from 'react';
import { GlobeAltIcon, ArrowRightIcon, CpuChipIcon, SparklesIcon, ServerStackIcon, CameraIcon, ShieldCheckIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const FeatureCard: React.FC<{ icon: React.FC<any>, title: string, description: string, step: string }> = ({ icon: Icon, title, description, step }) => (
  <div className="relative pl-16">
    <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-surfaceHighlight border border-white/10 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-background border border-accent/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-accent text-black flex items-center justify-center text-xs font-bold font-mono">
        {step}
      </div>
    </div>
    <h3 className="text-xl font-bold font-tech mb-2 text-white">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

const InteractiveGlobe: React.FC<{ isQuietMode: boolean }> = ({ isQuietMode }) => {
  const cities = [
    { name: 'DEL', lat: 28.6, lng: 77.2, size: 6 },
    { name: 'MUM', lat: 19.0, lng: 72.8, size: 6 },
    { name: 'BLR', lat: 12.9, lng: 77.6, size: 8 },
    { name: 'KOL', lat: 22.5, lng: 88.3, size: 5 },
    { name: 'CHE', lat: 13.0, lng: 80.2, size: 5 },
  ];

  const arcs = [ [0,1], [1,2], [2,4], [4,3], [3,0], [0,2] ];

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center group">
      <style>{`
        .globe-container { perspective: 1000px; }
        .globe {
          width: 400px; height: 400px;
          transform-style: preserve-3d;
          animation: ${!isQuietMode ? 'rotate-globe 45s linear infinite' : 'none'};
        }
        @keyframes rotate-globe { from { transform: rotateY(0deg) rotateX(10deg); } to { transform: rotateY(360deg) rotateX(10deg); } }
        .globe-sphere {
          position: absolute; inset: 0;
          border-radius: 50%;
          background-image: radial-gradient(circle at 30% 30%, rgba(6,182,212,0.4), transparent 70%),
                            radial-gradient(circle at 70% 70%, rgba(255,153,51,0.3), transparent 70%);
          box-shadow: inset 0 0 20px rgba(255,255,255,0.1), 0 0 50px rgba(6,182,212,0.2);
        }
        .globe-point {
          position: absolute;
          border-radius: 50%;
          background: #06B6D4;
          box-shadow: 0 0 10px #06B6D4;
        }
      `}</style>
      <div className="globe-container">
        <div className="globe">
          <div className="globe-sphere"></div>
          {cities.map(({ lat, lng, size }, i) => {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lng + 180) * (Math.PI / 180);
            const x = -200 * Math.sin(phi) * Math.cos(theta);
            const y = 200 * Math.cos(phi);
            const z = 200 * Math.sin(phi) * Math.sin(theta);
            return (
              <div key={i} className="globe-point" style={{
                width: size, height: size,
                left: '50%', top: '50%',
                transform: `translateX(-50%) translateY(-50%) translate3d(${x}px, ${y}px, ${z}px)`,
                animation: `${!isQuietMode ? `pulse-glow ${2 + Math.random()*2}s infinite` : 'none'}`
              }}></div>
            )
          })}
        </div>
      </div>
    </div>
  )
};


export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [isQuietMode, setIsQuietMode] = useState(false);

  return (
    <div className="bg-background text-white font-sans overflow-x-hidden selection:bg-accent selection:text-black">
      
      {/* --- AMBIENT BACKGROUND FX --- */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="animated-grid opacity-70"></div>
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] ${!isQuietMode ? 'animate-pulse' : ''}`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-saffron/10 rounded-full blur-[100px] ${!isQuietMode ? 'animate-pulse' : ''}`} style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* --- HERO SECTION --- */}
      <main className="relative min-h-screen flex items-center justify-center p-6 z-10 overflow-hidden">
        
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

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => onNavigate('DASHBOARD')}
                className="px-8 py-4 bg-accent text-black font-bold font-tech text-lg rounded-lg hover:bg-cyan-300 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] flex items-center gap-3 group translate-y-0 hover:-translate-y-1"
              >
                <span>Launch Simulation</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
          
          <div className="hidden lg:block animate-in fade-in" style={{ animationName: 'zoom-in-90', animationDuration: '1s' }}>
            <InteractiveGlobe isQuietMode={isQuietMode} />
          </div>
        </div>
      </main>

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