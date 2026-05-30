// ===========================
// products.js
// ===========================
import { api } from './api.js';
import { Utils } from './utils.js';
import { requireAuth, initUserUI, isAdmin } from './auth.js';

requireAuth();
initUserUI();

let currentPage = 1;
let totalPages = 1;
const productModal = new bootstrap.Modal(document.getElementById('productModal'));
const detailModal = new bootstrap.Modal(document.getElementById('productDetailModal'));

// ---------- Carregar categorias nos selects ----------


export async function loadCategoryOptions() {
  try {
    const response = await api.get('/products');

    const products = response.data || [];

    // Remove categorias duplicadas
    const categories = [
      ...new Map(
        products.map(p => [
          p.category.id,
          {
            id: p.category.id,
            name: p.category.name
          }
        ])
      ).values()
    ];

    const selects = [
      document.getElementById('product-category'),
      document.getElementById('filter-category')
    ];

    selects.forEach(select => {
      if (!select) return;

      if (select.id === 'filter-category') {
        select.innerHTML = '<option value="">Todas</option>';
      } else {
        select.innerHTML = '<option value="">Selecione...</option>';
      }

      categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
      });
    });

  } catch (e) {
    console.error('Erro ao carregar categorias:', e);
  }
}

export async function loadSupplierOptions() {
  try {
    const clients = await api.get('/clients?isSupplier=true');
    const sel = document.getElementById('product-supplier');
    clients.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
  } catch (e) { console.error(e); }
}

// ---------- Listar produtos ----------
export async function load(page = 1) {
  currentPage = page;
  const search = document.getElementById('filter-search').value;
  const category = document.getElementById('filter-category').value;
  const status = document.getElementById('filter-status').value;

  let url = `/products?page=${page}&limit=15`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (category) url += `&categoryId=${category}`;
  if (status === 'ok') url += `&normalStock=true`;
  if (status === 'low') url += `&lowStock=true`;

  const tbody = document.getElementById('products-table-body');
  tbody.innerHTML = '<tr><td colspan="9" class="text-center py-3">Carregando...</td></tr>';

  try {
    const res = await api.get(url);
    const products = res.data || res;
    totalPages = res.totalPages || 1;
    document.getElementById('products-count').textContent =
      `${res.total || products.length} produto(s)`;

    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">Nenhum produto encontrado</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => {
      const isLow = p.quantity <= p.minQuantity;
      const badge = isLow
        ? '<span class="badge bg-danger">Crítico</span>'
        : '<span class="badge bg-success">Normal</span>';
      const img = p.imageUrl
        ? `<img src="${p.imageUrl}" alt="${p.name}" class="img-thumbnail" style="width:40px;height:40px;object-fit:cover;">`
        : '<span class="text-muted">—</span>';
      const actions = isAdmin()
        ? `<button class="btn btn-sm btn-outline-primary me-1" onclick="Products.openForm('${p.id}')">✏️</button>
           <button class="btn btn-sm btn-outline-danger" onclick="Products.remove('${p.id}','${p.name}')">🗑️</button>`
        : `<button class="btn btn-sm btn-outline-secondary" onclick="Products.showDetail('${p.id}')">👁️</button>`;
      return `<tr>
        <td>${img}</td>
        <td><code>${p.code}</code></td>
        <td>${p.name}</td>
        <td>${p.category?.name || '—'}</td>
        <td class="${isLow ? 'text-danger fw-bold' : ''}">${p.quantity}</td>
        <td>${p.minQuantity}</td>
        <td>${Utils.formatCurrency(p.unitPrice)}</td>
        <td>${badge}</td>
        <td>${actions}</td>
      </tr>`;
    }).join('');

    Utils.renderPagination('products-pagination', { page, totalPages }, load);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Erro ao carregar produtos</td></tr>';
    Utils.showToast('Erro ao carregar produtos', 'error');
  }
}

