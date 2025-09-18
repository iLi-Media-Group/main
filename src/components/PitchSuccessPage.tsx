import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function PitchSuccessPage() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    const redirect = setTimeout(() => {
      window.location.replace('/dashboard');
    }, 10000);
    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-lg w-full text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Subscription Activated</h1>
        <p className="text-gray-300 mb-4">Your MyBeatFi Pitch Service is now active.</p>
        <p className="text-gray-400">Redirecting to your dashboard in {countdown}s…</p>
      </div>
    </div>
  );
}
