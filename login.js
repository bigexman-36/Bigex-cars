import { supabase, signInWithEmail, getCurrentUser, ensureProfile, signOut } from './supabase.js';

const form=document.getElementById('loginForm');
const emailInput=document.getElementById('email');
const submitBtn=document.getElementById('submitBtn');
const status=document.getElementById('status');

function show(message,type=''){status.textContent=message;status.className='auth-status '+type;}

async function finishSession(user){
  const profile=await ensureProfile(user);
  localStorage.setItem('bigexSession',JSON.stringify({id:user.id,email:user.email,role:profile?.role||'buyer'}));
  if(profile?.role==='admin'){
    location.replace('admin.html');
    return;
  }
  show('You are signed in. Redirecting to the marketplace…','ok');
  setTimeout(()=>location.replace('index.html'),700);
}

async function checkSession(){
  try{
    const user=await getCurrentUser();
    if(user) await finishSession(user);
  }catch(error){
    console.error(error);
  }
}

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const email=emailInput.value.trim();
  if(!email)return;
  submitBtn.disabled=true;
  submitBtn.textContent='Sending secure link…';
  show('');
  try{
    await signInWithEmail(email);
    show('Check your email for the secure sign-in link. Open it on this device to continue.','ok');
    submitBtn.textContent='Link sent ✓';
  }catch(error){
    show(error.message||'Could not send the sign-in link.','error');
    submitBtn.disabled=false;
    submitBtn.textContent='Send secure sign-in link ↗';
  }
});

supabase.auth.onAuthStateChange(async(event,session)=>{
  if(session?.user){
    try{await finishSession(session.user);}
    catch(error){show(error.message||'Signed in, but profile setup needs attention.','error');}
  }
});

checkSession();