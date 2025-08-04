import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-xl p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-4">Payment Successful!</h1>
        <p className="text-gray-300 mb-6">Your payment has been processed successfully. You can now access your dashboard.</p>
        <Link to="/dashboard" className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Go to Dashboard</Link>
      </div>
    </div>
  );
} 