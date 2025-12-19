import React from 'react';

interface NavbarProps {
  onNavigate?: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const handleNavigation = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-xl font-bold">BharatFlow</h1>
        <ul className="flex space-x-6">
          <li>
            <button 
              onClick={() => handleNavigation('simulation')} 
              className="text-gray-300 hover:text-white"
            >
              Simulation
            </button>
          </li>
          <li>
            <button 
              onClick={() => handleNavigation('dashboard')} 
              className="text-gray-300 hover:text-white"
            >
              Dashboard
            </button>
          </li>
          <li>
            <button 
              onClick={() => handleNavigation('settings')} 
              className="text-gray-300 hover:text-white"
            >
              Settings
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
};