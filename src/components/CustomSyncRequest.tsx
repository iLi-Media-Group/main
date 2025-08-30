import React, { useState, useEffect } from 'react';
import { Calendar, Music, Link as LinkIcon, FileText, Mail, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';
import { GENRES, SUB_GENRES } from '../types';
import { ProducerSearch } from './ProducerSearch';
import { RightsHolderSearch } from './RightsHolderSearch';
import { useNavigate } from 'react-router-dom';

export default function CustomSyncRequest() {
  const { user } = useUnifiedAuth();
  const navigate = useNavigate();
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [syncFee, setSyncFee] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSubGenres, setSelectedSubGenres] = useState<string[]>([]);
  const [referenceArtist, setReferenceArtist] = useState('');
  const [referenceSong, setReferenceSong] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [isOpenRequest, setIsOpenRequest] = useState(false);
  const [hasPreferredProducer, setHasPreferredProducer] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState('');
  const [hasPreferredRightsHolder, setHasPreferredRightsHolder] = useState(false);
  const [selectedRightsHolder, setSelectedRightsHolder] = useState('');
  const [submissionInstructions, setSubmissionInstructions] = useState('');
  const [submissionEmail, setSubmissionEmail] = useState('');
  const [useClientContract, setUseClientContract] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('immediate');
  const [isAgent, setIsAgent] = useState(false);
  const [agentCommissionPercentage, setAgentCommissionPercentage] = useState(20);
  const [showCommissionBreakdown, setShowCommissionBreakdown] = useState(false);

  // Check if user is an agent and load their default commission
  useEffect(() => {
    const checkAgentStatus = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_agent, agent_commission_percentage')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        if (profile?.is_agent) {
          setIsAgent(true);
          setAgentCommissionPercentage(profile.agent_commission_percentage || 20);
        }
      } catch (err) {
        console.error('Error checking agent status:', err);
      }
    };
    
    checkAgentStatus();
  }, [user]);

  // Calculate commission breakdown
  const calculateCommissionBreakdown = () => {
    const totalAmount = parseFloat(syncFee) || 0;
    const mybeatfiFee = totalAmount * 0.10; // 10% to MyBeatFi
    const remainingAmount = totalAmount * 0.90; // 90% to talent
    const agentCommission = remainingAmount * (agentCommissionPercentage / 100);
    const talentCompensation = remainingAmount - agentCommission;
    
    return {
      totalAmount,
      mybeatfiFee,
      remainingAmount,
      agentCommission,
      talentCompensation
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('custom_sync_requests')
        .insert({
          client_id: user.id,
          project_title: projectTitle,
          project_description: projectDescription,
          sync_fee: parseFloat(syncFee),
          end_date: endDate,
          genre: selectedGenre,
          sub_genres: selectedSubGenres.length > 0 ? selectedSubGenres : [],
          reference_artist: referenceArtist || null,
          reference_song: referenceSong || null,
          reference_url: referenceUrl || null,
          is_open_request: isOpenRequest,
          preferred_producer_id: hasPreferredProducer ? selectedProducer : null,
          preferred_rights_holder_id: hasPreferredRightsHolder ? selectedRightsHolder : null,
          submission_instructions: submissionInstructions,
          submission_email: submissionEmail,
          payment_terms: paymentTerms,
          use_client_contract: useClientContract,
          agent_commission_percentage: isAgent ? agentCommissionPercentage : 0,
          agent_id: isAgent ? user.id : null,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/dashboard');
        // Reset form
        setProjectTitle('');
        setProjectDescription('');
        setSyncFee('');
        setEndDate('');
        setSelectedGenre('');
        setSelectedSubGenres([]);
        setReferenceArtist('');
        setReferenceSong('');
        setReferenceUrl('');
        setIsOpenRequest(false);
        setHasPreferredProducer(false);
        setSelectedProducer('');
        setHasPreferredRightsHolder(false);
        setSelectedRightsHolder('');
        setSubmissionInstructions('');
        setSubmissionEmail('');
        setPaymentTerms('immediate');
      }, 3000);
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Create Custom Sync Request</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-center">Sync request submitted successfully!</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Title
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Project Description
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={4}
              className="w-full"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sync Fee Budget
              </label>
              <input
                type="number"
                value={syncFee}
                onChange={(e) => setSyncFee(e.target.value)}
                className="w-full"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Submission End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Payment Terms
            </label>
            <select
              value={paymentTerms}
              onChange={e => setPaymentTerms(e.target.value)}
              className="w-full"
              required
            >
              <option value="immediate">Immediate</option>
              <option value="net30">Net 30</option>
              <option value="net60">Net 60</option>
              <option value="net90">Net 90</option>
            </select>
          </div>

          {isAgent && (
            <div className="space-y-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-300">Agent Commission</h3>
                <button
                  type="button"
                  onClick={() => setShowCommissionBreakdown(!showCommissionBreakdown)}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{showCommissionBreakdown ? 'Hide' : 'Show'} Breakdown</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Commission Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={agentCommissionPercentage}
                      onChange={(e) => setAgentCommissionPercentage(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 pr-8"
                      placeholder="20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Commission is calculated from the 90% that goes to talent
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Commission
                  </label>
                  <div className="text-2xl font-bold text-blue-400">
                    ${calculateCommissionBreakdown().agentCommission.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-400">
                    From ${calculateCommissionBreakdown().totalAmount.toFixed(2)} total deal
                  </p>
                </div>
              </div>

              {showCommissionBreakdown && (
                <div className="p-4 bg-blue-800/30 border border-blue-500/20 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-300 mb-3">Commission Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Deal Amount:</span>
                      <span className="text-white font-medium">${calculateCommissionBreakdown().totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">MyBeatFi Fee (10%):</span>
                      <span className="text-gray-400">-${calculateCommissionBreakdown().mybeatfiFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Remaining for Talent (90%):</span>
                      <span className="text-white font-medium">${calculateCommissionBreakdown().remainingAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-500/30 pt-2">
                      <span className="text-blue-300">Your Commission ({agentCommissionPercentage}%):</span>
                      <span className="text-blue-400 font-medium">-${calculateCommissionBreakdown().agentCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-500/30 pt-2">
                      <span className="text-green-300">Talent Compensation:</span>
                      <span className="text-green-400 font-medium">${calculateCommissionBreakdown().talentCompensation.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genre
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => {
                  setSelectedGenre(e.target.value);
                  setSelectedSubGenres([]);
                }}
                className="w-full"
                required
              >
                <option value="">Select Genre</option>
                {GENRES.map((genre) => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {selectedGenre && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sub-Genres (Optional)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {(SUB_GENRES[selectedGenre.toLowerCase() as keyof typeof SUB_GENRES] || []).map((subGenre) => (
                    <label key={subGenre} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSubGenres.includes(subGenre)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubGenres([...selectedSubGenres, subGenre]);
                          } else {
                            setSelectedSubGenres(selectedSubGenres.filter(sg => sg !== subGenre));
                          }
                        }}
                        className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-300">{subGenre}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white">Reference Track (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Artist Name
                </label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={referenceArtist}
                    onChange={(e) => setReferenceArtist(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Song Title
                </label>
                <div className="relative">
                  <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={referenceSong}
                    onChange={(e) => setReferenceSong(e.target.value)}
                    className="w-full pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reference URL
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  className="w-full pl-10"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isOpenRequest}
                onChange={(e) => {
                  setIsOpenRequest(e.target.checked);
                  if (e.target.checked) {
                    setHasPreferredProducer(false);
                    setSelectedProducer('');
                    setHasPreferredRightsHolder(false);
                    setSelectedRightsHolder('');
                  }
                }}
                className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-300">Make this an open request (visible to all producers, record labels, and publishers)</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hasPreferredProducer}
                onChange={(e) => {
                  setHasPreferredProducer(e.target.checked);
                  if (e.target.checked) {
                    setIsOpenRequest(false);
                  } else {
                    setSelectedProducer('');
                  }
                }}
                className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-300">Select Preferred Producer</span>
            </label>

            <div className="pl-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Typing the Producer Name and Choose
              </label>
              <ProducerSearch
                value={selectedProducer}
                onChange={setSelectedProducer}
                disabled={!hasPreferredProducer}
                required={hasPreferredProducer}
              />
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hasPreferredRightsHolder}
                onChange={(e) => {
                  setHasPreferredRightsHolder(e.target.checked);
                  if (e.target.checked) {
                    setIsOpenRequest(false);
                  } else {
                    setSelectedRightsHolder('');
                  }
                }}
                className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-300">Select Preferred Record Label or Publisher</span>
            </label>

            <div className="pl-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Typing the Record Label or Publisher Name and Choose
              </label>
              <RightsHolderSearch
                value={selectedRightsHolder}
                onChange={setSelectedRightsHolder}
                disabled={!hasPreferredRightsHolder}
                required={hasPreferredRightsHolder}
              />
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useClientContract}
                onChange={(e) => setUseClientContract(e.target.checked)}
                className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-300">I will provide my own contract with terms for this sync</span>
            </label>
            
            {useClientContract && (
              <div className="p-4 bg-blue-800/50 border border-blue-600/30 rounded-lg">
                <p className="text-blue-200 text-sm">
                  <strong>Note:</strong> If your request is accepted, you will be able to upload your contract PDF. 
                  The producer/artist will need to sign your contract before files are made available.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Special Instructions
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={submissionInstructions}
                  onChange={(e) => setSubmissionInstructions(e.target.value)}
                  rows={4}
                  className="w-full pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Sync Request'}
          </button>
        </form>
      </div>
    </div>
  );
} 
