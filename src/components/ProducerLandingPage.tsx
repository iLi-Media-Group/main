import React from 'react';
import { Link } from 'react-router-dom';
import { Music, DollarSign, Users, Clock, CheckCircle } from 'lucide-react';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

export function ProducerLandingPage() {
  // Check if producer applications feature is enabled
  const { isEnabled: producerApplicationsEnabled, loading: producerApplicationsLoading } = useFeatureFlag('producer_applications');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Become a <span className="text-purple-400">Sync Producer</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join our network of talented producers and start earning from your music. 
            Get your tracks licensed for TV, film, commercials, and more.
          </p>

          {/* Producer Application Link - Only show if feature is enabled */}
          {!producerApplicationsLoading && producerApplicationsEnabled ? (
            <div className="mb-12">
              <Link
                to="/producer-application"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/25 text-lg"
              >
                <Music className="w-6 h-6 mr-3" />
                Apply Now
              </Link>
            </div>
          ) : (
            <div className="mb-12 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400">
                Producer applications are currently closed. Please check back later.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20">
              <DollarSign className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Earn More</h3>
              <p className="text-gray-300">
                Get paid for every license. Our producers earn competitive rates on all sync placements.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20">
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Global Reach</h3>
              <p className="text-gray-300">
                Your music reaches clients worldwide. From indie films to major TV networks.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20">
              <Clock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Quick Setup</h3>
              <p className="text-gray-300">
                Get started in minutes. Upload your tracks and start earning immediately.
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mt-1">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Submit Your Application</h4>
                    <p className="text-gray-300 text-sm">
                      Fill out our producer application with your details and music samples.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mt-1">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Get Approved</h4>
                    <p className="text-gray-300 text-sm">
                      Our team reviews your application and music quality.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mt-1">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Upload Your Tracks</h4>
                    <p className="text-gray-300 text-sm">
                      Start uploading your music to our catalog for licensing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mt-1">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Get Licensed</h4>
                    <p className="text-gray-300 text-sm">
                      Clients discover and license your music for their projects.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mt-1">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Earn Money</h4>
                    <p className="text-gray-300 text-sm">
                      Receive payments automatically for every license sold.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mt-1">
                    6
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Grow Your Business</h4>
                    <p className="text-gray-300 text-sm">
                      Build your catalog and increase your earnings over time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">What You Get</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Professional music catalog</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Automated licensing system</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Global client network</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Automated payouts (Stripe USD)</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Detailed analytics</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">Legal protection</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">24/7 support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-gray-300">No upfront costs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA - Only show if feature is enabled */}
          {!producerApplicationsLoading && producerApplicationsEnabled && (
            <div className="mt-12">
              <Link
                to="/producer-application"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/25 text-lg"
              >
                <Music className="w-6 h-6 mr-3" />
                Start Your Application
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProducerLandingPage;
