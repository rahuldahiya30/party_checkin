const { supabase } = require('../lib/supabase');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async function handler(req, res) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ticket_id } = req.body;

  if (!ticket_id || typeof ticket_id !== 'string' || ticket_id.trim() === '') {
    return res.status(200).json({ success: false, error: 'invalid', message: 'Invalid QR Code' });
  }

  const tid = ticket_id.trim();

  // Atomic check-in: only succeeds if the ticket exists AND is not yet checked in.
  // This prevents race conditions when two scanners scan the same QR simultaneously.
  const { data: checked, error: updateError } = await supabase
    .from('guests')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('ticket_id', tid)
    .eq('checked_in', false)
    .select('name')
    .maybeSingle();

  if (updateError) {
    console.error('Update error:', updateError);
    return res.status(500).json({ success: false, error: 'server_error', message: 'Server error. Try again.' });
  }

  if (checked) {
    // Successfully checked in
    return res.status(200).json({ success: true, guest: { name: checked.name } });
  }

  // Update matched nothing — either ticket doesn't exist OR already checked in
  const { data: existing, error: selectError } = await supabase
    .from('guests')
    .select('name, checked_in, checked_in_at')
    .eq('ticket_id', tid)
    .maybeSingle();

  if (selectError) {
    console.error('Select error:', selectError);
    return res.status(500).json({ success: false, error: 'server_error', message: 'Server error. Try again.' });
  }

  if (!existing) {
    return res.status(200).json({ success: false, error: 'not_found', message: 'Invalid Ticket' });
  }

  // Ticket exists but was already checked in
  const time = new Date(existing.checked_in_at).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return res.status(200).json({
    success: false,
    error: 'already_checked_in',
    message: `${existing.name} already checked in at ${time}`,
  });
};
