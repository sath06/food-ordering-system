const CART_KEY='sathvikaRestaurantCart';
function readCart(){try{const x=JSON.parse(localStorage.getItem(CART_KEY)||'[]');return Array.isArray(x)?x:[];}catch{return [];}}
function saveCart(cart){localStorage.setItem(CART_KEY,JSON.stringify(cart));updateCartCounts();}
function updateCartCounts(){const n=readCart().reduce((s,x)=>s+Number(x.quantity||0),0);document.querySelectorAll('.cart-count').forEach(x=>x.textContent=n);}
function money(v){return '₹'+Number(v||0).toFixed(2);}
function escapeHTML(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
document.addEventListener('DOMContentLoaded',updateCartCounts);
