const ADMIN='igetobiloluwa36@gmail.com';
const status=document.getElementById('status'),pending=document.getElementById('pending'),approved=document.getElementById('approved');
let session=null;try{session=JSON.parse(localStorage.getItem('bigexSession')||'null')}catch{}
const ok=session&&String(session.email||'').trim().toLowerCase()===ADMIN&&session.role==='admin';
if(!ok){status.innerHTML='<strong>Admin access required.</strong><p class="muted">Sign in with the designated administrator account first.</p>';pending.innerHTML='';approved.innerHTML='';}
else{status.innerHTML='<strong class="accent">Administrator authenticated.</strong><p class="muted">Signed in as '+session.email+'</p>';render();}
function get(){try{return JSON.parse(localStorage.getItem('bigexListings')||'[]')}catch{return[]}}
function save(x){localStorage.setItem('bigexListings',JSON.stringify(x));render()}
function card(c,actions){return '<div class="row"><div><strong>'+esc(c.name)+'</strong><div class="muted">'+c.year+' • '+esc(c.type)+' • ₦'+Number(c.price||0).toLocaleString()+' • '+esc(c.location)+'</div><small class="muted">'+esc(c.seller||c.seller_name||'Seller')+' • '+esc(c.email||'')+'</small></div><div>'+actions+'</div></div>'}
function render(){if(!ok)return;const all=get(),p=all.filter(x=>x.status==='pending'),a=all.filter(x=>x.status==='approved');pending.innerHTML=p.length?p.map(c=>card(c,'<button class="approve" onclick="moderate(\''+c.id+'\',\'approved\')">Approve</button><button class="reject" onclick="moderate(\''+c.id+'\',\'rejected\')">Reject</button>')).join(''):'<p class="muted">No pending listings.</p>';approved.innerHTML=a.length?a.map(c=>card(c,'<button class="reject" onclick="moderate(\''+c.id+'\',\'rejected\')">Remove</button>')).join(''):'<p class="muted">No locally approved listings.</p>'}
function moderate(id,status){save(get().map(x=>x.id===id?{...x,status}:x))}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}