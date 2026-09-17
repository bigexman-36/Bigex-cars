// Bigex Cars — first marketplace data layer.
// Demo data is intentionally local; replace with a database/API when backend is connected.
const ADMIN_EMAIL = 'igetobiloluwa36@gmail.com';

const listings = [
  {id:'BC001',name:'Toyota Land Cruiser',year:2023,type:'SUV',fuel:'Petrol',transmission:'Automatic',mileage:'18,400 km',price:82000000,location:'Lagos',power:'409 HP',seller:'Bigex Verified Motors'},
  {id:'BC002',name:'Lexus RX 350',year:2024,type:'SUV',fuel:'Petrol',transmission:'Automatic',mileage:'8,200 km',price:67500000,location:'Abuja',power:'275 HP',seller:'Prime Auto NG'},
  {id:'BC003',name:'BMW M4 Competition',year:2024,type:'Coupe',fuel:'Petrol',transmission:'Automatic',mileage:'4,600 km',price:95000000,location:'Lagos',power:'503 HP',seller:'Bigex Verified Motors'},
  {id:'BC004',name:'Mercedes-Benz C300',year:2023,type:'Sedan',fuel:'Petrol',transmission:'Automatic',mileage:'21,000 km',price:58000000,location:'Port Harcourt',power:'255 HP',seller:'Autohub NG'},
  {id:'BC005',name:'Tesla Model 3',year:2024,type:'Electric',fuel:'Electric',transmission:'Automatic',mileage:'5,100 km',price:72000000,location:'Lagos',power:'394 HP',seller:'EV Nigeria'},
  {id:'BC006',name:'Range Rover Sport',year:2022,type:'SUV',fuel:'Petrol',transmission:'Automatic',mileage:'31,200 km',price:115000000,location:'Lagos',power:'355 HP',seller:'Elite Auto Gallery'}
];

const state = { query:'', type:'all', min:null, max:null, favorites:new Set(JSON.parse(localStorage.getItem('bigexFavorites') || '[]')), compare:new Set() };

export function isAdmin(email){ return String(email || '').trim().toLowerCase() === ADMIN_EMAIL; }
export function formatNaira(value){ return `₦${(value/1000000).toFixed(1)}M`; }
export function saveFavorites(){ localStorage.setItem('bigexFavorites', JSON.stringify([...state.favorites])); }
export function toggleFavorite(id){ state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id); saveFavorites(); return state.favorites.has(id); }
export function toggleCompare(id){ if(state.compare.has(id)) state.compare.delete(id); else if(state.compare.size < 4) state.compare.add(id); return [...state.compare]; }
export function filteredListings(){
  const q=state.query.toLowerCase();
  return listings.filter(c => (!q || `${c.name} ${c.type} ${c.fuel} ${c.location} ${c.seller}`.toLowerCase().includes(q)) && (state.type==='all' || c.type===state.type) && (state.min===null || c.price>=state.min) && (state.max===null || c.price<=state.max));
}
export function getListing(id){ return listings.find(c=>c.id===id); }
export { listings, state };
