import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Mail, User, Music, Calendar, Filter, Search, Eye, CheckCircle, Clock, XCircle, Save, ArrowUpDown, Star, UserPlus, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateRankingScore, applicationToRankingCriteria, RankingResult } from '../lib/rankingSystem';
import { useNavigate } from 'react-router-dom';

type ProducerApplication = {
  id: string;
  name: string;
  email: string;
  primary_genre: string;
  secondary_genre: string;
  years_experience: string;
  daws_used: string;
  team_type: string;
  tracks_per_week: string;
  instruments: string;
  sample_use: string;
  splice_use: string;
  loop_use: string;
  ai_generated_music: string;
  artist_collab: string;
  business_entity: string;
  pro_affiliation: string;
  additional_info: string;
  instrument_one: string;
  instrument_one_proficiency: string;
  instrument_two: string;
  instrument_two_proficiency: string;
  instrument_three: string;
  instrument_three_proficiency: string;
  instrument_four: string;
  instrument_four_proficiency: string;
  records_artists: string;
  artist_example_link: string;
  sync_licensing_course: string;
  quiz_question_1: string;
  quiz_question_2: string;
  quiz_question_3: string;
  quiz_question_4: string;
  quiz_question_5: string;
  quiz_score: number;
  quiz_total_questions: number;
  quiz_completed: boolean;
  status: string;
  review_tier: string | null;
  auto_disqualified: boolean;
  created_at: string;
  updated_at: string;
  ranking_score?: number;
  ranking_breakdown?: any;
  is_auto_rejected?: boolean;
  rejection_reason?: string;
  manual_review_approved?: boolean;
  manual_review?: boolean;
  signed_to_label?: string;
  label_relationship_explanation?: string;
  signed_to_publisher?: string;
  publisher_relationship_explanation?: string;
  signed_to_manager?: string;
  manager_relationship_explanation?: string;
  entity_collects_payment?: string;
  payment_collection_explanation?: string;
  production_master_percentage?: number;
  requires_review?: boolean;
};

type ArtistApplication = {
  id: string;
  name: string;
  email: string;
  artist_type: string;
  primary_genre: string;
  stage_name: string;
  music_producer: string;
  production_method: string;
  uses_premade_tracks: string;
  master_rights_owner: string;
  publishing_rights_owner: string;
  shares_ownership: string;
  ownership_explanation: string;
  is_one_stop: string;
  has_streaming_releases: string;
  streaming_links: string;
  catalog_track_count: string;
  has_instrumentals: string;
  has_stems: string;
  has_sync_licenses: string;
  understands_rights_requirement: string;
  account_manager_name: string;
  account_manager_email: string;
  account_manager_phone: string;
  account_manager_authority: string;
  additional_info: string;
  // Sync licensing and quiz fields
  sync_licensing_course: string;
  quiz_question_1: string;
  quiz_question_2: string;
  quiz_question_3: string;
  quiz_question_4: string;
  quiz_question_5: string;
  quiz_score: number;
  quiz_total_questions: number;
  quiz_completed: boolean;
  status: string;
  review_tier: string | null;
  auto_disqualified: boolean;
  created_at: string;
  updated_at: string;
  application_score: number;
  score_breakdown?: any;
  rejection_reason?: string;
  manual_review_approved?: boolean;
  manual_review?: boolean;
};

type ApplicationType = 'producer' | 'artist';
type TabType = 'new' | 'invited' | 'onboarded' | 'save_for_later' | 'declined' | 'manual_review' | 'all';

