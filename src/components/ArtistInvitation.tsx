import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, User, X, CheckCircle, AlertCircle, Copy, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  artistNumber: string;
  invitationCode: string;
}

export function ArtistInvitation() {
  const { user } = useUnifiedAuth();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [artistNumber, setArtistNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [invitationSent, setInvitationSent] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('artist_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
    }
  };

  const generateInvitationCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 32 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  };

  const getNextArtistNumber = async () => {
    try {
      const { data, error } = await supabase.rpc('get_next_artist_number');
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error getting next artist number:', err);
      // Fallback: get the highest number and increment
      const { data: existingNumbers } = await supabase
        .from('artist_invitations')
        .select('artist_number')
        .order('artist_number', { ascending: false })
        .limit(1);

      if (existingNumbers && existingNumbers.length > 0) {
        const lastNumber = existingNumbers[0].artist_number;
        const match = lastNumber.match(/MBAR-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          return `MBAR-${nextNum.toString().padStart(2, '0')}`;
        }
      }
      return 'MBAR-01';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);

    try {
      if (!user?.email) {
        throw new Error('Admin email not found');
      }

      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!firstName.trim() || !lastName.trim()) {
        throw new Error('First name and last name are required');
      }

      if (!artistNumber.match(/^MBAR-\d{2}$/)) {
        throw new Error('Invalid artist number format. Must be MBAR-XX');
      }

      // Check if artist number already exists
      const { data: existingNumber } = await supabase
        .from('profiles')
        .select('id')
        .eq('artist_number', artistNumber)
        .maybeSingle();

      if (existingNumber) {
        throw new Error('This artist number is already in use');
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, account_type')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        throw new Error('This email is already registered');
      }

      const invitationCode = generateInvitationCode();

      const { error: insertError } = await supabase
        .from('artist_invitations')
        .insert({
          email,
          first_name: firstName,
          last_name: lastName,
          invitation_code: invitationCode,
          created_by: user.id,
          artist_number: artistNumber
        });

      if (insertError) throw insertError;

      // Store invitation data for email sending
      setInvitationData({
        email,
        firstName,
        lastName,
        artistNumber,
        invitationCode
      });
      
      setSuccess('Artist invitation created successfully');
      setInvitationSent(true);
      
      // Clear form
      setEmail('');
      setFirstName('');
      setLastName('');
      setArtistNumber('');
      
      // Refresh invitations list
      fetchInvitations();

    } catch (err) {
      console.error('Error creating invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickInvite = async () => {
    try {
      setLoading(true);
      setError('');
      
      const nextNumber = await getNextArtistNumber();
      setArtistNumber(nextNumber);
      
      setSuccess('Artist number generated. Please fill in the details and submit.');
    } catch (err) {
      setError('Failed to generate artist number');
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationCode = () => {
    if (invitationData) {
      navigator.clipboard.writeText(invitationData.invitationCode);
      setSuccess('Invitation code copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const sendInvitationEmail = async () => {
    if (!invitationData) return;

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('send-artist-invitation', {
        body: {
          email: invitationData.email,
          firstName: invitationData.firstName,
          lastName: invitationData.lastName,
          artistNumber: invitationData.artistNumber,
          invitationCode: invitationData.invitationCode
        }
      });

      if (error) throw error;

      setSuccess('Invitation email sent successfully!');
      setInvitationData(null);
      setInvitationSent(false);
    } catch (err) {
      setError('Failed to send invitation email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <UserPlus className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold text-white">Artist Invitation Management</h1>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-lg flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400">{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Invitation Form */}
          <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Create Artist Invitation</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                    required
                    disabled={loading}
                    placeholder="artist@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      required
                      disabled={loading}
                      placeholder="John"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                      required
                      disabled={loading}
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artist Number
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={artistNumber}
                    onChange={(e) => setArtistNumber(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
                    required
                    disabled={loading}
                    placeholder="MBAR-01"
                    pattern="^MBAR-\d{2}$"
                  />
                  <button
                    type="button"
                    onClick={handleQuickInvite}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Auto
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Format: MBAR-XX (e.g., MBAR-01, MBAR-02)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Invitation'}
              </button>
            </form>
          </div>

          {/* Invitation Details */}
          <div className="bg-white/5 border border-blue-500/20 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Invitation Details</h2>
            
            {invitationSent && invitationData ? (
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">Invitation Created Successfully!</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p><strong>Email:</strong> {invitationData.email}</p>
                    <p><strong>Name:</strong> {invitationData.firstName} {invitationData.lastName}</p>
                    <p><strong>Artist Number:</strong> {invitationData.artistNumber}</p>
                    <p><strong>Invitation Code:</strong> {invitationData.invitationCode}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={copyInvitationCode}
                    className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Code</span>
                  </button>
                  <button
                    onClick={sendInvitationEmail}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Email</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Create an invitation to see details here</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Invitations */}
        <div className="mt-8 bg-white/5 border border-blue-500/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Invitations</h2>
          
          {invitations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-500/20">
                    <th className="text-left py-2 text-gray-300">Email</th>
                    <th className="text-left py-2 text-gray-300">Name</th>
                    <th className="text-left py-2 text-gray-300">Artist Number</th>
                    <th className="text-left py-2 text-gray-300">Status</th>
                    <th className="text-left py-2 text-gray-300">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.slice(0, 10).map((invitation) => (
                    <tr key={invitation.id} className="border-b border-blue-500/10">
                      <td className="py-2 text-gray-300">{invitation.email}</td>
                      <td className="py-2 text-gray-300">{invitation.first_name} {invitation.last_name}</td>
                      <td className="py-2 text-gray-300">{invitation.artist_number}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          invitation.used 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {invitation.used ? 'Used' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-2 text-gray-300">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-400 text-center py-8">
              <p>No invitations created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
