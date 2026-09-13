// ============================================================
// DINATA STORE — APP.JS
// ============================================================

// ================= SUPABASE CONFIG =================
const SUPABASE_URL = 'https://khktvmiigsgpugxopxcv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_RsHXxxAGrKuOka09PBd-zw_Vju5GmEK';

// ================= SUPABASE HELPER =================
async function sb(table, { method = 'GET', query = '', body = null } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) {
      const err = await res.text();
      console.error('❌ Supabase error:', err);
      return { error: err };
    }
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (e) {
    console.error('❌ Fetch error:', e);
    return { error: e.message };
  }
}

// ================= AUTH =================
function currentUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); }
  catch { return null; }
}

async function login(username, password) {
  if (!username || !password) return { error: 'Lengkapi data' };

  // Admin hardcoded
  if (username.toLowerCase() === 'risky' && password === 'viky') {
    localStorage.setItem('user', JSON.stringify({ username: 'risky', role: 'admin' }));
    return { success: true, role: 'admin', username: 'risky' };
  }

  // User biasa
  const q = `?or=(username.eq.${encodeURIComponent(username)},email.eq.${encodeURIComponent(username)})&select=*`;
  const users = await sb('users', { query: q });
  if (!Array.isArray(users) || !users.length) return { error: 'Akun tidak ditemukan' };
  const u = users[0];
  if (u.password !== password) return { error: 'Password salah' };
  localStorage.setItem('user', JSON.stringify({ username: u.username, role: u.role }));
  return { success: true, role: u.role, username: u.username };
}

async function register(username, email, password) {
  if (!username || !email || !password) return { error: 'Lengkapi data' };
  if (username.length < 3) return { error: 'Username minimal 3 karakter' };
  if (password.length < 6) return { error: 'Password minimal 6 karakter' };
  if (!/^[a-zA-Z0-9_]+$/.test(username)) return { error: 'Username hanya huruf/angka/_' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Email tidak valid' };

  const q = `?or=(username.eq.${encodeURIComponent(username)},email.eq.${encodeURIComponent(email)})&select=*`;
  const exist = await sb('users', { query: q });
  if (Array.isArray(exist) && exist.length) return { error: 'Username atau email sudah dipakai' };

  const res = await sb('users', {
    method: 'POST',
    body: { username, email, password, role: 'user' }
  });
  if (res.error) return { error: 'Gagal daftar: ' + res.error };
  return { success: true };
}

function requireAuth() {
  if (!currentUser()) { location.href = 'login.html'; return false; }
  return true;
}
function requireAdmin() {
  const u = currentUser();
  if (!u) { location.href = 'login.html'; return false; }
  if (u.role !== 'admin') { location.href = 'dasbor.html'; return false; }
  return true;
}
function logout() {
  if (!confirm('Yakin mau logout?')) return;
  localStorage.removeItem('user');
  location.href = 'login.html';
}

// ================= ORDERS =================
async function createOrder(order) {
  return sb('orders', { method: 'POST', body: order });
}
async function getAllOrders() {
  const res = await sb('orders', { query: '?select=*&order=created_at.desc' });
  return Array.isArray(res) ? res : [];
}
async function getMyOrders(username) {
  const res = await sb('orders', {
    query: `?username=eq.${encodeURIComponent(username)}&select=*&order=created_at.desc`
  });
  return Array.isArray(res) ? res : [];
}
async function updateOrderStatus(invoice_id, status, note = null) {
  const body = { status, updated_at: new Date().toISOString() };
  if (note !== null) body.admin_note = note;
  return sb('orders', {
    method: 'PATCH',
    query: `?invoice_id=eq.${encodeURIComponent(invoice_id)}`,
    body
  });
}
async function deleteOrder(invoice_id) {
  return sb('orders', {
    method: 'DELETE',
    query: `?invoice_id=eq.${encodeURIComponent(invoice_id)}`
  });
}

// ================= USERS =================
async function getAllUsers() {
  const res = await sb('users', { query: '?select=*&order=created_at.desc' });
  return Array.isArray(res) ? res : [];
}
async function deleteUser(username) {
  return sb('users', {
    method: 'DELETE',
    query: `?username=eq.${encodeURIComponent(username)}`
  });
}

// ================= API (Netlify Functions) =================
async function api(url, opts = {}) {
  try {
    const res = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
    });
    return await res.json();
  } catch (e) { return { error: e.message }; }
}

// ================= TOAST =================
function toast(msg, type = 'info', duration = 3000) {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => {
    el.style.transition = '.3s';
    el.style.transform = 'translateX(400px)';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ================= LOADING =================
function showLoading(text = 'Memproses...') {
  let el = document.querySelector('.loading-overlay');
  if (!el) {
    el = document.createElement('div');
    el.className = 'loading-overlay';
    el.innerHTML = '<div class="spinner"></div><span class="loading-text"></span>';
    document.body.appendChild(el);
  }
  el.querySelector('.loading-text').textContent = text;
  el.classList.add('show');
}
function hideLoading() {
  const el = document.querySelector('.loading-overlay');
  if (el) el.classList.remove('show');
}

// ================= UTIL =================
function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function escapeHTML(s) {
  return String(s ?? '').replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}
function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ================= REALTIME POLLING =================
let _rtTimer = null;
function startRealtime(callback, intervalMs = 3000) {
  if (_rtTimer) clearInterval(_rtTimer);
  let lastJson = '';
  const tick = async () => {
    const orders = await getAllOrders();
    const json = JSON.stringify(orders);
    if (json !== lastJson) { lastJson = json; callback(orders); }
  };
  tick();
  _rtTimer = setInterval(tick, intervalMs);
    }
