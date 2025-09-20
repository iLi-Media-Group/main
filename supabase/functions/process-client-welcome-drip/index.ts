import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Email templates for 6 weeks
const templates: { subject: string; html: (firstName: string) => string }[] = [
  {
    subject: 'Need music without copyright risk?',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Meet Mario, an indie filmmaker with a vision. He's working on his latest project and knows the right soundtrack will set the mood. But Mario has a challenge: he can't risk copyright issues or spend weeks chasing down music rights.<br/><br/>That's where MyBeatFi Track Licensing comes in. With just a few clicks, Mario discovers music that fits his story perfectly and licenses it instantly—legally and securely.<br/><br/>The result? His film now carries the emotional weight he imagined, without any legal headaches.<br/><br/><a href="https://mybeatfi.io/catalog">Browse Tracks & License Now</a>`
  },
  {
    subject: 'Work directly with producers through Sync Proposals',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Imagine Sarah, a creative director producing a high-profile TV commercial. While browsing MyBeatFi, she finds the perfect track. But it's listed as a Sync Proposal.<br/><br/>At first, Sarah wonders if this means extra steps. Instead, it opens the door to direct collaboration with the producer. She submits her project details, chats with the creator, negotiates usage terms, and receives the official license—tailored to her campaign.<br/><br/>The result? Sarah secures a track that feels custom-made, and her commercial connects with audiences exactly as she envisioned.<br/><br/><a href="https://mybeatfi.io/sync-proposals">Submit a Sync Proposal Today</a>`
  },
  {
    subject: 'Get original music made just for your project',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Meet David, a brand manager preparing for a fashion campaign. He knows the soundtrack has to be unique—something no one has heard before. But stock music won't cut it, and he doesn't have in-house composers.<br/><br/>With Custom Sync Requests on MyBeatFi, David posts his creative brief. Within days, talented producers submit tracks crafted specifically for his brand. He reviews the options, chooses one, and works directly with the producer to finalize delivery.<br/><br/>The result? His campaign debuts with an exclusive soundtrack that feels fresh, elevates the brand, and sets it apart from competitors.<br/><br/><a href="https://mybeatfi.io/custom-sync-request">Request a Custom Track Now</a>`
  },
  {
    subject: 'Never lose the perfect track again',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Picture Ana, a documentary filmmaker. One late night, she stumbles across a track that perfectly matches her project. Excited, she tells herself she'll grab it tomorrow—but by the next morning, she can't remember which one it was.<br/><br/>Luckily, MyBeatFi makes it simple. With the Favorite feature, Ana can just click the heart icon and save any track to revisit later.<br/><br/>The result? Ana never loses a great find again, and she builds a personal library of music ready for her projects.<br/><br/><a href="https://mybeatfi.io/catalog">Start Favoriting Tracks Today</a>`
  },
  {
    subject: 'Get notified when your favorite producers upload',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Take James, a podcast producer who discovers a creator with exactly the sound he loves—catchy, modern, and perfectly suited to his episodes. In the past, he'd have to keep checking back, hoping to catch new uploads.<br/><br/>With MyBeatFi, James simply follows the producer. Now, whenever that creator uploads new music, James is notified instantly.<br/><br/>The result? James always has fresh tracks on hand, and his podcast stays sounding current and professional.<br/><br/><a href="https://mybeatfi.io/producers">Follow Your Favorite Producers Now</a>`
  },
  {
    subject: 'Keep your projects organized with playlists',
    html: (firstName) => `Hi ${firstName || 'there'},<br/><br/>Think of Carla, a director working on a documentary. She discovers a playlist filled with cinematic tracks that perfectly match her style. Instead of scrambling to find those sounds again, she simply favorites the playlist.<br/><br/>Now Carla has an inspiration library at her fingertips. Whenever she needs a mood board of music—or a quick set of tracks for a project—her playlists are ready.<br/><br/>The result? Carla saves time, stays organized, and can focus on telling her story while MyBeatFi keeps the music in order.<br/><br/><a href="https://mybeatfi.io/favorited-playlists">Discover & Favorite Playlists Now</a>`
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


