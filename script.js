import { supabase, signOut, getCurrentUser, ensureProfile } from './supabase.js';

const grid=document.getElementById('carGrid');
const toast=document.getElementById('toast');
const resultsMeta=document.getElementById('resultsMeta');
const clearSearch=document.getElementById('clearSearch');
const mobileMenuBtn=document.getElementById('mobileMenuBtn');
const mobileMenu=document.getElementById('mobileMenu');

let activeFilter='all';
let query='';
let advanced={minPrice:'',maxPrice:'',minYear:'',maxYear:'',location:'',fuel:'all',transmission:'all'};
let cloudCars=[];
let favorites=new Set();
try{favorites=new Set(JSON.parse(localStorage.getItem('bigexFavorites')||'[]'));}catch{localStorage.removeItem('bigexFavorites');}
const IMAGE_FALLBACKS={
  'Toyota Land Cruiser':'https://commons.wikimedia.org/wiki/Special:FilePath/2023_Toyota_Land_Cruiser_300_3.4_VX_V6_in_Precious_White_Pearl%2C_06-12-2024.jpg',
  'BMW M4 Competition':'https://commons.wikimedia.org/wiki/Special:FilePath/2024_BMW_M4_%28G82%29_Competition_IMG_9370.jpg'
};
const imageFallbackFor=name=>IMAGE_FALLBACKS[String(name||'').trim()]||'';
const compare=new Set();

function esc(value){return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function normalizeCloud(c){return {...c,price:'₦'+Number(c.price||0).toLocaleString(),spec:(c.fuel||'')+' • '+(c.transmission||'Automatic'),mileage:Number(c.mileage||0).toLocaleString()+' km',symbol:'◇',image:c.image_url||imageFallbackFor(c.name)||''};}
function showSkeletons(){grid.innerHTML=Array.from({length:6},()=>'<div class="skeleton-card" aria-hidden="true"></div>').join('');resultsMeta.textContent='Loading the marketplace…';}

function filteredCars(){
  const minPrice=advanced.minPrice?Number(advanced.minPrice):0;
  const maxPrice=advanced.maxPrice?Number(advanced.maxPrice):Infinity;
  const minYear=advanced.minYear?Number(advanced.minYear):0;
  const maxYear=advanced.maxYear?Number(advanced.maxYear):Infinity;
  const location=advanced.location.trim().toLowerCase();
  return cloudCars.filter(c=>{
    const rawPrice=Number(String(c.price).replace(/[^0-9.]/g,''))||0;
    const rawYear=Number(c.year)||0;
    const text=[c.name,c.type,c.fuel,c.location,c.transmission,c.seller_name].join(' ').toLowerCase();
    return (activeFilter==='all'||String(c.type).toLowerCase()===String(activeFilter).toLowerCase()) &&
      (!query||text.includes(query)) && rawPrice>=minPrice && rawPrice<=maxPrice && rawYear>=minYear && rawYear<=maxYear &&
      (!location||String(c.location||'').toLowerCase().includes(location)) &&
      (advanced.fuel==='all'||String(c.fuel||'').toLowerCase()===advanced.fuel.toLowerCase()) &&
      (advanced.transmission==='all'||String(c.transmission||'Automatic').toLowerCase()===advanced.transmission.toLowerCase());
  });
}

function installAdvancedFilters(){
  const toolbar=document.querySelector('.marketplace-toolbar');
  if(!toolbar||document.getElementById('advancedFilters'))return;
  const box=document.createElement('div');
  box.id='advancedFilters';
  box.className='advanced-filters';
  box.innerHTML='<button type="button" class="advanced-toggle" aria-expanded="false">More filters <span>⌄</span></button><div class="advanced-filter-panel" hidden>'+
    '<label>Min price<input inputmode="numeric" data-advanced="minPrice" placeholder="₦0"></label>'+
    '<label>Max price<input inputmode="numeric" data-advanced="maxPrice" placeholder="₦50m"></label>'+
    '<label>From year<input inputmode="numeric" data-advanced="minYear" placeholder="2015"></label>'+ 
    '<label>To year<input inputmode="numeric" data-advanced="maxYear" placeholder="2026"></label>'+ 
    '<label>Location<input data-advanced="location" placeholder="Lagos"></label>'+ 
    '<label>Fuel<select data-advanced="fuel"><option value="all">Any fuel</option><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option></select></label>'+ 
    '<label>Transmission<select data-advanced="transmission"><option value="all">Any transmission</option><option>Automatic</option><option>Manual</option></select></label>'+ 
    '<button type="button" class="advanced-reset">Reset filters</button></div>';
  toolbar.insertAdjacentElement('afterend',box);
  const toggle=box.querySelector('.advanced-toggle');
  const panel=box.querySelector('.advanced-filter-panel');
  toggle.onclick=()=>{const open=panel.hidden;panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));};
  box.querySelectorAll('[data-advanced]').forEach(input=>{
    input.addEventListener('input',()=>{advanced[input.dataset.advanced]=input.value;render();});
    input.addEventListener('change',()=>{advanced[input.dataset.advanced]=input.value;render();});
  });
  box.querySelector('.advanced-reset').onclick=()=>{advanced={minPrice:'',maxPrice:'',minYear:'',maxYear:'',location:'',fuel:'all',transmission:'all'};box.querySelectorAll('[data-advanced]').forEach(input=>input.value=input.tagName==='SELECT'?'all':'');render();};
}

