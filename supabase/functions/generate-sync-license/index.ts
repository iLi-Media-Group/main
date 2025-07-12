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
          id,
          title,
          artist,
          genre,
          bpm,
          key,
          duration,
          track_producer_id
        ),
        client:profiles!sync_proposals_client_id_fkey (
          id,
          first_name,
          last_name,
          email,
          company_name
        ),
        producer:profiles!tracks_track_producer_id_fkey (
          id,
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

    // Check if license already exists
    const { data: existingLicense, error: checkError } = await supabaseClient
      .from('sales')
      .select('id')
      .eq('track_id', proposal.track_id)
      .eq('buyer_id', proposal.client_id)
      .eq('license_type', 'Sync Proposal')
      .eq('transaction_id', proposal_id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing license:', checkError);
    } else if (existingLicense) {
      return new Response(
        JSON.stringify({ error: 'License already exists for this proposal' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate license amount (use negotiated amount if available)
    const licenseAmount = proposal.final_amount || proposal.negotiated_amount || proposal.sync_fee || 0;

    // Create license record in sales table
    const { data: licenseRecord, error: licenseError } = await supabaseClient
      .from('sales')
      .insert({
        track_id: proposal.track_id,
        sale_producer_id: proposal.track.track_producer_id,
        buyer_id: proposal.client_id,
        license_type: 'Sync Proposal',
        amount: licenseAmount,
        payment_method: 'stripe',
        transaction_id: proposal_id,
        created_at: proposal.payment_date || proposal.client_accepted_at || new Date().toISOString(),
        licensee_info: {
          name: `${proposal.client.first_name || ''} ${proposal.client.last_name || ''}`.trim(),
          email: proposal.client.email,
          company: proposal.client.company_name
        }
      })
      .select('id')
      .single();

    if (licenseError) {
      console.error('Error creating license record:', licenseError);
      return new Response(
        JSON.stringify({ error: 'Failed to create license record' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate PDF using a simple HTML template
    const pdfHtml = generateLicenseHTML({
      trackTitle: proposal.track?.title || 'Unknown Track',
      producerName: `${proposal.producer?.first_name || ''} ${proposal.producer?.last_name || ''}`.trim(),
      producerEmail: proposal.producer?.email || '',
      clientName: `${proposal.client?.first_name || ''} ${proposal.client?.last_name || ''}`.trim(),
      clientEmail: proposal.client?.email || '',
      clientCompany: proposal.client?.company_name || undefined,
      projectDescription: proposal.project_description || proposal.project_type || 'Sync project',
      duration: proposal.duration || '1 year',
      isExclusive: proposal.is_exclusive || false,
      syncFee: licenseAmount,
      paymentDate: proposal.payment_date || proposal.client_accepted_at || new Date().toISOString(),
      expirationDate: calculateExpirationDate(
        proposal.payment_date || proposal.client_accepted_at || new Date().toISOString(),
        proposal.duration || '1 year'
      ),
      paymentTerms: proposal.payment_terms || proposal.final_payment_terms || 'immediate'
    });

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
        license_id: licenseRecord.id,
        type: 'sync_proposal',
        pdf_url: publicUrl,
        licensee_info: {
          name: `${proposal.client?.first_name || ''} ${proposal.client?.last_name || ''}`.trim(),
          email: proposal.client?.email || '',
          company: proposal.client?.company_name
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
        licenseId: licenseRecord.id,
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

function calculateExpirationDate(paymentDate: string, duration: string): string {
  const date = new Date(paymentDate);
  
  switch (duration.toLowerCase()) {
    case '1 year':
    case '1yr':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case '2 years':
    case '2yr':
      date.setFullYear(date.getFullYear() + 2);
      break;
    case 'perpetual':
    case 'forever':
      date.setFullYear(date.getFullYear() + 100); // Set to 100 years for "perpetual"
      break;
    default:
      // Default to 1 year
      date.setFullYear(date.getFullYear() + 1);
  }
  
  return date.toISOString();
}

function generateLicenseHTML(licenseData: any): string {
  const expirationDate = new Date(licenseData.expirationDate).toLocaleDateString();
  const paymentDate = new Date(licenseData.paymentDate).toLocaleDateString();
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sync License Agreement</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .section { margin: 20px 0; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .party-info { margin: 20px 0; padding: 15px; background: #f5f5f5; }
        .terms { margin: 20px 0; }
        .signature { margin-top: 40px; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Music Synchronization License Agreement</div>
        <div style="font-size: 18px; color: #666;">"${licenseData.trackTitle}"</div>
    </div>

    <div class="section">
        <p>This Music Synchronization License Agreement ("Agreement") is entered into on ${paymentDate} by and between:</p>
        
        <div class="party-info">
            <strong>Licensor:</strong> MyBeatFi Sync<br>
            <strong>Licensee:</strong> ${licenseData.clientName}
            ${licenseData.clientCompany ? ` (${licenseData.clientCompany})` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-title">License Summary</div>
        <p><strong>Track:</strong> ${licenseData.trackTitle}</p>
        <p><strong>License Type:</strong> Sync Proposal</p>
        <p><strong>Duration:</strong> ${licenseData.duration}</p>
        <p><strong>Exclusive:</strong> ${licenseData.isExclusive ? 'Yes' : 'No'}</p>
        <p><strong>Project Description:</strong> ${licenseData.projectDescription}</p>
        <p><strong>Purchase Date:</strong> ${paymentDate}</p>
        <p><strong>Expiration Date:</strong> ${expirationDate}</p>
        <p><strong>License Fee:</strong> $${licenseData.syncFee.toFixed(2)} USD</p>
        <p><strong>Payment Terms:</strong> ${licenseData.paymentTerms.toUpperCase()}</p>
    </div>

    <div class="section">
        <div class="section-title">License Terms</div>
        <div class="terms">
            <p><strong>1. Grant of License:</strong> Licensor grants Licensee a non-exclusive (unless specified as exclusive above) license to synchronize the musical composition "${licenseData.trackTitle}" in audiovisual works.</p>
            
            <p><strong>2. Scope of Use:</strong> This license covers synchronization in ${licenseData.projectDescription} for the duration specified above.</p>
            
            <p><strong>3. Territory:</strong> Worldwide</p>
            
            <p><strong>4. Term:</strong> ${licenseData.duration} from the date of payment</p>
            
            <p><strong>5. Payment:</strong> Licensee has paid the full license fee of $${licenseData.syncFee.toFixed(2)} USD under ${licenseData.paymentTerms.toUpperCase()} terms.</p>
            
            <p><strong>6. Restrictions:</strong> Licensee may not:</p>
            <ul>
                <li>Use the composition in a manner that exceeds the scope of this license</li>
                <li>Transfer or sublicense this agreement without written consent</li>
                <li>Use the composition after the expiration date</li>
            </ul>
            
            <p><strong>7. Representations:</strong> Licensor represents that it has the right to grant this license.</p>
            
            <p><strong>8. Indemnification:</strong> Licensee agrees to indemnify Licensor against any claims arising from Licensee's use of the composition.</p>
        </div>
    </div>

    <div class="signature">
        <p><strong>Licensor:</strong> MyBeatFi Sync</p>
        <p><strong>Licensee:</strong> ${licenseData.clientName}</p>
        <p><strong>Date:</strong> ${paymentDate}</p>
    </div>

    <div class="footer">
        <p>This agreement constitutes the entire understanding between the parties regarding the synchronization license for "${licenseData.trackTitle}".</p>
        <p>Generated by MyBeatFi Sync on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
  `;
} 