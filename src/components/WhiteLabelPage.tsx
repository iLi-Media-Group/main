import React, { useRef, useState } from 'react';
import { Music, Zap, Brain, Globe, Shield, DollarSign, Mail, User, MessageSquare, Wallet, Check, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { WhiteLabelCalculator } from './WhiteLabelCalculator';

export default function WhiteLabelPage() {
  // Form state & handlers for contact form (you should already have these)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Simulate form submission logic here
      // e.g. send formData to your backend or API
      await new Promise((res) => setTimeout(res, 1500));
      setSuccess(true);
      setFormData({ name: '', email: '', company: '', message: '' });
    } catch (err) {
      setError('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Scroll to Calculator ref and handler
  const calculatorRef = useRef<HTMLDivElement>(null);
  const scrollToCalculator = () => {
    if (calculatorRef.current) {
      calculatorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      <main>
        {/* Pricing Plans Section */}
        <section className="py-20 bg-black/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">

              {/* Starter Plan */}
              <div className="bg-white/5 p-6 rounded-xl border border-blue-500/20">
                <h3 className="text-3xl font-bold text-white mb-6">Starter</h3>
                {/* Your starter plan details here... */}
                <button
                  onClick={scrollToCalculator}
                  className="block w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white text-center font-semibold rounded-lg transition-colors"
                >
                  Start Now
                </button>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-8 max-w-md mx-auto shadow-lg shadow-purple-500/50">
                <h3 className="text-3xl font-bold text-white mb-6">Pro</h3>
                {/* Your pro plan details here... */}
                <button
                  onClick={scrollToCalculator}
                  className="block w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-center font-semibold rounded-lg transition-colors shadow-lg shadow-purple-500/25"
                >
                  Get Pro
                </button>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white/5 p-6 rounded-xl border border-green-500/30 max-w-md mx-auto">
                <h3 className="text-3xl font-bold text-white mb-6">Enterprise</h3>
                {/* Your enterprise plan details here... */}
                <a
                  href="#contact"
                  className="block w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white text-center font-semibold rounded-lg transition-colors"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Calculator Section with ref */}
        <section className="py-20 bg-black/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Calculate Your Costs</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Use our interactive calculator to see exactly what your white-label platform will cost, including setup fees and annual service costs.
              </p>
            </div>
            <div className="max-w-4xl mx-auto" ref={calculatorRef}>
              <WhiteLabelCalculator />
            </div>
          </div>
        </section>

        {/* Optional Feature Add-Ons */}
        <section id="addons" className="py-20 bg-black/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Optional Feature Add-Ons</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Customize your white-label platform even further with these powerful feature modules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Producer Onboarding */}
              <div className="bg-white/5 p-6 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white">Producer Onboarding Process</h3>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Included in Pro+</span>
                </div>
                <p className="text-gray-300 mb-4">
                  Let producers apply to join your library. Applications are automatically ranked by genre to help you select the best fits.
                </p>
                <p className="text-blue-400 font-bold mb-4">$249</p>
                <a href="#contact" className="text-blue-400 hover:underline">Add to My Demo Request</a>
              </div>

              {/* AI Search Assistance */}
              <div className="bg-white/5 p-6 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white">AI Search Assistance</h3>
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Pro Plan Only</span>
                </div>
                <p className="text-gray-300 mb-4">
                  Help clients discover music based on their previous searches, favorites, or licensed tracks. AI-driven suggestions in real time.
                </p>
                <p className="text-blue-400 font-bold mb-4">$249</p>
                <a href="#contact" className="text-blue-400 hover:underline">Add to My Demo Request</a>
              </div>

              {/* Deep Media Search Options */}
              <div className="bg-white/5 p-6 rounded-xl border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-white">Deep Media Search Options</h3>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Included in Enterprise</span>
                </div>
                <p className="text-gray-300 mb-4">
                  Let producers tag tracks with recommended media types (TV shows, films, commercials, podcasts, YouTube, etc.). Add media filters for your clients.
                </p>
                <p className="text-blue-400 font-bold mb-4">$249</p>
                <a href="#contact" className="text-blue-400 hover:underline">Add to My Demo Request</a>
              </div>
            </div>

            {/* Bundle Discounts */}
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Bundle and Save</h3>
              <ul className="text-gray-300 space-y-2">
                <li>✅ Any 2 Add-Ons for <span className="text-blue-400 font-bold">$449</span> (Save $49)</li>
                <li>✅ All 3 Add-Ons for <span className="text-blue-400 font-bold">$599</span> (Save $148)</li>
                <li>✅ <span className="text-purple-400 font-bold">Pro Plan</span> includes Producer Onboarding for free!</li>
                <li>✅ <span className="text-green-400 font-bold">Enterprise Plan</span> includes all 3 add-ons for free!</li>
              </ul>
              <a href="#contact" className="mt-4 inline-block py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 transition-colors">
                Request Bundle Pricing
              </a>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-black/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Our Partners Say</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Join the growing number of businesses using our white-label solution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
                <p className="text-gray-300 mb-6 italic">
                  "We launched our music licensing platform in just two weeks. The crypto payment integration was seamless and our producers love getting paid in USDC."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-lg mr-3">
                    JD
                  </div>
                  <div>
                    <p className="text-white font-medium">James Davis</p>
                    <p className="text-gray-400 text-sm">SoundSync Media</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
                <p className="text-gray-300 mb-6 italic">
                  "The AI tagging feature saved us countless hours of manual work. Our catalog is now perfectly organized and searchable without any effort from our team."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-lg mr-3">
                    ML
                  </div>
                  <div>
                    <p className="text-white font-medium">Maria Lopez</p>
                    <p className="text-gray-400 text-sm">Harmony Tracks</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
                <p className="text-gray-300 mb-6 italic">
                  "The ROI has been incredible. We've grown our licensing business by 300% in six months with minimal overhead thanks to the automated systems."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-lg mr-3">
                    RK
                  </div>
                  <div>
                    <p className="text-white font-medium">Robert Kim</p>
                    <p className="text-gray-400 text-sm">Elevate Audio</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="contact" className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-sm p-8 rounded-xl border border-blue-500/20">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Get Started Today</h2>
              <p className="text-gray-300 mb-8 text-center">
                Fill out the form below and our team will contact you to discuss your white-label solution.
              </p>

              {success ? (
                <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">Message Sent Successfully!</h3>
                  <p className="text-gray-300">
                    Thank you for your interest in our white-label solution. Our team will contact you shortly to discuss your needs.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-center">{error}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Your Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tell us about your needs
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      className="w-full"
                      placeholder="What kind of music licensing platform are you looking to build? What features are most important to you?"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Request Information'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-black/30">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">How long does it take to launch?</h3>
                <p className="text-gray-300">
                  Most white-label platforms can be set up and launched within 2-4 weeks, depending on the level of customization required. Our Pro and Enterprise plans include expedited setup.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">Can I migrate my existing catalog?</h3>
                <p className="text-gray-300">
                  Yes, we offer data migration services to import your existing music catalog, user accounts, and licensing history. This is included in Pro and Enterprise plans.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">How do producer payments work?</h3>
                <p className="text-gray-300">
                  You can set custom commission rates for each producer or track. Payments are processed automatically via Stripe. 
                  Your platform can accept crypto payments from customers, which are automatically converted to USD and paid out to producers' bank accounts.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">What kind of support is included?</h3>
                <p className="text-gray-300">
                  All plans include technical support. Starter plans include email support with 48-hour response time. Pro plans include priority email and chat support. Enterprise plans include dedicated account managers and 24/7 emergency support.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20">
                <h3 className="text-xl font-semibold text-white mb-3">Can I customize the licensing terms?</h3>
                <p className="text-gray-300">
                  Absolutely. We'll work with you to create custom license agreements that match your business model and legal requirements. This includes territory restrictions, usage rights, and duration terms.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
