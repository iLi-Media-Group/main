import { supabase } from '../lib/supabase';

export async function requestLicenseRenewal({ licenseType, licenseId, userId }: { licenseType: 'regular' | 'sync', licenseId: string, userId: string }) {
  const res = await fetch('/functions/v1/request-license-renewal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseType, licenseId, userId }),
  });
  return res.json();
}

export async function respondRenewalRequest({ licenseId, producerId, action, reason }: { licenseId: string, producerId: string, action: 'accept' | 'reject', reason?: string }) {
  const res = await fetch('/functions/v1/respond-renewal-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseId, producerId, action, reason }),
  });
  return res.json();
}

export async function completeRenewal({ licenseType, licenseId, userId, newExpiryDate }: { licenseType: 'regular' | 'sync', licenseId: string, userId: string, newExpiryDate: string }) {
  const res = await fetch('/functions/v1/complete-renewal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseType, licenseId, userId, newExpiryDate }),
  });
  return res.json();
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
} 