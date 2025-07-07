import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, ShoppingCart, User, Plus, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function NavigationMenu() {
  const { accountType } = useAuth();
  return (
    <nav className="bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 h-full w-64 fixed left-0 top-0 p-4 overflow-y-auto max-h-screen">
      <div className="flex flex-col space-y-6">
        <Link 
          to="/" 
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </Link>

        <Link 
          to="/pricing" 
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Pricing</span>
        </Link>

        <Link 
          to="/custom-sync-request" 
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Custom Sync Request</span>
        </Link>

        <Link 
          to="/services" 
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Services</span>
        </Link>
        {accountType === 'admin' && (
          <Link 
            to="/admin/services" 
            className="flex items-center space-x-3 text-blue-400 hover:text-white transition-colors font-semibold border-t border-blue-500/20 pt-4 mt-2"
          >
            <Settings className="w-5 h-5" />
            <span>Services Admin</span>
          </Link>
        )}
        <Link 
          to="/profile" 
          className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors"
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
