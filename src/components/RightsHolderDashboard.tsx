import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRightsHolderAuth } from '../contexts/RightsHolderAuthContext';
import { supabase } from '../lib/supabase';
import { 
  Building2, 
  Music, 
  FileText, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Upload,
  Settings,
  BarChart3,
  DollarSign,
  Calendar,
  ArrowRight,
  Mail
} from 'lucide-react';

interface DashboardStats {
  totalRecordings: number;
  pendingVerifications: number;
  activeLicenses: number;
  totalRevenue: number;
}

interface RecentActivity {
  id: string;
  type: 'upload' | 'verification' | 'license' | 'split_sheet';
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
}

export function RightsHolderDashboard() {
  const { rightsHolder, rightsHolderProfile } = useRightsHolderAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRecordings: 0,
    pendingVerifications: 0,
    activeLicenses: 0,
    totalRevenue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rightsHolder) {
      fetchDashboardData();
    } else {
      // If no rightsHolder, still set loading to false to show empty state
      setLoading(false);
    }
  }, [rightsHolder]);

  const fetchDashboardData = async () => {
    if (!rightsHolder) {
      console.log('No rightsHolder available, skipping dashboard data fetch');
      return;
    }

    console.log('Fetching dashboard data for rightsHolder:', rightsHolder.id);
    try {
      setLoading(true);

      // Initialize stats with default values
      let recordingsCount = 0;
      let pendingCount = 0;
      let licensesCount = 0;

      // Try to fetch master recordings count (handle missing table gracefully)
      try {
        const { count } = await supabase
          .from('master_recordings')
          .select('*', { count: 'exact', head: true })
          .eq('rights_holder_id', rightsHolder.id);
        recordingsCount = count || 0;
      } catch (error) {
        console.log('master_recordings table not found, using default value');
        recordingsCount = 0;
      }

      // Try to fetch pending verifications (handle missing table gracefully)
      try {
        const { count } = await supabase
          .from('master_recordings')
          .select('*', { count: 'exact', head: true })
          .eq('rights_holder_id', rightsHolder.id)
          .eq('rights_verification_status', 'pending');
        pendingCount = count || 0;
      } catch (error) {
        console.log('Could not fetch pending verifications, using default value');
        pendingCount = 0;
      }

      // Try to fetch active licenses (handle missing table gracefully)
      try {
        const { count } = await supabase
          .from('rights_licenses')
          .select('*', { count: 'exact', head: true })
          .eq('license_status', 'active');
        licensesCount = count || 0;
      } catch (error) {
        console.log('rights_licenses table not found, using default value');
        licensesCount = 0;
      }

      // Fetch total revenue (placeholder for now)
      const totalRevenue = 0; // This would be calculated from actual license data

      setStats({
        totalRecordings: recordingsCount,
        pendingVerifications: pendingCount,
        activeLicenses: licensesCount,
        totalRevenue,
      });

      // Try to fetch recent activity (handle missing table gracefully)
      try {
        const { data: activityData } = await supabase
          .from('master_recordings')
          .select('id, title, rights_verification_status, admin_review_status, created_at')
          .eq('rights_holder_id', rightsHolder.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (activityData) {
          const activity: RecentActivity[] = activityData.map(recording => ({
            id: recording.id,
            type: 'upload',
            title: recording.title,
            description: `Recording uploaded`,
            status: recording.rights_verification_status === 'verified' ? 'approved' : 'pending',
            created_at: recording.created_at,
          }));
          setRecentActivity(activity);
        } else {
          setRecentActivity([]);
        }
      } catch (error) {
        console.log('Could not fetch recent activity, using empty array');
        setRecentActivity([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default values on error
      setStats({
        totalRecordings: 0,
        pendingVerifications: 0,
        activeLicenses: 0,
        totalRevenue: 0,
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {rightsHolder.company_name}
              </h1>
              <p className="text-gray-300 mt-1">
                {rightsHolder.rights_holder_type === 'record_label' ? 'Record Label' : 'Publisher'} Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/rights-holder/settings"
                className="p-2 text-gray-300 hover:text-white transition-colors"
              >
                <Settings className="w-6 h-6" />
              </Link>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Music className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Recordings</p>
                <p className="text-2xl font-bold text-white">{stats.totalRecordings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Pending Verifications</p>
                <p className="text-2xl font-bold text-white">{stats.pendingVerifications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <FileText className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Active Licenses</p>
                <p className="text-2xl font-bold text-white">{stats.activeLicenses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/rights-holder/upload"
                  className="flex items-center p-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors group"
                >
                  <Upload className="w-5 h-5 text-blue-400 mr-3" />
                  <span className="text-white">Upload New Recording</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/recordings"
                  className="flex items-center p-3 bg-orange-600/20 hover:bg-orange-600/30 rounded-lg transition-colors group"
                >
                  <Music className="w-5 h-5 text-orange-400 mr-3" />
                  <span className="text-white">Manage Recordings</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/split-sheets"
                  className="flex items-center p-3 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors group"
                >
                  <FileText className="w-5 h-5 text-green-400 mr-3" />
                  <span className="text-white">Manage Split Sheets</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/analytics"
                  className="flex items-center p-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-colors group"
                >
                  <BarChart3 className="w-5 h-5 text-purple-400 mr-3" />
                  <span className="text-white">View Analytics</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/licensing"
                  className="flex items-center p-3 bg-teal-600/20 hover:bg-teal-600/30 rounded-lg transition-colors group"
                >
                  <FileText className="w-5 h-5 text-teal-400 mr-3" />
                  <span className="text-white">Licensing & Revenue</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/e-signatures"
                  className="flex items-center p-3 bg-indigo-600/20 hover:bg-indigo-600/30 rounded-lg transition-colors group"
                >
                  <Mail className="w-5 h-5 text-indigo-400 mr-3" />
                  <span className="text-white">E-Signatures</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/rights-holder/profile"
                  className="flex items-center p-3 bg-gray-600/20 hover:bg-gray-600/30 rounded-lg transition-colors group"
                >
                  <Users className="w-5 h-5 text-gray-400 mr-3" />
                  <span className="text-white">Update Profile</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                <Link
                  to="/rights-holder/activity"
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  View all
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No recent activity</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Start by uploading your first recording
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center p-4 bg-gray-800/30 rounded-lg"
                    >
                      {getStatusIcon(activity.status)}
                      <div className="ml-3 flex-1">
                        <p className="text-white font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-400">{activity.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Account Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <p className="text-gray-300">Verification Status</p>
                  <p className={`font-medium ${getStatusColor(rightsHolder.verification_status)}`}>
                    {rightsHolder.verification_status.charAt(0).toUpperCase() + rightsHolder.verification_status.slice(1)}
                  </p>
                </div>
                {getStatusIcon(rightsHolder.verification_status)}
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <p className="text-gray-300">Account Type</p>
                  <p className="font-medium text-white">
                    {rightsHolder.rights_holder_type === 'record_label' ? 'Record Label' : 'Publisher'}
                  </p>
                </div>
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>

                             <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                 <div>
                   <p className="text-gray-300">Terms Accepted</p>
                   <p className="font-medium text-green-400">
                     {rightsHolder.terms_accepted ? 'Yes' : 'No'}
                   </p>
                 </div>
                 {rightsHolder.terms_accepted ? (
                   <CheckCircle className="w-5 h-5 text-green-400" />
                 ) : (
                   <AlertCircle className="w-5 h-5 text-red-400" />
                 )}
               </div>

               <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                 <div>
                   <p className="text-gray-300">Rights Authority Declaration</p>
                   <p className="font-medium text-green-400">
                     {rightsHolder.rights_authority_declaration_accepted ? 'Accepted' : 'Pending'}
                   </p>
                 </div>
                 {rightsHolder.rights_authority_declaration_accepted ? (
                   <CheckCircle className="w-5 h-5 text-green-400" />
                 ) : (
                   <AlertCircle className="w-5 h-5 text-red-400" />
                 )}
               </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                <div>
                  <p className="text-gray-300">Member Since</p>
                  <p className="font-medium text-white">
                    {formatDate(rightsHolder.created_at)}
                  </p>
                </div>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
