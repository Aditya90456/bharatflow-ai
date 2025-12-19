import React, { useState } from 'react';
import { 
  GlobeAltIcon, 
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  CogIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatusIndicator } from '../ui/StatusIndicator';
import { cn } from '../utils/cn';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentCity: string;
  onNavigate: (page: string) => void;
  stats?: {
    totalCars: number;
    avgSpeed: number;
    congestionLevel: number;
    incidents: number;
  };
  notifications?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentCity,
  onNavigate,
  stats,
  notifications = 0
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="animated-grid" />
      
      {/* Header */}
      <header className="relative z-40 h-16 border-b border-border/50 backdrop-blur-xl bg-surface/80">
        <div className="flex items-center justify-between h-full px-6">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </Button>

            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onNavigate('LANDING')}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-saffron to-red-600 flex items-center justify-center shadow-lg shadow-saffron/20 group-hover:shadow-saffron/40 transition-all duration-300">
                <GlobeAltIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-display font-bold tracking-widest leading-none text-white holographic">
                  BHARAT<span className="text-saffron">FLOW</span>
                </span>
                <div className="text-[10px] font-mono text-accent tracking-wider">
                  AI COMMAND • {currentCity.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - System Status */}
          <div className="hidden md:flex items-center gap-6">
            <StatusIndicator 
              status="online" 
              label="System Online" 
              size="sm"
            />
            {stats && (
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-muted">UNITS:</span>
                <span className="text-cyan-400 font-bold">{stats.totalCars}</span>
                <span className="text-muted">•</span>
                <span className="text-muted">SPEED:</span>
                <span className="text-success-400 font-bold">{stats.avgSpeed.toFixed(1)}</span>
                <span className="text-muted">•</span>
                <span className="text-muted">CONGESTION:</span>
                <span className={cn(
                  "font-bold",
                  stats.congestionLevel > 70 ? "text-danger-400" :
                  stats.congestionLevel > 40 ? "text-warning-400" : "text-success-400"
                )}>
                  {stats.congestionLevel}%
                </span>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger text-white text-xs rounded-full flex items-center justify-center animate-pulse-glow">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <CogIcon className="h-5 w-5" />
            </Button>

            {/* Profile */}
            <Button variant="ghost" size="icon">
              <UserCircleIcon className="h-5 w-5" />
            </Button>

            {/* Exit */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onNavigate('LANDING')}
              className="hover:bg-danger/20 hover:text-danger"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <Button
          variant="cyber"
          size="lg"
          className="rounded-full w-14 h-14 shadow-2xl"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};