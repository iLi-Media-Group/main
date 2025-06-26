import React from 'react';
import { Link } from 'react-router-dom';
import { Music, ListMusic } from 'lucide-react';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

export function Footer() {
  // Check if producer applications feature is enabled
  const { isEnabled: producerApplicationsEnabled } = useFeatureFlag('producer_applications');

  return (
    <footer className="bg-black/40 border-t border-blue-500/20 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Music className="w-8 h-8 text-blue-500 mr-2" />
              <span className="text-xl font-bold text-white">MYBEATFI SYNC</span>
            </div>
            <p className="text-gray-400">
              Your source for professional music licensing and sync opportunities.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Licensing</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/catalog" className="text-gray-400 hover:text-white transition-colors">
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link to="/vocals" className="text-gray-400 hover:text-white transition-colors">
                  Full Tracks with Vocals
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link to="/white-label" className="text-gray-400 hover:text-white transition-colors">
                  White Label Solutions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">For Producers</h3>
            <ul className="space-y-2">
              {producerApplicationsEnabled ? (
                <li>
                  <Link to="/producer-application" className="text-gray-400 hover:text-white transition-colors">
                    Become a Sync Producer
                  </Link>
                </li>
              ) : (
                <li className="text-gray-500">
                  Applications Closed
                </li>
              )}
              <li>
                <Link to="/producer/login" className="text-gray-400 hover:text-white transition-colors">
                  Producer Login
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/refund-policy" className="text-gray-400 hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-blue-500/20 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} MyBeatFi Sync. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