// ---------- Abrir formulário ----------
export async function openForm(id = null) {
  document.getElementById('product-id').value = '';
  document.getElementById('product-code').value = '';
  document.getElementById('product-name').value = '';
  document.getElementById('product-category').value = '';
  document.getElementById('product-supplier').value = '';
  document.getElementById('product-quantity').value = 0;
  document.getElementById('product-min-quantity').value = 1;
  document.getElementById('product-price').value = '';
  document.getElementById('product-description').value = '';
  document.getElementById('product-image-preview').innerHTML = '';

  if (id) {
    document.getElementById('productModalTitle').textContent = 'Editar Produto';
    try {
      const p = await api.get(`/products/${id}`);
      document.getElementById('product-id').value = p.id;
      document.getElementById('product-code').value = p.code;
      document.getElementById('product-name').value = p.name;
      document.getElementById('product-category').value = p.categoryId || '';
      document.getElementById('product-supplier').value = p.supplierId || '';
      document.getElementById('product-quantity').value = p.quantity;
      document.getElementById('product-min-quantity').value = p.minQuantity;
      document.getElementById('product-price').value = p.unitPrice;
      document.getElementById('product-description').value = p.description || '';
      if (p.imageUrl) {
        document.getElementById('product-image-preview').innerHTML =
          `<img src="${p.imageUrl}" class="img-thumbnail" style="max-height:80px;" />`;
      }
    } catch (e) { Utils.showToast('Erro ao carregar produto', 'error'); return; }
  } else {
    document.getElementById('productModalTitle').textContent = 'Novo Produto';
  }
  productModal.show();
}

// ---------- Salvar ----------
export async function save() {
  const id = document.getElementById('product-id').value;
  const btn = document.getElementById('btn-save-product');
  Utils.setLoading(btn, true);

  try {
    const formData = new FormData();
    formData.append('code', document.getElementById('product-code').value.trim());
    formData.append('name', document.getElementById('product-name').value.trim());
    formData.append('categoryId', document.getElementById('product-category').value);
    formData.append('supplierId', document.getElementById('product-supplier').value);
    formData.append('quantity', document.getElementById('product-quantity').value);
    formData.append('minQuantity', document.getElementById('product-min-quantity').value);
    formData.append('unitPrice', document.getElementById('product-price').value);
    formData.append('description', document.getElementById('product-description').value);
    const imgFile = document.getElementById('product-image').files[0];
    if (imgFile) formData.append('image', imgFile);

    if (id) {
      await api.putFormData(`/products/${id}`, formData);
      Utils.showToast('Produto atualizado!');
    } else {
      await api.postFormData('/products', formData);
      Utils.showToast('Produto cadastrado!');
    }
    productModal.hide();
    load(currentPage);
  } catch (e) {
    Utils.showToast(e.message || 'Erro ao salvar produto', 'error');
  } finally {
    Utils.setLoading(btn, false);
  }
}

// ---------- Detalhes ----------
export async function showDetail(id) {
  try {
    const p = await api.get(`/products/${id}`);
    const isLow = p.quantity <= p.minQuantity;
    document.getElementById('product-detail-body').innerHTML = `
      <div class="text-center mb-3">
        ${p.imageUrl ? `<img src="${p.imageUrl}" class="img-fluid rounded" style="max-height:150px;">` : ''}
      </div>
      <table class="table table-sm">
        <tr><th>Código</th><td><code>${p.code}</code></td></tr>
        <tr><th>Nome</th><td>${p.name}</td></tr>
        <tr><th>Categoria</th><td>${p.category?.name || '—'}</td></tr>
        <tr><th>Quantidade</th><td class="${isLow ? 'text-danger fw-bold' : ''}">${p.quantity}</td></tr>
        <tr><th>Qtd. Mínima</th><td>${p.minQuantity}</td></tr>
        <tr><th>Preço Unitário</th><td>${Utils.formatCurrency(p.unitPrice)}</td></tr>
        <tr><th>Descrição</th><td>${p.description || '—'}</td></tr>
      </table>`;
    detailModal.show();
  } catch (e) { Utils.showToast('Erro ao carregar detalhes', 'error'); }
}

// ---------- Remover ----------
export async function remove(id, name) {
  if (!Utils.confirmAction(`Excluir o produto "${name}"?`)) return;
  try {
    await api.delete(`/products/${id}`);
    Utils.showToast('Produto excluído!');
    load(currentPage);
  } catch (e) {
    Utils.showToast(e.message || 'Erro ao excluir produto', 'error');
  }
}

// Esconde elementos admin para USER
if (!isAdmin()) {
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
}

// Busca com debounce
document.getElementById('filter-search').addEventListener('input',
  Utils.debounce(() => load(1), 500)
);

// Exportar
window.Products = { load, openForm, save, showDetail, remove };

// Init
(async () => {
  await Promise.all([loadCategoryOptions(), loadSupplierOptions()]);
  load();
})();
