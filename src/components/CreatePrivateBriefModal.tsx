import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface CreatePrivateBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBriefCreated: () => void;
}

interface Agent {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
}

export function CreatePrivateBriefModal({ isOpen, onClose, onBriefCreated }: CreatePrivateBriefModalProps) {
  const { user } = useUnifiedAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState('');
  const [deadline, setDeadline] = useState('');
  const [submissionEmail, setSubmissionEmail] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [submissionInstructions, setSubmissionInstructions] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
      // Reset form
      setTitle('');
      setDescription('');
      setGenre('');
      setDeadline('');
      setSubmissionEmail('');
      setAssignedAgent('');
      setClientName('');
      setClientEmail('');
      setClientCompany('');
      setSubmissionInstructions('');
      setError(null);
    }
  }, [isOpen]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, display_name')
        .eq('is_agent', true)
        .order('display_name', { ascending: true });

      if (error) throw error;
      setAgents(data || []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError(null);

      // Debug: Check user profile and account type
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, account_type')
        .eq('id', user.id)
        .single();

      console.log('User profile data:', { profileData, profileError });
      console.log('User account type:', profileData?.account_type);

      // Validate required fields
      if (!title.trim()) {
        setError('Title is required');
        return;
      }
      if (!clientName.trim()) {
        setError('Client name is required');
        return;
      }
      if (!submissionEmail.trim()) {
        setError('Submission email is required');
        return;
      }

      const briefData = {
        title: title.trim(),
        description: description.trim() || null,
        client_name: clientName.trim(),
        client_email: clientEmail.trim() || null,
        client_company: clientCompany.trim() || null,
        brief_type: 'custom' as const,
        genre_requirements: genre.trim() ? [genre.trim()] : [],
        deadline: deadline ? new Date(deadline).toISOString() : null,
        submission_email: submissionEmail.trim(),
        submission_instructions: submissionInstructions.trim() || null,
        assigned_agent: assignedAgent || null,
        created_by: user.id,
        status: 'active' as const
      };

      console.log('Creating brief with data:', briefData);
      console.log('Current user ID:', user.id);

      const { data, error: insertError } = await supabase
        .from('pitch_opportunities')
        .insert(briefData)
        .select();

      console.log('Insert result:', { data, error: insertError });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      console.log('Brief created successfully:', data);
      onBriefCreated();
      onClose();
    } catch (err) {
      console.error('Error creating brief:', err);
      setError(err instanceof Error ? err.message : 'Failed to create brief');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-blue-900/90 backdrop-blur-md rounded-xl border border-purple-500/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Create Private Brief</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 text-red-200">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description and requirements"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Hip-Hop, Electronic, Rock"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Deadline
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Client Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Client or company name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Email
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="client@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Client Company
              </label>
              <input
                type="text"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Company name"
              />
            </div>
          </div>

          {/* Submission Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Submission Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Submission Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={submissionEmail}
                onChange={(e) => setSubmissionEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="submissions@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Submission Instructions
              </label>
              <textarea
                value={submissionInstructions}
                onChange={(e) => setSubmissionInstructions(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Special instructions for submissions"
              />
            </div>
          </div>

          {/* Agent Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Agent Assignment</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assign Agent
              </label>
              {loading ? (
                <div className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-gray-400">
                  Loading agents...
                </div>
              ) : (
                <select
                  value={assignedAgent}
                  onChange={(e) => setAssignedAgent(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No agent assigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.display_name || `${agent.first_name || ''} ${agent.last_name || ''}`.trim() || agent.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Brief
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
