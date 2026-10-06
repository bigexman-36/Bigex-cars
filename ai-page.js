import { supabase } from './supabase.js';

const reply=document.getElementById('aiReply');
const input=document.getElementById('aiInput');
const button=document.getElementById('aiBtn');
const history=[];
let cars=[];

function esc(value){return String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function imageFallback(name){
  const map={
    'Toyota Land Cruiser':'https://commons.wikimedia.org/wiki/Special:FilePath/2023_Toyota_Land_Cruiser_300_3.4_VX_V6_in_Precious_White_Pearl%2C_06-12-2024.jpg',
    'BMW M4 Competition':'https://commons.wikimedia.org/wiki/Special:FilePath/2024_BMW_M4_%28G82%29_Competition_IMG_9370.jpg'
  };
  return map[String(name||'').trim()]||'';
}
function normalize(c){return {...c,price:'₦'+Number(c.price||0).toLocaleString(),mileage:Number(c.mileage||0).toLocaleString()+' km',image:c.image_url||imageFallback(c.name)||''};}
function appendTurn(message,recommendations=[]){
  const turn=document.createElement('div');turn.className='ai-turn';
  turn.innerHTML='<div class="ai-bubble ai-bubble-assistant">'+esc(message)+'</div>';
  if(recommendations.length){
    const box=document.createElement('div');box.className='ai-recommendations';
    box.innerHTML=recommendations.map(item=>{
      const car=cars.find(c=>String(c.id)===String(item.id));
      if(!car)return '';
      return '<a class="ai-recommendation" href="car.html?id='+encodeURIComponent(car.id)+'"><div class="ai-recommendation-image">'+(car.image?'<img src="'+esc(car.image)+'" alt="" loading="lazy">':'◇')+'</div><div class="ai-recommendation-copy"><strong>'+esc(car.name)+'</strong><span>'+esc(car.price)+' · '+esc(car.location)+'</span><small>'+esc(item.reason||'Matches your preferences')+'</small></div><span class="ai-recommendation-arrow">↗</span></a>';
    }).join('');turn.appendChild(box);
  }
  reply.appendChild(turn);reply.scrollTop=reply.scrollHeight;
}
async function loadCars(){
  const {data,error}=await supabase.from('listings').select('*').eq('status','approved').order('created_at',{ascending:false});
  if(error){appendTurn('I could not load the marketplace right now. Please try again in a moment.');return false;}
  cars=(data||[]).map(normalize);return true;
}
async function ask(){
  const message=input.value.trim();if(!message)return;
  input.value='';button.disabled=true;input.disabled=true;
  const user=document.createElement('div');user.className='ai-turn ai-turn-user';user.innerHTML='<div class="ai-bubble ai-bubble-user">'+esc(message)+'</div>';reply.appendChild(user);reply.scrollTop=reply.scrollHeight;
  try{
    const {data,error}=await supabase.functions.invoke('bigex-ai',{body:{message,history:history.slice(-10),cars:cars.map(c=>({id:c.id,name:c.name,price:c.price,year:c.year,type:c.type,fuel:c.fuel,mileage:c.mileage,location:c.location,transmission:c.transmission,seller_name:c.seller_name||''}))}});
    if(error)throw error;
    if(data?.error)throw new Error(String(data.error));
    history.push({role:'user',content:message},{role:'assistant',content:data?.message||''});
    appendTurn(data?.message||'I could not find a useful answer.',Array.isArray(data?.recommendations)?data.recommendations:[]);
  }catch(error){appendTurn(error?.message||'Bigex AI is unavailable right now. Please try again.');}
  finally{button.disabled=false;input.disabled=false;input.focus();}
}
button.onclick=ask;input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask();}});
document.querySelectorAll('[data-prompt]').forEach(b=>b.onclick=()=>{input.value=b.dataset.prompt;ask();});
const mobile=document.getElementById('mobileMenuBtn');const menu=document.getElementById('mobileMenu');if(mobile&&menu)mobile.onclick=()=>menu.classList.toggle('open');
loadCars();