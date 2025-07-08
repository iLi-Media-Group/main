import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const WhiteLabelSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirect to login after countdown
      window.location.href = '/login';
    }
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Your white label account has been created and a magic link has been sent to your email.
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
          <ol className="text-sm text-blue-800 space-y-1 text-left">
            <li>1. Check your email for the magic link</li>
            <li>2. Click the link to activate your account</li>
            <li>3. Log in to access your white label dashboard</li>
          </ol>
        </div>

        <div className="text-sm text-gray-500">
          Redirecting to login in {countdown} seconds...
        </div>
      </div>
    </div>
  );
};

export default WhiteLabelSuccessPage; 