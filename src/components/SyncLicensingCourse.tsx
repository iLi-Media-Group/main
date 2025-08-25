import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const SyncLicensingCourse: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-start mb-4">
              <Link 
                to="/" 
                className="flex items-center text-blue-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">🎵 Sync Licensing Basics Course</h1>
            <p className="text-xl text-blue-200">
              Learn the fundamentals of sync licensing and prepare for success in the music industry
            </p>
          </div>

          {/* Course Content */}
          <div className="space-y-6">
            {/* Module 1: Understanding Sync Licensing */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 1: Understanding Sync Licensing</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">What is Sync Licensing?</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• <strong>"Synchronization"</strong> means pairing music with visual media (TV, film, ads, games, YouTube, etc.)</li>
                    <li>• A sync license gives permission to use your music alongside visual content</li>
                    <li>• Unlike streaming royalties, sync deals are usually upfront, one-time payments (sometimes with backend royalties if broadcasted)</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Why It Matters:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• Sync is a growing industry that allows independent artists to earn revenue without major label backing</li>
                    <li>• Music supervisors, brands, and content creators need pre-cleared tracks</li>
                    <li>• Can provide significant income streams beyond traditional music sales</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Module 2: Master Rights vs. Publishing Rights */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 2: Master Rights vs. Publishing Rights</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Master Rights:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• The actual sound recording</li>
                    <li>• Typically owned by whoever paid for the recording (label, producer, or artist if independent)</li>
                    <li>• Includes the performance, arrangement, and production elements</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Publishing Rights:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• The composition (lyrics + melody)</li>
                    <li>• Usually split between songwriter(s) and publisher(s)</li>
                    <li>• Includes the underlying musical work and lyrics</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h5 className="text-lg font-medium text-yellow-300 mb-2">Key Point:</h5>
                  <p className="text-gray-300 text-sm">To license a track, both the master and the publishing rights must be cleared.</p>
                </div>
              </div>
            </div>

            {/* Module 3: One-Stop Licensing */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 3: One-Stop Licensing</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Definition:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• "One-stop" means the same person or company controls both the master and publishing rights</li>
                    <li>• Example: An independent artist who writes and records their own music</li>
                    <li>• Also applies when a single entity owns all rights to a track</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Why It's Important:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• Music supervisors love one-stop tracks because they only need one signature to clear usage</li>
                    <li>• More complex ownership (labels, multiple publishers, co-writers) slows down deals</li>
                    <li>• Increases the likelihood of your music being selected for projects</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Module 4: Common Licensing Scenarios */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 4: Common Licensing Scenarios</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">TV & Film</h5>
                  <p className="text-gray-300 text-sm ml-4">Background music, opening/closing credits, featured song in a scene</p>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Advertising</h5>
                  <p className="text-gray-300 text-sm ml-4">Commercials for brands or products</p>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Video Games</h5>
                  <p className="text-gray-300 text-sm ml-4">Soundtracks, trailers, or in-game background music</p>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Online Content</h5>
                  <p className="text-gray-300 text-sm ml-4">YouTube, social media, influencer campaigns</p>
                </div>
                
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">Corporate & Trailers</h5>
                  <p className="text-gray-300 text-sm ml-4">Event videos, movie trailers, presentations</p>
                </div>
              </div>
            </div>

            {/* Module 5: Rights & Permissions */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 5: Rights & Permissions</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-lg font-medium text-blue-300 mb-2">What You Need Before Licensing:</h5>
                  <ul className="text-gray-300 text-sm space-y-2 ml-4">
                    <li>• Confirm ownership of both master + publishing rights</li>
                    <li>• If multiple people own shares, all must approve the license</li>
                    <li>• If samples are used, they must be cleared (uncleared samples = legal risk)</li>
                    <li>• Ensure all co-writers and producers have signed agreements</li>
                  </ul>
                </div>
                
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <h5 className="text-lg font-medium text-green-300 mb-2">Permissions Checklist:</h5>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>✅ Do you own the master recording?</li>
                    <li>✅ Do you own or control the publishing rights?</li>
                    <li>✅ Are there co-writers, producers, or labels that need to approve?</li>
                    <li>✅ Are there uncleared samples in your track?</li>
                    <li>✅ Do you have proper documentation of all rights?</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Module 6: Best Practices for Sync Success */}
            <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Module 6: Best Practices for Sync Success</h4>
              
              <div className="space-y-4">
                <ul className="text-gray-300 text-sm space-y-2 ml-4">
                  <li>• Create instrumental versions of your songs (music supervisors often request them)</li>
                  <li>• Tag your tracks with clear moods, genres, and keywords</li>
                  <li>• Keep paperwork and agreements organized (split sheets, copyright registration)</li>
                  <li>• Understand that sync deals vary: some are exclusive (locked to one library) and others are non-exclusive (you can license elsewhere)</li>
                  <li>• Build relationships with music supervisors and licensing companies</li>
                  <li>• Ensure your tracks are professionally mixed and mastered</li>
                  <li>• Consider creating multiple versions (30s, 60s, full length) of your tracks</li>
                  <li>• Stay current with industry trends and licensing opportunities</li>
                </ul>
              </div>
            </div>

            {/* Course Completion & Next Steps */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Course Completion & Next Steps</h4>
              <p className="text-gray-300 text-sm mb-4">
                Congratulations! You have completed the Sync Licensing Basics Course. This knowledge will help you understand 
                the licensing process and prepare you for success in the sync licensing industry.
              </p>
              
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
                <h5 className="text-lg font-medium text-purple-300 mb-3">Ready to Take Your Knowledge Further?</h5>
                <p className="text-gray-300 text-sm mb-4">
                  This course covers the fundamentals, but there's much more to learn about sync licensing. 
                  We recommend taking a more comprehensive course with one of our trusted course providers.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    to="/producer/resources" 
                    className="flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Explore Producer Resources
                  </Link>
                  
                  <Link 
                    to="/application-type-selector" 
                    className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Apply as Producer/Artist
                  </Link>
                </div>
                
                <p className="text-gray-400 text-xs mt-4">
                  Visit our Producer Resources section to find comprehensive courses, industry tools, and educational materials 
                  from leading music industry professionals and organizations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyncLicensingCourse;
