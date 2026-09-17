const cars=[
{name:'Toyota Land Cruiser',year:2023,type:'SUV',price:'₦82.0M',spec:'3.5L • 409 HP',symbol:'◆'},
{name:'Lexus RX 350',year:2024,type:'SUV',price:'₦67.5M',spec:'2.4L Turbo • 275 HP',symbol:'◇'},
{name:'BMW M4 Competition',year:2024,type:'Coupe',price:'₦95.0M',spec:'3.0L • 503 HP',symbol:'▰'},
{name:'Mercedes C300',year:2023,type:'Sedan',price:'₦58.0M',spec:'2.0L Turbo • 255 HP',symbol:'◈'},
{name:'Tesla Model 3',year:2024,type:'Electric',price:'₦72.0M',spec:'Dual Motor • 394 HP',symbol:'⚡'},
{name:'Range Rover Sport',year:2022,type:'SUV',price:'₦115.0M',spec:'3.0L • 355 HP',symbol:'▰'}
];
const grid=document.getElementById('carGrid'),toast=document.getElementById('toast');
function render(list=cars){grid.innerHTML=list.map((c,i)=>`<article class="listing"><div class="listing-img">${c.symbol}</div><div class="listing-body"><div class="listing-meta"><span>${c.year} • ${c.type}</span><span>Bigex verified</span></div><h3>${c.name}</h3><div class="listing-bottom"><div><div class="listing-price">${c.price}</div><small style="color:#6f7b89">${c.spec}</small></div><button class="heart" aria-label="Save ${c.name}" data-heart="${i}">♡</button></div></div></article>`).join('');document.querySelectorAll('[data-heart]').forEach(b=>b.onclick=()=>{b.textContent=b.textContent==='♡'?'♥':'♡';showToast(b.textContent==='♥'?'Saved to your shortlist':'Removed from shortlist')})}
function showToast(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove('show'),2200)}
function doSearch(value){const q=value.trim().toLowerCase();if(!q){render();return}const results=cars.filter(c=>`${c.name} ${c.type} ${c.spec}`.toLowerCase().includes(q));render(results);document.getElementById('explore').scrollIntoView({behavior:'smooth'});showToast(results.length?`${results.length} match${results.length>1?'es':''} found`:'No exact matches — try another search')}
document.getElementById('searchBtn').onclick=()=>doSearch(document.getElementById('heroSearch').value);document.getElementById('heroSearch').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch(e.target.value)});
document.querySelectorAll('[data-search]').forEach(b=>b.onclick=()=>{document.getElementById('heroSearch').value=b.dataset.search;doSearch(b.dataset.search)});
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');const f=b.dataset.filter;render(f==='all'?cars:cars.filter(c=>c.type===f))});
document.getElementById('viewAll').onclick=()=>{document.querySelector('[data-filter="all"]').click();document.getElementById('explore').scrollIntoView({behavior:'smooth'})};
document.getElementById('loginBtn').onclick=()=>showToast('Accounts are coming in the next build.');
document.getElementById('sellBtn').onclick=()=>showToast('Seller onboarding is coming in the next build.');
document.getElementById('aiBtn').onclick=()=>{const input=document.getElementById('aiInput'),reply=document.getElementById('aiReply');const text=input.value.trim();if(!text){reply.textContent='Try describing your budget, body type, or use case.';return}let suggestions=cars.filter(c=>text.toLowerCase().includes(c.type.toLowerCase())||text.toLowerCase().includes(c.name.split(' ')[0].toLowerCase()));if(text.toLowerCase().includes('electric'))suggestions=cars.filter(c=>c.type==='Electric');reply.textContent=suggestions.length?`I found ${suggestions.map(c=>c.name).join(', ')}. Open the marketplace below to explore.`:'I would start by filtering by budget, body type and fuel preference. Full AI matching is planned for the next build.';};
render();