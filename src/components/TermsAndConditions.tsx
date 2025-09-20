import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Terms and Conditions</h1>
          <p className="text-gray-400">Last updated: January 8, 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10 max-w-4xl mx-auto">
          <div className="prose prose-invert max-w-none">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">MyBeatFi.io – Client Terms and Conditions</h2>
              <p className="text-gray-300 mb-2"><strong>Effective Date:</strong> 08/01/2025</p>
              <p className="text-gray-300 mb-6"><strong>Company:</strong> MyBeatFi.io, operated by iLi Media Group, LLC ("MyBeatFi," "we," "our," or "us")</p>
              
              <p className="text-gray-300 mb-6">
                These Terms and Conditions ("Terms") govern your access to and use of MyBeatFi.io as a client ("you" or "Client"). 
                By using our site, purchasing a license, or otherwise engaging with our services, you agree to these Terms. 
                If you do not agree, you may not use the site.
              </p>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-xl font-semibold text-white mb-3">1. Services Provided</h3>
                <p className="text-gray-300">
                  MyBeatFi.io provides access to a catalog of music tracks and related content for licensing in film, TV, advertising, 
                  online, social media, games, and other media projects. Clients may purchase licenses for single tracks, 
                  subscription-based access, or custom sync requests.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">2. Account Registration</h3>
                <ul className="text-gray-300 space-y-2 ml-6">
                  <li>• You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account.</li>
                  <li>• You agree to provide accurate and complete information when registering.</li>
                  <li>• You are responsible for maintaining the security of your account credentials.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">3. License Grant</h3>
                <p className="text-gray-300 mb-3">
                  When you purchase or obtain a license through MyBeatFi.io, you are granted a non-exclusive, non-transferable, 
                  limited license to use the track(s) in accordance with the terms of the specific license agreement provided 
                  at the time of purchase.
                </p>
                <p className="text-gray-300 mb-3"><strong>Unless otherwise specified in your license:</strong></p>
                <ul className="text-gray-300 space-y-2 ml-6">
                  <li>• You may use the track in synchronized audiovisual works (films, ads, YouTube videos, games, podcasts, etc.).</li>
                  <li>• You may not resell, redistribute, or relicense the track as standalone music.</li>
                  <li>• You may not claim ownership or authorship of the track.</li>
                  <li>• You may not use the track in defamatory, obscene, or illegal content.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">4. Intellectual Property</h3>
                <ul className="text-gray-300 space-y-2 ml-6">
                  <li>• All tracks, compositions, sound recordings, and other content available on MyBeatFi.io remain the property of the respective producer, artist, or copyright holder.</li>
                  <li>• No ownership rights are transferred to you.</li>
                  <li>• All rights not expressly granted under these Terms or your license agreement are reserved.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">5. Payment and Fees</h3>
                <ul className="text-gray-300 space-y-2 ml-6">
                  <li>• All fees are displayed at checkout and must be paid in full before a license is issued.</li>
                  <li>• Payments are processed securely via Stripe (and/or other approved processors).</li>
                  <li>• All sales are final except in cases of duplicate charges or technical errors.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">6. Prohibited Uses</h3>
                <p className="text-gray-300 mb-3">You agree not to:</p>
                <ul className="text-gray-300 space-y-2 ml-6">
                  <li>• Reproduce or distribute tracks outside the scope of your license.</li>
                  <li>• Upload tracks to third-party platforms (Spotify, Apple Music, etc.) unless explicitly permitted in your license.</li>
                  <li>• Use tracks in AI training datasets without written consent.</li>
                  <li>• Attempt to circumvent security measures on the platform.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">7. Termination</h3>
                <p className="text-gray-300 mb-3">We reserve the right to suspend or terminate your account and licenses if you:</p>
                <ul className="text-gray-300 space-y-2 ml-6">
                  <li>• Violate these Terms or applicable laws.</li>
                  <li>• Engage in fraudulent or abusive conduct.</li>
                </ul>
                <p className="text-gray-300 mt-3">Termination does not release you from payment obligations or unauthorized use liabilities.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">8. Disclaimer of Warranties</h3>
                <p className="text-gray-300">
                  The platform and its content are provided "as is" without warranties of any kind. We do not guarantee 
                  uninterrupted service, error-free operation, or availability of specific tracks.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">9. Limitation of Liability</h3>
                <p className="text-gray-300 mb-3">To the maximum extent permitted by law, MyBeatFi.io and iLi Media Group, LLC shall not be liable for:</p>
                <ul className="text-gray-300 space-y-2 ml-6">
                  <li>• Indirect, incidental, or consequential damages.</li>
                  <li>• Losses resulting from misuse of licensed music.</li>
                  <li>• Total liability exceeding the amount you paid for the relevant license.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">10. Indemnification</h3>
                <p className="text-gray-300">
                  You agree to indemnify and hold harmless MyBeatFi.io, iLi Media Group, LLC, and its affiliates from any claims, 
                  damages, or expenses arising from your use of licensed music, including but not limited to unauthorized use 
                  or third-party claims.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">11. Governing Law</h3>
                <p className="text-gray-300">
                  These Terms shall be governed by and construed in accordance with the laws of the State of [Insert State], 
                  United States, without regard to conflict of law principles.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">12. Modifications</h3>
                <p className="text-gray-300">
                  We may update these Terms from time to time. Any changes will be posted on the site with an updated effective date. 
                  Continued use of the platform after changes constitutes acceptance.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-white mb-3">13. Contact</h3>
                <p className="text-gray-300 mb-2">If you have any questions, please contact:</p>
                <div className="text-gray-300 ml-6">
                  <p><strong>iLi Media Group, LLC</strong></p>
                  <p>Email: <a href="mailto:mybeatfisync@gmail.com" className="text-blue-400 hover:text-blue-300">mybeatfisync@gmail.com</a></p>
                  <p>Website: <a href="https://mybeatfi.io" className="text-blue-400 hover:text-blue-300">https://mybeatfi.io</a></p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
