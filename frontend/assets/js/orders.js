// ===========================
// orders.js
// ===========================
import { api } from './api.js';
import { Utils } from './utils.js';
import { requireAuth, initUserUI, isAdmin } from './auth.js';

requireAuth();
initUserUI();

let currentPage = 1;
let orderItems = [];
let allProducts = [];

let orderModal;
let detailModal;

//const orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
//const detailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));

// ---------- Inicialização ----------
async function init() {
  await Promise.all([loadClientOptions(), loadProductOptions()]);
  load();
  if (!isAdmin()) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
}

async function loadClientOptions() {
  try {
    const clients = await api.get('/clients?isClient=true');
    const sel = document.getElementById('order-client');
    clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
  } catch (e) { console.error(e); }
}

async function loadProductOptions() {
  try {
    allProducts = await api.get('/products?limit=1000');
    if (allProducts.data) allProducts = allProducts.data;
    const sel = document.getElementById('item-product');
    allProducts.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.code} — ${p.name} (Estoque: ${p.quantity})`;
      opt.dataset.price = p.unitPrice;
      sel.appendChild(opt);
    });
    // Auto-preencher preço ao selecionar produto
    sel.addEventListener('change', () => {
      const opt = sel.options[sel.selectedIndex];
      document.getElementById('item-price').value = opt.dataset.price || '';
    });
  } catch (e) { console.error(e); }
}

// ---------- Listar ----------
async function load(page = 1) {
  currentPage = page;
  const search = document.getElementById('filter-search').value;
  const status = document.getElementById('filter-status').value;
  const dateStart = document.getElementById('filter-date-start').value;
  const dateEnd = document.getElementById('filter-date-end').value;

  let url = `/orders?page=${page}&limit=15`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status) url += `&status=${status}`;
  if (dateStart) url += `&startDate=${dateStart}`;
  if (dateEnd) url += `&endDate=${dateEnd}`;

  const tbody = document.getElementById('orders-table-body');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3">Carregando...</td></tr>';

  try {
    const res = await api.get(url);
    const orders = res.data || res;
    const totalPages = res.totalPages || 1;
    document.getElementById('orders-count').textContent = `${res.total || orders.length} pedido(s)`;

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Nenhum pedido encontrado</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><strong>#${o.orderNumber}</strong></td>
        <td>${o.client?.name || '—'}</td>
        <td>${o.items?.length || 0}</td>
        <td>${Utils.formatCurrency(o.totalAmount)}</td>
        <td>${Utils.statusBadge(o.status)}</td>
        <td>${Utils.formatDate(o.createdAt)}</td>
        <td>
          <button class="btn btn-sm btn-outline-secondary" onclick="Orders.showDetail('${o.id}')">👁️ Ver</button>
        </td>
      </tr>`).join('');

    Utils.renderPagination('orders-pagination', { page, totalPages }, load);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar pedidos</td></tr>';
    Utils.showToast('Erro ao carregar pedidos', 'error');
  }
}

// ---------- Abrir formulário novo pedido ----------
function openForm() {
  orderItems = [];
  document.getElementById('order-client').value = '';
  document.getElementById('order-notes').value = '';
  document.getElementById('item-product').value = '';
  document.getElementById('item-qty').value = 1;
  document.getElementById('item-price').value = '';
  renderItemsTable();
  orderModal.show();
}

// ---------- Adicionar item ----------
function addItem() {
  const productId = document.getElementById('item-product').value;
  const qty = parseInt(document.getElementById('item-qty').value) || 1;
  const price = parseFloat(document.getElementById('item-price').value) || 0;

  if (!productId) { Utils.showToast('Selecione um produto', 'warning'); return; }
  //const product = allProducts.find(p => p.id === productId);
  const product = allProducts.find(p => String(p.id) === String(productId));
  if (!product) return;

  const existing = orderItems.find(i => i.productId === productId);
  if (existing) {
    existing.quantity += qty;
    existing.subtotal = existing.quantity * existing.unitPrice;
  } else {
    orderItems.push({ productId, name: product.name, code: product.code, quantity: qty, unitPrice: price, subtotal: qty * price });
  }
  renderItemsTable();
}

function renderItemsTable() {
  const tbody = document.getElementById('order-items-body');
  if (!orderItems.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-muted text-center">Nenhum item adicionado</td></tr>';
    document.getElementById('order-total').textContent = 'Total: R$ 0,00';
    return;
  }
  tbody.innerHTML = orderItems.map((item, i) => `
    <tr>
      <td>${item.code} — ${item.name}</td>
      <td>${item.quantity}</td>
      <td>${Utils.formatCurrency(item.unitPrice)}</td>
      <td>${Utils.formatCurrency(item.subtotal)}</td>
      <td><button class="btn btn-sm btn-outline-danger" onclick="Orders.removeItem(${i})">✖</button></td>
    </tr>`).join('');
  const total = orderItems.reduce((acc, i) => acc + i.subtotal, 0);
  document.getElementById('order-total').textContent = `Total: ${Utils.formatCurrency(total)}`;
}

