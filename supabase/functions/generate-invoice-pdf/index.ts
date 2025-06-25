import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://mybeatfi.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { proposal_id } = await req.json()

    if (!proposal_id) {
      return new Response(
        JSON.stringify({ error: 'Proposal ID is required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch proposal details
    const { data: proposal, error: proposalError } = await supabaseClient
      .from('sync_proposals')
      .select(`
        *,
        tracks (
          title,
          artist,
          genre,
          bpm,
          key,
          duration
        ),
        clients (
          first_name,
          last_name,
          email,
          company_name
        ),
        producers (
          first_name,
          last_name,
          email,
          company_name
        )
      `)
      .eq('id', proposal_id)
      .single()

    if (proposalError || !proposal) {
      return new Response(
        JSON.stringify({ error: 'Proposal not found' }),
        { status: 404, headers: corsHeaders }
      )
    }

    // Verify payment status
    if (proposal.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Invoice can only be generated for paid proposals' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHtml(proposal)

    // Convert HTML to PDF using a simple approach
    // For production, you might want to use a proper PDF library
    const pdfContent = generateSimplePDF(invoiceHtml)

    return new Response(pdfContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${proposal_id.slice(0, 8)}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error generating invoice:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate invoice' }),
      { status: 500, headers: corsHeaders }
    )
  }
})

function generateInvoiceHtml(proposal: any): string {
  const track = proposal.tracks
  const client = proposal.clients
  const producer = proposal.producers
  const acceptedDate = new Date(proposal.accepted_at || proposal.updated_at)
  const dueDate = proposal.payment_due_date ? new Date(proposal.payment_due_date) : acceptedDate

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${proposal.id.slice(0, 8)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; }
        .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .invoice-number { font-size: 16px; color: #666; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-item { margin-bottom: 10px; }
        .info-label { font-weight: bold; color: #666; }
        .track-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .amount { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-number">#${proposal.id.slice(0, 8).toUpperCase()}</div>
      </div>

      <div class="section">
        <div class="section-title">Billing Information</div>
        <div class="info-grid">
          <div>
            <div class="info-item">
              <div class="info-label">Bill To:</div>
              <div>${client?.first_name} ${client?.last_name}</div>
              ${client?.company_name ? `<div>${client.company_name}</div>` : ''}
              <div>${client?.email}</div>
            </div>
          </div>
          <div>
            <div class="info-item">
              <div class="info-label">From:</div>
              <div>${producer?.first_name} ${producer?.last_name}</div>
              ${producer?.company_name ? `<div>${producer.company_name}</div>` : ''}
              <div>${producer?.email}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Invoice Date:</div>
              <div>${acceptedDate.toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Due Date:</div>
              <div>${dueDate.toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Track Details</div>
        <div class="track-details">
          <div class="info-item">
            <div class="info-label">Track Title:</div>
            <div>${track?.title}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Artist:</div>
            <div>${track?.artist}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Genre:</div>
            <div>${track?.genre}</div>
          </div>
          <div class="info-item">
            <div class="info-label">BPM:</div>
            <div>${track?.bpm}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Key:</div>
            <div>${track?.key}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Duration:</div>
            <div>${track?.duration}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Payment Terms</div>
        <div class="info-item">
          <div class="info-label">Payment Terms:</div>
          <div>${proposal.payment_terms || 'Immediate'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Usage Rights:</div>
          <div>${proposal.usage_rights || 'Standard sync license'}</div>
        </div>
      </div>

      <div class="amount">
        Total Amount: $${proposal.sync_fee?.toFixed(2) || '0.00'}
      </div>

      <div class="footer">
        <p>This invoice was generated automatically by MyBeatFi</p>
        <p>Proposal ID: ${proposal.id}</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>
  `
}

function generateSimplePDF(html: string): Uint8Array {
  // This is a simplified approach - in production, you'd want to use a proper PDF library
  // For now, we'll return the HTML as-is, which browsers can handle
  const encoder = new TextEncoder()
  return encoder.encode(html)
} 