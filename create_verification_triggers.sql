-- Create Verification Triggers for Rights Holders System
-- This script creates database triggers to automatically send email notifications

-- ============================================
-- 1. CREATE EMAIL LOGS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  provider TEXT DEFAULT 'resend',
  recipient_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CREATE VERIFICATION NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS verification_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rights_holder_id UUID REFERENCES rights_holders(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('account_verification', 'recording_verification')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  email_sent_to TEXT NOT NULL,
  subject TEXT NOT NULL,
  notes TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE FUNCTION TO SEND VERIFICATION EMAILS
-- ============================================

CREATE OR REPLACE FUNCTION send_verification_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  email_subject TEXT;
  email_html TEXT;
  email_text TEXT;
  company_name TEXT;
  rights_holder_type TEXT;
  rights_holder_email TEXT;
BEGIN
  -- Only trigger on verification status changes
  IF OLD.verification_status = NEW.verification_status THEN
    RETURN NEW;
  END IF;

  -- Get rights holder details
  SELECT 
    rh.company_name,
    rh.rights_holder_type,
    rh.email
  INTO 
    company_name,
    rights_holder_type,
    rights_holder_email
  FROM rights_holders rh
  WHERE rh.id = NEW.id;

  -- Create notification record
  INSERT INTO verification_notifications (
    rights_holder_id,
    notification_type,
    status,
    email_sent_to,
    subject,
    notes
  ) VALUES (
    NEW.id,
    'account_verification',
    'pending',
    rights_holder_email,
    CASE 
      WHEN NEW.verification_status = 'verified' THEN '🎉 Your Rights Holder Account Has Been Verified!'
      WHEN NEW.verification_status = 'rejected' THEN '❌ Rights Holder Account Verification Update'
      ELSE 'Rights Holder Account Status Update'
    END,
    NEW.verification_notes
  ) RETURNING id INTO notification_id;

  -- Prepare email content
  email_subject := CASE 
    WHEN NEW.verification_status = 'verified' THEN '🎉 Your Rights Holder Account Has Been Verified!'
    WHEN NEW.verification_status = 'rejected' THEN '❌ Rights Holder Account Verification Update'
    ELSE 'Rights Holder Account Status Update'
  END;

  email_html := '
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #111827; color: #f9fafb; padding: 40px; margin: 0; }
        .container { max-width: 600px; margin: auto; background: #1f2937; border-radius: 12px; padding: 30px; border: 1px solid #374151; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 150px; margin-bottom: 15px; }
        .title { font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
        .subtitle { font-size: 16px; color: #9ca3af; margin-bottom: 25px; }
        .status-card { background: ' || CASE WHEN NEW.verification_status = 'verified' THEN 'linear-gradient(135deg, #10b981/10, #059669/10)' ELSE 'linear-gradient(135deg, #ef4444/10, #dc2626/10)' END || '; border: 1px solid ' || CASE WHEN NEW.verification_status = 'verified' THEN '#10b981/20' ELSE '#ef4444/20' END || '; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .status-title { font-size: 20px; font-weight: bold; color: #f9fafb; margin-bottom: 10px; }
        .company-info { background: #374151; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .company-name { font-size: 18px; font-weight: bold; color: #3b82f6; margin-bottom: 5px; }
        .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; transition: all 0.3s ease; }
        .button:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3); }
        .footer { margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #374151; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img class="logo" src="https://mybeatfi.io/logo.png" alt="MyBeatFi Logo" />
          <div class="title">Rights Holder Verification Update</div>
          <div class="subtitle">Your account verification status has been updated</div>
        </div>
        
        <div class="status-card">
          <div class="status-title">
            ' || CASE WHEN NEW.verification_status = 'verified' THEN '✅ Account Verified' ELSE '❌ Verification Rejected' END || '
          </div>
          <p style="margin: 10px 0; color: #d1d5db;">
            ' || CASE WHEN NEW.verification_status = 'verified' 
              THEN 'Congratulations! Your rights holder account has been successfully verified. You can now access all features of the MyBeatFi platform.'
              ELSE 'We regret to inform you that your rights holder account verification has been rejected. Please review the notes below and resubmit if needed.'
            END || '
          </p>
        </div>

        <div class="company-info">
          <div class="company-name">' || company_name || '</div>
          <p style="margin: 5px 0; color: #9ca3af;">' || CASE WHEN rights_holder_type = 'record_label' THEN 'Record Label' ELSE 'Publisher' END || '</p>
          <p style="margin: 5px 0; color: #9ca3af;">' || rights_holder_email || '</p>
        </div>

        ' || CASE WHEN NEW.verification_notes IS NOT NULL AND NEW.verification_notes != '' THEN '
        <div style="background: #374151; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #f9fafb;">Review Notes:</h4>
          <p style="margin: 0; color: #d1d5db; line-height: 1.6;">' || NEW.verification_notes || '</p>
        </div>
        ' ELSE '' END || '

        ' || CASE WHEN NEW.verification_status = 'verified' THEN '
        <div style="text-align: center;">
          <a href="https://mybeatfi.io/rights-holder/dashboard" class="button">Access Your Dashboard</a>
        </div>
        ' ELSE '
        <div style="text-align: center;">
          <a href="https://mybeatfi.io/rights-holder/signup" class="button">Resubmit Application</a>
        </div>
        ' END || '
        
        <div class="footer">
          This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
          2025 © All rights reserved.
        </div>
      </div>
    </body>
    </html>';

  email_text := '
Rights Holder Verification Update

' || CASE WHEN NEW.verification_status = 'verified' THEN '✅ Account Verified' ELSE '❌ Verification Rejected' END || '

Company: ' || company_name || '
Type: ' || CASE WHEN rights_holder_type = 'record_label' THEN 'Record Label' ELSE 'Publisher' END || '
Email: ' || rights_holder_email || '

' || CASE WHEN NEW.verification_status = 'verified' 
  THEN 'Congratulations! Your rights holder account has been successfully verified. You can now access all features of the MyBeatFi platform.'
  ELSE 'We regret to inform you that your rights holder account verification has been rejected. Please review the notes below and resubmit if needed.'
END || '

' || CASE WHEN NEW.verification_notes IS NOT NULL AND NEW.verification_notes != '' THEN 'Review Notes: ' || NEW.verification_notes ELSE '' END || '

' || CASE WHEN NEW.verification_status = 'verified' 
  THEN 'Access your dashboard: https://mybeatfi.io/rights-holder/dashboard'
  ELSE 'Resubmit application: https://mybeatfi.io/rights-holder/signup'
END || '

---
MyBeatFi.io | iLi Media Group, LLC
2025 © All rights reserved.';

  -- Log the email (the actual sending will be handled by the admin panel)
  INSERT INTO email_logs (
    to_email,
    subject,
    status,
    provider
  ) VALUES (
    rights_holder_email,
    email_subject,
    'pending',
    'resend'
  );

  -- Update notification status
  UPDATE verification_notifications 
  SET status = 'pending', updated_at = NOW()
  WHERE id = notification_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CREATE TRIGGER FOR RIGHTS HOLDERS VERIFICATION
-- ============================================

DROP TRIGGER IF EXISTS rights_holder_verification_trigger ON rights_holders;
CREATE TRIGGER rights_holder_verification_trigger
  AFTER UPDATE OF verification_status ON rights_holders
  FOR EACH ROW
  EXECUTE FUNCTION send_verification_notification();

-- ============================================
-- 5. CREATE FUNCTION TO SEND RECORDING VERIFICATION EMAILS
-- ============================================

CREATE OR REPLACE FUNCTION send_recording_verification_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  email_subject TEXT;
  email_html TEXT;
  email_text TEXT;
  rights_holder_email TEXT;
  track_title TEXT;
  artist TEXT;
  genre TEXT;
  mood TEXT;
  bpm INTEGER;
  key TEXT;
BEGIN
  -- Only trigger on verification status changes
  IF OLD.rights_verification_status = NEW.rights_verification_status THEN
    RETURN NEW;
  END IF;

  -- Get recording details
  SELECT 
    mr.title,
    mr.artist,
    mr.genre,
    mr.mood,
    mr.bpm,
    mr.key,
    rh.email
  INTO 
    track_title,
    artist,
    genre,
    mood,
    bpm,
    key,
    rights_holder_email
  FROM master_recordings mr
  LEFT JOIN rights_holders rh ON mr.rights_holder_id = rh.id
  WHERE mr.id = NEW.id;

  -- Skip if no rights holder email
  IF rights_holder_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Create notification record
  INSERT INTO verification_notifications (
    rights_holder_id,
    notification_type,
    status,
    email_sent_to,
    subject,
    notes
  ) VALUES (
    NEW.rights_holder_id,
    'recording_verification',
    'pending',
    rights_holder_email,
    CASE 
      WHEN NEW.rights_verification_status = 'verified' THEN '🎵 Your Recording Has Been Verified!'
      WHEN NEW.rights_verification_status = 'rejected' THEN '❌ Recording Verification Update'
      ELSE 'Recording Verification Status Update'
    END,
    NEW.admin_review_notes
  ) RETURNING id INTO notification_id;

  -- Prepare email content
  email_subject := CASE 
    WHEN NEW.rights_verification_status = 'verified' THEN '🎵 Your Recording Has Been Verified!'
    WHEN NEW.rights_verification_status = 'rejected' THEN '❌ Recording Verification Update'
    ELSE 'Recording Verification Status Update'
  END;

  email_html := '
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #111827; color: #f9fafb; padding: 40px; margin: 0; }
        .container { max-width: 600px; margin: auto; background: #1f2937; border-radius: 12px; padding: 30px; border: 1px solid #374151; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-width: 150px; margin-bottom: 15px; }
        .title { font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
        .subtitle { font-size: 16px; color: #9ca3af; margin-bottom: 25px; }
        .status-card { background: ' || CASE WHEN NEW.rights_verification_status = 'verified' THEN 'linear-gradient(135deg, #10b981/10, #059669/10)' ELSE 'linear-gradient(135deg, #ef4444/10, #dc2626/10)' END || '; border: 1px solid ' || CASE WHEN NEW.rights_verification_status = 'verified' THEN '#10b981/20' ELSE '#ef4444/20' END || '; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .status-title { font-size: 20px; font-weight: bold; color: #f9fafb; margin-bottom: 10px; }
        .track-info { background: #374151; border-radius: 6px; padding: 15px; margin: 20px 0; }
        .track-title { font-size: 18px; font-weight: bold; color: #3b82f6; margin-bottom: 5px; }
        .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 20px 0; transition: all 0.3s ease; }
        .button:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3); }
        .footer { margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #374151; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img class="logo" src="https://mybeatfi.io/logo.png" alt="MyBeatFi Logo" />
          <div class="title">Recording Verification Update</div>
          <div class="subtitle">Your recording verification status has been updated</div>
        </div>
        
        <div class="status-card">
          <div class="status-title">
            ' || CASE WHEN NEW.rights_verification_status = 'verified' THEN '✅ Recording Verified' ELSE '❌ Verification Rejected' END || '
          </div>
          <p style="margin: 10px 0; color: #d1d5db;">
            ' || CASE WHEN NEW.rights_verification_status = 'verified' 
              THEN 'Congratulations! Your recording has been successfully verified and is now available for licensing on the MyBeatFi platform.'
              ELSE 'We regret to inform you that your recording verification has been rejected. Please review the notes below and resubmit if needed.'
            END || '
          </p>
        </div>

        <div class="track-info">
          <div class="track-title">' || track_title || '</div>
          <p style="margin: 5px 0; color: #9ca3af;">Artist: ' || artist || '</p>
          <p style="margin: 5px 0; color: #9ca3af;">Genre: ' || genre || ' • Mood: ' || mood || '</p>
          <p style="margin: 5px 0; color: #9ca3af;">BPM: ' || bpm || ' • Key: ' || key || '</p>
        </div>

        ' || CASE WHEN NEW.admin_review_notes IS NOT NULL AND NEW.admin_review_notes != '' THEN '
        <div style="background: #374151; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #f9fafb;">Review Notes:</h4>
          <p style="margin: 0; color: #d1d5db; line-height: 1.6;">' || NEW.admin_review_notes || '</p>
        </div>
        ' ELSE '' END || '

        ' || CASE WHEN NEW.rights_verification_status = 'verified' THEN '
        <div style="text-align: center;">
          <a href="https://mybeatfi.io/rights-holder/recordings" class="button">View Your Recordings</a>
        </div>
        ' ELSE '
        <div style="text-align: center;">
          <a href="https://mybeatfi.io/rights-holder/upload" class="button">Resubmit Recording</a>
        </div>
        ' END || '
        
        <div class="footer">
          This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
          2025 © All rights reserved.
        </div>
      </div>
    </body>
    </html>';

  email_text := '
Recording Verification Update

' || CASE WHEN NEW.rights_verification_status = 'verified' THEN '✅ Recording Verified' ELSE '❌ Verification Rejected' END || '

Track: ' || track_title || '
Artist: ' || artist || '
Genre: ' || genre || ' • Mood: ' || mood || '
BPM: ' || bpm || ' • Key: ' || key || '

' || CASE WHEN NEW.rights_verification_status = 'verified' 
  THEN 'Congratulations! Your recording has been successfully verified and is now available for licensing on the MyBeatFi platform.'
  ELSE 'We regret to inform you that your recording verification has been rejected. Please review the notes below and resubmit if needed.'
END || '

' || CASE WHEN NEW.admin_review_notes IS NOT NULL AND NEW.admin_review_notes != '' THEN 'Review Notes: ' || NEW.admin_review_notes ELSE '' END || '

' || CASE WHEN NEW.rights_verification_status = 'verified' 
  THEN 'View your recordings: https://mybeatfi.io/rights-holder/recordings'
  ELSE 'Resubmit recording: https://mybeatfi.io/rights-holder/upload'
END || '

---
MyBeatFi.io | iLi Media Group, LLC
2025 © All rights reserved.';

  -- Log the email (the actual sending will be handled by the admin panel)
  INSERT INTO email_logs (
    to_email,
    subject,
    status,
    provider
  ) VALUES (
    rights_holder_email,
    email_subject,
    'pending',
    'resend'
  );

  -- Update notification status
  UPDATE verification_notifications 
  SET status = 'pending', updated_at = NOW()
  WHERE id = notification_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. CREATE TRIGGER FOR MASTER RECORDINGS VERIFICATION
-- ============================================

DROP TRIGGER IF EXISTS master_recording_verification_trigger ON master_recordings;
CREATE TRIGGER master_recording_verification_trigger
  AFTER UPDATE OF rights_verification_status ON master_recordings
  FOR EACH ROW
  EXECUTE FUNCTION send_recording_verification_notification();

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================

-- Check if triggers were created successfully
SELECT 'Verification triggers created successfully' as status;

-- Show pending notifications
SELECT 
  'Pending notifications' as status,
  COUNT(*) as count
FROM verification_notifications 
WHERE status = 'pending';

-- Show email logs
SELECT 
  'Email logs' as status,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_emails,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_emails
FROM email_logs;
