import React from 'react';

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="bg-white/10 p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold text-green-400 mb-4">Payment Successful!</h1>
        <p className="text-white mb-2">Thank you for your payment. Your custom sync request is now being processed.</p>
        <a href="/dashboard" className="mt-4 inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Go to Dashboard</a>
      </div>
    </div>
  );
} 