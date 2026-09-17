// Bigex Cars authentication helpers.
// The frontend demo session is retained for local development only.
// Production admin privileges must come from the authenticated backend profile.
const ADMIN_EMAIL = 'igetobiloluwa36@gmail.com';

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function roleForEmail(email) {
  return normalizeEmail(email) === ADMIN_EMAIL ? 'admin' : 'buyer';
}

export function createDemoSession(user) {
  const email = normalizeEmail(user?.email);
  const session = {
    ...user,
    email,
    role: roleForEmail(email),
    signedInAt: new Date().toISOString(),
    demo: true
  };
  localStorage.setItem('bigexSession', JSON.stringify(session));
  return session;
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem('bigexSession')) || null; } catch { return null; }
}

export function signOut() {
  localStorage.removeItem('bigexSession');
}

export function requireAdmin() {
  const session = getSession();
  return Boolean(session?.demo && session.role === 'admin' && normalizeEmail(session.email) === ADMIN_EMAIL);
}

export { ADMIN_EMAIL };
