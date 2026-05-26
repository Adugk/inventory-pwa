// 🔑 REPLACE THESE WITH YOUR SUPABASE PROJECT URL & ANON KEY
const SUPABASE_URL = 'https://eynltgmshxcejdlpbwjo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bmx0Z21zaHhjZWpkbHBid2pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDAyNDksImV4cCI6MjA5NTM3NjI0OX0.uJWWNKGr99ZzVEk_p9MeBpwEIWr8lmGp6dHLSGsUKcU';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (session) { currentUser = session.user; showView('main'); } 
  else { showView('login'); }

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) document.getElementById('login-error').textContent = error.message;
    else { currentUser = data.user; showView('main'); }
  });
});

function showView(v) {
  document.getElementById('login-view').classList.toggle('hidden', v !== 'login');
  document.getElementById('main-view').classList.toggle('hidden', v !== 'main');
}
function showSubView(name) {
  document.querySelectorAll('.subview').forEach(el => el.classList.add('hidden'));
  document.getElementById(`${name}-view`).classList.remove('hidden');
  if (name === 'products') loadProducts();
}
async function logout() {
  await supabase.auth.signOut(); currentUser = null; showView('login');
}

async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) return console.error('Load error:', error);
  const tbody = document.getElementById('products-list'); tbody.innerHTML = '';
  data.forEach(p => {
    tbody.innerHTML += `<tr><td>${p.name}</td><td>${p.quantity}</td><td>$${p.current_sell}</td><td><button onclick="editProduct('${p.id}')">✏️ Edit</button></td></tr>`;
  });
}

document.getElementById('add-product-btn').onclick = () => openModal();
document.getElementById('product-form').onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const payload = {
    name: document.getElementById('prod-name').value,
    category: document.getElementById('prod-category').value || 'General',
    current_cost: parseFloat(document.getElementById('prod-cost').value),
    current_sell: parseFloat(document.getElementById('prod-sell').value),
    quantity: parseInt(document.getElementById('prod-qty').value),
    barcode: document.getElementById('prod-barcode').value || null
  };
  const { error } = id 
    ? await supabase.from('products').update(payload).eq('id', id)
    : await supabase.from('products').insert(payload);
  if (error) return alert('Save failed: ' + error.message);
  closeModal(); loadProducts();
};

function openModal(product = null) {
  document.getElementById('product-modal').classList.remove('hidden');
  if (product) {
    document.getElementById('modal-title').textContent = 'Edit Product';
    document.getElementById('prod-id').value = product.id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-cost').value = product.current_cost;
    document.getElementById('prod-sell').value = product.current_sell;
    document.getElementById('prod-qty').value = product.quantity;
    document.getElementById('prod-barcode').value = product.barcode || '';
  } else {
    document.getElementById('modal-title').textContent = 'Add Product';
    document.getElementById('product-form').reset();
    document.getElementById('prod-id').value = '';
  }
}
function closeModal() { document.getElementById('product-modal').classList.add('hidden'); }
function editProduct(id) { supabase.from('products').select('*').eq('id', id).single().then(({ data }) => { if (data) openModal(data); }); }