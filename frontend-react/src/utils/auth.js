const KEY = 'party_admin_auth';

export const auth = {
  check() {
    try { return localStorage.getItem(KEY) === 'true'; }
    catch { return false; }
  },
  login(username, password) {
    if (username === 'admin' && password === 'admin') {
      try { localStorage.setItem(KEY, 'true'); } catch {}
      return true;
    }
    return false;
  },
  logout() {
    try { localStorage.removeItem(KEY); } catch {}
  },
};