function updateCompareBar(){
  let bar=document.getElementById('compareBar');
  if(!bar){bar=document.createElement('div');bar.id='compareBar';bar.className='compare-bar';document.body.appendChild(bar);}
  const selected=[...compare].map(id=>cloudCars.find(c=>c.id===id)).filter(Boolean);
  if(!selected.length){bar.classList.remove('show');return;}
  bar.innerHTML='<div><strong>'+selected.length+' car'+(selected.length>1?'s':'')+' selected</strong><span>'+selected.map(c=>esc(c.name)).join(' · ')+'</span></div><div class="compare-bar-actions"><button class="compare-clear" type="button" id="compareClear">Clear</button><button type="button" id="compareAction">Compare ↗</button></div>';
  bar.classList.add('show');
  document.getElementById('compareAction').onclick=e=>{e.preventDefault();e.stopPropagation();openComparePanel();};
  document.getElementById('compareClear').onclick=()=>{compare.clear();render();};
}

function attachImageFallbacks(scope=document){
  scope.querySelectorAll('img[data-fallback]').forEach(img=>{
    img.addEventListener('error',()=>{
      const fallback=img.dataset.fallback||'';
      if(fallback&&img.src!==fallback){img.src=fallback;return;}
      const placeholder=document.createElement('div');
      placeholder.className='image-placeholder';
      placeholder.setAttribute('aria-label','Vehicle image unavailable');
      placeholder.textContent='◇';
      img.replaceWith(placeholder);
    },{once:false});
  });
}

function render(){
  const list=filteredCars();
  resultsMeta.textContent=list.length+' '+(list.length===1?'car':'cars')+' available';
  clearSearch.hidden=!query&&!hasAdvancedFilters();
  if(!list.length){
    grid.innerHTML='<div class="empty-state"><h3>No cars found</h3><p>Try another search or clear your current filters.</p><button id="emptyClear" type="button">Reset marketplace</button></div>';
    document.getElementById('emptyClear').onclick=resetMarketplace;
    updateCompareBar();
    return;
  }
  grid.innerHTML=list.map(c=>{
    const saved=favorites.has(c.id),selected=compare.has(c.id),fallback=imageFallbackFor(c.name);
    return '<article class="listing" data-id="'+esc(c.id)+'" role="link" tabindex="0" aria-label="View '+esc(c.name)+'">'+
      '<div class="listing-img"><span class="listing-badge">APPROVED</span>'+(c.image?'<img src="'+esc(c.image)+'" alt="'+esc(c.name)+'" loading="lazy" referrerpolicy="no-referrer" data-fallback="'+esc(fallback)+'">':'<span class="image-placeholder" aria-hidden="true">◇</span>')+'</div>'+ 
      '<div class="listing-body"><div class="listing-meta"><span>'+esc(c.year)+' • '+esc(c.type)+'</span><span class="listing-location">'+esc(c.location)+'</span></div><h3>'+esc(c.name)+'</h3><div class="listing-bottom"><div><div class="listing-price">'+esc(c.price)+'</div><small class="listing-spec">'+esc(c.spec)+' • '+esc(c.mileage)+'</small></div><div class="listing-actions"><button class="heart '+(saved?'is-active':'')+'" aria-label="'+(saved?'Remove '+esc(c.name)+' from saved':'Save '+esc(c.name))+'" data-heart="'+esc(c.id)+'" type="button">'+(saved?'♥':'♡')+'</button><button class="heart '+(selected?'is-active':'')+'" aria-label="'+(selected?'Remove '+esc(c.name)+' from comparison':'Compare '+esc(c.name))+'" data-compare="'+esc(c.id)+'" type="button">'+(selected?'✓':'+')+'</button></div></div></div></article>';
  }).join('');
  attachImageFallbacks(grid);
  grid.querySelectorAll('[data-heart]').forEach(button=>button.onclick=e=>{e.stopPropagation();const id=button.dataset.heart;favorites.has(id)?favorites.delete(id):favorites.add(id);localStorage.setItem('bigexFavorites',JSON.stringify([...favorites]));render();showToast(favorites.has(id)?'Saved to your shortlist':'Removed from shortlist');});
  grid.querySelectorAll('[data-compare]').forEach(button=>button.onclick=e=>{e.stopPropagation();const id=button.dataset.compare;if(compare.has(id))compare.delete(id);else if(compare.size<4)compare.add(id);else return showToast('Compare up to 4 cars');render();});
  grid.querySelectorAll('.listing[data-id]').forEach(card=>{const open=()=>location.href='car.html?id='+encodeURIComponent(card.dataset.id);card.addEventListener('click',open);card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});});
  updateCompareBar();
}

