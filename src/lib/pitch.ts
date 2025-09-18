import { supabase } from './supabase';

export async function getPitchStatusForCurrentUser() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;
  if (!userId) return { isActive: false };
  const { data, error } = await supabase
    .from('pitch_subscriptions')
    .select('is_active, failed_renewal_attempts')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { isActive: false };
  return { isActive: !!data?.is_active, failedAttempts: data?.failed_renewal_attempts ?? 0 };
}

export function showPitchBadgeIfActive() {
  getPitchStatusForCurrentUser().then(({ isActive }) => {
    const badge = document.getElementById('pitch-badge');
    if (badge) {
      if (isActive) {
        badge.classList.remove('hidden');
        badge.classList.add('inline-flex');
      } else {
        badge.classList.add('hidden');
        badge.classList.remove('inline-flex');
      }
    }
  }).catch(() => {
    // Silent failure
  });
}
