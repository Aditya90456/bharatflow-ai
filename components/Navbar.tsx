import React, { useState } from 'react';
import { 
  GlobeAltIcon, 
  MagnifyingGlassIcon, 
  SparklesIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  MapIcon,
  DocumentTextIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface NavbarProps {
  onNavigate?: (page: string) => void;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearch?: (query: string) => void;
  isSearching?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onNavigate, 
  showSearch = false,
  searchQuery = '',
  onSearchChange,
  onSearch,
  isSearching = false
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
    setIsMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const navigationItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: ChartBarIcon },
    { id: 'FEATURES', label: 'Features', icon: SparklesIcon },
    { id: 'PUBLIC_MAP', label: 'Live Map', icon: MapIcon },
    { id: 'API_DOCS', label: 'API Docs', icon: DocumentTextIcon },
    { id: 'AI_FEATURES', label: 'AI Features', icon: CpuChipIcon },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => handleNavigation('LANDING')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-saffron/30 group-hover:shadow-saffron/50 transition-all duration-300 group-hover:scale-110">
              <GlobeAltIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-display font-black tracking-wider text-white group-hover:text-saffron transition-colors">
                BHARAT<span className="text-saffron">FLOW</span>
              </span>
              <span className="text-[9px] font-mono text-cyan-300 tracking-[0.15em] uppercase opacity-80">
                AI Traffic Control
              </span>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className={`relative transition-all duration-300 ${isSearchFocused ? 'scale-105' : 'scale-100'}`}>
                  <div className={`flex items-center bg-surface/50 backdrop-blur-sm rounded-2xl border transition-all duration-300 ${
                    isSearchFocused 
                      ? 'border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.3)]' 
                      : 'border-white/10 hover:border-cyan-400/30'
                  }`}>
                    <div className={`flex-shrink-0 ml-4 transition-colors duration-300 ${
                      isSearchFocused ? 'text-cyan-400' : 'text-gray-400'
                    }`}>
                      <SparklesIcon className={`w-5 h-5 ${isSearching ? 'animate-spin' : ''}`} />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => onSearchChange?.(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      placeholder="Ask AI about traffic, search locations, or give commands..."
                      className="flex-1 bg-transparent text-white placeholder:text-gray-400 focus:outline-none px-4 py-3 font-mono text-sm"
                    />
                    <button
                      type="submit"
                      disabled={!searchQuery.trim() || isSearching}
                      className={`flex-shrink-0 mr-4 p-2 rounded-lg transition-all duration-300 ${
                        searchQuery.trim() 
                          ? 'text-cyan-400 hover:bg-cyan-400/20 hover:scale-110' 
                          : 'text-gray-500'
                      }`}
                    >
                      <MagnifyingGlassIcon className={`w-5 h-5 ${isSearching ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                  {isSearching && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 font-tech text-sm group"
                >
                  <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearch && (
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="flex items-center bg-surface/50 backdrop-blur-sm rounded-2xl border border-white/10">
                <div className="flex-shrink-0 ml-4 text-gray-400">
                  <SparklesIcon className={`w-5 h-5 ${isSearching ? 'animate-spin' : ''}`} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="Ask AI about traffic..."
                  className="flex-1 bg-transparent text-white placeholder:text-gray-400 focus:outline-none px-4 py-3 font-mono text-sm"
                />
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isSearching}
                  className={`flex-shrink-0 mr-4 p-2 rounded-lg transition-colors ${
                    searchQuery.trim() 
                      ? 'text-cyan-400 hover:bg-cyan-400/20' 
                      : 'text-gray-500'
                  }`}
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface/95 backdrop-blur-xl border-t border-white/10">
          <div className="px-4 py-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-300 font-tech"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};