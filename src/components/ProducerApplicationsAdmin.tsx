import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Mail, User, Music, Calendar, Filter, Search, Eye, CheckCircle, Clock, XCircle, Save, ArrowUpDown, Star, UserPlus } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateRankingScore, applicationToRankingCriteria, RankingResult } from '../lib/rankingSystem';
import { useNavigate } from 'react-router-dom';

type Application = {
  id: string;
  name: string;
  email: string;
  primary_genre: string;
  secondary_genre: string;
  years_experience: string;
  daws_used: string;
  team_type: string;
  tracks_per_week: string;
  instruments: string; // Keep for backward compatibility
  sample_use: string;
  splice_use: string;
  loop_use: string;
  ai_generated_music: string;
  artist_collab: string;
  business_entity: string;
  pro_affiliation: string;
  additional_info: string;
  // New instrument fields
  instrument_one: string;
  instrument_one_proficiency: string;
  instrument_two: string;
  instrument_two_proficiency: string;
  instrument_three: string;
  instrument_three_proficiency: string;
  instrument_four: string;
  instrument_four_proficiency: string;
  // New recording artists fields
  records_artists: string;
  artist_example_link: string;
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
  // Ranking fields
  ranking_score?: number;
  ranking_breakdown?: any;
  is_auto_rejected?: boolean;
  rejection_reason?: string;
  // Screening questions
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

type TabType = 'new' | 'invited' | 'onboarded' | 'save_for_later' | 'declined' | 'manual_review' | 'all';

export default function ProducerApplicationsAdmin() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [allApplications, setAllApplications] = useState<Application[]>([]); // Add this for tab counts
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedRankingRange, setSelectedRankingRange] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'genre' | 'ranking'>('ranking');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
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

  useEffect(() => {
    fetchAllApplications(); // Fetch all applications first
    fetchApplications(); // Then fetch filtered applications
  }, [activeTab]);

  // Refresh all applications when component mounts to ensure tab counts are accurate
  useEffect(() => {
    fetchAllApplications();
  }, []);

  // Update tab counts when allApplications changes
  useEffect(() => {
    updateTabCounts();
  }, [allApplications]);

  // Function to update tab counts
  const updateTabCounts = async () => {
    const newCounts = {
      new: allApplications.filter(app => 
        (app.status === 'new' || !app.status) && 
        !app.is_auto_rejected &&
        !app.requires_review
      ).length,
      invited: 0,
      onboarded: 0,
      save_for_later: allApplications.filter(app => 
        app.status === 'save_for_later' || app.requires_review
      ).length,
      declined: allApplications.filter(app => 
        app.status === 'declined' || app.is_auto_rejected
      ).length,
      manual_review: allApplications.filter(app => 
        app.status === 'manual_review'
      ).length,
      all: allApplications.length
    };

    // Get invited applications
    const invitedApps = allApplications.filter(app => app.status === 'invited');
    
    if (invitedApps.length > 0) {
      // Get unused invitations
      const { data: unusedInvitations } = await supabase
        .from('producer_invitations')
        .select('email')
        .eq('used', false);
      
      const unusedEmails = new Set(unusedInvitations?.map(inv => inv.email) || []);
      newCounts.invited = invitedApps.filter(app => unusedEmails.has(app.email)).length;

      // Get used invitations
      const { data: usedInvitations } = await supabase
        .from('producer_invitations')
        .select('email')
        .eq('used', true);
      
      const usedEmails = new Set(usedInvitations?.map(inv => inv.email) || []);
      newCounts.onboarded = invitedApps.filter(app => usedEmails.has(app.email)).length;
    }

    setTabCounts(newCounts);
  };

  // Calculate rankings for applications
  const calculateRankings = (apps: Application[]): Application[] => {
    return apps.map(app => {
      const criteria = applicationToRankingCriteria(app);
      const ranking = calculateRankingScore(criteria);
      
      const updatedApp = {
        ...app,
        ranking_score: ranking.totalScore,
        ranking_breakdown: ranking.breakdown,
        is_auto_rejected: ranking.isAutoRejected,
        rejection_reason: ranking.rejectionReason
      };

      // Update the database if auto-rejection status has changed
      if (ranking.isAutoRejected !== app.is_auto_rejected) {
        updateAutoRejectionStatus(app.id, ranking.isAutoRejected, ranking.rejectionReason);
      }

      return updatedApp;
    });
  };

  const updateAutoRejectionStatus = async (applicationId: string, isAutoRejected: boolean, rejectionReason?: string) => {
    try {
      const updateData: any = {
        is_auto_rejected: isAutoRejected,
        updated_at: new Date().toISOString()
      };
      
      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }
      
      // If auto-rejected, also set status to 'declined'
      if (isAutoRejected) {
        updateData.status = 'declined';
      }

      const { error } = await supabase
        .from('producer_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating auto-rejection status:', error);
      }
    } catch (err) {
      console.error('Error updating auto-rejection status:', err);
    }
  };

  // Add this function to fetch all applications for tab counts
  const fetchAllApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('producer_applications')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching all applications:', error);
      } else {
        setAllApplications(data || []);
        // Update tab counts after fetching all applications
        await updateTabCounts();
      }
    } catch (error) {
      console.error('Error fetching all applications:', error);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('producer_applications')
        .select('*')
        .order('created_at', { ascending: true });

      // Debug: First, let's see ALL applications to understand what we're working with
      const { data: allApps, error: allAppsError } = await supabase
        .from('producer_applications')
        .select('*')
        .order('created_at', { ascending: true });
      
      console.log('=== ALL APPLICATIONS DEBUG ===');
      console.log('Total applications in database:', allApps?.length || 0);
      if (allApps && allApps.length > 0) {
        allApps.forEach((app, index) => {
          console.log(`App ${index + 1}:`, {
            id: app.id,
            name: app.name,
            email: app.email,
            status: app.status,
            is_auto_rejected: app.is_auto_rejected,
            requires_review: app.requires_review,
            review_tier: app.review_tier,
            created_at: app.created_at
          });
        });
      }
      console.log('=== END ALL APPLICATIONS DEBUG ===');

      // Filter by status based on active tab
      switch (activeTab) {
        case 'new':
          // Show applications that are new or don't have a status set
          // Also include applications with status 'new' regardless of review_tier to prevent data loss
          // Exclude applications that require review (they go to save_for_later)
          query = query.or('status.eq.new,status.is.null').eq('is_auto_rejected', false).eq('requires_review', false);
          break;
        case 'invited':
          // Show applications with status 'invited' that haven't completed their invitation yet
          query = query.eq('status', 'invited');
          break;
        case 'onboarded':
          // Show applications with status 'invited' that have completed their invitation
          // We'll filter this after fetching to check producer_invitations table
          query = query.eq('status', 'invited');
          break;
        case 'save_for_later':
          // Show applications that require review OR have status 'save_for_later'
          query = query.or('status.eq.save_for_later,requires_review.eq.true');
          break;
        case 'declined':
          // Include both manually declined and auto-rejected applications
          query = query.or('status.eq.declined,is_auto_rejected.eq.true');
          break;
        case 'manual_review':
          // Show applications that need manual review
          query = query.eq('status', 'manual_review');
          break;
        case 'all':
          // Show all applications without filtering
          break;
      }

      const { data, error } = await query;
      
      // Debug logging
      console.log('ProducerApplicationsAdmin: fetchApplications');
      console.log('Active tab:', activeTab);
      console.log('Query result:', { data, error });
      console.log('Applications count:', data?.length || 0);
      
      // Log each application for debugging
      if (data && data.length > 0) {
        console.log('Applications found:');
        data.forEach((app, index) => {
          console.log(`App ${index + 1}:`, {
            id: app.id,
            name: app.name,
            email: app.email,
            status: app.status,
            is_auto_rejected: app.is_auto_rejected,
            review_tier: app.review_tier,
            created_at: app.created_at
          });
        });
      } else {
        console.log('No applications found for current tab');
      }
      
      if (error) {
        console.error('Error fetching applications:', error);
      } else {
        let filteredData = data || [];
        
        // For onboarded tab, filter to only show applications where the invitation has been used
        if (activeTab === 'onboarded') {
          const { data: invitations } = await supabase
            .from('producer_invitations')
            .select('email, used')
            .eq('used', true);
          
          const usedEmails = new Set(invitations?.map(inv => inv.email) || []);
          filteredData = filteredData.filter(app => usedEmails.has(app.email));
        }
        
        // For invited tab, filter to only show applications where the invitation has NOT been used
        if (activeTab === 'invited') {
          const { data: invitations } = await supabase
            .from('producer_invitations')
            .select('email, used')
            .eq('used', false);
          
          const unusedEmails = new Set(invitations?.map(inv => inv.email) || []);
          filteredData = filteredData.filter(app => unusedEmails.has(app.email));
        }
        
        const appsWithRankings = calculateRankings(filteredData);
        setApplications(appsWithRankings);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string, reviewTier?: string) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      // Handle review_tier based on the new status
      if (newStatus === 'new') {
        // When moving to 'new', clear the review_tier
        updateData.review_tier = null;
      } else if (reviewTier) {
        // When setting a specific review tier
        updateData.review_tier = reviewTier;
      }
      
      const { error } = await supabase
        .from('producer_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) {
        console.error('Error updating application:', error);
      } else {
        // Refresh both the filtered applications and all applications
        fetchAllApplications();
        fetchApplications();
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleOverride = async (application: Application) => {
    try {
      const updateData = {
        status: 'new',
        is_auto_rejected: false,
        auto_disqualified: false,
        rejection_reason: null,
        review_tier: null,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('producer_applications')
        .update(updateData)
        .eq('id', application.id);

      if (error) {
        console.error('Error overriding application:', error);
        alert('Failed to override application. Please try again.');
      } else {
        alert('Application overridden successfully! The producer can now be invited.');
        // Refresh both the filtered applications and all applications
        fetchAllApplications();
        fetchApplications();
      }
    } catch (err) {
      console.error('Error overriding application:', err);
      alert('Failed to override application. Please try again.');
    }
  };

  const handleMoveToOnboarded = async (application: Application) => {
    try {
      const updateData = {
        status: 'invited', // This will show up in the onboarded tab since it checks producer_invitations.used = true
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('producer_applications')
        .update(updateData)
        .eq('id', application.id);

      if (error) {
        console.error('Error moving to onboarded:', error);
        alert('Failed to move to onboarded. Please try again.');
      } else {
        alert('Application moved to onboarded successfully!');
        // Refresh both the filtered applications and all applications
        fetchAllApplications();
        fetchApplications();
      }
    } catch (err) {
      console.error('Error moving to onboarded:', err);
      alert('Failed to move to onboarded. Please try again.');
    }
  };

  const getTabApplications = () => {
    let filtered = applications;

    // Debug logging
    console.log('ProducerApplicationsAdmin: getTabApplications');
    console.log('Total applications:', applications.length);
    console.log('Selected genre:', selectedGenre);
    console.log('Search term:', search);

    // Filter by genre if selected
    if (selectedGenre) {
      filtered = filtered.filter(app => 
        app.primary_genre.toLowerCase().includes(selectedGenre.toLowerCase()) ||
        (app.secondary_genre && app.secondary_genre.toLowerCase().includes(selectedGenre.toLowerCase()))
      );
      console.log('After genre filter:', filtered.length);
    }

    // Filter by search term
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(searchLower) ||
        app.email.toLowerCase().includes(searchLower) ||
        app.primary_genre.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', filtered.length);
    }

    // Filter by ranking range
    if (selectedRankingRange) {
      filtered = filtered.filter(app => {
        const score = app.ranking_score || 0;
        switch (selectedRankingRange) {
          case 'high':
            return score >= 20;
          case 'medium':
            return score >= 10 && score < 20;
          case 'low':
            return score < 10;
          case 'auto-rejected':
            return app.is_auto_rejected === true;
          default:
            return true;
        }
      });
      console.log('After ranking filter:', filtered.length);
    }

    // Sort applications
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'genre') {
        // Sort by genre
        const genreA = a.primary_genre.toLowerCase();
        const genreB = b.primary_genre.toLowerCase();
        return sortOrder === 'asc' ? genreA.localeCompare(genreB) : genreB.localeCompare(genreA);
      } else if (sortBy === 'ranking') {
        // Sort by ranking score
        const scoreA = a.ranking_score || 0;
        const scoreB = b.ranking_score || 0;
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
      return 0;
    });

    console.log('Final filtered applications:', filtered.length);
    return filtered;
  };

  const getUniqueGenres = () => {
    const genres = new Set<string>();
    applications.forEach(app => {
      if (app.primary_genre) genres.add(app.primary_genre);
      if (app.secondary_genre) genres.add(app.secondary_genre);
    });
    return Array.from(genres).sort();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Producer Applications - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`, 10, 10);
    
    const rows = getTabApplications().map(app => [
      app.name,
      app.email,
      app.primary_genre,
      app.status,
      app.review_tier || 'N/A',
      new Date(app.created_at).toLocaleDateString(),
    ]);
    
    autoTable(doc, {
      head: [['Name', 'Email', 'Genre', 'Status', 'Tier', 'Date']],
      body: rows,
    });
    doc.save(`producer_applications_${activeTab}.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'invited': return 'bg-green-100 text-green-800';
      case 'save_for_later': return 'bg-yellow-100 text-yellow-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTabCount = (tab: TabType) => {
    return tabCounts[tab] || 0;
  };

  // Debug function to show all applications
  const debugAllApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('producer_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('=== DEBUG: ALL APPLICATIONS ===');
      console.log('Total applications in database:', data?.length || 0);
      
      if (data && data.length > 0) {
        data.forEach((app, index) => {
          console.log(`Application ${index + 1}:`, {
            id: app.id,
            name: app.name,
            email: app.email,
            status: app.status || 'NULL',
            is_auto_rejected: app.is_auto_rejected,
            review_tier: app.review_tier,
            created_at: app.created_at,
            quiz_score: app.quiz_score,
            quiz_completed: app.quiz_completed
          });
        });
      } else {
        console.log('No applications found in database');
      }
      
      if (error) {
        console.error('Error in debug query:', error);
      }
    } catch (error) {
      console.error('Error in debug function:', error);
    }
  };

  const handleInviteProducer = (application: Application) => {
    // Extract first and last name from the full name
    const nameParts = application.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Navigate to invite producer page with pre-filled data
    const params = new URLSearchParams({
      email: application.email,
      firstName: firstName,
      lastName: lastName,
      applicationId: application.id
    });
    
    navigate(`/admin/invite-producer?${params.toString()}`);
  };

  const handleQuickInvite = async (application: Application) => {
    try {
      // Extract first and last name from the full name
      const nameParts = application.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Generate producer number
      const { data: nextNumber } = await supabase
        .from('profiles')
        .select('producer_number')
        .not('producer_number', 'is', null)
        .order('producer_number', { ascending: false })
        .limit(1);

      let producerNumber = 'mbfpr-001';
      if (nextNumber && nextNumber.length > 0) {
        const lastNumber = nextNumber[0].producer_number;
        const match = lastNumber.match(/mbfpr-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          producerNumber = `mbfpr-${nextNum.toString().padStart(3, '0')}`;
        }
      }

      // Generate invitation code
      const invitationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Create invitation
      const { error: insertError } = await supabase
        .from('producer_invitations')
        .insert({
          email: application.email,
          first_name: firstName,
          last_name: lastName,
          invitation_code: invitationCode,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          producer_number: producerNumber
        });

      if (insertError) throw insertError;

      // Send email
      const emailResult = await sendProducerInvitationEmail(application.email, firstName, lastName, producerNumber, invitationCode);

      // Update application status
      await supabase
        .from('producer_applications')
        .update({ 
          status: 'invited',
          review_tier: 'Tier 1',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      // Refresh the applications list
      fetchAllApplications();
      fetchApplications();

      // Show success message
      if (emailResult.success) {
        alert(`Producer ${firstName} ${lastName} has been invited successfully! Producer Number: ${producerNumber}`);
      } else {
        alert(`Producer ${firstName} ${lastName} has been invited, but email failed. Producer Number: ${producerNumber}. You can resend the email later.`);
      }

    } catch (error) {
      console.error('Quick invite error:', error);
      alert('Failed to invite producer. Please try again.');
    }
  };

  const handleProperInvite = async (application: Application, tier: 'Tier 1' | 'Tier 2') => {
    try {
      // Extract first and last name from the full name
      const nameParts = application.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Generate producer number
      const { data: nextNumber } = await supabase
        .from('profiles')
        .select('producer_number')
        .not('producer_number', 'is', null)
        .order('producer_number', { ascending: false })
        .limit(1);

      let producerNumber = 'mbfpr-001';
      if (nextNumber && nextNumber.length > 0) {
        const lastNumber = nextNumber[0].producer_number;
        const match = lastNumber.match(/mbfpr-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          producerNumber = `mbfpr-${nextNum.toString().padStart(3, '0')}`;
        }
      }

      // Generate invitation code
      const invitationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Create invitation
      const { error: insertError } = await supabase
        .from('producer_invitations')
        .insert({
          email: application.email,
          first_name: firstName,
          last_name: lastName,
          invitation_code: invitationCode,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          producer_number: producerNumber
        });

      if (insertError) throw insertError;

      // Send email
      const emailResult = await sendProducerInvitationEmail(application.email, firstName, lastName, producerNumber, invitationCode);

      // Update application status
      await supabase
        .from('producer_applications')
        .update({ 
          status: 'invited',
          review_tier: tier,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      // Refresh the applications list
      fetchAllApplications();
      fetchApplications();

      // Show success message
      if (emailResult.success) {
        alert(`Producer ${firstName} ${lastName} has been invited successfully! Producer Number: ${producerNumber}`);
      } else {
        alert(`Producer ${firstName} ${lastName} has been invited, but email failed. Producer Number: ${producerNumber}. You can resend the email later.`);
      }

    } catch (error) {
      console.error('Proper invite error:', error);
      alert('Failed to invite producer. Please try again.');
    }
  };

  const sendProducerInvitationEmail = async (email: string, firstName: string, lastName: string, producerNumber: string, invitationCode: string) => {
    try {
      const emailSubject = `🎉 Congratulations! You've Been Accepted as a MyBeatFi Producer`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">🎵 Welcome to MyBeatFi! 🎵</h1>
          <h2>CONGRATULATIONS!</h2>
          
          <p>Dear ${firstName} ${lastName},</p>
          
          <p>We are thrilled to inform you that your producer application has been reviewed and <strong>ACCEPTED</strong>!</p>
          
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>📋 Your Producer Details:</h3>
            <ul>
              <li><strong>Producer Number:</strong> ${producerNumber}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Status:</strong> ACCEPTED</li>
            </ul>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>🔑 Your Invitation Code:</h3>
            <p><strong>${invitationCode}</strong></p>
            <p style="font-size: 14px; color: #92400e;">Use this code when signing up as a producer</p>
          </div>
          
          <h3>🔑 Next Steps:</h3>
          <ol>
            <li>Go to: <a href="https://mybeatfi.io/signup">https://mybeatfi.io/signup</a></li>
            <li>Select "Sign Up as Producer"</li>
            <li>Enter your invitation code: <strong>${invitationCode}</strong></li>
            <li>Complete your profile setup</li>
            <li>Start uploading your tracks and connecting with clients</li>
          </ol>
          
          <p><strong>🎯 Keep your invitation code safe - you'll need it to create your account!</strong></p>
          
          <p>Welcome to MyBeatFi!</p>
          
          <p>Best regards,<br>The MyBeatFi Team</p>
        </div>
      `;

                                       const { error: emailError } = await supabase.functions.invoke('send-email-resend', {
        body: {
          to: email,
          subject: emailSubject,
          html: emailHtml,
          producerData: {
            email,
            firstName,
            lastName,
            producerNumber,
            invitationCode
          }
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        return { success: false, error: emailError };
      }

      return { success: true };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error };
    }
  };

  const handleResendEmail = async (application: Application) => {
    try {
      // Get the invitation data
      const { data: invitation, error: invitationError } = await supabase
        .from('producer_invitations')
        .select('*')
        .eq('email', application.email)
        .single();

      if (invitationError) {
        console.error('Error fetching invitation:', invitationError);
        if (invitationError.code === 'PGRST116') {
          // No rows returned
          alert('No invitation found for this producer. Please use Quick Invite first.');
          return;
        } else {
          alert('Error accessing invitation data. Please try again.');
          return;
        }
      }

      if (!invitation) {
        alert('No invitation found for this producer. Please use Quick Invite first.');
        return;
      }

      const nameParts = application.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const emailResult = await sendProducerInvitationEmail(
        application.email, 
        firstName, 
        lastName, 
        invitation.producer_number, 
        invitation.invitation_code
      );

      if (emailResult.success) {
        alert('Email resent successfully!');
      } else {
        alert('Failed to resend email. Please try again.');
      }
    } catch (error) {
      console.error('Resend email error:', error);
      alert('Failed to resend email. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Producer Applications</h1>
        <Button onClick={exportPDF} className="bg-blue-600 hover:bg-blue-700">
          Export PDF
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('new')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'new'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-blue-500/10'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <User className="w-4 h-4" />
            <span>New Applicants</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {getTabCount('new')}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('invited')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'invited'
              ? 'bg-green-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-green-500/10'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Invited</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {getTabCount('invited')}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('onboarded')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'onboarded'
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-purple-500/10'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Onboarded</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {getTabCount('onboarded')}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('save_for_later')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'save_for_later'
              ? 'bg-yellow-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-yellow-500/10'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save for Later</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {getTabCount('save_for_later')}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('declined')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'declined'
              ? 'bg-red-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-red-500/10'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <XCircle className="w-4 h-4" />
            <span>Declined</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {getTabCount('declined')}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('manual_review')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'manual_review'
              ? 'bg-orange-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-orange-500/10'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Manual Review</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {getTabCount('manual_review')}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-gray-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-500/10'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>All Applications</span>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
              {getTabCount('all')}
            </span>
          </div>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-white/10 border border-blue-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Genres</option>
            {getUniqueGenres().map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Star className="w-4 h-4 text-gray-400" />
          <select
            value={selectedRankingRange}
            onChange={(e) => setSelectedRankingRange(e.target.value)}
            className="bg-white/10 border border-blue-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Rankings</option>
            <option value="high">High Score (20+ pts)</option>
            <option value="medium">Medium Score (10-19 pts)</option>
            <option value="low">Low Score (&lt; 10 pts)</option>
            <option value="auto-rejected">Auto-Rejected</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'genre' | 'ranking')}
            className="bg-white/10 border border-blue-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="genre">Sort by Genre</option>
            <option value="ranking">Sort by Ranking</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-white/10 border border-blue-500/20 rounded-lg px-3 py-2 text-white hover:bg-white/20 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or genre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/10 border border-blue-500/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
          />
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {getTabApplications().length === 0 ? (
            <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-lg border border-blue-500/20">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No applications found in this category.</p>
            </div>
          ) : (
            getTabApplications().map((app) => (
              <div key={app.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-blue-500/20">
                {/* Ranking Score - Prominent Display */}
                {app.ranking_score !== undefined && (
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <span className={`text-lg font-bold px-4 py-2 rounded-lg ${
                        app.ranking_score >= 20 ? 'bg-green-100 text-green-800' :
                        app.ranking_score >= 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {app.ranking_score} points
                      </span>
                    </div>
                    {app.is_auto_rejected && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Auto-Rejected
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-xl font-semibold text-white">{app.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                        {app.is_auto_rejected ? 'Auto-Rejected' : app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                      {app.auto_disqualified && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          Auto-Disqualified
                        </span>
                      )}
                      {/* Show warning for inconsistent status */}
                      {app.status === 'new' && app.review_tier && (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          Status Inconsistent
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-gray-300 mb-2">
                      <span className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {app.email}
                      </span>
                      <span className="flex items-center">
                        <Music className="w-4 h-4 mr-1" />
                        {app.primary_genre}
                        {app.secondary_genre && ` / ${app.secondary_genre}`}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p><strong>Experience:</strong> {app.years_experience} years • <strong>Team:</strong> {app.team_type} • <strong>Output:</strong> {app.tracks_per_week} tracks/week</p>
                      <p><strong>DAWs:</strong> {app.daws_used} • <strong>PRO:</strong> {app.pro_affiliation}</p>
                    </div>
                    
                    {/* Screening Questions Summary */}
                    {(app.signed_to_label === 'Yes' || app.signed_to_publisher === 'Yes' || app.signed_to_manager === 'Yes' || app.entity_collects_payment === 'Yes' || (app.production_master_percentage && app.production_master_percentage < 100)) && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm font-medium text-yellow-400 mb-2">⚠️ Requires Review - Screening Questions:</p>
                        <div className="text-xs text-yellow-300 space-y-1">
                          {app.signed_to_label === 'Yes' && <p>• Signed to label: {app.label_relationship_explanation}</p>}
                          {app.signed_to_publisher === 'Yes' && <p>• Signed to publisher: {app.publisher_relationship_explanation}</p>}
                          {app.signed_to_manager === 'Yes' && <p>• Signed to manager/agent: {app.manager_relationship_explanation}</p>}
                          {app.entity_collects_payment === 'Yes' && <p>• Entity collects payment: {app.payment_collection_explanation}</p>}
                          {app.production_master_percentage && app.production_master_percentage < 100 && (
                            <p>• Production master ownership: {app.production_master_percentage}%</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setSelectedApplication(app);
                        setShowApplicationModal(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    {activeTab === 'new' && (
                      <Button
                        onClick={() => handleQuickInvite(app)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Quick Invite
                      </Button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-blue-500/20">
                  {activeTab === 'new' && (
                    <>
                      <Button
                        onClick={() => handleMoveToOnboarded(app)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Move to Onboarded
                      </Button>
                      <Button
                        onClick={() => handleInviteProducer(app)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Manual Invite
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'manual_review', 'Tier 2')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Tier 2 - Review
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'save_for_later')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'declined')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}
                  {activeTab === 'invited' && (
                    <>
                      <Button
                        onClick={() => handleMoveToOnboarded(app)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Move to Onboarded
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'manual_review')}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        size="sm"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Manual Review
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'save_for_later')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'declined')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}

                  {activeTab === 'onboarded' && (
                    <>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'manual_review')}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        size="sm"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Manual Review
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'save_for_later')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'declined')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}

                  {activeTab === 'save_for_later' && (
                    <>
                      <Button
                        onClick={() => handleMoveToOnboarded(app)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Move to Onboarded
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'manual_review')}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        size="sm"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Manual Review
                      </Button>
                      <Button
                        onClick={() => handleProperInvite(app, 'Tier 1')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Invite (Tier 1)
                      </Button>
                      <Button
                        onClick={() => handleProperInvite(app, 'Tier 2')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Invite (Tier 2)
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'declined')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}
                  {activeTab === 'manual_review' && (
                    <>
                      <Button
                        onClick={() => handleMoveToOnboarded(app)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Move to Onboarded
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => handleProperInvite(app, 'Tier 1')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Invite (Tier 1)
                      </Button>
                      <Button
                        onClick={() => handleProperInvite(app, 'Tier 2')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Invite (Tier 2)
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'save_for_later')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'declined')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}

                  {activeTab === 'declined' && (
                    <>
                      {app.is_auto_rejected && (
                        <Button
                          onClick={() => handleOverride(app)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          size="sm"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Override & Onboard
                        </Button>
                      )}
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => handleProperInvite(app, 'Tier 1')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Invite (Tier 1)
                      </Button>
                      <Button
                        onClick={() => handleProperInvite(app, 'Tier 2')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Invite (Tier 2)
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'save_for_later')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                    </>
                  )}

                  {activeTab === 'all' && (
                    <>
                      {app.is_auto_rejected && (
                        <Button
                          onClick={() => handleOverride(app)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          size="sm"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Override & Onboard
                        </Button>
                      )}
                      <Button
                        onClick={() => handleMoveToOnboarded(app)}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Move to Onboarded
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'manual_review')}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        size="sm"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Manual Review
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'save_for_later')}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                      <Button
                        onClick={() => handleProperInvite(app, 'Tier 1')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Invite (Tier 1)
                      </Button>
                      <Button
                        onClick={() => handleProperInvite(app, 'Tier 2')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Invite (Tier 2)
                      </Button>
                      <Button
                        onClick={() => updateApplicationStatus(app.id, 'declined')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Application Details Modal */}
      {showApplicationModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-blue-900/90 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Application Details</h2>
              <Button
                onClick={() => setShowApplicationModal(false)}
                variant="outline"
                size="sm"
                className="text-white border-white hover:bg-white/10"
              >
                ×
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Contact Information</h3>
                <div className="space-y-2 text-sm text-white">
                  <p><strong>Name:</strong> {selectedApplication.name}</p>
                  <p><strong>Email:</strong> {selectedApplication.email}</p>
                  <p><strong>Status:</strong> {selectedApplication.status}</p>
                  <p><strong>Created:</strong> {new Date(selectedApplication.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Music Information</h3>
                <div className="space-y-2 text-sm text-white">
                  <p><strong>Primary Genre:</strong> {selectedApplication.primary_genre}</p>
                  <p><strong>Secondary Genre:</strong> {selectedApplication.secondary_genre || 'N/A'}</p>
                  <p><strong>Years Experience:</strong> {selectedApplication.years_experience}</p>
                  <p><strong>DAWs Used:</strong> {selectedApplication.daws_used}</p>
                  <p><strong>Team Type:</strong> {selectedApplication.team_type}</p>
                  <p><strong>Tracks per Week:</strong> {selectedApplication.tracks_per_week}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Instruments & Proficiency</h3>
                <div className="space-y-2 text-sm text-white">
                  {selectedApplication.instrument_one && (
                    <p><strong>Instrument 1:</strong> {selectedApplication.instrument_one} ({selectedApplication.instrument_one_proficiency || 'N/A'})</p>
                  )}
                  {selectedApplication.instrument_two && (
                    <p><strong>Instrument 2:</strong> {selectedApplication.instrument_two} ({selectedApplication.instrument_two_proficiency || 'N/A'})</p>
                  )}
                  {selectedApplication.instrument_three && (
                    <p><strong>Instrument 3:</strong> {selectedApplication.instrument_three} ({selectedApplication.instrument_three_proficiency || 'N/A'})</p>
                  )}
                  {selectedApplication.instrument_four && (
                    <p><strong>Instrument 4:</strong> {selectedApplication.instrument_four} ({selectedApplication.instrument_four_proficiency || 'N/A'})</p>
                  )}
                  {!selectedApplication.instrument_one && !selectedApplication.instrument_two && 
                   !selectedApplication.instrument_three && !selectedApplication.instrument_four && (
                    <p><strong>Instruments:</strong> {selectedApplication.instruments || 'N/A'}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Music Creation</h3>
                <div className="space-y-2 text-sm text-white">
                  <p><strong>Sample Use:</strong> {selectedApplication.sample_use}</p>
                  <p><strong>Splice Use:</strong> {selectedApplication.splice_use}</p>
                  <p><strong>Loop Use:</strong> {selectedApplication.loop_use}</p>
                  <p><strong>AI-Generated Music:</strong> {selectedApplication.ai_generated_music}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Recording Artists</h3>
                <div className="space-y-2 text-sm text-white">
                  <p><strong>Records Artists:</strong> {selectedApplication.records_artists || 'N/A'}</p>
                  {selectedApplication.records_artists === 'Yes' && selectedApplication.artist_example_link && (
                    <p><strong>Artist Example Link:</strong> <a href={selectedApplication.artist_example_link} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline hover:text-blue-200">{selectedApplication.artist_example_link}</a></p>
                  )}
                  {selectedApplication.artist_collab && (
                    <p><strong>Artist Collaboration:</strong> {selectedApplication.artist_collab}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Business Information</h3>
                <div className="space-y-2 text-sm text-white">
                  <p><strong>Business Entity:</strong> {selectedApplication.business_entity || 'N/A'}</p>
                  <p><strong>PRO Affiliation:</strong> {selectedApplication.pro_affiliation}</p>
                  <p><strong>Auto-Disqualified:</strong> {selectedApplication.auto_disqualified ? 'Yes' : 'No'}</p>
                  <p><strong>Review Tier:</strong> {selectedApplication.review_tier || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Sync Licensing & Quiz</h3>
                <div className="space-y-2 text-sm text-white">
                  <p><strong>Sync Licensing Course:</strong> {selectedApplication.sync_licensing_course || 'N/A'}</p>
                  <p><strong>Quiz Score:</strong> {selectedApplication.quiz_score || 0}/{selectedApplication.quiz_total_questions || 5}</p>
                  <p><strong>Quiz Completed:</strong> {selectedApplication.quiz_completed ? 'Yes' : 'No'}</p>
                  {selectedApplication.quiz_question_1 && (
                    <p><strong>Q1 Answer:</strong> {selectedApplication.quiz_question_1}</p>
                  )}
                  {selectedApplication.quiz_question_2 && (
                    <p><strong>Q2 Answer:</strong> {selectedApplication.quiz_question_2}</p>
                  )}
                  {selectedApplication.quiz_question_3 && (
                    <p><strong>Q3 Answer:</strong> {selectedApplication.quiz_question_3}</p>
                  )}
                  {selectedApplication.quiz_question_4 && (
                    <p><strong>Q4 Answer:</strong> {selectedApplication.quiz_question_4}</p>
                  )}
                  {selectedApplication.quiz_question_5 && (
                    <p><strong>Q5 Answer:</strong> {selectedApplication.quiz_question_5}</p>
                  )}
                </div>
              </div>
              
              {selectedApplication.ranking_breakdown && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-white">Ranking Breakdown</h3>
                  <div className="space-y-2 text-sm text-white">
                    <p><strong>Total Score:</strong> {selectedApplication.ranking_score} points</p>
                    <p><strong>Experience Score:</strong> {selectedApplication.ranking_breakdown.experienceScore} points</p>
                    <p><strong>Output Score:</strong> {selectedApplication.ranking_breakdown.outputScore} points</p>
                    <p><strong>Skillset Score:</strong> {selectedApplication.ranking_breakdown.skillsetScore} points</p>
                    <p><strong>Disqualifier Penalty:</strong> {selectedApplication.ranking_breakdown.disqualifierPenalty} points</p>
                    <p><strong>Quiz Score:</strong> {selectedApplication.ranking_breakdown.quizScore} points</p>
                    {selectedApplication.is_auto_rejected && (
                      <p className="text-red-300"><strong>Rejection Reason:</strong> {selectedApplication.rejection_reason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {selectedApplication.additional_info && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3 text-white">Additional Information</h3>
                <p className="text-sm text-white whitespace-pre-wrap">{selectedApplication.additional_info}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-white/20">
              <Button
                onClick={() => setShowApplicationModal(false)}
                variant="outline"
                className="text-white border-white hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
