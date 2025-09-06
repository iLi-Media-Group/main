import React, { useState, useEffect } from 'react';
import { X, BarChart3, TrendingUp, Calendar, Users, Play } from 'lucide-react';
import { getDailyPlaysForTrack, getTopTracksThisMonth } from '../lib/trackPlays';

interface TrackAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: {
    id: string;
    title: string;
    play_count: number;
  };
}

interface AnalyticsData {
  totalPlays: number;
  dailyPlays: Array<{
    day: string;
    plays: number;
  }>;
  topTracksThisMonth: Array<{
    title: string;
    plays: number;
  }>;
}

export function TrackAnalyticsModal({ isOpen, onClose, track }: TrackAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && track) {
      fetchAnalytics();
    }
  }, [isOpen, track]);

  const fetchAnalytics = async () => {
    if (!track) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch daily plays trend for this track
      const dailyPlaysData = await getDailyPlaysForTrack(track.id);

      // Fetch top tracks this month
      const topTracksData = await getTopTracksThisMonth();

      setAnalytics({
        totalPlays: track.play_count,
        dailyPlays: dailyPlaysData,
        topTracksThisMonth: topTracksData
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const maxPlays = analytics?.dailyPlays.reduce((max, day) => Math.max(max, day.plays), 0) || 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-blue-900/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-blue-500/20 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white">Track Analytics</h3>
            <p className="text-gray-400 mt-1">{track.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Total Plays */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Play className="w-6 h-6 text-blue-400" />
                <div>
                  <h4 className="text-lg font-semibold text-white">Total Plays</h4>
                  <p className="text-3xl font-bold text-blue-400">{analytics.totalPlays.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Daily Plays Chart */}
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h4 className="text-lg font-semibold text-white">Daily Plays (Last 30 Days)</h4>
              </div>
              
              <div className="space-y-2">
                {analytics.dailyPlays.slice(-7).map((day, index) => (
                  <div key={day.day} className="flex items-center space-x-3">
                    <div className="w-16 text-sm text-gray-400">
                      {formatDate(day.day)}
                    </div>
                    <div className="flex-1 bg-gray-700 rounded-full h-4 relative">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${(day.plays / maxPlays) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {day.plays}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Tracks This Month */}
            {analytics.topTracksThisMonth.length > 0 && (
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                  <h4 className="text-lg font-semibold text-white">Top Tracks This Month</h4>
                </div>
                
                <div className="space-y-2">
                  {analytics.topTracksThisMonth.slice(0, 5).map((track, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="text-white">{track.title}</span>
                      </div>
                      <span className="text-purple-400 font-semibold">
                        {track.plays.toLocaleString()} plays
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
