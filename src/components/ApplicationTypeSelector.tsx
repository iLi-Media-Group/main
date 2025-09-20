import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Music, Mic, Building2 } from 'lucide-react';

const ApplicationTypeSelector: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-start mb-4">
              <Link 
                to="/sync-licensing-course" 
                className="flex items-center text-blue-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Course
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">Choose Your Application Type</h1>
            <p className="text-xl text-blue-200">
              Select the type of account you'd like to apply for
            </p>
          </div>

                     {/* Application Options */}
           <div className="grid md:grid-cols-3 gap-6">
             {/* Producer Option */}
             <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6 hover:bg-white/10 transition-colors">
               <div className="text-center">
                 <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Mic className="w-8 h-8 text-white" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-3">I am a Producer</h3>
                 <p className="text-gray-300 text-sm mb-6">
                   I create and produce music tracks for sync licensing. I want to upload my tracks 
                   and make them available for licensing opportunities.
                 </p>
                 <Link 
                   to="/producer-application" 
                   className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors w-full"
                 >
                   Apply as Producer
                 </Link>
               </div>
             </div>

             {/* Artist/Band Option */}
             <div className="bg-white/5 border border-purple-500/20 rounded-lg p-6 hover:bg-white/10 transition-colors">
               <div className="text-center">
                 <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Music className="w-8 h-8 text-white" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-3">I am an Artist/Band</h3>
                 <p className="text-gray-300 text-sm mb-6">
                   I am a solo artist, duo, or band that performs and releases music. I want to 
                   make my catalog available for sync licensing opportunities.
                 </p>
                 <Link 
                   to="/artist-application" 
                   className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors w-full"
                 >
                   Apply as Artist/Band
                 </Link>
               </div>
             </div>

             {/* Record Label/Publisher Option */}
             <div className="bg-white/5 border border-green-500/20 rounded-lg p-6 hover:bg-white/10 transition-colors">
               <div className="text-center">
                 <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Building2 className="w-8 h-8 text-white" />
                 </div>
                 <h3 className="text-2xl font-bold text-white mb-3">I am a Record Label/Publisher</h3>
                                   <p className="text-gray-300 text-sm mb-6">
                    I represent a record label or publishing company. I want to manage rights and 
                    license our catalog for sync licensing opportunities.
                  </p>
                 <Link 
                   to="/rights-holder/signup" 
                   className="inline-flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors w-full"
                 >
                   Apply as Rights Holder
                 </Link>
               </div>
             </div>
           </div>

                     {/* Additional Information */}
           <div className="mt-8 bg-white/5 border border-blue-500/20 rounded-lg p-6">
             <h4 className="text-lg font-semibold text-white mb-3">What's the difference?</h4>
             <div className="grid md:grid-cols-3 gap-4 text-sm">
               <div>
                 <h5 className="text-blue-300 font-medium mb-2">Producers:</h5>
                 <ul className="text-gray-300 space-y-1">
                   <li>• Create instrumental tracks and beats</li>
                   <li>• Focus on production and composition</li>
                   <li>• Upload tracks for licensing</li>
                   <li>• Receive sync licensing revenue</li>
                 </ul>
               </div>
               <div>
                 <h5 className="text-purple-300 font-medium mb-2">Artists/Bands:</h5>
                 <ul className="text-gray-300 space-y-1">
                   <li>• Perform and release music</li>
                   <li>• Have vocal tracks and full songs</li>
                   <li>• Control master and publishing rights</li>
                   <li>• License existing catalog</li>
                 </ul>
               </div>
               <div>
                 <h5 className="text-green-300 font-medium mb-2">Record Labels/Publishers:</h5>
                 <ul className="text-gray-300 space-y-1">
                   <li>• Manage rights for multiple artists</li>
                   <li>• Control master and publishing catalogs</li>
                   <li>• Handle licensing negotiations</li>
                   <li>• Distribute revenue to artists</li>
                 </ul>
               </div>
             </div>
           </div>

          {/* Back to Course */}
          <div className="text-center mt-8">
            <Link 
              to="/sync-licensing-course" 
              className="text-blue-300 hover:text-white transition-colors"
            >
              ← Back to Sync Licensing Course
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationTypeSelector;