export default function ApplicationsAdmin() {
  const navigate = useNavigate();
  const [producerApplications, setProducerApplications] = useState<ProducerApplication[]>([]);
  const [artistApplications, setArtistApplications] = useState<ArtistApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [selectedType, setSelectedType] = useState<ApplicationType>('producer');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedRankingRange, setSelectedRankingRange] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'genre' | 'ranking'>('ranking');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<ProducerApplication | ArtistApplication | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showRankingBreakdown, setShowRankingBreakdown] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<TabType, number>>({
    new: 0,
    invited: 0,
    onboarded: 0,
    save_for_later: 0,
    declined: 0,
    manual_review: 0,
    all: 0
  });

  // Get current applications based on selected type
  const getCurrentApplications = () => {
    return selectedType === 'producer' ? producerApplications : artistApplications;
  };

  // Get all applications for tab counts
  const getAllApplications = () => {
    return [...producerApplications, ...artistApplications];
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      // Fetch producer applications
      const { data: producerData, error: producerError } = await supabase
        .from('producer_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (producerError) throw producerError;

      // Fetch artist applications
      const { data: artistData, error: artistError } = await supabase
        .from('artist_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (artistError) throw artistError;

      setProducerApplications(producerData || []);
      setArtistApplications(artistData || []);

      // Calculate tab counts
      updateTabCounts([...(producerData || []), ...(artistData || [])]);

    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTabCounts = (allApps: any[]) => {
    const counts = {
      new: allApps.filter(app => app.status === 'new').length,
      invited: allApps.filter(app => app.status === 'invited').length,
      onboarded: allApps.filter(app => app.status === 'onboarded').length,
      save_for_later: allApps.filter(app => app.status === 'save_for_later').length,
      declined: allApps.filter(app => app.status === 'declined').length,
      manual_review: allApps.filter(app => app.manual_review === true).length,
      all: allApps.length
    };
    setTabCounts(counts);
  };

  const getFilteredApplications = () => {
    let apps = getCurrentApplications();

    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'manual_review') {
        apps = apps.filter(app => app.manual_review === true);
      } else {
        apps = apps.filter(app => app.status === activeTab);
      }
    }

    // Filter by search
    if (search) {
      apps = apps.filter(app => 
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.email.toLowerCase().includes(search.toLowerCase()) ||
        (selectedType === 'producer' ? 
          (app as ProducerApplication).primary_genre?.toLowerCase().includes(search.toLowerCase()) :
          (app as ArtistApplication).primary_genre?.toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Filter by genre
    if (selectedGenre) {
      apps = apps.filter(app => 
        selectedType === 'producer' ? 
          (app as ProducerApplication).primary_genre === selectedGenre :
          (app as ArtistApplication).primary_genre === selectedGenre
      );
    }

    // Filter by ranking range
    if (selectedRankingRange) {
      const [min, max] = selectedRankingRange.split('-').map(Number);
      apps = apps.filter(app => {
        const score = selectedType === 'producer' ? 
          (app as ProducerApplication).ranking_score || 0 :
          (app as ArtistApplication).application_score || 0;
        return score >= min && score <= max;
      });
    }

    // Sort applications
    apps.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'genre':
          aValue = selectedType === 'producer' ? 
            (a as ProducerApplication).primary_genre :
            (a as ArtistApplication).primary_genre;
          bValue = selectedType === 'producer' ? 
            (b as ProducerApplication).primary_genre :
            (b as ArtistApplication).primary_genre;
          break;
        case 'ranking':
        default:
          aValue = selectedType === 'producer' ? 
            (a as ProducerApplication).ranking_score || 0 :
            (a as ArtistApplication).application_score || 0;
          bValue = selectedType === 'producer' ? 
            (b as ProducerApplication).ranking_score || 0 :
            (b as ArtistApplication).application_score || 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return apps;
  };

  const updateApplicationStatus = async (applicationId: string, status: string, type: ApplicationType) => {
    try {
      const table = type === 'producer' ? 'producer_applications' : 'artist_applications';
      const { error } = await supabase
        .from(table)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;

      // Refresh applications
      await fetchApplications();

      // Send approval email if status is 'invited'
      if (status === 'invited') {
        const app = type === 'producer' ? 
          producerApplications.find(a => a.id === applicationId) :
          artistApplications.find(a => a.id === applicationId);
        
        if (app) {
          await sendApprovalEmail(app.email, type);
        }
      }

    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const sendApprovalEmail = async (email: string, type: ApplicationType) => {
    try {
      const { error } = await supabase.functions.invoke('send-producer-approval-email', {
        body: { email, type }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error sending approval email:', error);
    }
  };

  const getApplicationTypeBadge = (app: ProducerApplication | ArtistApplication) => {
    const isProducer = 'daws_used' in app;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isProducer 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-purple-100 text-purple-800'
      }`}>
        {isProducer ? 'Producer' : 'Artist'}
      </span>
    );
  };

  const getApplicationScore = (app: ProducerApplication | ArtistApplication) => {
    if ('ranking_score' in app) {
      return (app as ProducerApplication).ranking_score || 0;
    } else {
      return (app as ArtistApplication).application_score || 0;
    }
  };

  const filteredApplications = getFilteredApplications();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Applications Management</h1>
            <p className="text-gray-300">Manage producer and artist applications</p>
          </div>
          <Button
            onClick={() => navigate('/admin')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Admin
          </Button>
        </div>

        {/* Type Selector */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedType('producer')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'producer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Music className="w-4 h-4 inline mr-2" />
              Producer Applications ({producerApplications.length})
            </button>
            <button
              onClick={() => setSelectedType('artist')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'artist'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Artist Applications ({artistApplications.length})
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search applications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
            >
              <option value="">All Genres</option>
              {/* Add genre options based on selected type */}
            </select>
            <select
              value={selectedRankingRange}
              onChange={(e) => setSelectedRankingRange(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
            >
              <option value="">All Scores</option>
              <option value="0-25">0-25</option>
              <option value="26-50">26-50</option>
              <option value="51-75">51-75</option>
              <option value="76-100">76-100</option>
            </select>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'date' | 'genre' | 'ranking');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-4 py-2 bg-white/10 border border-blue-500/20 rounded-lg text-white"
            >
              <option value="ranking-desc">Score (High to Low)</option>
              <option value="ranking-asc">Score (Low to High)</option>
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="genre-asc">Genre (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(tabCounts).map(([tab, count]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as TabType)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {tab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white/5 rounded-lg p-4 border border-blue-500/20 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getApplicationTypeBadge(app)}
                      <div>
                        <h3 className="text-white font-semibold">{app.name}</h3>
                        <p className="text-gray-400 text-sm">{app.email}</p>
                        <p className="text-gray-400 text-sm">
                          {selectedType === 'producer' ? 
                            (app as ProducerApplication).primary_genre :
                            (app as ArtistApplication).primary_genre
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          Score: {getApplicationScore(app)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowApplicationModal(true);
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {app.status === 'new' && (
                          <Button
                            onClick={() => updateApplicationStatus(app.id, 'invited', selectedType)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {app.status === 'new' && (
                          <Button
                            onClick={() => updateApplicationStatus(app.id, 'declined', selectedType)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Application Details</h2>
              <Button
                onClick={() => setShowApplicationModal(false)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Close
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Basic Information</h3>
                <p className="text-gray-300">Name: {selectedApplication.name}</p>
                <p className="text-gray-300">Email: {selectedApplication.email}</p>
                <p className="text-gray-300">Status: {selectedApplication.status}</p>
                <p className="text-gray-300">Created: {new Date(selectedApplication.created_at).toLocaleString()}</p>
              </div>

              {/* Show different fields based on application type */}
              {selectedType === 'producer' ? (
                <div>
                  <h3 className="text-white font-semibold mb-2">Producer Details</h3>
                  <p className="text-gray-300">Primary Genre: {(selectedApplication as ProducerApplication).primary_genre}</p>
                  <p className="text-gray-300">Years Experience: {(selectedApplication as ProducerApplication).years_experience}</p>
                  <p className="text-gray-300">DAWs Used: {(selectedApplication as ProducerApplication).daws_used}</p>
                  <p className="text-gray-300">Tracks per Week: {(selectedApplication as ProducerApplication).tracks_per_week}</p>
                </div>
              ) : (
                <div>
                  <h3 className="text-white font-semibold mb-2">Artist Details</h3>
                  <p className="text-gray-300">Artist Type: {(selectedApplication as ArtistApplication).artist_type}</p>
                  <p className="text-gray-300">Primary Genre: {(selectedApplication as ArtistApplication).primary_genre}</p>
                  <p className="text-gray-300">Stage Name: {(selectedApplication as ArtistApplication).stage_name}</p>
                  <p className="text-gray-300">Music Producer: {(selectedApplication as ArtistApplication).music_producer}</p>
                  
                  <h3 className="text-white font-semibold mb-2 mt-4">Sync Licensing & Quiz</h3>
                  <p className="text-gray-300">Sync Licensing Course: {(selectedApplication as ArtistApplication).sync_licensing_course || 'N/A'}</p>
                  <p className="text-gray-300">Quiz Score: {(selectedApplication as ArtistApplication).quiz_score || 0}/{(selectedApplication as ArtistApplication).quiz_total_questions || 5}</p>
                  <p className="text-gray-300">Quiz Completed: {(selectedApplication as ArtistApplication).quiz_completed ? 'Yes' : 'No'}</p>
                  {(selectedApplication as ArtistApplication).quiz_question_1 && (
                    <p className="text-gray-300">Q1 Answer: {(selectedApplication as ArtistApplication).quiz_question_1}</p>
                  )}
                  {(selectedApplication as ArtistApplication).quiz_question_2 && (
                    <p className="text-gray-300">Q2 Answer: {(selectedApplication as ArtistApplication).quiz_question_2}</p>
                  )}
                  {(selectedApplication as ArtistApplication).quiz_question_3 && (
                    <p className="text-gray-300">Q3 Answer: {(selectedApplication as ArtistApplication).quiz_question_3}</p>
                  )}
                  {(selectedApplication as ArtistApplication).quiz_question_4 && (
                    <p className="text-gray-300">Q4 Answer: {(selectedApplication as ArtistApplication).quiz_question_4}</p>
                  )}
                  {(selectedApplication as ArtistApplication).quiz_question_5 && (
                    <p className="text-gray-300">Q5 Answer: {(selectedApplication as ArtistApplication).quiz_question_5}</p>
                  )}
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                {selectedApplication.status === 'new' && (
                  <>
                    <Button
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, 'invited', selectedType);
                        setShowApplicationModal(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, 'declined', selectedType);
                        setShowApplicationModal(false);
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Decline
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
