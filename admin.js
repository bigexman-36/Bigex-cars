import { supabase, getCurrentUser, ensureProfile, signOut, ADMIN_EMAIL } from './supabase.js';

const status = document.getElementById('status');
const pending = document.getElementById('pending');
const approved = document.getElementById('approved');
const signOutBtn = document.getElementById('signOutBtn');
const pendingCount = document.getElementById('pendingCount');
const approvedCount = document.getElementById('approvedCount');
const totalCount = document.getElementById('totalCount');

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function money(value) {
  return '₦' + Number(value || 0).toLocaleString();
}

function listingCard(c, actions) {
  const image = c.image_url
    ? '<img src="' + esc(c.image_url) + '" alt="" loading="lazy" referrerpolicy="no-referrer">'
    : '<span aria-hidden="true">◇</span>';

  return '<article class="admin-listing">' +
    '<div class="admin-thumb">' + image + '</div>' +
    '<div class="admin-listing-main">' +
      '<div class="admin-listing-top"><span class="admin-status-badge ' + esc(c.status) + '">' + esc(c.status) + '</span><span class="admin-date">' + esc(c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Date unavailable') + '</span></div>' +
      '<h3>' + esc(c.name) + '</h3>' +
      '<p class="admin-meta">' + esc(c.year) + ' · ' + esc(c.type) + ' · ' + esc(c.fuel || '—') + ' · ' + esc(c.transmission || 'Automatic') + '</p>' +
      '<strong class="admin-price">' + money(c.price) + '</strong>' +
      '<p class="admin-seller">' + esc(c.location || 'Location unavailable') + ' · ' + esc(c.seller_name || 'Seller') + ' · ' + esc(c.email || 'No email') + '</p>' +
    '</div>' +
    '<div class="admin-actions">' + actions + '</div>' +
  '</article>';
}

function render(listings) {
  const p = listings.filter(x => x.status === 'pending');
  const a = listings.filter(x => x.status === 'approved');

  pendingCount.textContent = p.length;
  approvedCount.textContent = a.length;
  totalCount.textContent = p.length + a.length;
  document.getElementById('pendingLabel').textContent = p.length + (p.length === 1 ? ' waiting' : ' waiting');
  document.getElementById('approvedLabel').textContent = a.length + ' live';

  pending.innerHTML = p.length
    ? p.map(c => listingCard(c,
        '<button class="admin-btn approve" data-action="approve" data-id="' + esc(c.id) + '">Approve</button>' +
        '<button class="admin-btn reject" data-action="reject" data-id="' + esc(c.id) + '">Reject</button>'
      )).join('')
    : '<div class="admin-empty"><strong>Queue is clear.</strong><span>No pending listings need review.</span></div>';

  approved.innerHTML = a.length
    ? a.map(c => listingCard(c,
        '<button class="admin-btn remove" data-action="remove" data-id="' + esc(c.id) + '">Remove</button>'
      )).join('')
    : '<div class="admin-empty"><strong>No live listings yet.</strong><span>Approved vehicles will appear here.</span></div>';

  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => moderate(btn.dataset.id, btn.dataset.action));
  });
}

async function loadListings() {
  pending.innerHTML = '<div class="admin-loading">Refreshing moderation queue…</div>';
  approved.innerHTML = '<div class="admin-loading">Loading marketplace…</div>';

  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  render(data || []);
}

async function moderate(id, action) {
  const messages = {
    approve: 'Approve this listing and publish it?',
    reject: 'Reject this listing?',
    remove: 'Remove this listing from the marketplace?'
  };
  if (!confirm(messages[action])) return;

  try {
    const next = action === 'approve' ? 'approved' : 'rejected';
    const { error } = await supabase.from('listings').update({ status: next }).eq('id', id);
    if (error) throw error;
    await loadListings();
  } catch (error) {
    alert(error.message || 'Could not update listing.');
  }
}

async function boot() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      location.replace('login.html');
      return;
    }

    const profile = await ensureProfile(user);
    const isAdmin = profile?.role === 'admin' &&
      (!ADMIN_EMAIL || String(user.email || '').toLowerCase() === String(ADMIN_EMAIL).toLowerCase());

    if (!isAdmin) {
      status.className = 'admin-status error';
      status.innerHTML = '<strong>Admin access required.</strong><span>This account does not have administrator privileges.</span><a href="index.html">Return to marketplace →</a>';
      return;
    }

    status.className = 'admin-status success';
    status.innerHTML = '<strong>Administrator authenticated.</strong><span>' + esc(user.email) + '</span>';
    await loadListings();
  } catch (error) {
    console.error(error);
    status.className = 'admin-status error';
    status.innerHTML = '<strong>Could not verify admin access.</strong><span>' + esc(error.message) + '</span>';
  }
}

signOutBtn.addEventListener('click', async () => {
  await signOut();
  localStorage.removeItem('bigexSession');
  location.replace('login.html');
});

boot();
