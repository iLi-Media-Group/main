import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Loader2, CheckCircle, XCircle } from 'lucide-react';

export function WelcomeEmailTest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setResult(null);

    try {
      console.log('Testing welcome email for:', email);
      
      const { error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email: email,
          first_name: 'Test User',
          account_type: 'client'
        }
      });

      if (error) {
        console.error('Welcome email test failed:', error);
        setResult({
          success: false,
          message: `Failed to send welcome email: ${error.message}`
        });
      } else {
        console.log('Welcome email test successful');
        setResult({
          success: true,
          message: 'Welcome email sent successfully! Check your inbox.'
        });
      }
    } catch (err: any) {
      console.error('Welcome email test error:', err);
      setResult({
        success: false,
        message: `Error: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-blue-500/20 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <Mail className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Email Test</h1>
          <p className="text-gray-300">
            Test the welcome email functionality by sending a test email
          </p>
        </div>

        <form onSubmit={handleTestEmail} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to test"
              required
              className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Sending Test Email...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Send Test Welcome Email
              </>
            )}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg flex items-center ${
            result.success 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 mr-2" />
            )}
            <span>{result.message}</span>
          </div>
        )}

        <div className="mt-6 text-sm text-gray-400">
          <p className="mb-2"><strong>What this tests:</strong></p>
          <ul className="space-y-1 text-xs">
            <li>• Welcome email Edge Function connectivity</li>
            <li>• Resend API integration</li>
            <li>• PDF attachment generation</li>
            <li>• Email delivery to your inbox</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
