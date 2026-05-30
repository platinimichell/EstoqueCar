// ===========================
// stock.js
// ===========================
import { api } from './api.js';
import { Utils } from './utils.js';
import { requireAuth, initUserUI, isAdmin } from './auth.js';

requireAuth();
initUserUI();

if (!isAdmin()) {
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  // Bloquear formulário de entrada para USER (somente ADMIN pode dar entrada)
  document.getElementById('btn-entry').disabled = true;
  document.getElementById('btn-entry').title = 'Somente administradores podem registrar entradas';
}

let movPage = 1;

// ---------- Carregar produtos ----------
async function loadProducts() {
  try {
    const res = await api.get('/products?limit=1000&active=true');
    const products = res.data || res;
    const sel = document.getElementById('entry-product');
    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.code} — ${p.name}`;
      opt.dataset.qty = p.quantity;
      opt.dataset.min = p.minQuantity;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      const opt = sel.options[sel.selectedIndex];
      const infoEl = document.getElementById('entry-product-info');
      if (opt.value) {
        const isLow = parseInt(opt.dataset.qty) <= parseInt(opt.dataset.min);
        infoEl.innerHTML = `Estoque atual: <strong class="${isLow ? 'text-danger' : 'text-success'}">${opt.dataset.qty}</strong> un. &nbsp;|&nbsp; Mínimo: ${opt.dataset.min} un.`;
      } else {
        infoEl.innerHTML = '';
      }
    });
  } catch (e) { console.error(e); }
}

// ---------- Registrar entrada ----------
async function registerEntry() {
  const productId = document.getElementById('entry-product').value;
  const qty = parseInt(document.getElementById('entry-qty').value) || 0;
  const notes = document.getElementById('entry-notes').value;

  if (!productId) { Utils.showToast('Selecione um produto', 'warning'); return; }
  if (qty < 1) { Utils.showToast('Quantidade deve ser maior que zero', 'warning'); return; }

  const btn = document.getElementById('btn-entry');
  
  Utils.setLoading(btn, true);

  try {
    await api.post('/stock/entry', {
      productId: Number(productId),
      quantity: Number(qty),
      notes });

    Utils.showToast(`Entrada de ${qty} unidade(s) registrada!`);

    document.getElementById('entry-product').value = '';
    document.getElementById('entry-qty').value = 1;
    document.getElementById('entry-notes').value = '';
    document.getElementById('entry-product-info').innerHTML = '';

    await loadMovements();
    await loadProducts(); // Atualizar estoques
    
  } catch (e) {
    Utils.showToast(e.message || 'Erro ao registrar entrada', 'error');
  } finally {
    Utils.setLoading(btn, false);
  }
}

// ---------- Carregar movimentações ----------
async function loadMovements(page = 1) {
  movPage = page;
  const type = document.getElementById('filter-mov-type').value;
  const date = document.getElementById('filter-mov-date').value;

  let url = `/stock/movements?page=${page}&limit=20`;
  if (type) url += `&type=${type}`;
  if (date) {
    url += `&startDate=${date}T00:00:00`;
    url += `&endDate=${date}T23:59:59`;
  }

  const tbody = document.getElementById('movements-body');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3">Carregando...</td></tr>';

  try {
    const res = await api.get(url);
    const movements = res.data || res;
    const totalPages = res.totalPages || 1;
    document.getElementById('movements-count').textContent = `${res.total || movements.length} registro(s)`;

    if (!movements.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhuma movimentação</td></tr>';
      return;
    }

    tbody.innerHTML = movements.map(m => {
      const isEntry = m.type === 'ENTRY';
      const badge = isEntry
        ? '<span class="badge bg-success">ENTRADA</span>'
        : '<span class="badge bg-danger">SAÍDA</span>';
      const qty = isEntry ? `+${m.quantity}` : `-${m.quantity}`;
      const origin = m.referenceType === 'ORDER'
        ? `Pedido #${m.referenceId}`
        : (m.notes || 'Manual');
      return `<tr>
        <td>${badge}</td>
        <td>${m.product?.name || '—'}</td>
        <td class="${isEntry ? 'text-success' : 'text-danger'} fw-bold">${qty}</td>
        <td class="text-muted small">${origin}</td>
        <td class="text-muted small">${Utils.formatDate(m.createdAt)}</td>
      </tr>`;
    }).join('');

    Utils.renderPagination('movements-pagination', { page, totalPages }, loadMovements);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar</td></tr>';
  }
}

window.Stock = { registerEntry, loadMovements };

(async () => {
  await loadProducts();
  loadMovements();
})();
