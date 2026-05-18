const { supabase } = require('../lib/supabase');
const { v4: uuidv4 } = require('uuid');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async function handler(req, res) {
  Object.entries(cors).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('guests')
      .select('id, name, phone, ticket_id, checked_in, checked_in_at, created_at')
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ guests: data });
  }

  if (req.method === 'POST') {
    const { name, phone } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const ticket_id = uuidv4();

    const { data, error } = await supabase
      .from('guests')
      .insert([{ name: name.trim(), phone: phone?.trim() || null, ticket_id }])
      .select('id, name, phone, ticket_id, checked_in, checked_in_at, created_at')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true, guest: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'id is required' });

    const { error } = await supabase.from('guests').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