function removeItem(index) {
  orderItems.splice(index, 1);
  renderItemsTable();
}

// ---------- Salvar ----------
async function save() {
  const clientId = document.getElementById('order-client').value;
  if (!clientId) { Utils.showToast('Selecione um cliente', 'warning'); return; }
  if (!orderItems.length) { Utils.showToast('Adicione pelo menos um item', 'warning'); return; }

  const btn = document.getElementById('btn-save-order');
  Utils.setLoading(btn, true);

  //LOG PARA VER O QUE ESTOU ENVIANDO
  /*
  console.log({
  clientId,
  notes: document.getElementById('order-notes').value,
  items: orderItems.map(i => ({
    productId: i.productId,
    quantity: i.quantity,
    unitPrice: i.unitPrice
  }))
    }); */



  try {
    await api.post('/orders', {
      clientId: Number(clientId),
      notes: document.getElementById('order-notes').value,
      items: orderItems.map(i => ({ 
        productId: Number(i.productId), 
        quantity: Number(i.quantity),
         unitPrice: Number(i.unitPrice)
      }))
    });
    
    Utils.showToast('Pedido criado com sucesso!');
    orderModal.hide();
    load(currentPage);
  } catch (e) {
    Utils.showToast(e.message || 'Erro ao criar pedido', 'error');
  } finally {
    Utils.setLoading(btn, false);
  }
}

// ---------- Detalhes ----------
async function showDetail(id) {
  try {
    const o = await api.get(`/orders/${id}`);
    const itemsHtml = (o.items || []).map(i => `
      <tr>
        <td>${i.product?.code} — ${i.product?.name}</td>
        <td>${i.quantity}</td>
        <td>${Utils.formatCurrency(i.unitPrice)}</td>
        <td>${Utils.formatCurrency(i.subtotal)}</td>
      </tr>`).join('');

    document.getElementById('order-detail-body').innerHTML = `
      <div class="row mb-3">
        <div class="col-6"><strong>Pedido:</strong> #${o.orderNumber}</div>
        <div class="col-6"><strong>Status:</strong> ${Utils.statusBadge(o.status)}</div>
        <div class="col-6 mt-2"><strong>Cliente:</strong> ${o.client?.name || '—'}</div>
        <div class="col-6 mt-2"><strong>Data:</strong> ${Utils.formatDate(o.createdAt)}</div>
        ${o.notes ? `<div class="col-12 mt-2"><strong>Obs:</strong> ${o.notes}</div>` : ''}
      </div>
      <table class="table table-sm">
        <thead><tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Subtotal</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <div class="text-end fw-bold fs-5">Total: ${Utils.formatCurrency(o.totalAmount)}</div>`;

    // Ações de status
    const actionsEl = document.getElementById('order-detail-actions');
    const nextStatus = { PENDING: 'SEPARATED', SEPARATED: 'COMPLETED' };
    const nextLabel = { PENDING: '📦 Marcar Separado', SEPARATED: '✅ Dar Baixa (Concluir)' };
    let actionsHtml = '<button class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>';

    if (nextStatus[o.status]) {
      actionsHtml += `<button class="btn btn-primary ms-2" onclick="Orders.updateStatus('${o.id}','${nextStatus[o.status]}')">${nextLabel[o.status]}</button>`;
    }
    if (o.status !== 'CANCELLED' && o.status !== 'COMPLETED' && isAdmin()) {
      actionsHtml += `<button class="btn btn-danger ms-2" onclick="Orders.updateStatus('${o.id}','CANCELLED')">✖ Cancelar</button>`;
    }
    actionsEl.innerHTML = actionsHtml;
    detailModal.show();
  } catch (e) { Utils.showToast('Erro ao carregar pedido', 'error'); }
}

// ---------- Atualizar status ----------
async function updateStatus(id, status) {
  const labels = { SEPARATED: 'marcar como Separado', COMPLETED: 'concluir (dar baixa no estoque)', CANCELLED: 'cancelar' };
  if (!Utils.confirmAction(`Deseja ${labels[status] || 'atualizar'} este pedido?`)) return;
  try {
    await api.put(`/orders/${id}/status`, { status });
    Utils.showToast('Status atualizado!');
    detailModal.hide();
    load(currentPage);
  } catch (e) {
    Utils.showToast(e.message || 'Erro ao atualizar status', 'error');
  }
}

//window.Orders = { load, openForm, addItem, removeItem, save, showDetail, updateStatus };
//window.handleChangePassword = handleChangePassword;
//init();

document.addEventListener('DOMContentLoaded', async () => {
  orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
  detailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));

  window.Orders = {
    load,
    openForm,
    addItem,
    removeItem,
    save,
    showDetail,
    updateStatus
  };

  //window.addItem = addItem;

  //console.log('Orders carregado:', window.Orders);

  await init();
});