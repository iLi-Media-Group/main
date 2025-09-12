import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Mail, User, Music, Calendar, Filter, Search, Eye, CheckCircle, Clock, XCircle, Save, ArrowUpDown, Star, UserPlus, Users, Building2 } from 'lucide-react';
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

type RightsHolderApplication = {
  id: string;
  company_name: string;
  contact_first_name: string;
  contact_last_name: string;
  email: string;
  phone: string;
  rights_holder_type: string;
  website: string;
  company_size: string;
  years_in_business: number;
  primary_genres: string[];
  catalog_size: number;
  has_sync_experience: boolean;
  sync_experience_details: string;
  has_licensing_team: boolean;
  licensing_team_size: number;
  revenue_range: string;
  target_markets: string[];
  additional_info: string;
  status: string;
  review_tier: string | null;
  auto_disqualified: boolean;
  application_score: number;
  score_breakdown?: any;
  rejection_reason?: string;
  manual_review_approved?: boolean;
  manual_review?: boolean;
  created_at: string;
  updated_at: string;
};

type ApplicationType = 'producer' | 'artist' | 'rights_holder';
type TabType = 'new' | 'invited' | 'onboarded' | 'save_for_later' | 'declined' | 'manual_review' | 'all';

export default function ApplicationsAdmin() {
  const navigate = useNavigate();
  const [producerApplications, setProducerApplications] = useState<ProducerApplication[]>([]);
  const [artistApplications, setArtistApplications] = useState<ArtistApplication[]>([]);
  const [rightsHolderApplications, setRightsHolderApplications] = useState<RightsHolderApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('new');
  const [selectedType, setSelectedType] = useState<ApplicationType>('producer');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedRankingRange, setSelectedRankingRange] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'genre' | 'ranking'>('ranking');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<ProducerApplication | ArtistApplication | RightsHolderApplication | null>(null);
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
  const getCurrentApplications = (): (ProducerApplication | ArtistApplication | RightsHolderApplication)[] => {
    if (selectedType === 'producer') return producerApplications;
    if (selectedType === 'artist') return artistApplications;
    return rightsHolderApplications;
  };

  // Get application name for display
  const getApplicationName = (app: ProducerApplication | ArtistApplication | RightsHolderApplication) => {
    if ('company_name' in app) {
      return app.company_name; // Rights holder
    }
    return app.name; // Producer or artist
  };

  // Get application email for display
  const getApplicationEmail = (app: ProducerApplication | ArtistApplication | RightsHolderApplication) => {
    return app.email;
  };

  // Get all applications for tab counts
  const getAllApplications = (): (ProducerApplication | ArtistApplication | RightsHolderApplication)[] => {
    return [...producerApplications, ...artistApplications, ...rightsHolderApplications];
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

      // Fetch rights holder applications
      const { data: rightsHolderData, error: rightsHolderError } = await supabase
        .from('rights_holder_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (rightsHolderError) throw rightsHolderError;

      setProducerApplications(producerData || []);
      setArtistApplications(artistData || []);
      setRightsHolderApplications(rightsHolderData || []);

      // Calculate tab counts
      updateTabCounts([...(producerData || []), ...(artistData || []), ...(rightsHolderData || [])]);

    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTabCounts = (allApps: (ProducerApplication | ArtistApplication | RightsHolderApplication)[]) => {
    const counts = {
      new: allApps.filter(app => app.status === 'new').length,
      invited: allApps.filter(app => app.status === 'invited').length,
      onboarded: allApps.filter(app => app.status === 'onboarded').length,
      save_for_later: allApps.filter(app => app.status === 'save_for_later').length,
      declined: allApps.filter(app => app.status === 'declined').length,
      manual_review: allApps.filter(app => app.status === 'manual_review').length,
      all: allApps.length
    };
    setTabCounts(counts);
  };

  const getFilteredApplications = (): (ProducerApplication | ArtistApplication | RightsHolderApplication)[] => {
    let apps = getCurrentApplications();

    // Filter by tab
    if (activeTab !== 'all') {
      if (activeTab === 'manual_review') {
        apps = apps.filter(app => app.status === 'manual_review');
      } else {
        apps = apps.filter(app => app.status === activeTab);
      }
    }

    // Filter by search
    if (search) {
      apps = apps.filter(app => {
        const name = getApplicationName(app);
        const email = getApplicationEmail(app);
        const searchLower = search.toLowerCase();
        
        if (name.toLowerCase().includes(searchLower) || email.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Check genre for producer and artist applications
        if (selectedType === 'producer' && 'primary_genre' in app) {
          return app.primary_genre?.toLowerCase().includes(searchLower);
        }
        if (selectedType === 'artist' && 'primary_genre' in app) {
          return app.primary_genre?.toLowerCase().includes(searchLower);
        }
        
        return false;
      });
    }

    // Filter by genre (only for producer and artist applications)
    if (selectedGenre && selectedType !== 'rights_holder') {
      apps = apps.filter(app => {
        if ('primary_genre' in app) {
          return app.primary_genre === selectedGenre;
        }
        return false;
      });
    }

    // Filter by ranking range
    if (selectedRankingRange) {
      const [min, max] = selectedRankingRange.split('-').map(Number);
      apps = apps.filter(app => {
        let score = 0;
        if ('ranking_score' in app) {
          score = app.ranking_score || 0;
        } else if ('application_score' in app) {
          score = app.application_score || 0;
        }
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
          aValue = 'primary_genre' in a ? a.primary_genre : '';
          bValue = 'primary_genre' in b ? b.primary_genre : '';
          break;
        case 'ranking':
        default:
          aValue = 'ranking_score' in a ? a.ranking_score || 0 : 'application_score' in a ? a.application_score || 0 : 0;
          bValue = 'ranking_score' in b ? b.ranking_score || 0 : 'application_score' in b ? b.application_score || 0 : 0;
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
      // Get the application data BEFORE updating status
      let app: ProducerApplication | ArtistApplication | RightsHolderApplication | undefined;
      
      if (type === 'producer') {
        app = producerApplications.find(a => a.id === applicationId);
      } else if (type === 'artist') {
        app = artistApplications.find(a => a.id === applicationId);
      } else if (type === 'rights_holder') {
        app = rightsHolderApplications.find(a => a.id === applicationId);
      }
      
      if (!app) {
        console.error('Application not found:', applicationId);
        return;
      }

      // Update the status first
      const table = type === 'producer' ? 'producer_applications' : 
                   type === 'artist' ? 'artist_applications' : 
                   'rights_holder_applications';
      
      // Prepare update data
      const updateData: any = { 
        status, 
        updated_at: new Date().toISOString() 
      };
      
      // Set boolean fields based on status
      if (status === 'manual_review') {
        updateData.manual_review = true;
        updateData.manual_review_approved = false;
      } else if (status === 'onboarded' || status === 'invited') {
        updateData.manual_review = false;
        updateData.manual_review_approved = true;
      } else {
        updateData.manual_review = false;
        updateData.manual_review_approved = false;
      }
      
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      // Refresh applications after status update
      await fetchApplications();

      // If this is an invitation, send the email synchronously to catch errors
      if (status === 'invited') {
        try {
          await sendApprovalEmail(app, type);
          const appName = getApplicationName(app);
          alert(`SUCCESS: ${appName} has been invited and email sent!`);
        } catch (emailError: any) {
          console.error('Email sending failed:', emailError);
          const appName = getApplicationName(app);
          alert(`ERROR: ${appName} was invited but email failed to send: ${emailError.message}`);
        }
      }

    } catch (error) {
      console.error('Error updating application status:', error);
      alert('Error updating application status. Please try again.');
    }
  };

  const sendApprovalEmail = async (app: ProducerApplication | ArtistApplication | RightsHolderApplication, type: ApplicationType) => {
    try {
      if (type === 'producer') {
        const producerApp = app as ProducerApplication;
        
        // Extract first and last name from the full name
        const nameParts = producerApp.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Generate producer number using the working approach from ProducerApplicationsAdmin
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

        // Get current user and ensure we have the user ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user?.id) throw new Error('User not authenticated');

        // Create invitation record using service role to bypass RLS issues
        const { error: insertError } = await supabase
          .from('producer_invitations')
          .insert({
            email: producerApp.email,
            first_name: firstName,
            last_name: lastName,
            invitation_code: invitationCode,
            created_by: user.id,
            producer_number: producerNumber
          })
          .select();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }

        // Send invitation email using the working system from ProducerApplicationsAdmin
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
                <li><strong>Email:</strong> ${producerApp.email}</li>
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
            to: producerApp.email,
            subject: emailSubject,
            html: emailHtml,
            producerData: {
              email: producerApp.email,
              firstName,
              lastName,
              producerNumber,
              invitationCode
            }
          }
        });

                 if (emailError) throw emailError;
       } else if (type === 'artist') {
         const artistApp = app as ArtistApplication;
         
         // Extract first and last name from the full name
         const nameParts = artistApp.name.split(' ');
         const firstName = nameParts[0] || '';
         const lastName = nameParts.slice(1).join(' ') || '';
         
         // Generate artist number using the function
         const { data: nextArtistNumber } = await supabase.rpc('get_next_artist_number');
         const artistNumber = nextArtistNumber || 'MBAR-01';

         // Generate invitation code
         const invitationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

         // Get current user and ensure we have the user ID
         const { data: { user }, error: userError } = await supabase.auth.getUser();
         if (userError) throw userError;
         if (!user?.id) throw new Error('User not authenticated');

         // Create invitation record
         const { error: insertError } = await supabase
           .from('artist_invitations')
           .insert({
             email: artistApp.email,
             first_name: firstName,
             last_name: lastName,
             invitation_code: invitationCode,
             created_by: user.id,
             artist_number: artistNumber
           })
           .select();

         if (insertError) {
           console.error('Insert error:', insertError);
           throw insertError;
         }

         // Send invitation email
         const { error: emailError } = await supabase.functions.invoke('send-artist-invitation', {
           body: {
             email: artistApp.email,
             firstName,
             lastName,
             artistNumber,
             invitationCode
           }
         });

         if (emailError) throw emailError;
       } else if (type === 'rights_holder') {
         const rightsHolderApp = app as RightsHolderApplication;
         
         // Generate rights holder number using the function
         const { data: nextRightsHolderNumber } = await supabase.rpc('get_next_rights_holder_number');
         const rightsHolderNumber = nextRightsHolderNumber || 'mbfr-001';

         // Generate invitation code
         const invitationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

         // Get current user and ensure we have the user ID
         const { data: { user }, error: userError } = await supabase.auth.getUser();
         if (userError) throw userError;
         if (!user?.id) throw new Error('User not authenticated');

         // Create invitation record
         const { error: insertError } = await supabase
           .from('rights_holder_invitations')
           .insert({
             email: rightsHolderApp.email,
             company_name: rightsHolderApp.company_name,
             contact_first_name: rightsHolderApp.contact_first_name,
             contact_last_name: rightsHolderApp.contact_last_name,
             invitation_code: invitationCode,
             created_by: user.id,
             rights_holder_number: rightsHolderNumber
           })
           .select();

         if (insertError) {
           console.error('Insert error:', insertError);
           throw insertError;
         }

         // Send invitation email
         const { error: emailError } = await supabase.functions.invoke('send-rights-holder-invitation', {
           body: {
             email: rightsHolderApp.email,
             companyName: rightsHolderApp.company_name,
             contactFirstName: rightsHolderApp.contact_first_name,
             contactLastName: rightsHolderApp.contact_last_name,
             rightsHolderNumber,
             invitationCode
           }
         });

         if (emailError) throw emailError;
       }
     } catch (error) {
       console.error('Error sending approval email:', error);
       throw error;
     }
   };

  const sendArtistInvitationEmail = async (email: string, firstName: string, lastName: string, artistNumber: string, invitationCode: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-artist-invitation', {
        body: {
          email,
          firstName,
          lastName,
          artistNumber,
          invitationCode
        }
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error sending artist invitation email:', error);
      return { success: false, error };
    }
  };

  const handleArtistQuickInvite = async (application: ArtistApplication) => {
    try {
      // Extract first and last name from the full name
      const nameParts = application.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Generate artist number using the function
      const { data: nextArtistNumber } = await supabase.rpc('get_next_artist_number');
      const artistNumber = nextArtistNumber || 'MBAR-01';

      // Generate invitation code
      const invitationCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Create invitation
      const { error: insertError } = await supabase
        .from('artist_invitations')
        .insert({
          email: application.email,
          first_name: firstName,
          last_name: lastName,
          invitation_code: invitationCode,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          artist_number: artistNumber
        });

      if (insertError) throw insertError;

      // Send email
      const emailResult = await sendArtistInvitationEmail(application.email, firstName, lastName, artistNumber, invitationCode);

      // Update application status
      await supabase
        .from('artist_applications')
        .update({ 
          status: 'invited',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

             // Refresh the applications list
       fetchApplications();

      // Show success message
      if (emailResult.success) {
        alert(`Artist ${firstName} ${lastName} has been invited successfully! Artist Number: ${artistNumber}`);
      } else {
        alert(`Artist ${firstName} ${lastName} has been invited, but email failed. Artist Number: ${artistNumber}. You can resend the email later.`);
      }

    } catch (error) {
      console.error('Artist quick invite error:', error);
      alert('Failed to invite artist. Please try again.');
    }
  };

  const handleRightsHolderQuickInvite = async (application: RightsHolderApplication) => {
    try {
      // APPROVE RIGHTS HOLDER - Account already exists, just needs approval
      // This sets verification_status to 'verified' and application status to 'onboarded'
      await handleRightsHolderPasswordApproval(application);
    } catch (error) {
      console.error('Rights holder approval error:', error);
      alert('Failed to approve rights holder. Please try again.');
    }
  };

  const handleRightsHolderPasswordApproval = async (application: RightsHolderApplication) => {
    try {
      // APPROVE RIGHTS HOLDER APPLICATION
      // This function:
      // 1. Updates profile.verification_status to 'verified'
      // 2. Updates rights_holders.verification_status to 'verified' and is_active to true
      // 3. Updates rights_holder_applications.status to 'onboarded'
      // 4. Sends approval email
      // 5. User can now log in and access dashboard immediately
      
      // Generate rights holder number
      const { data: nextRightsHolderNumber } = await supabase.rpc('get_next_rights_holder_number');
      const rightsHolderNumber = nextRightsHolderNumber || 'mbfr-001';

      // Find the user by email using profiles table instead of admin API
      const { data: profileData, error: profileLookupError } = await supabase
        .from('profiles')
        .select('id, email, verification_status')
        .eq('email', application.email)
        .single();

      if (profileLookupError || !profileData) {
        throw new Error('User profile not found. They may not have completed the signup process.');
      }

      const userId = profileData.id;

      // Update profile to verified status
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ 
          verification_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileUpdateError) throw profileUpdateError;

      // Update rights holder to active status
      const { error: rightsHolderError } = await supabase
        .from('rights_holders')
        .update({ 
          verification_status: 'verified',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (rightsHolderError) throw rightsHolderError;

      // Update application status to onboarded
      await supabase
        .from('rights_holder_applications')
        .update({ 
          status: 'onboarded',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);

      // Send approval email
      const { error: emailError } = await supabase.functions.invoke('send-rights-holder-approval', {
        body: {
          email: application.email,
          companyName: application.company_name,
          contactFirstName: application.contact_first_name,
          contactLastName: application.contact_last_name,
          rightsHolderNumber
        }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        alert(`Rights Holder ${application.company_name} has been approved! Rights Holder Number: ${rightsHolderNumber}. However, the approval email failed to send.`);
      } else {
        alert(`Rights Holder ${application.company_name} has been approved! Rights Holder Number: ${rightsHolderNumber}. Approval email sent.`);
      }

      // Refresh the applications list
      fetchApplications();

    } catch (error) {
      console.error('Rights holder approval error:', error);
      throw error;
    }
  };



  const getApplicationTypeBadge = (app: ProducerApplication | ArtistApplication | RightsHolderApplication) => {
    if ('daws_used' in app) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Producer
        </span>
      );
    } else if ('artist_type' in app) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Artist
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Rights Holder
        </span>
      );
    }
  };

  const getApplicationScore = (app: ProducerApplication | ArtistApplication | RightsHolderApplication) => {
    if ('ranking_score' in app) {
      return (app as ProducerApplication).ranking_score || 0;
    } else if ('application_score' in app) {
      return (app as ArtistApplication | RightsHolderApplication).application_score || 0;
    } else {
      return 0;
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
             <button
               onClick={() => setSelectedType('rights_holder')}
               className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                 selectedType === 'rights_holder'
                   ? 'bg-green-600 text-white'
                   : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
               }`}
             >
               <Building2 className="w-4 h-4 inline mr-2" />
               Rights Holder Applications ({rightsHolderApplications.length})
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
                        <h3 className="text-white font-semibold">{getApplicationName(app)}</h3>
                        <p className="text-gray-400 text-sm">{getApplicationEmail(app)}</p>
                        <p className="text-gray-400 text-sm">
                          {selectedType === 'producer' ? 
                            (app as ProducerApplication).primary_genre :
                            selectedType === 'artist' ? 
                            (app as ArtistApplication).primary_genre :
                            (app as RightsHolderApplication).rights_holder_type
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
                        {app.status === 'new' && selectedType !== 'rights_holder' && (
                          <Button
                            onClick={() => updateApplicationStatus(app.id, 'manual_review', selectedType)}
                            size="sm"
                            className="bg-yellow-600 hover:bg-yellow-700"
                            title="Move to Manual Review"
                          >
                            <Clock className="w-4 h-4" />
                          </Button>
                        )}
                        {app.status === 'new' && selectedType === 'artist' && (
                          <Button
                            onClick={() => handleArtistQuickInvite(app as ArtistApplication)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            title="Quick Invite Artist"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        )}
                        {app.status === 'new' && selectedType === 'rights_holder' && (
                          <Button
                            onClick={() => handleRightsHolderQuickInvite(app as RightsHolderApplication)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            title="Approve Rights Holder (Account Already Created)"
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
                        {/* Buttons for applications in manual review */}
                        {app.status === 'manual_review' && (
                          <Button
                            onClick={() => updateApplicationStatus(app.id, 'onboarded', selectedType)}
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            title="Move to Onboarded"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        )}
                        {app.status === 'manual_review' && selectedType === 'rights_holder' && (
                          <Button
                            onClick={() => handleRightsHolderQuickInvite(app as RightsHolderApplication)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            title="Approve Rights Holder (Account Already Created)"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {app.status === 'manual_review' && (
                          <Button
                            onClick={() => updateApplicationStatus(app.id, 'declined', selectedType)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            title="Decline Application"
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
                <p className="text-gray-300">Name: {getApplicationName(selectedApplication)}</p>
                <p className="text-gray-300">Email: {getApplicationEmail(selectedApplication)}</p>
                <p className="text-gray-300">Status: {selectedApplication.status}</p>
                <p className="text-gray-300">Created: {new Date(selectedApplication.created_at).toLocaleString()}</p>
              </div>

                             {/* Show different fields based on application type */}
               {selectedType === 'producer' ? (
                 <>
                   <div>
                     <h3 className="text-white font-semibold mb-2">Producer Details</h3>
                     <p className="text-gray-300">Primary Genre: {(selectedApplication as ProducerApplication).primary_genre}</p>
                     <p className="text-gray-300">Secondary Genre: {(selectedApplication as ProducerApplication).secondary_genre || 'N/A'}</p>
                     <p className="text-gray-300">Years Experience: {(selectedApplication as ProducerApplication).years_experience}</p>
                     <p className="text-gray-300">DAWs Used: {(selectedApplication as ProducerApplication).daws_used}</p>
                     <p className="text-gray-300">Team Type: {(selectedApplication as ProducerApplication).team_type}</p>
                     <p className="text-gray-300">Tracks per Week: {(selectedApplication as ProducerApplication).tracks_per_week}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Music Creation</h3>
                     <p className="text-gray-300">Sample Use: {(selectedApplication as ProducerApplication).sample_use ? 'Yes' : 'No'}</p>
                     <p className="text-gray-300">Splice Use: {(selectedApplication as ProducerApplication).splice_use}</p>
                     <p className="text-gray-300">Loop Use: {(selectedApplication as ProducerApplication).loop_use}</p>
                     <p className="text-gray-300">AI-Generated Music: {(selectedApplication as ProducerApplication).ai_generated_music ? 'Yes' : 'No'}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Business Information</h3>
                     <p className="text-gray-300">Business Entity: {(selectedApplication as ProducerApplication).business_entity || 'N/A'}</p>
                     <p className="text-gray-300">PRO Affiliation: {(selectedApplication as ProducerApplication).pro_affiliation}</p>
                     <p className="text-gray-300">Auto-Disqualified: {(selectedApplication as ProducerApplication).auto_disqualified ? 'Yes' : 'No'}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Sync Licensing & Quiz</h3>
                     <p className="text-gray-300">Sync Licensing Course: {(selectedApplication as ProducerApplication).sync_licensing_course || 'N/A'}</p>
                     <p className="text-gray-300">Quiz Score: {(selectedApplication as ProducerApplication).quiz_score || 0}/100</p>
                     <p className="text-gray-300">Quiz Completed: {(selectedApplication as ProducerApplication).quiz_completed ? 'Yes' : 'No'}</p>
                     <p className="text-gray-300">Q1 Answer: {(selectedApplication as ProducerApplication).quiz_question_1 || '(empty)'}</p>
                     <p className="text-gray-300">Q2 Answer: {(selectedApplication as ProducerApplication).quiz_question_2 || '(empty)'}</p>
                     <p className="text-gray-300">Q3 Answer: {(selectedApplication as ProducerApplication).quiz_question_3 || '(empty)'}</p>
                     <p className="text-gray-300">Q4 Answer: {(selectedApplication as ProducerApplication).quiz_question_4 || '(empty)'}</p>
                     <p className="text-gray-300">Q5 Answer: {(selectedApplication as ProducerApplication).quiz_question_5 || '(empty)'}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Screening Questions</h3>
                     <p className="text-gray-300">Signed to Label: {(selectedApplication as ProducerApplication).signed_to_label || 'N/A'}</p>
                     {(selectedApplication as ProducerApplication).signed_to_label === 'Yes' && (selectedApplication as ProducerApplication).label_relationship_explanation && (
                       <p className="text-gray-300">Label Relationship: {(selectedApplication as ProducerApplication).label_relationship_explanation}</p>
                     )}
                     <p className="text-gray-300">Signed to Publisher: {(selectedApplication as ProducerApplication).signed_to_publisher || 'N/A'}</p>
                     {(selectedApplication as ProducerApplication).signed_to_publisher === 'Yes' && (selectedApplication as ProducerApplication).publisher_relationship_explanation && (
                       <p className="text-gray-300">Publisher Relationship: {(selectedApplication as ProducerApplication).publisher_relationship_explanation}</p>
                     )}
                     <p className="text-gray-300">Signed to Manager: {(selectedApplication as ProducerApplication).signed_to_manager || 'N/A'}</p>
                     {(selectedApplication as ProducerApplication).signed_to_manager === 'Yes' && (selectedApplication as ProducerApplication).manager_relationship_explanation && (
                       <p className="text-gray-300">Manager Relationship: {(selectedApplication as ProducerApplication).manager_relationship_explanation}</p>
                     )}
                     <p className="text-gray-300">Entity Collects Payment: {(selectedApplication as ProducerApplication).entity_collects_payment || 'N/A'}</p>
                     {(selectedApplication as ProducerApplication).entity_collects_payment === 'Yes' && (selectedApplication as ProducerApplication).payment_collection_explanation && (
                       <p className="text-gray-300">Payment Collection: {(selectedApplication as ProducerApplication).payment_collection_explanation}</p>
                     )}
                     <p className="text-gray-300">Production Master Percentage: {(selectedApplication as ProducerApplication).production_master_percentage || 0}%</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Ranking & Status</h3>
                     <p className="text-gray-300">Ranking Score: {(selectedApplication as ProducerApplication).ranking_score || 0} points</p>
                     <p className="text-gray-300">Is Auto-Rejected: {(selectedApplication as ProducerApplication).is_auto_rejected ? 'Yes' : 'No'}</p>
                     {(selectedApplication as ProducerApplication).is_auto_rejected && (
                       <p className="text-red-300">Rejection Reason: {(selectedApplication as ProducerApplication).rejection_reason}</p>
                     )}
                   </div>

                   {(selectedApplication as ProducerApplication).additional_info && (
                     <div>
                       <h3 className="text-white font-semibold mb-2">Additional Information</h3>
                       <p className="text-gray-300 whitespace-pre-wrap">{(selectedApplication as ProducerApplication).additional_info}</p>
                     </div>
                   )}
                 </>
               ) : selectedType === 'artist' ? (
                 <>
                   <div>
                     <h3 className="text-white font-semibold mb-2">Artist Details</h3>
                     <p className="text-gray-300">Artist Type: {(selectedApplication as ArtistApplication).artist_type}</p>
                     <p className="text-gray-300">Primary Genre: {(selectedApplication as ArtistApplication).primary_genre}</p>
                     <p className="text-gray-300">Stage Name: {(selectedApplication as ArtistApplication).stage_name}</p>
                     <p className="text-gray-300">Music Producer: {(selectedApplication as ArtistApplication).music_producer}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Production & Creation</h3>
                     <p className="text-gray-300">Production Method: {(selectedApplication as ArtistApplication).production_method}</p>
                     <p className="text-gray-300">Uses Premade Tracks: {(selectedApplication as ArtistApplication).uses_premade_tracks}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Ownership & Rights</h3>
                     <p className="text-gray-300">Master Rights Owner: {(selectedApplication as ArtistApplication).master_rights_owner}</p>
                     <p className="text-gray-300">Publishing Rights Owner: {(selectedApplication as ArtistApplication).publishing_rights_owner}</p>
                     <p className="text-gray-300">Shares Ownership: {(selectedApplication as ArtistApplication).shares_ownership}</p>
                     {(selectedApplication as ArtistApplication).ownership_explanation && (
                       <p className="text-gray-300">Ownership Explanation: {(selectedApplication as ArtistApplication).ownership_explanation}</p>
                     )}
                     <p className="text-gray-300">Is One-Stop: {(selectedApplication as ArtistApplication).is_one_stop}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Releases & Catalog</h3>
                     <p className="text-gray-300">Has Streaming Releases: {(selectedApplication as ArtistApplication).has_streaming_releases}</p>
                     {(selectedApplication as ArtistApplication).streaming_links && (
                       <p className="text-gray-300">Streaming Links: {(selectedApplication as ArtistApplication).streaming_links}</p>
                     )}
                     <p className="text-gray-300">Catalog Track Count: {(selectedApplication as ArtistApplication).catalog_track_count}</p>
                     <p className="text-gray-300">Has Instrumentals: {(selectedApplication as ArtistApplication).has_instrumentals}</p>
                     <p className="text-gray-300">Has Stems: {(selectedApplication as ArtistApplication).has_stems}</p>
                     <p className="text-gray-300">Has Sync Licenses: {(selectedApplication as ArtistApplication).has_sync_licenses}</p>
                     <p className="text-gray-300">Understands Rights Requirement: {(selectedApplication as ArtistApplication).understands_rights_requirement}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Account Management</h3>
                     <p className="text-gray-300">Account Manager Name: {(selectedApplication as ArtistApplication).account_manager_name}</p>
                     <p className="text-gray-300">Account Manager Email: {(selectedApplication as ArtistApplication).account_manager_email}</p>
                     <p className="text-gray-300">Account Manager Phone: {(selectedApplication as ArtistApplication).account_manager_phone}</p>
                     <p className="text-gray-300">Account Manager Authority: {(selectedApplication as ArtistApplication).account_manager_authority}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Sync Licensing & Quiz</h3>
                     <p className="text-gray-300">Sync Licensing Course: {(selectedApplication as ArtistApplication).sync_licensing_course || 'N/A'}</p>
                     <p className="text-gray-300">Quiz Score: {(selectedApplication as ArtistApplication).quiz_score || 0}/100</p>
                     <p className="text-gray-300">Quiz Completed: {(selectedApplication as ArtistApplication).quiz_completed ? 'Yes' : 'No'}</p>
                     <p className="text-gray-300">Q1 Answer: {(selectedApplication as ArtistApplication).quiz_question_1 || '(empty)'}</p>
                     <p className="text-gray-300">Q2 Answer: {(selectedApplication as ArtistApplication).quiz_question_2 || '(empty)'}</p>
                     <p className="text-gray-300">Q3 Answer: {(selectedApplication as ArtistApplication).quiz_question_3 || '(empty)'}</p>
                     <p className="text-gray-300">Q4 Answer: {(selectedApplication as ArtistApplication).quiz_question_4 || '(empty)'}</p>
                     <p className="text-gray-300">Q5 Answer: {(selectedApplication as ArtistApplication).quiz_question_5 || '(empty)'}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Application Scoring & Status</h3>
                     <p className="text-gray-300">Application Score: {(selectedApplication as ArtistApplication).application_score || 0} points</p>
                     <p className="text-gray-300">Auto-Disqualified: {(selectedApplication as ArtistApplication).auto_disqualified ? 'Yes' : 'No'}</p>
                     {(selectedApplication as ArtistApplication).rejection_reason && (
                       <p className="text-red-300">Rejection Reason: {(selectedApplication as ArtistApplication).rejection_reason}</p>
                     )}
                     {(selectedApplication as ArtistApplication).score_breakdown && (
                       <div>
                         <p className="text-gray-300 font-medium">Score Breakdown:</p>
                         <pre className="text-gray-300 text-xs bg-gray-700 p-2 rounded mt-1 overflow-x-auto">
                           {JSON.stringify((selectedApplication as ArtistApplication).score_breakdown, null, 2)}
                         </pre>
                       </div>
                     )}
                   </div>

                   {(selectedApplication as ArtistApplication).additional_info && (
                     <div>
                       <h3 className="text-white font-semibold mb-2">Additional Information</h3>
                       <p className="text-gray-300 whitespace-pre-wrap">{(selectedApplication as ArtistApplication).additional_info}</p>
                     </div>
                   )}
                 </>
               ) : (
                 <>
                   <div>
                     <h3 className="text-white font-semibold mb-2">Rights Holder Details</h3>
                     <p className="text-gray-300">Company Name: {(selectedApplication as RightsHolderApplication).company_name}</p>
                     <p className="text-gray-300">Contact: {(selectedApplication as RightsHolderApplication).contact_first_name} {(selectedApplication as RightsHolderApplication).contact_last_name}</p>
                     <p className="text-gray-300">Phone: {(selectedApplication as RightsHolderApplication).phone || 'N/A'}</p>
                     <p className="text-gray-300">Rights Holder Type: {(selectedApplication as RightsHolderApplication).rights_holder_type}</p>
                     <p className="text-gray-300">Website: {(selectedApplication as RightsHolderApplication).website || 'N/A'}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Company Information</h3>
                     <p className="text-gray-300">Company Size: {(selectedApplication as RightsHolderApplication).company_size || 'N/A'}</p>
                     <p className="text-gray-300">Years in Business: {(selectedApplication as RightsHolderApplication).years_in_business || 'N/A'}</p>
                     <p className="text-gray-300">Catalog Size: {(selectedApplication as RightsHolderApplication).catalog_size || 'N/A'} tracks</p>
                     <p className="text-gray-300">Revenue Range: {(selectedApplication as RightsHolderApplication).revenue_range || 'N/A'}</p>
                     <p className="text-gray-300">Primary Genres: {(selectedApplication as RightsHolderApplication).primary_genres?.join(', ') || 'N/A'}</p>
                     <p className="text-gray-300">Target Markets: {(selectedApplication as RightsHolderApplication).target_markets?.join(', ') || 'N/A'}</p>
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Licensing Information</h3>
                     <p className="text-gray-300">Has Sync Experience: {(selectedApplication as RightsHolderApplication).has_sync_experience ? 'Yes' : 'No'}</p>
                     {(selectedApplication as RightsHolderApplication).has_sync_experience && (
                       <p className="text-gray-300">Sync Experience Details: {(selectedApplication as RightsHolderApplication).sync_experience_details || 'N/A'}</p>
                     )}
                     <p className="text-gray-300">Has Licensing Team: {(selectedApplication as RightsHolderApplication).has_licensing_team ? 'Yes' : 'No'}</p>
                     {(selectedApplication as RightsHolderApplication).has_licensing_team && (
                       <p className="text-gray-300">Licensing Team Size: {(selectedApplication as RightsHolderApplication).licensing_team_size || 'N/A'}</p>
                     )}
                   </div>

                   <div>
                     <h3 className="text-white font-semibold mb-2">Application Status</h3>
                     <p className="text-gray-300">Application Score: {(selectedApplication as RightsHolderApplication).application_score || 0} points</p>
                     <p className="text-gray-300">Auto-Disqualified: {(selectedApplication as RightsHolderApplication).auto_disqualified ? 'Yes' : 'No'}</p>
                     {(selectedApplication as RightsHolderApplication).rejection_reason && (
                       <p className="text-red-300">Rejection Reason: {(selectedApplication as RightsHolderApplication).rejection_reason}</p>
                     )}
                   </div>

                   {(selectedApplication as RightsHolderApplication).additional_info && (
                     <div>
                       <h3 className="text-white font-semibold mb-2">Additional Information</h3>
                       <p className="text-gray-300 whitespace-pre-wrap">{(selectedApplication as RightsHolderApplication).additional_info}</p>
                     </div>
                   )}
                 </>
               )}

              {/* Action Buttons Section */}
              <div className="pt-4 border-t border-gray-600">
                <h3 className="text-white font-semibold mb-3">Application Actions</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                  {/* New Applications Actions */}
                {selectedApplication.status === 'new' && (
                  <>
                    <Button
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, 'invited', selectedType);
                        setShowApplicationModal(false);
                      }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                    >
                        <UserPlus className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'manual_review', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        size="sm"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Manual Review
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'save_for_later', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                    <Button
                      onClick={() => {
                        updateApplicationStatus(selectedApplication.id, 'declined', selectedType);
                        setShowApplicationModal(false);
                      }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}

                  {/* Invited Applications Actions */}
                  {selectedApplication.status === 'invited' && (
                    <>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'onboarded', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Move to Onboarded
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'new', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'manual_review', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        size="sm"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Manual Review
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'save_for_later', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'declined', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}

                  {/* Onboarded Applications Actions */}
                  {selectedApplication.status === 'onboarded' && (
                    <>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'new', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'manual_review', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        size="sm"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Manual Review
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'save_for_later', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'declined', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}

                  {/* Manual Review Applications Actions */}
                  {selectedApplication.status === 'manual_review' && (
                    <>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'onboarded', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Move to Onboarded
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'invited', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Move to Invited
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'new', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'save_for_later', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'declined', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}

                  {/* Save for Later Applications Actions */}
                  {selectedApplication.status === 'save_for_later' && (
                    <>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'new', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'invited', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'manual_review', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        size="sm"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Manual Review
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'declined', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </>
                  )}

                  {/* Declined Applications Actions */}
                  {selectedApplication.status === 'declined' && (
                    <>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'new', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'manual_review', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        size="sm"
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Manual Review
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'save_for_later', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                    </>
                  )}

                  {/* Manual Review Applications Actions */}
                  {selectedApplication.status === 'in_review' && (
                    <>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'new', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Move to New
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'onboarded', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Move to Onboarded
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'save_for_later', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save for Later
                      </Button>
                      <Button
                        onClick={() => {
                          updateApplicationStatus(selectedApplication.id, 'declined', selectedType);
                          setShowApplicationModal(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </>
                )}
                </div>

                {/* Close Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowApplicationModal(false)}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
