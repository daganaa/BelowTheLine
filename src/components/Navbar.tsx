import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Users, UserCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import BTLLogo from '../assets/BTL.png';

export const Navbar = () => {
  const { signOut, user } = useAuthStore();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <img src={BTLLogo} alt="Below The Line" className="h-10 w-10 rounded-lg" />
              <span className="ml-2 text-xl font-bold text-gray-900">Below The Line</span>
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <Link to="/portfolio" className="text-gray-600 hover:text-gray-900">
                <Film className="h-6 w-6" />
              </Link>
              <Link to="/connections" className="text-gray-600 hover:text-gray-900">
                <Users className="h-6 w-6" />
              </Link>
              <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                <UserCircle className="h-6 w-6" />
              </Link>
              <button
                onClick={() => signOut()}
                className="text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};