function hasAdvancedFilters(){return Object.values(advanced).some((v)=>v&&v!=='all');}
function resetMarketplace(){activeFilter='all';query='';advanced={minPrice:'',maxPrice:'',minYear:'',maxYear:'',location:'',fuel:'all',transmission:'all'};document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));const input=document.getElementById('heroSearch');if(input)input.value='';document.querySelectorAll('[data-advanced]').forEach(input=>input.value=input.tagName==='SELECT'?'all':'');render();}
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove('show'),2200);}
function doSearch(value){query=value.trim().toLowerCase();render();document.getElementById('explore').scrollIntoView({behavior:'smooth'});showToast(query?'Marketplace updated':'Search cleared');}

async function loadCloudListings(){
  showSkeletons();
  const {data,error}=await supabase.from('listings').select('*').eq('status','approved').order('created_at',{ascending:false});
  if(error){console.warn('Supabase listings unavailable:',error.message);grid.innerHTML='<div class="empty-state"><h3>Marketplace unavailable</h3><p>We could not load the cars right now. Please try again.</p><button id="retryListings" type="button">Retry</button></div>';document.getElementById('retryListings').onclick=loadCloudListings;resultsMeta.textContent='Unable to load listings';return;}
  cloudCars=(data||[]).map(normalizeCloud);
  render();
}

function openComparePanel(){
  const selected=[...compare].map(id=>cloudCars.find(c=>c.id===id)).filter(Boolean);
  if(selected.length<2){showToast('Select at least 2 cars to compare');return;}
  let modal=document.getElementById('compareModal');
  if(!modal){modal=document.createElement('div');modal.id='compareModal';modal.className='compare-modal';modal.innerHTML='<div class="compare-dialog" role="dialog" aria-modal="true" aria-labelledby="compareTitle"><div class="compare-dialog-head"><div><p class="eyebrow">SIDE BY SIDE</p><h2 id="compareTitle">Compare cars</h2></div><button class="compare-close" type="button" aria-label="Close comparison">×</button></div><div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>Specification</th></tr></thead><tbody></tbody></table></div></div>';document.body.appendChild(modal);modal.querySelector('.compare-close').onclick=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');};modal.addEventListener('click',e=>{if(e.target===modal){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');}});}
  const table=modal.querySelector('.compare-table');
  table.querySelector('thead tr').innerHTML='<th>Specification</th>'+selected.map(c=>'<th><a class="compare-car-link" href="car.html?id='+encodeURIComponent(c.id)+'" aria-label="View '+esc(c.name)+' listing">'+(c.image?'<img src="'+esc(c.image)+'" alt="" loading="lazy" referrerpolicy="no-referrer" data-fallback="'+esc(imageFallbackFor(c.name))+'">':'')+'<strong>'+esc(c.name)+'</strong></a><button class="remove-compare" data-remove-compare="'+esc(c.id)+'" type="button">Remove</button></th>').join('');
  const rows=[['Price',...selected.map(c=>c.price)],['Year',...selected.map(c=>c.year)],['Body type',...selected.map(c=>c.type)],['Fuel',...selected.map(c=>c.fuel)],['Mileage',...selected.map(c=>c.mileage)],['Transmission',...selected.map(c=>c.transmission||'Automatic')],['Location',...selected.map(c=>c.location)],['Seller',...selected.map(c=>c.seller_name||'—')]];
  table.querySelector('tbody').innerHTML=rows.map(row=>'<tr>'+row.map((value,i)=>'<'+(i===0?'th':'td')+'>'+esc(value)+'</'+(i===0?'th':'td')+'>').join('')+'</tr>').join('');
  attachImageFallbacks(modal);
  table.querySelectorAll('[data-remove-compare]').forEach(button=>button.onclick=()=>{compare.delete(button.dataset.removeCompare);render();if(compare.size<2)modal.classList.remove('open');else openComparePanel();});
  modal.setAttribute('aria-hidden','false');modal.classList.add('open');modal.querySelector('.compare-close')?.focus();
}

