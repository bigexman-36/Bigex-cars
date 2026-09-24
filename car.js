import { supabase } from './supabase.js';

const root=document.getElementById('carDetails');
const id=new URLSearchParams(location.search).get('id');

function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function money(value){return '₦'+Number(value||0).toLocaleString()}
function renderError(title,copy){
  root.innerHTML='<div class="detail-empty"><p class="eyebrow">LISTING NOT FOUND</p><h1>'+esc(title)+'</h1><p>'+esc(copy)+'</p><a class="primary-btn" href="index.html#explore">Back to marketplace</a></div>';
}
async function load(){
  if(!id){renderError('Missing car ID.','The listing link is incomplete.');return}
  const {data:c,error}=await supabase.from('listings').select('*').eq('id',id).eq('status','approved').maybeSingle();
  if(error||!c){renderError('This car is no longer available.','It may have been removed or is still waiting for approval.');return}
  document.title=c.name+' — Bigex Cars';
  const image=c.image_url?'<img src="'+esc(c.image_url)+'" alt="'+esc(c.name)+'" referrerpolicy="no-referrer">':'<div class="detail-image-fallback" aria-hidden="true">◇</div>';
  const phone=(c.phone||'').replace(/[^0-9+]/g,'');
  const whatsapp=phone?'<a class="primary-btn" href="https://wa.me/'+phone.replace(/^\+/,'')+'?text='+encodeURIComponent('Hi, I am interested in your '+c.name+' listing on Bigex Cars.')+'" target="_blank" rel="noopener noreferrer">WhatsApp seller ↗</a>':'';
  const email=c.email?'<a class="ghost-btn" href="mailto:'+encodeURIComponent(c.email)+'">Email seller</a>':'';
  root.innerHTML='<div class="detail-layout">'+
    '<div class="detail-main">'+
      '<div class="detail-image">'+image+'<span class="listing-badge">APPROVED LISTING</span></div>'+
      '<div class="detail-heading"><div><p class="eyebrow">LISTING // '+esc(c.location)+'</p><h1>'+esc(c.name)+'</h1><p class="detail-location">'+esc(c.location)+'</p></div><div class="detail-price">'+money(c.price)+'</div></div>'+
      '<div class="detail-spec-grid"><div><span>YEAR</span><strong>'+esc(c.year)+'</strong></div><div><span>TYPE</span><strong>'+esc(c.type)+'</strong></div><div><span>FUEL</span><strong>'+esc(c.fuel)+'</strong></div><div><span>MILEAGE</span><strong>'+Number(c.mileage||0).toLocaleString()+' km</strong></div><div><span>TRANSMISSION</span><strong>'+esc(c.transmission||'Automatic')+'</strong></div><div><span>LOCATION</span><strong>'+esc(c.location)+'</strong></div></div>'+
      '<div class="detail-copy"><p class="eyebrow">DESCRIPTION</p><p>'+esc(c.description||'No description provided.')+'</p></div>'+
    '</div>'+
    '<aside class="seller-card"><p class="eyebrow">SELLER</p><h2>'+esc(c.seller_name||'Seller')+'</h2><p class="seller-location">'+esc(c.location)+'</p><div class="seller-divider"></div><p class="seller-note">Interested in this vehicle? Contact the seller directly and mention Bigex Cars.</p><div class="seller-actions">'+whatsapp+email+'<a class="ghost-btn" href="index.html#explore">Browse more cars</a></div></aside>'+
  '</div>';
}
load();