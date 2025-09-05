import { supabase } from './supabase';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (emailData: EmailData): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-simple-email', {
      body: emailData
    });

    if (error) {
      console.error('Email service error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const sendVerificationEmail = async (
  to: string,
  companyName: string,
  rightsHolderType: string,
  status: 'verified' | 'rejected',
  notes?: string
): Promise<{ success: boolean; error?: string }> => {
  const subject = status === 'verified' 
    ? '🎉 Your Rights Holder Account Has Been Verified!'
    : '❌ Rights Holder Account Verification Update';

  const html = `
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
        .status-card { background: ${status === 'verified' ? 'linear-gradient(135deg, #10b981/10, #059669/10)' : 'linear-gradient(135deg, #ef4444/10, #dc2626/10)'}; border: 1px solid ${status === 'verified' ? '#10b981/20' : '#ef4444/20'}; border-radius: 8px; padding: 20px; margin: 20px 0; }
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
            ${status === 'verified' ? '✅ Account Verified' : '❌ Verification Rejected'}
          </div>
          <p style="margin: 10px 0; color: #d1d5db;">
            ${status === 'verified' 
              ? 'Congratulations! Your rights holder account has been successfully verified. You can now access all features of the MyBeatFi platform.'
              : 'We regret to inform you that your rights holder account verification has been rejected. Please review the notes below and resubmit if needed.'
            }
          </p>
        </div>

        <div class="company-info">
          <div class="company-name">${companyName}</div>
          <p style="margin: 5px 0; color: #9ca3af;">${rightsHolderType === 'record_label' ? 'Record Label' : 'Publisher'}</p>
          <p style="margin: 5px 0; color: #9ca3af;">${to}</p>
        </div>

        ${notes ? `
        <div style="background: #374151; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #f9fafb;">Review Notes:</h4>
          <p style="margin: 0; color: #d1d5db; line-height: 1.6;">${notes}</p>
        </div>
        ` : ''}

        ${status === 'verified' ? `
        <div style="text-align: center;">
          <a href="https://mybeatfi.io/rights-holder/dashboard" class="button">Access Your Dashboard</a>
        </div>
        ` : `
        <div style="text-align: center;">
          <a href="https://mybeatfi.io/rights-holder/signup" class="button">Resubmit Application</a>
        </div>
        `}
        
        <div class="footer">
          This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
          2025 © All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Rights Holder Verification Update

${status === 'verified' ? '✅ Account Verified' : '❌ Verification Rejected'}

Company: ${companyName}
Type: ${rightsHolderType === 'record_label' ? 'Record Label' : 'Publisher'}
Email: ${to}

${status === 'verified' 
  ? 'Congratulations! Your rights holder account has been successfully verified. You can now access all features of the MyBeatFi platform.'
  : 'We regret to inform you that your rights holder account verification has been rejected. Please review the notes below and resubmit if needed.'
}

${notes ? `Review Notes: ${notes}` : ''}

${status === 'verified' 
  ? 'Access your dashboard: https://mybeatfi.io/rights-holder/dashboard'
  : 'Resubmit application: https://mybeatfi.io/rights-holder/signup'
}

---
MyBeatFi.io | iLi Media Group, LLC
2025 © All rights reserved.
  `;

  return await sendEmail({
    to,
    subject,
    html,
    text
  });
};

export const sendRecordingVerificationEmail = async (
  to: string,
  trackTitle: string,
  artist: string,
  genre: string,
  mood: string,
  bpm: number,
  key: string,
  status: 'verified' | 'rejected',
  notes?: string
): Promise<{ success: boolean; error?: string }> => {
  const subject = status === 'verified' 
    ? '🎵 Your Recording Has Been Verified!'
    : '❌ Recording Verification Update';

  const html = `
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
        .status-card { background: ${status === 'verified' ? 'linear-gradient(135deg, #10b981/10, #059669/10)' : 'linear-gradient(135deg, #ef4444/10, #dc2626/10)'}; border: 1px solid ${status === 'verified' ? '#10b981/20' : '#ef4444/20'}; border-radius: 8px; padding: 20px; margin: 20px 0; }
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
            ${status === 'verified' ? '✅ Recording Verified' : '❌ Verification Rejected'}
          </div>
          <p style="margin: 10px 0; color: #d1d5db;">
            ${status === 'verified' 
              ? 'Congratulations! Your recording has been successfully verified and is now available for licensing on the MyBeatFi platform.'
              : 'We regret to inform you that your recording verification has been rejected. Please review the notes below and resubmit if needed.'
            }
          </p>
        </div>

        <div class="track-info">
          <div class="track-title">${trackTitle}</div>
          <p style="margin: 5px 0; color: #9ca3af;">Artist: ${artist}</p>
          <p style="margin: 5px 0; color: #9ca3af;">Genre: ${genre} • Mood: ${mood}</p>
          <p style="margin: 5px 0; color: #9ca3af;">BPM: ${bpm} • Key: ${key}</p>
        </div>

        ${notes ? `
        <div style="background: #374151; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #f9fafb;">Review Notes:</h4>
          <p style="margin: 0; color: #d1d5db; line-height: 1.6;">${notes}</p>
        </div>
        ` : ''}

        ${status === 'verified' ? `
        <div style="text-align: center;">
          <a href="https://mybeatfi.io/rights-holder/recordings" class="button">View Your Recordings</a>
        </div>
        ` : `
        <div style="text-align: center;">
          <a href="https://mybeatfi.io/rights-holder/upload" class="button">Resubmit Recording</a>
        </div>
        `}
        
        <div class="footer">
          This email was sent by MyBeatFi.io | iLi Media Group, LLC<br />
          2025 © All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Recording Verification Update

${status === 'verified' ? '✅ Recording Verified' : '❌ Verification Rejected'}

Track: ${trackTitle}
Artist: ${artist}
Genre: ${genre} • Mood: ${mood}
BPM: ${bpm} • Key: ${key}

${status === 'verified' 
  ? 'Congratulations! Your recording has been successfully verified and is now available for licensing on the MyBeatFi platform.'
  : 'We regret to inform you that your recording verification has been rejected. Please review the notes below and resubmit if needed.'
}

${notes ? `Review Notes: ${notes}` : ''}

${status === 'verified' 
  ? 'View your recordings: https://mybeatfi.io/rights-holder/recordings'
  : 'Resubmit recording: https://mybeatfi.io/rights-holder/upload'
}

---
MyBeatFi.io | iLi Media Group, LLC
2025 © All rights reserved.
  `;

  return await sendEmail({
    to,
    subject,
    html,
    text
  });
};
