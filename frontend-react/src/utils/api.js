const BASE = import.meta.env.VITE_API_URL || 'https://your-backend.vercel.app';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  getGuests:    ()              => req('/api/guests'),
  addGuest:     (name, phone)   => req('/api/guests', { method: 'POST', body: JSON.stringify({ name, phone }) }),
  deleteGuest:  (id)            => req(`/api/guests?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
  importGuests: (guests)        => req('/api/import',  { method: 'POST', body: JSON.stringify({ guests }) }),
  scanTicket:   (ticket_id)     => req('/api/scan',    { method: 'POST', body: JSON.stringify({ ticket_id }) }),
};
