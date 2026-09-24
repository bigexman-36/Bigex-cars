import { supabase, signInWithEmail, signOut, getCurrentUser, ensureProfile } from './supabase.js';

const grid=document.getElementById('carGrid');
const toast=document.getElementById('toast');
const resultsMeta=document.getElementById('resultsMeta');
const clearSearch=document.getElementById('clearSearch');
const mobileMenuBtn=document.getElementById('mobileMenuBtn');
const mobileMenu=document.getElementById('mobileMenu');

let activeFilter='all';
let query='';
let cloudCars=[];
const favorites=new Set(JSON.parse(localStorage.getItem('bigexFavorites')||'[]'));
const compare=new Set();

function esc(value){
  return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function normalizeCloud(c){
  return {
    ...c,
    price:'₦'+Number(c.price||0).toLocaleString(),
    spec:(c.fuel||'')+' • '+(c.transmission||'Automatic'),
    mileage:Number(c.mileage||0).toLocaleString()+' km',
    symbol:'◇',
    image:c.image_url||''
  };
}

function showSkeletons(){
  grid.innerHTML=Array.from({length:6},()=>'<div class="skeleton-card" aria-hidden="true"></div>').join('');
  resultsMeta.textContent='Loading the marketplace…';
}

function filteredCars(){
  return cloudCars.filter(c=>
    (activeFilter==='all'||c.type===activeFilter) &&
    (!query||[c.name,c.type,c.fuel,c.location].join(' ').toLowerCase().includes(query))
  );
}

function updateCompareBar(){
  let bar=document.getElementById('compareBar');
  if(!bar){
    bar=document.createElement('div');
    bar.id='compareBar';
    bar.className='compare-bar';
    document.body.appendChild(bar);
  }
  const selected=[...compare].map(id=>cloudCars.find(c=>c.id===id)).filter(Boolean);
  if(!selected.length){
    bar.classList.remove('show');
    return;
  }
  bar.innerHTML='<div><strong>'+selected.length+' car'+(selected.length>1?'s':'')+' selected</strong><span>'+selected.map(c=>esc(c.name)).join(' · ')+'</span></div><button type="button" id="compareAction">Compare ↗</button>';
  bar.classList.add('show');
  document.getElementById('compareAction').onclick=()=>{
    document.getElementById('compare')?.scrollIntoView({behavior:'smooth'});
    showToast('Comparison selection is ready');
  };
}

function render(){
  const list=filteredCars();
  resultsMeta.textContent=list.length+' '+(list.length===1?'car':'cars')+' available';
  clearSearch.hidden=!query;

  if(!list.length){
    grid.innerHTML='<div class="empty-state"><h3>No cars found</h3><p>Try another search or clear your current filters.</p><button id="emptyClear" type="button">Reset marketplace</button></div>';
    document.getElementById('emptyClear').onclick=resetMarketplace;
    updateCompareBar();
    return;
  }

  grid.innerHTML=list.map(c=>{
    const saved=favorites.has(c.id);
    const selected=compare.has(c.id);
    return '<article class="listing" data-id="'+esc(c.id)+'" role="link" tabindex="0" aria-label="View '+esc(c.name)+'">'+
      '<div class="listing-img">'+
        '<span class="listing-badge">APPROVED</span>'+
        (c.image?'<img src="'+esc(c.image)+'" alt="'+esc(c.name)+'" loading="lazy" referrerpolicy="no-referrer">':'<span aria-hidden="true">'+esc(c.symbol)+'</span>')+
      '</div>'+
      '<div class="listing-body">'+
        '<div class="listing-meta"><span>'+esc(c.year)+' • '+esc(c.type)+'</span><span class="listing-location">'+esc(c.location)+'</span></div>'+
        '<h3>'+esc(c.name)+'</h3>'+
        '<div class="listing-bottom">'+
          '<div><div class="listing-price">'+esc(c.price)+'</div><small class="listing-spec">'+esc(c.spec)+' • '+esc(c.mileage)+'</small></div>'+
          '<div class="listing-actions">'+
            '<button class="heart '+(saved?'is-active':'')+'" aria-label="'+(saved?'Remove '+esc(c.name)+' from saved':'Save '+esc(c.name))+'" data-heart="'+esc(c.id)+'" type="button">'+(saved?'♥':'♡')+'</button>'+
            '<button class="heart '+(selected?'is-active':'')+'" aria-label="'+(selected?'Remove '+esc(c.name)+' from comparison':'Compare '+esc(c.name))+'" data-compare="'+esc(c.id)+'" type="button">'+(selected?'✓':'+')+'</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</article>';
  }).join('');

  document.querySelectorAll('[data-heart]').forEach(button=>{
    button.onclick=event=>{
      event.stopPropagation();
      const id=button.dataset.heart;
      favorites.has(id)?favorites.delete(id):favorites.add(id);
      localStorage.setItem('bigexFavorites',JSON.stringify([...favorites]));
      render();
      showToast(favorites.has(id)?'Saved to your shortlist':'Removed from shortlist');
    };
  });

  document.querySelectorAll('[data-compare]').forEach(button=>{
    button.onclick=event=>{
      event.stopPropagation();
      const id=button.dataset.compare;
      if(compare.has(id)) compare.delete(id);
      else if(compare.size<4) compare.add(id);
      else return showToast('Compare up to 4 cars');
      render();
      updateCompareBar();
    };
  });

  document.querySelectorAll('.listing[data-id]').forEach(card=>{
    const open=()=>location.href='car.html?id='+encodeURIComponent(card.dataset.id);
    card.addEventListener('click',open);
    card.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        open();
      }
    });
  });

  updateCompareBar();
}

