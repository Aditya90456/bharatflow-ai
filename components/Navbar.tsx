import React from 'react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  return (
    <nav className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-white text-xl font-bold">BharatFlow</h1>
        <ul className="flex space-x-6">
          <li><Link to="/simulation" className="text-gray-300 hover:text-white">Simulation</Link></li>
          <li><Link to="/dashboard" className="text-gray-300 hover:text-white">Dashboard</Link></li>
          <li><Link to="/settings" className="text-gray-300 hover:text-white">Settings</Link></li>
        </ul>
      </div>
    </nav>
  );
};