document.getElementById('searchBtn').onclick=()=>doSearch(document.getElementById('heroSearch').value);
document.getElementById('heroSearch').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch(e.target.value);});
document.querySelectorAll('[data-search]').forEach(button=>button.onclick=()=>{document.getElementById('heroSearch').value=button.dataset.search;doSearch(button.dataset.search);});
document.querySelectorAll('.filter').forEach(button=>button.onclick=()=>{document.querySelectorAll('.filter').forEach(item=>item.classList.remove('active'));button.classList.add('active');activeFilter=button.dataset.filter;render();});
document.getElementById('viewAll').onclick=()=>{resetMarketplace();document.getElementById('explore').scrollIntoView({behavior:'smooth'});};
clearSearch.onclick=resetMarketplace;
document.getElementById('loginBtn').onclick=async event=>{const user=await getCurrentUser();if(!user)return;event.preventDefault();try{await signOut();localStorage.removeItem('bigexSession');showToast('Signed out');setTimeout(()=>location.href='index.html',300);}catch(error){showToast(error.message||'Sign out failed');}};
document.getElementById('sellBtn').onclick=()=>location.href='sell.html';

const aiHistory=[];
function renderAiReply(data){
  const reply=document.getElementById('aiReply');
  const matches=Array.isArray(data.recommendations)?data.recommendations:[];
  const block=document.createElement('div');block.className='ai-turn';
  block.innerHTML='<div class="ai-bubble ai-bubble-assistant">'+esc(data.message||'')+'</div>'+(matches.length?'<div class="ai-recommendations">'+matches.map(item=>{const car=cloudCars.find(c=>String(c.id)===String(item.id));if(!car)return '';return '<a class="ai-recommendation" href="car.html?id='+encodeURIComponent(car.id)+'" aria-label="View '+esc(car.name)+' listing"><div class="ai-recommendation-image">'+(car.image?'<img src="'+esc(car.image)+'" alt="" loading="lazy" referrerpolicy="no-referrer" data-fallback="'+esc(imageFallbackFor(car.name))+'">':'<span aria-hidden="true">◇</span>')+'</div><div class="ai-recommendation-copy"><strong>'+esc(car.name)+'</strong><span>'+esc(car.price)+' · '+esc(car.location)+'</span><small>'+esc(item.reason||'Matches your preferences')+'</small></div><span class="ai-recommendation-arrow" aria-hidden="true">↗</span></a>';}).join('')+'</div>':'');
  reply.appendChild(block);attachImageFallbacks(block);reply.scrollTop=reply.scrollHeight;
}
async function askBigexAI(userMessage){
  const {data,error}=await supabase.functions.invoke('bigex-ai',{body:{message:userMessage,history:aiHistory.slice(-10),cars:cloudCars.map(c=>({id:c.id,name:c.name,price:c.price,year:c.year,type:c.type,fuel:c.fuel,mileage:c.mileage,location:c.location,transmission:c.transmission,seller_name:c.seller_name||''}))}});
  if(error){let detail=error.message||'Bigex Intelligence is unavailable right now.';try{const response=error.context;if(response?.json){const payload=await response.json();if(payload?.error)detail=String(payload.error);else if(payload?.message)detail=String(payload.message);}}catch{}throw new Error(detail);}
  if(data?.error)throw new Error(String(data.error));
  return data||{};
}
document.getElementById('aiBtn').onclick=async()=>{
  const input=document.getElementById('aiInput'),reply=document.getElementById('aiReply'),userMessage=input.value.trim();if(!userMessage)return;
  const button=document.getElementById('aiBtn');button.disabled=true;input.disabled=true;
  const userBubble=document.createElement('div');userBubble.className='ai-turn ai-turn-user';userBubble.innerHTML='<div class="ai-bubble ai-bubble-user">'+esc(userMessage)+'</div>';reply.appendChild(userBubble);
  const thinking=document.createElement('div');thinking.className='ai-turn ai-thinking-turn';thinking.innerHTML='<div class="ai-bubble ai-bubble-assistant ai-thinking">Thinking through your requirements<span class="ai-dots"><i></i><i></i><i></i></span></div>';reply.appendChild(thinking);reply.scrollTop=reply.scrollHeight;
  try{const data=await askBigexAI(userMessage);thinking.remove();aiHistory.push({role:'user',content:userMessage});aiHistory.push({role:'assistant',content:data.message||''});renderAiReply(data);input.value='';}
  catch(error){console.error(error);thinking.remove();const errorBubble=document.createElement('div');errorBubble.className='ai-turn';errorBubble.innerHTML='<div class="ai-bubble ai-bubble-assistant">'+esc(error.message||'Something went wrong. Please try again.')+'</div>';reply.appendChild(errorBubble);reply.scrollTop=reply.scrollHeight;}
  finally{button.disabled=false;input.disabled=false;input.focus();}
};
document.getElementById('aiInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();document.getElementById('aiBtn').click();}});

if(mobileMenuBtn){mobileMenuBtn.onclick=()=>{const open=mobileMenu.classList.toggle('open');mobileMenuBtn.setAttribute('aria-expanded',String(open));mobileMenu.setAttribute('aria-label',open?'Close menu':'Open menu');mobileMenu.setAttribute('aria-hidden',String(!open));};mobileMenu.querySelectorAll('a').forEach(link=>link.onclick=()=>{mobileMenu.classList.remove('open');mobileMenuBtn.setAttribute('aria-expanded','false');mobileMenu.setAttribute('aria-hidden','true');});}

/* Small responsive layer so the marketplace remains usable on narrow phones without changing the visual language. */
const mobileStyle=document.createElement('style');mobileStyle.textContent=`
@media(max-width:800px){.container{width:min(100% - 24px,var(--max))}.nav{height:62px}.nav nav{display:none}.mobile-menu-btn{display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border:1px solid var(--line);background:#09131f;color:#fff;border-radius:10px}.nav-actions .ghost-btn{display:none}.hero{grid-template-columns:1fr;min-height:auto;padding:35px 0 25px}.hero h1{font-size:clamp(42px,13vw,62px);letter-spacing:-3px}.hero-visual{min-height:280px}.car-card{transform:none}.stats{grid-template-columns:repeat(2,1fr);gap:0}.stats div{padding:12px;border-bottom:1px solid var(--line)}.stats div:nth-child(2){border-right:0}.car-grid{grid-template-columns:1fr 1fr}.section{padding:55px 0}.section-head{align-items:flex-start}.ai-panel{grid-template-columns:1fr;padding:25px;gap:20px}.compare-box{grid-template-columns:1fr}.compare-box>div{border-right:0;border-bottom:1px solid var(--line)}.category-grid{grid-template-columns:repeat(4,1fr)}.sell{padding:25px;flex-direction:column;align-items:flex-start}.footer{grid-template-columns:1fr;gap:15px}.footer small{text-align:left}.advanced-filter-panel{grid-template-columns:1fr 1fr!important}.compare-dialog{padding:15px}.compare-table{min-width:600px}}
@media(max-width:520px){.car-grid{grid-template-columns:1fr}.listing-img{height:210px}.search-box{padding:5px}.search-box button{padding:11px 13px}.quick-tags{overflow:auto;padding-bottom:3px}.quick-tags button{flex:0 0 auto}.marketplace-toolbar{align-items:flex-start;flex-direction:column}.filters{width:100%}.advanced-filter-panel{grid-template-columns:1fr!important}.ai-panel{border-radius:16px}.ai-input input{min-width:0}.compare-bar{bottom:8px}.compare-bar span{max-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}}
.advanced-filters{margin:-5px 0 16px}.advanced-toggle{border:1px solid var(--line);background:#09131f;color:#cbd5e1;border-radius:9px;padding:8px 12px;font-size:10px;cursor:pointer}.advanced-filter-panel{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:9px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#08121d}.advanced-filter-panel label{display:flex;flex-direction:column;gap:5px;color:#8795a7;font-size:9px}.advanced-filter-panel input,.advanced-filter-panel select{width:100%;border:1px solid var(--line);background:#0d1926;color:#fff;border-radius:8px;padding:9px;font-size:10px;outline:none}.advanced-filter-panel input:focus,.advanced-filter-panel select:focus{border-color:rgba(22,136,255,.6)}.advanced-reset{align-self:end;border:1px solid var(--line);background:transparent;color:#9aa8b8;border-radius:8px;padding:9px;font-size:9px;cursor:pointer}.image-placeholder{width:100%;height:100%;display:grid;place-items:center;color:#34465a;font-size:32px}
`;
document.head.appendChild(mobileStyle);

installAdvancedFilters();
render();
loadCloudListings();