function resetMarketplace(){
  activeFilter='all';
  query='';
  document.querySelectorAll('.filter').forEach(button=>button.classList.toggle('active',button.dataset.filter==='all'));
  const input=document.getElementById('heroSearch');
  if(input) input.value='';
  render();
}

function showToast(message){
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer=setTimeout(()=>toast.classList.remove('show'),2200);
}

function doSearch(value){
  query=value.trim().toLowerCase();
  render();
  document.getElementById('explore').scrollIntoView({behavior:'smooth'});
  showToast(query?'Marketplace updated':'Search cleared');
}

async function loadCloudListings(){
  showSkeletons();
  const {data,error}=await supabase.from('listings').select('*').eq('status','approved').order('created_at',{ascending:false});
  if(error){
    console.warn('Supabase listings unavailable:',error.message);
    grid.innerHTML='<div class="empty-state"><h3>Marketplace unavailable</h3><p>We could not load the cars right now. Please try again.</p><button id="retryListings" type="button">Retry</button></div>';
    document.getElementById('retryListings').onclick=loadCloudListings;
    resultsMeta.textContent='Unable to load listings';
    return;
  }
  cloudCars=(data||[]).map(normalizeCloud);
  render();
}

document.getElementById('searchBtn').onclick=()=>doSearch(document.getElementById('heroSearch').value);
document.getElementById('heroSearch').addEventListener('keydown',event=>{
  if(event.key==='Enter') doSearch(event.target.value);
});
document.querySelectorAll('[data-search]').forEach(button=>{
  button.onclick=()=>{
    document.getElementById('heroSearch').value=button.dataset.search;
    doSearch(button.dataset.search);
  };
});
document.querySelectorAll('.filter').forEach(button=>{
  button.onclick=()=>{
    document.querySelectorAll('.filter').forEach(item=>item.classList.remove('active'));
    button.classList.add('active');
    activeFilter=button.dataset.filter;
    render();
  };
});
document.getElementById('viewAll').onclick=()=>{
  resetMarketplace();
  document.getElementById('explore').scrollIntoView({behavior:'smooth'});
};
clearSearch.onclick=resetMarketplace;

document.getElementById('loginBtn').onclick=async event=>{
  const user=await getCurrentUser();
  if(!user)return;
  event.preventDefault();
  try{
    await signOut();
    localStorage.removeItem('bigexSession');
    showToast('Signed out');
    setTimeout(()=>location.href='index.html',300);
  }catch(error){
    showToast(error.message||'Sign out failed');
  }
};

document.getElementById('sellBtn').onclick=()=>location.href='sell.html';

document.getElementById('aiBtn').onclick=()=>{
  const input=document.getElementById('aiInput');
  const reply=document.getElementById('aiReply');
  const text=input.value.trim().toLowerCase();
  if(!text){
    reply.textContent='Try a body type, location, fuel preference, or brand.';
    return;
  }
  const matches=cloudCars.filter(c=>
    text.includes(String(c.type||'').toLowerCase())||
    text.includes(String(c.fuel||'').toLowerCase())||
    text.includes(String(c.location||'').toLowerCase())||
    text.includes(String(c.name||'').split(' ')[0].toLowerCase())
  );
  reply.textContent=matches.length
    ?'Possible matches: '+matches.slice(0,4).map(c=>c.name).join(', ')+'.'
    :'Try mentioning SUV, Sedan, Electric, Lagos, Toyota, BMW, or another preference.';
};

if(mobileMenuBtn){
  mobileMenuBtn.onclick=()=>{
    const open=mobileMenu.classList.toggle('open');
    mobileMenuBtn.setAttribute('aria-expanded',String(open));
    mobileMenu.setAttribute('aria-hidden',String(!open));
  };
  mobileMenu.querySelectorAll('a').forEach(link=>link.onclick=()=>{
    mobileMenu.classList.remove('open');
    mobileMenuBtn.setAttribute('aria-expanded','false');
    mobileMenu.setAttribute('aria-hidden','true');
  });
}

supabase.auth.onAuthStateChange(async(event,session)=>{
  if(session?.user){
    try{
      const profile=await ensureProfile(session.user);
      localStorage.setItem('bigexSession',JSON.stringify({id:session.user.id,email:session.user.email,role:profile?.role||'buyer'}));
      const loginButton=document.getElementById('loginBtn');
      if(loginButton) loginButton.textContent='Sign out';
      if(profile?.role==='admin') setTimeout(()=>location.href='admin.html',300);
      else showToast('Signed in successfully');
    }catch(error){
      console.error(error);
      showToast('Signed in, but profile setup needs attention');
    }
  }
});

render();
loadCloudListings();