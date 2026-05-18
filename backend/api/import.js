const { supabase } = require('../lib/supabase');
const { v4: uuidv4 } = require('uuid');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async function handler(req, res) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { guests } = req.body;

  if (!Array.isArray(guests) || guests.length === 0) {
    return res.status(400).json({ error: 'guests array is required' });
  }

  if (guests.length > 300) {
    return res.status(400).json({ error: 'Maximum 300 guests per import' });
  }

  const rows = guests
    .filter(g => g.name && g.name.trim() !== '')
    .map(g => ({
      name: g.name.trim(),
      phone: g.phone?.trim() || null,
      ticket_id: uuidv4(),
    }));

  if (rows.length === 0) {
    return res.status(400).json({ error: 'No valid guests found in the CSV' });
  }

  const { data, error } = await supabase
    .from('guests')
    .insert(rows)
    .select('id, name, phone, ticket_id, checked_in, checked_in_at, created_at');

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ success: true, guests: data, count: data.length });
};
