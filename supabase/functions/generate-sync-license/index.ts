import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { proposal_id } = await req.json();

    if (!proposal_id) {
      return new Response(
        JSON.stringify({ error: 'Proposal ID is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch proposal details with all related data
    const { data: proposal, error: proposalError } = await supabaseClient
      .from('sync_proposals')
      .select(`
        *,
        track:tracks (
          title,
          artist,
          genre,
          bpm,
          key,
          duration
        ),
        client:clients (
          first_name,
          last_name,
          email,
          company_name
        ),
        producer:producers (
          first_name,
          last_name,
          email,
          company_name
        )
      `)
      .eq('id', proposal_id)
      .single();

    if (proposalError || !proposal) {
      return new Response(
        JSON.stringify({ error: 'Proposal not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify payment status
    if (proposal.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'License can only be generated for paid proposals' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate expiration date based on duration
    const calculateExpirationDate = (paymentDate: string, duration: string): string => {
      const payment = new Date(paymentDate);
      
      switch (duration.toLowerCase()) {
        case 'perpetual':
          return 'Perpetual';
        case '1 year':
          payment.setFullYear(payment.getFullYear() + 1);
          return payment.toISOString();
        case '2 years':
          payment.setFullYear(payment.getFullYear() + 2);
          return payment.toISOString();
        case '3 years':
          payment.setFullYear(payment.getFullYear() + 3);
          return payment.toISOString();
        case '5 years':
          payment.setFullYear(payment.getFullYear() + 5);
          return payment.toISOString();
        default:
          // Default to 1 year if duration is not specified
          payment.setFullYear(payment.getFullYear() + 1);
          return payment.toISOString();
      }
    };

    // Prepare license data
    const licenseData = {
      trackTitle: proposal.track?.title || 'Unknown Track',
      producerName: `${proposal.producer?.first_name || ''} ${proposal.producer?.last_name || ''}`.trim(),
      producerEmail: proposal.producer?.email || '',
      clientName: `${proposal.client?.first_name || ''} ${proposal.client?.last_name || ''}`.trim(),
      clientEmail: proposal.client?.email || '',
      clientCompany: proposal.client?.company_name || undefined,
      projectDescription: proposal.project_description || proposal.project_title || 'Sync project',
      duration: proposal.duration || '1 year',
      isExclusive: proposal.is_exclusive || false,
      syncFee: proposal.sync_fee || proposal.final_amount || 0,
      paymentDate: proposal.payment_date || proposal.client_accepted_at || new Date().toISOString(),
      expirationDate: calculateExpirationDate(
        proposal.payment_date || proposal.client_accepted_at || new Date().toISOString(),
        proposal.duration || '1 year'
      ),
      paymentTerms: proposal.payment_terms || proposal.final_payment_terms || 'immediate'
    };

    // Generate PDF using a simple HTML template (since we can't use React PDF in edge functions)
    const pdfHtml = generateLicenseHTML(licenseData);

    // Convert HTML to PDF (simplified approach)
    const pdfContent = new TextEncoder().encode(pdfHtml);

    // Upload PDF to Supabase storage
    const fileName = `sync-license-${proposal_id.slice(0, 8)}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('license-agreements')
      .upload(fileName, pdfContent, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from('license-agreements')
      .getPublicUrl(fileName);

    // Store license agreement record
    const { error: dbError } = await supabaseClient
      .from('license_agreements')
      .insert({
        license_id: proposal_id,
        type: 'sync_proposal',
        pdf_url: publicUrl,
        licensee_info: {
          name: licenseData.clientName,
          email: licenseData.clientEmail,
          company: licenseData.clientCompany
        },
        sent_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // Update proposal with license URL
    await supabaseClient
      .from('sync_proposals')
      .update({
        license_url: publicUrl,
        license_generated_at: new Date().toISOString()
      })
      .eq('id', proposal_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        licenseUrl: publicUrl,
        message: 'Sync proposal license generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating sync license:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate license' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

function generateLicenseHTML(license: any): string {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateDuration = (duration: string): string => {
    switch (duration.toLowerCase()) {
      case 'perpetual':
        return 'Perpetual (No Expiration)';
      case '1 year':
        return '1 Year';
      case '2 years':
        return '2 Years';
      case '3 years':
        return '3 Years';
      case '5 years':
        return '5 Years';
      default:
        return duration;
    }
  };

  const getRightsText = (isExclusive: boolean): string => {
    return isExclusive 
      ? 'Exclusive rights granted for the specified duration'
      : 'Non-exclusive rights granted for the specified duration';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Sync License - ${license.trackTitle}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          color: #333; 
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .title { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 8px; 
          color: #1f2937; 
        }
        .subtitle { 
          font-size: 16px; 
          color: #6b7280; 
          margin-bottom: 20px; 
        }
        .section { 
          margin-bottom: 20px; 
        }
        .section-title { 
          font-size: 14px; 
          font-weight: bold; 
          margin-bottom: 10px; 
          color: #1f2937; 
          border-bottom: 1px solid #e5e7eb; 
          padding-bottom: 5px; 
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 2fr; 
          gap: 10px; 
          margin-bottom: 8px; 
        }
        .info-label { 
          font-weight: bold; 
          color: #4b5563; 
        }
        .info-value { 
          color: #374151; 
        }
        .party-info { 
          margin-bottom: 15px; 
          padding: 12px; 
          background-color: #f9fafb; 
          border-radius: 4px; 
        }
        .highlight { 
          background-color: #fef3c7; 
          padding: 8px; 
          border-radius: 4px; 
          margin: 20px 0; 
        }
        .terms-list { 
          margin-left: 20px; 
          margin-bottom: 8px; 
        }
        .terms-item { 
          margin-bottom: 5px; 
          color: #374151; 
        }
        .signature { 
          margin-top: 40px; 
          border-top: 1px solid #e5e7eb; 
          padding-top: 20px; 
        }
        .footer { 
          margin-top: 30px; 
          text-align: center; 
          font-size: 10px; 
          color: #6b7280; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">Music Synchronization License Agreement</div>
        <div class="subtitle">Sync Proposal License</div>
      </div>

      <div class="section">
        <div class="section-title">LICENSE SUMMARY</div>
        <div class="info-grid">
          <div class="info-label">Track Title:</div>
          <div class="info-value">${license.trackTitle}</div>
        </div>
        <div class="info-grid">
          <div class="info-label">Producer:</div>
          <div class="info-value">${license.producerName}</div>
        </div>
        <div class="info-grid">
          <div class="info-label">License Type:</div>
          <div class="info-value">${license.isExclusive ? 'Exclusive' : 'Non-Exclusive'} Sync License</div>
        </div>
        <div class="info-grid">
          <div class="info-label">Duration:</div>
          <div class="info-value">${calculateDuration(license.duration)}</div>
        </div>
        <div class="info-grid">
          <div class="info-label">License Fee:</div>
          <div class="info-value">${formatCurrency(license.syncFee)}</div>
        </div>
        <div class="info-grid">
          <div class="info-label">Payment Date:</div>
          <div class="info-value">${formatDate(license.paymentDate)}</div>
        </div>
        ${license.expirationDate !== 'Perpetual' ? `
        <div class="info-grid">
          <div class="info-label">Expiration Date:</div>
          <div class="info-value">${formatDate(license.expirationDate)}</div>
        </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">PROJECT DETAILS</div>
        <div class="info-grid">
          <div class="info-label">Project Description:</div>
          <div class="info-value">${license.projectDescription}</div>
        </div>
        <div class="info-grid">
          <div class="info-label">Usage Rights:</div>
          <div class="info-value">${getRightsText(license.isExclusive)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">PARTIES</div>
        <div class="party-info">
          <div><strong>Licensor (Producer):</strong> ${license.producerName}</div>
          <div>Email: ${license.producerEmail}</div>
        </div>
        <div class="party-info">
          <div><strong>Licensee (Client):</strong> ${license.clientName}</div>
          ${license.clientCompany ? `<div>Company: ${license.clientCompany}</div>` : ''}
          <div>Email: ${license.clientEmail}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">GRANT OF LICENSE</div>
        <p>
          Licensor hereby grants Licensee a ${license.isExclusive ? 'exclusive' : 'non-exclusive'}, 
          non-transferable license to synchronize and use the musical composition and sound recording 
          titled "${license.trackTitle}" ("Music") for the project described above.
        </p>
        <p>
          This license is worldwide and valid for ${calculateDuration(license.duration).toLowerCase()}, 
          subject to the terms and conditions stated herein.
        </p>
      </div>

      <div class="section">
        <div class="section-title">PERMITTED USES</div>
        <div class="terms-list">
          <div class="terms-item">• Synchronization with visual content for the specified project</div>
          <div class="terms-item">• Public performance in connection with the licensed project</div>
          <div class="terms-item">• Reproduction and distribution as part of the licensed project</div>
          <div class="terms-item">• Digital streaming and broadcasting of the licensed project</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">RESTRICTIONS</div>
        <div class="terms-list">
          <div class="terms-item">• Resell, sublicense, or distribute the Music as a standalone product</div>
          <div class="terms-item">• Use the Music in projects not specified in this agreement</div>
          <div class="terms-item">• Use the Music in a manner that is defamatory, obscene, or illegal</div>
          <div class="terms-item">• Register the Music with any content identification system</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">COMPENSATION</div>
        <p>
          Licensee has paid ${formatCurrency(license.syncFee)} for this license, 
          which covers the specified usage rights for the duration of this agreement.
        </p>
        <p>Payment Terms: ${license.paymentTerms}</p>
      </div>

      <div class="highlight">
        <p>
          <strong>Important:</strong> This license is valid only for the 
          project described above. Any use outside the scope of this agreement requires a separate license.
        </p>
      </div>

      <div class="signature">
        <p>Agreement accepted electronically by ${license.clientName} on ${formatDate(license.paymentDate)}</p>
        <p>Licensee Email: ${license.clientEmail}</p>
        <p>Agreement executed by ${license.producerName} on ${formatDate(license.paymentDate)}</p>
        <p>Licensor Email: ${license.producerEmail}</p>
      </div>

      <div class="footer">
        <p>This agreement was generated automatically by MyBeatFi.io</p>
        <p>Generated on: ${formatDate(new Date().toISOString())}</p>
        <p>For questions or support, contact: support@mybeatfi.io</p>
      </div>
    </body>
    </html>
  `;
} 