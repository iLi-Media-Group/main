import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Email templates for 6 weeks
const templates: { subject: string; html: (firstName: string) => string }[] = [
  {
    subject: '🎬 Need music for your project? Start licensing instantly.',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Meet Mario. He’s producing an indie film and needs music that fits the mood without copyright risk.<br/><br/>With MyBeatFi Track Licensing, you can license tracks legally and securely—ready for film, ads, or podcasts.<br/><br/><a href="https://mybeatfi.io/catalog">Browse Tracks & License Now</a>`
  },
  {
    subject: '💬 Connect directly with producers before you license',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Imagine Sarah, a creative director. She finds the perfect track listed as a Sync Proposal.<br/><br/>That means the producer wants to be contacted first. Share details, chat, negotiate, then receive the official license.<br/><br/><a href="https://mybeatfi.io/sync-proposals">Submit a Sync Proposal Today</a>`
  },
  {
    subject: '✨ Get music custom-made for your project',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Meet David. He needs a completely original soundtrack for a fashion brand campaign.<br/><br/>With Custom Sync Requests, connect with producers who create on-brand music just for you.<br/><br/><a href="https://mybeatfi.io/custom-sync-request">Request a Custom Track Now</a>`
  },
  {
    subject: '❤️ Save the tracks you love (and never lose them)',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Picture Ana. She hears the perfect track late at night and wants to find it later.<br/><br/>Click the heart icon to favorite tracks—ready to revisit anytime.<br/><br/><a href="https://mybeatfi.io/catalog">Start Favoriting Tracks Today</a>`
  },
  {
    subject: '👩‍🎤 Stay connected to your favorite creators',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Take James. He follows producers who match his projects. When they upload, he’s first to know.<br/><br/><a href="https://mybeatfi.io/producers">Follow a Producer Now</a>`
  },
  {
    subject: '🎶 Curated playlists, saved for you',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Think of Carla. She favorites playlists full of cinematic tracks and returns anytime.<br/><br/><a href="https://mybeatfi.io/favorited-playlists">Discover & Favorite Playlists Now</a>`
  }
];

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MyBeatFi <welcome@mybeatfi.com>",
      to: to,
      subject,
      html,
      tags: [{ name: "drip", value: "client_welcome" }]
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }
}

function addWeeks(dateIso: string, weeks: number): string {
  const d = new Date(dateIso);
  d.setUTCDate(d.getUTCDate() + (7 * weeks));
  return d.toISOString();
}

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date().toISOString();
    const { data: due, error } = await supabase
      .from('client_welcome_drip_subscriptions')
      .select('*')
      .lte('next_send_at', now)
      .eq('completed', false)
      .limit(100);

    if (error) {
      console.error('query error:', error);
      return new Response('error', { status: 500 });
    }

    if (!due || due.length === 0) {
      return new Response('no due items', { status: 200 });
    }

    for (const sub of due) {
      try {
        const weekIdx = Math.min(sub.current_week, templates.length - 1);
        const tpl = templates[weekIdx];
        await sendEmail(sub.email, tpl.subject, tpl.html(sub.first_name || 'there'));

        const nextWeek = sub.current_week + 1;
        const completed = nextWeek >= templates.length;
        const nextSend = completed ? sub.next_send_at : addWeeks(sub.next_send_at, 1);

        const { error: upErr } = await supabase
          .from('client_welcome_drip_subscriptions')
          .update({ current_week: nextWeek, completed, next_send_at: nextSend })
          .eq('id', sub.id);

        if (upErr) console.error('update error:', upErr);
      } catch (sendErr) {
        console.error('send error for', sub.email, sendErr);
        // Skip; will retry next run
      }
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('process error:', err);
    return new Response('error', { status: 500 });
  }
});


