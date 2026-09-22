import { supabase } from './supabase.js';

const root=document.getElementById('carDetails');
const id=new URLSearchParams(location.search).get('id');

function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

async function load(){
  if(!id){root.innerHTML='<p class="eyebrow">LISTING NOT FOUND</p><h1>Missing car ID.</h1><a class="primary-btn" href="index.html#explore">Back to marketplace</a>';return}
  const {data:c,error}=await supabase.from('listings').select('*').eq('id',id).eq('status','approved').maybeSingle();
  if(error||!c){root.innerHTML='<p class="eyebrow">LISTING NOT FOUND</p><h1>This car is no longer available.</h1><a class="primary-btn" href="index.html#explore">Back to marketplace</a>';return}
  document.title=c.name+' — Bigex Cars';
  const image=c.image_url?'<img src="'+esc(c.image_url)+'" alt="'+esc(c.name)+'" style="width:100%;max-height:520px;object-fit:cover;border-radius:20px" referrerpolicy="no-referrer">':'<div style="min-height:360px;display:grid;place-items:center;border-radius:20px;background:#111;font-size:5rem">🚘</div>';
  const phone=(c.phone||'').replace(/[^0-9+]/g,'');
  const whatsapp=phone?'<a class="primary-btn" href="https://wa.me/'+phone.replace(/^\+/,'')+'?text='+encodeURIComponent('Hi, I am interested in your '+c.name+' listing on Bigex Cars.')+'" target="_blank" rel="noopener">WhatsApp seller ↗</a>':'';
  const email=c.email?'<a class="ghost-btn" href="mailto:'+encodeURIComponent(c.email)+'">Email seller</a>':'';
  root.innerHTML='<p class="eyebrow">LISTING // '+esc(c.location)+'</p><h1>'+esc(c.name)+'</h1><p style="font-size:1.3rem">₦'+Number(c.price||0).toLocaleString()+'</p><div style="margin:28px 0">'+image+'</div><div class="compare-box"><div><span>YEAR</span><h3>'+esc(c.year)+'</h3></div><div><span>TYPE</span><h3>'+esc(c.type)+'</h3></div><div><span>FUEL</span><h3>'+esc(c.fuel)+'</h3></div><div><span>MILEAGE</span><h3>'+Number(c.mileage||0).toLocaleString()+' km</h3></div></div><div style="margin-top:30px"><p class="eyebrow">DESCRIPTION</p><p style="line-height:1.8">'+esc(c.description||'No description provided.')+'</p></div><div style="margin-top:30px"><p class="eyebrow">SELLER</p><h2>'+esc(c.seller_name||'Seller')+'</h2><p style="color:#8d98a8">'+esc(c.location)+'</p></div><div style="margin-top:20px;display:flex;gap:12px;flex-wrap:wrap">'+whatsapp+email+'<a class="ghost-btn" href="index.html#explore">← Back to cars</a></div>';
}
load();