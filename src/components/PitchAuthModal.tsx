import React, { useState } from 'react';
import { X, User, Building2, Music, Users, UserPlus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PitchAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export function PitchAuthModal({ isOpen, onClose, onLoginSuccess }: PitchAuthModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSignupOption = (accountType: string) => {
    onClose();
    switch (accountType) {
      case 'producer':
        navigate('/producer-application');
        break;
      case 'artist':
        navigate('/artist-application');
        break;
      case 'rights-holder':
        navigate('/rights-holder/signup');
        break;
      case 'agent':
        // Navigate to signup page with agent parameter
        navigate('/signup?accountType=agent');
        break;
      default:
        navigate('/signup');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-blue-500/20 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">Join MyBeatFi Pitch Service</h2>
            <p className="text-gray-300">You need to be an active artist, producer, or rights holder to subscribe to our pitch service.</p>
          </div>

          {/* Toggle between Login and Signup */}
          <div className="flex bg-gray-800/50 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsLoginMode(true)}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                isLoginMode 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLoginMode(false)}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                !isLoginMode 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {isLoginMode ? (
            /* Login Section */
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-300 mb-4">Already have an account? Sign in to continue.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Producer Login */}
                <button
                  onClick={() => {
                    onClose();
                    navigate('/producer/login?redirect=pitch');
                  }}
                  className="group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white p-4 rounded-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
                >
                  <Music className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Producer Login</div>
                    <div className="text-sm opacity-90">Sign in as producer</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </button>

                {/* Artist Login */}
                <button
                  onClick={() => {
                    onClose();
                    navigate('/artist/login?redirect=pitch');
                  }}
                  className="group bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white p-4 rounded-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
                >
                  <Users className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Artist Login</div>
                    <div className="text-sm opacity-90">Sign in as artist</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </button>

                {/* Rights Holder Login */}
                <button
                  onClick={() => {
                    onClose();
                    navigate('/rights-holder/login?redirect=pitch');
                  }}
                  className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
                >
                  <Building2 className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Record Label/Publisher Login</div>
                    <div className="text-sm opacity-90">Sign in as rights holder</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </button>

                {/* Agent Login */}
                <button
                  onClick={() => {
                    onClose();
                    navigate('/login?redirect=pitch');
                  }}
                  className="group bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white p-4 rounded-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
                >
                  <UserPlus className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Agent Login</div>
                    <div className="text-sm opacity-90">Sign in as agent</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-400">
                  After signing in, you'll be able to subscribe to the Pitch Service.
                </p>
              </div>
            </div>
          ) : (
            /* Signup Section */
            <div className="space-y-4">
              <div className="text-center mb-6">
                <p className="text-gray-300 mb-4">Choose your account type to get started:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Producer */}
                <button
                  onClick={() => handleSignupOption('producer')}
                  className="group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white p-4 rounded-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
                >
                  <Music className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Join as Producer</div>
                    <div className="text-sm opacity-90">Create and license beats</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </button>

                {/* Artist */}
                <button
                  onClick={() => handleSignupOption('artist')}
                  className="group bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white p-4 rounded-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
                >
                  <Users className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Join as Artist</div>
                    <div className="text-sm opacity-90">Solo artists and bands</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </button>

                {/* Rights Holder */}
                <button
                  onClick={() => handleSignupOption('rights-holder')}
                  className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white p-4 rounded-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
                >
                  <Building2 className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Record Label/Publisher</div>
                    <div className="text-sm opacity-90">Manage artist catalogs</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </button>

                {/* Agent */}
                <button
                  onClick={() => handleSignupOption('agent')}
                  className="group bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white p-4 rounded-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-xl shadow-lg flex items-center"
                >
                  <UserPlus className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div className="font-semibold">Join as Agent</div>
                    <div className="text-sm opacity-90">Represent artists and clients</div>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-gray-400">
                  After creating your account, you'll be able to subscribe to the Pitch Service.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
