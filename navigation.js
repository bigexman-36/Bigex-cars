// Small navigation bridge: keep the existing marketplace interactions intact while
// allowing Compare to become a real page and preserving selected cars across pages.
const key='bigexCompare';
function read(){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return[]}}
function write(ids){localStorage.setItem(key,JSON.stringify([...new Set(ids)].slice(0,4)))}
document.addEventListener('click',event=>{
  const compareButton=event.target.closest('[data-compare]');
  if(compareButton){
    const id=compareButton.dataset.compare;if(!id)return;
    const ids=read();const next=ids.includes(id)?ids.filter(x=>x!==id):ids.length<4?[...ids,id]:ids;
    write(next);return;
  }
  if(event.target.closest('#compareAction')){event.preventDefault();event.stopImmediatePropagation();location.href='compare.html';return;}
  if(event.target.closest('#compareClear')){write([]);}
},true);
