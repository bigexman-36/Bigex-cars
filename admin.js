import { supabase, getCurrentUser, ensureProfile, signOut, ADMIN_EMAIL } from './supabase.js';

const status=document.getElementById('status');
const pending=document.getElementById('pending');
const approved=document.getElementById('approved');
const signOutBtn=document.getElementById('signOutBtn');

function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function card(c,actions){
  return '<div class="row"><div><strong>'+esc(c.name)+'</strong><div class="muted">'+esc(c.year)+' • '+esc(c.type)+' • ₦'+Number(c.price||0).toLocaleString()+' • '+esc(c.location)+'</div><small class="muted">'+esc(c.seller_name||'Seller')+' • '+esc(c.email||'')+'</small></div><div>'+actions+'</div></div>';
}
function render(listings){
  const p=listings.filter(x=>x.status==='pending');
  const a=listings.filter(x=>x.status==='approved');
  pending.innerHTML=p.length?p.map(c=>card(c,'<button class="approve" data-action="approve" data-id="'+c.id+'">Approve</button><button class="reject" data-action="reject" data-id="'+c.id+'">Reject</button>')).join(''):'<p class="muted">No pending listings.</p>';
  approved.innerHTML=a.length?a.map(c=>card(c,'<button class="reject" data-action="remove" data-id="'+c.id+'">Remove</button>')).join(''):'<p class="muted">No approved listings.</p>';
  document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>moderate(btn.dataset.id,btn.dataset.action)));
}
async function loadListings(){
  const {data,error}=await supabase.from('listings').select('*').in('status',['pending','approved']).order('created_at',{ascending:false});
  if(error)throw error;
  render(data||[]);
}
async function moderate(id,action){
  const next=action==='approve'?'approved':'rejected';
  if(!confirm(action==='approve'?'Approve this listing?':action==='remove'?'Remove this listing from the marketplace?':'Reject this listing?'))return;
  try{
    const {error}=await supabase.from('listings').update({status:next}).eq('id',id);
    if(error)throw error;
    await loadListings();
  }catch(error){alert(error.message||'Could not update listing.');}
}
async function boot(){
  try{
    const user=await getCurrentUser();
    if(!user){
      location.replace('login.html');
      return;
    }
    const profile=await ensureProfile(user);
    const isAdmin=profile?.role==='admin' || String(user.email||'').toLowerCase()===String(ADMIN_EMAIL).toLowerCase() && profile?.role==='admin';
    if(!isAdmin){
      status.innerHTML='<strong>Admin access required.</strong><p class="muted">This account does not have administrator privileges.</p><button class="ghost" id="goBack">← Marketplace</button>';
      document.getElementById('goBack').onclick=()=>location.href='index.html';
      return;
    }
    status.innerHTML='<strong class="accent">Administrator authenticated.</strong><p class="muted">Cloud moderation is active for '+esc(user.email)+'</p>';
    await loadListings();
  }catch(error){
    console.error(error);
    status.innerHTML='<strong>Could not verify admin access.</strong><p class="muted">'+esc(error.message)+'</p>';
  }
}
signOutBtn.addEventListener('click',async()=>{await signOut();localStorage.removeItem('bigexSession');location.replace('login.html')});
boot();