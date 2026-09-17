// Authentication foundation for Bigex Cars.
// Production authentication must verify identity server-side with an auth provider.
const ADMIN_EMAIL = 'igetobiloluwa36@gmail.com';

export function roleForEmail(email) {
  return String(email || '').trim().toLowerCase() === ADMIN_EMAIL ? 'admin' : 'buyer';
}

export function createSession(user) {
  const session = { ...user, role: roleForEmail(user.email), signedInAt: new Date().toISOString() };
  localStorage.setItem('bigexSession', JSON.stringify(session));
  return session;
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem('bigexSession')) || null; } catch { return null; }
}

export function signOut() { localStorage.removeItem('bigexSession'); }

export function requireAdmin() {
  const session = getSession();
  return !!session && session.role === 'admin' && session.email.toLowerCase() === ADMIN_EMAIL;
}
