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
  bar.innerHTML='<div><strong>'+selected.length+' car'+(selected.length>1?'s':'')+' selected</strong><span>'+selected.map(c=>esc(c.name)).join(' · ')+'</span></div><div class="compare-bar-actions"><button class="compare-clear" type="button" id="compareClear">Clear</button><button type="button" id="compareAction">Compare ↗</button></div>';
  bar.classList.add('show');
  document.getElementById('compareAction').onclick=(event)=>{
  event.preventDefault();
  event.stopPropagation();
  openComparePanel();
};
  document.getElementById('compareClear').onclick=()=>{
    compare.clear();
    render();
    updateCompareBar();
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

function openComparePanel(){
  const selected=[...compare].map(id=>cloudCars.find(c=>c.id===id)).filter(Boolean);
  if(selected.length<2){
    showToast('Select at least 2 cars to compare');
    return;
  }

  let modal=document.getElementById('compareModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='compareModal';
    modal.className='compare-modal';
    modal.innerHTML='<div class="compare-dialog" role="dialog" aria-modal="true" aria-labelledby="compareTitle"><div class="compare-dialog-head"><div><p class="eyebrow">SIDE BY SIDE</p><h2 id="compareTitle">Compare cars</h2></div><button class="compare-close" type="button" aria-label="Close comparison">×</button></div><div class="compare-table-wrap"><table class="compare-table"><thead><tr><th>Specification</th></tr></thead><tbody></tbody></table></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.compare-close').onclick=()=>{
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden','true');
    };
    modal.addEventListener('click',e=>{
      if(e.target===modal){
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden','true');
      }
    });
  }

  const table=modal.querySelector('.compare-table');
  table.querySelector('thead tr').innerHTML='<th>Specification</th>'+selected.map(c=>'<th><strong>'+esc(c.name)+'</strong><button class="remove-compare" data-remove-compare="'+esc(c.id)+'" type="button">Remove</button></th>').join('');
  const rows=[
    ['Price',...selected.map(c=>c.price)],
    ['Year',...selected.map(c=>c.year)],
    ['Body type',...selected.map(c=>c.type)],
    ['Fuel',...selected.map(c=>c.fuel)],
    ['Mileage',...selected.map(c=>c.mileage)],
    ['Transmission',...selected.map(c=>c.transmission||'Automatic')],
    ['Location',...selected.map(c=>c.location)],
    ['Seller',...selected.map(c=>c.seller_name||'—')]
  ];
  table.querySelector('tbody').innerHTML=rows.map(row=>'<tr>'+row.map((value,i)=>'<'+(i===0?'th':'td')+'>'+esc(value)+'</'+(i===0?'th':'td')+'>').join('')+'</tr>').join('');
  table.querySelectorAll('[data-remove-compare]').forEach(button=>button.onclick=()=>{
    compare.delete(button.dataset.removeCompare);
    render();
    updateCompareBar();
    if(compare.size<2) modal.classList.remove('open');
    else openComparePanel();
  });
  modal.setAttribute('aria-hidden','false');
  modal.classList.add('open');
  modal.querySelector('.compare-close')?.focus();
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

const aiHistory=[];

function renderAiReply(data){
  const reply=document.getElementById('aiReply');
  const message=esc(data.message||'');
  const matches=Array.isArray(data.recommendations)?data.recommendations:[];
  reply.innerHTML='<div class="ai-answer">'+message+'</div>'+
    (matches.length?'<div class="ai-recommendations">'+
      matches.map(item=>{
        const car=cloudCars.find(c=>String(c.id)===String(item.id));
        if(!car) return '';
        return '<button type="button" class="ai-recommendation" data-ai-car="'+esc(car.id)+'">'+
          '<strong>'+esc(car.name)+'</strong>'+
          '<span>'+esc(car.price)+' · '+esc(car.location)+'</span>'+
          '<small>'+esc(item.reason||'Matches your preferences')+'</small>'+
        '</button>';
      }).join('')+'</div>':'');
  reply.querySelectorAll('[data-ai-car]').forEach(button=>{
    button.onclick=()=>{
      const id=button.dataset.aiCar;
      const card=document.querySelector('.listing[data-id="'+CSS.escape(id)+'"]');
      if(!card){
        showToast('That car is not currently visible in the marketplace');
        return;
      }
      card.scrollIntoView({behavior:'smooth',block:'center'});
      card.classList.add('ai-highlight');
      setTimeout(()=>card.classList.remove('ai-highlight'),1800);
    };
  });
}

async function askBigexAI(userMessage){
  const {data,error}=await supabase.functions.invoke('bigex-ai',{
    body:{
      message:userMessage,
      history:aiHistory.slice(-10),
      cars:cloudCars.map(c=>({
        id:c.id,name:c.name,price:c.price,year:c.year,type:c.type,fuel:c.fuel,
        mileage:c.mileage,location:c.location,transmission:c.transmission,
        seller_name:c.seller_name||''
      }))
    }
  });
  if(error) throw new Error(error.message||'Bigex Intelligence is unavailable right now.');
  return data||{};
}

document.getElementById('aiBtn').onclick=async()=>{
  const input=document.getElementById('aiInput');
  const reply=document.getElementById('aiReply');
  const userMessage=input.value.trim();
  if(!userMessage) return;

  const button=document.getElementById('aiBtn');
  button.disabled=true;
  input.disabled=true;
  reply.innerHTML='<div class="ai-answer ai-thinking">Thinking through your requirements…</div>';

  try{
    const data=await askBigexAI(userMessage);
    aiHistory.push({role:'user',content:userMessage});
    aiHistory.push({role:'assistant',content:data.message||''});
    renderAiReply(data);
    input.value='';
  }catch(error){
    console.error(error);
    reply.innerHTML='<div class="ai-answer">'+esc(error.message||'Something went wrong. Please try again.')+'</div>';
  }finally{
    button.disabled=false;
    input.disabled=false;
    input.focus();
  }
};

document.getElementById('aiInput').addEventListener('keydown',event=>{
  if(event.key==='Enter'&&!event.shiftKey){
    event.preventDefault();
    document.getElementById('aiBtn').click();
  }
});

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