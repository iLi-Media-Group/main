import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  BarChart3, 
  Eye, 
  Play, 
  Clock, 
  TrendingUp, 
  Users, 
  Calendar,
  Music,
  Activity,
  Globe,
  Download,
  Heart
} from 'lucide-react';
import { PlaylistService } from '../lib/playlistService';
import { PlaylistAnalytics as PlaylistAnalyticsType } from '../types/playlist';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  totalTrackPlays: number;
  averageTimeOnPage: number;
  viewsByDay: Array<{ date: string; views: number }>;
  trackPlays: Array<{ trackTitle: string; plays: number }>;
  viewsByHour: Array<{ hour: string; views: number }>;
  topReferrers: Array<{ source: string; views: number }>;
  deviceTypes: Array<{ device: string; views: number }>;
  countries: Array<{ country: string; views: number }>;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

export function PlaylistAnalytics() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (playlistId) {
      loadAnalytics();
    }
  }, [playlistId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      if (!playlistId) return;

      const analyticsData = await PlaylistService.getPlaylistAnalytics(playlistId, timeRange);
      if (!analyticsData) {
        setError('Analytics not available');
        return;
      }

      // Transform the data for charts
      const transformedData: AnalyticsData = {
        totalViews: analyticsData.totalViews,
        uniqueVisitors: analyticsData.uniqueVisitors,
        totalTrackPlays: analyticsData.totalTrackPlays,
        averageTimeOnPage: analyticsData.averageTimeOnPage,
        viewsByDay: analyticsData.viewsByDay || [],
        trackPlays: analyticsData.trackPlays || [],
        viewsByHour: analyticsData.viewsByHour || [],
        topReferrers: analyticsData.topReferrers || [],
        deviceTypes: analyticsData.deviceTypes || [],
        countries: analyticsData.countries || []
      };

      setAnalytics(transformedData);
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-blue-900/90 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Analytics Unavailable</h1>
          <p className="text-gray-300">{error || 'No analytics data found for this playlist.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-900/90">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Playlist Analytics</h1>
              <p className="text-gray-300 mt-2">Track your playlist performance and audience engagement</p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="px-4 py-2 border border-gray-600 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm"
              >
                <option value="7d" className="bg-blue-900 text-white">Last 7 days</option>
                <option value="30d" className="bg-blue-900 text-white">Last 30 days</option>
                <option value="90d" className="bg-blue-900 text-white">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalViews)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.uniqueVisitors)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Track Plays</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalTrackPlays)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Time on Page</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(analytics.averageTimeOnPage)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Views Over Time */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Views Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.viewsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Track Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Track Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.trackPlays}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="trackTitle" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="plays" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Views by Hour */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Views by Hour of Day</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.viewsByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Device Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.deviceTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="views"
                >
                  {analytics.deviceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Referrers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Traffic Sources</h3>
            <div className="space-y-4">
              {analytics.topReferrers.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <span className="text-gray-900">{referrer.source}</span>
                  </div>
                  <span className="text-gray-600 font-medium">{formatNumber(referrer.views)} views</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
            <div className="space-y-4">
              {analytics.countries.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Globe className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-gray-900">{country.country}</span>
                  </div>
                  <span className="text-gray-600 font-medium">{formatNumber(country.views)} views</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {analytics.totalViews > 0 ? ((analytics.totalTrackPlays / analytics.totalViews) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-gray-600">Play Rate</p>
              <p className="text-sm text-gray-500">Percentage of visitors who played tracks</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {analytics.uniqueVisitors > 0 ? (analytics.totalViews / analytics.uniqueVisitors).toFixed(1) : 0}
              </div>
              <p className="text-gray-600">Views per Visitor</p>
              <p className="text-sm text-gray-500">Average views per unique visitor</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {analytics.totalTrackPlays > 0 ? (analytics.totalTrackPlays / analytics.trackPlays.length).toFixed(1) : 0}
              </div>
              <p className="text-gray-600">Plays per Track</p>
              <p className="text-sm text-gray-500">Average plays per track</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
