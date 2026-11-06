const foodList = document.getElementById('foodList');
const addFoodForm = document.getElementById('addFoodForm');
const formMessage = document.getElementById('formMessage');
let allFoods = [];
async function api(url, options) { const r = await fetch(url, options); const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Request failed'); return data; }
function renderFoods() {
 const term = (document.getElementById('searchFood').value || '').toLowerCase();
 const foods = allFoods.filter(f => `${f.food_name} ${f.category}`.toLowerCase().includes(term));
 foodList.innerHTML = foods.length ? foods.map(f => `<tr><td>${f.food_id}</td><td><strong>${escapeHTML(f.food_name)}</strong></td><td>${escapeHTML(f.category)}</td><td>${money(f.price)}</td><td>${escapeHTML(f.description || '-')}</td><td>${f.availability ? 'Available' : 'Unavailable'}</td><td class="actions"><button class="small-button" data-edit="${f.food_id}">Edit</button><button class="small-button danger" data-delete="${f.food_id}">Delete</button><button class="small-button" data-cart="${f.food_id}" ${f.availability ? '' : 'disabled'}>Add to cart</button></td></tr>`).join('') : '<tr><td colspan="7">No food items found.</td></tr>';
}
async function loadFoods() { try { allFoods = await api('/api/food'); renderFoods(); } catch(e) { foodList.innerHTML = `<tr><td colspan="7">${escapeHTML(e.message)}</td></tr>`; } }
addFoodForm.addEventListener('submit', async e => { e.preventDefault(); const data = { food_name:document.getElementById('food_name').value.trim(), category:document.getElementById('category').value.trim(), price:document.getElementById('price').value, description:document.getElementById('description').value.trim(), availability:document.getElementById('availability').value === 'true' }; try { await api('/api/food',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); formMessage.textContent='Added successfully — saved in MySQL.'; addFoodForm.reset(); await loadFoods(); } catch(err) { formMessage.textContent=err.message; } });
document.getElementById('searchFood').addEventListener('input', renderFoods);
foodList.addEventListener('click', async e => { const b=e.target.closest('button'); if(!b) return; const id=Number(b.dataset.edit || b.dataset.delete || b.dataset.cart); if(b.dataset.edit){ location.href=`/update.html?id=${id}`; return; } if(b.dataset.delete){ if(!confirm('Permanently delete this food item from MySQL?')) return; try { await api(`/api/food/${id}`,{method:'DELETE'}); await loadFoods(); } catch(err){alert(err.message);} return; } if(b.dataset.cart){ const f=allFoods.find(x=>x.food_id===id); const cart=readCart(); const old=cart.find(x=>x.food_id===id); if(old) old.quantity++; else cart.push({food_id:id,food_name:f.food_name,price:f.price,quantity:1}); saveCart(cart); b.textContent='Added ✓'; } });
loadFoods();
