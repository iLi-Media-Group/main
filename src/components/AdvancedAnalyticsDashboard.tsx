import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { CalendarDays, FileText, Download, TrendingUp, AlertTriangle, Sparkles, BarChart3, Users, DollarSign, Music, Eye, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { supabase } from '../lib/supabase';

// Sample data - in production, this would come from your database
const revenueData = [
  { month: 'Jan', total: 3200, licenses: 45, clients: 12 },
  { month: 'Feb', total: 4100, licenses: 52, clients: 15 },
  { month: 'Mar', total: 5300, licenses: 68, clients: 18 },
  { month: 'Apr', total: 4900, licenses: 61, clients: 16 },
  { month: 'May', total: 6700, licenses: 89, clients: 22 },
  { month: 'Jun', total: 7400, licenses: 95, clients: 25 },
];

const licenseData = [
  { name: 'Client A', licenses: 3, revenue: 450 },
  { name: 'Client B', licenses: 5, revenue: 750 },
  { name: 'Client C', licenses: 2, revenue: 300 },
  { name: 'Client D', licenses: 7, revenue: 1050 },
  { name: 'Client E', licenses: 4, revenue: 600 },
];

const churnData = [
  { name: 'Client A', churnRisk: 80, lastActivity: '2024-01-15' },
  { name: 'Client B', churnRisk: 45, lastActivity: '2024-01-20' },
  { name: 'Client C', churnRisk: 20, lastActivity: '2024-01-25' },
  { name: 'Client D', churnRisk: 65, lastActivity: '2024-01-10' },
  { name: 'Client E', churnRisk: 30, lastActivity: '2024-01-22' },
];

const topTracks = [
  { title: 'Dreamscape', plays: 98, licenses: 6, revenue: 900 },
  { title: 'Midnight Vibe', plays: 120, licenses: 9, revenue: 1350 },
  { title: 'Sunset Rush', plays: 87, licenses: 4, revenue: 600 },
  { title: 'Ocean Waves', plays: 156, licenses: 12, revenue: 1800 },
  { title: 'Urban Pulse', plays: 134, licenses: 8, revenue: 1200 },
];

const forecastData = [
  { month: 'Jul', projected: 7800, actual: 7400 },
  { month: 'Aug', projected: 8100, actual: null },
  { month: 'Sep', projected: 8500, actual: null },
  { month: 'Oct', projected: 8900, actual: null },
];

const genreData = [
  { name: 'Hip Hop', value: 35, color: '#3b82f6' },
  { name: 'Pop', value: 25, color: '#10b981' },
  { name: 'Electronic', value: 20, color: '#f59e0b' },
  { name: 'Cinematic', value: 15, color: '#ef4444' },
  { name: 'Other', value: 5, color: '#8b5cf6' },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AdvancedAnalyticsDashboard() {
  const { user, accountType } = useAuth();
  const { isEnabled: hasAnalyticsAccess, loading: featureLoading } = useFeatureFlag('advanced_analytics');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedRange, setSelectedRange] = useState('last_30_days');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user has access to advanced analytics
  const hasAccess = accountType === 'admin' || hasAnalyticsAccess;

  useEffect(() => {
    if (hasAccess) {
      fetchAiRecommendations();
    }
  }, [hasAccess]);

  const fetchAiRecommendations = async () => {
    try {
      setLoading(true);
      // In production, this would call your AI recommendations endpoint
      const mockSuggestions = [
        { suggestion: "Consider adding more cinematic tracks - 23% of searches are for this genre" },
        { suggestion: "Client engagement peaks on Tuesdays - schedule releases accordingly" },
        { suggestion: "Top 3 clients account for 45% of revenue - focus on retention strategies" },
        { suggestion: "Average license value increased 12% this month - pricing optimization working" },
        { suggestion: "Consider bundle deals for clients with high churn risk" }
      ];
      setAiSuggestions(mockSuggestions);
    } catch (err) {
      console.error('AI Recommendations fetch error:', err);
      setError('Failed to load AI recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setLoading(true);
      // In production, this would call your export endpoint
      console.log(`Exporting ${format} report...`);
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`${format.toUpperCase()} export completed!`);
    } catch (err) {
      console.error('Export error:', err);
      setError(`Failed to export ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // Show access denied if user doesn't have permission
  if (!featureLoading && !hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-300">
            Advanced Analytics is only available for administrators and Enterprise White Label clients.
          </p>
        </div>
      </div>
    );
  }

  if (featureLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Advanced Analytics Dashboard</h1>
              <p className="text-gray-300">Comprehensive insights and reporting for your music licensing business</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {accountType === 'admin' ? 'Administrator Access' : 'Enterprise Access'}
              </span>
            </div>
          </div>

          {/* Filters and Export Controls */}
          <div className="flex flex-wrap justify-between gap-4 mb-6">
            <div className="flex gap-2">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 backdrop-blur-sm"
              >
                <option value="all">All Genres</option>
                <option value="hiphop">Hip Hop</option>
                <option value="pop">Pop</option>
                <option value="electronic">Electronic</option>
                <option value="cinematic">Cinematic</option>
              </select>

              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white border border-white/20 backdrop-blur-sm"
              >
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex gap-2 items-center bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => handleExport('csv')}
                disabled={loading}
              >
                <Download className="w-4 h-4" /> CSV
              </Button>
              <Button 
                variant="outline" 
                className="flex gap-2 items-center bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => handleExport('pdf')}
                disabled={loading}
              >
                <FileText className="w-4 h-4" /> PDF
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-400">{error}</span>
            </div>
          )}
        </div>

        {/* Analytics Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Revenue Chart */}
          <Card className="md:col-span-2">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Monthly Revenue & Performance
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.3}
                    name="Revenue ($)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="licenses" 
                    stackId="2"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                    name="Licenses" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Licenses Per Client */}
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Licenses Per Client
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={licenseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.7)" />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="licenses" fill="#10b981" name="Licenses" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performing Tracks */}
          <Card className="xl:col-span-1 md:col-span-2">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                Top Performing Tracks
              </h2>
              <div className="space-y-3">
                {topTracks.map((track, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{track.title}</div>
                        <div className="text-sm text-gray-400">
                          Plays: {track.plays} | Licenses: {track.licenses} | Revenue: ${track.revenue}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">${track.revenue}</div>
                        <div className="text-xs text-gray-400">Revenue</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Genre Distribution */}
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                Genre Distribution
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Forecast */}
          <Card className="xl:col-span-2">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Revenue Forecast (Next 3 Months)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                  <YAxis stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="projected" fill="#f59e0b" name="Projected ($)" />
                  <Bar dataKey="actual" fill="#10b981" name="Actual ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Client Churn Risk */}
          <Card className="xl:col-span-3">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Client Churn Risk Analysis
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={churnData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" domain={[0, 100]} stroke="rgba(255,255,255,0.7)" />
                  <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.7)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="churnRisk" fill="#ef4444" name="Churn Risk (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="xl:col-span-3">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                AI-Powered Business Insights
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Strategic Recommendations</h3>
                  <ul className="list-disc pl-6 space-y-2 text-white/90">
                    {aiSuggestions.map((item, idx) => (
                      <li key={idx} className="text-sm">{item.suggestion}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Key Metrics</h3>
                  <div className="space-y-3">
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">$74,400</div>
                      <div className="text-sm text-gray-400">Total Revenue (YTD)</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">156</div>
                      <div className="text-sm text-gray-400">Active Clients</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">89%</div>
                      <div className="text-sm text-gray-400">Client Retention Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 