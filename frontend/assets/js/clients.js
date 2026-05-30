// ===========================
// clients.js
// ===========================
import { api } from './api.js';
import { Utils } from './utils.js';
import { requireAuth, initUserUI, isAdmin } from './auth.js';

requireAuth();
initUserUI();

let currentPage = 1;
const clientModal = new bootstrap.Modal(document.getElementById('clientModal'));

if (!isAdmin()) {
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
}

async function load(page = 1) {
  currentPage = page;
  const search = document.getElementById('filter-search').value;
  const type = document.getElementById('filter-type').value;

  let url = `/clients?page=${page}&limit=15`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (type === 'client') url += `&isClient=true`;
  if (type === 'supplier') url += `&isSupplier=true`;

  const tbody = document.getElementById('clients-table-body');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-3">Carregando...</td></tr>';

  try {
    const res = await api.get(url);
    const clients = res.data || res;
    const totalPages = res.totalPages || 1;
    document.getElementById('clients-count').textContent = `${res.total || clients.length} registro(s)`;

    if (!clients.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Nenhum registro encontrado</td></tr>';
      return;
    }

    tbody.innerHTML = clients.map(c => {
      const types = [];
      if (c.isClient) types.push('<span class="badge bg-primary">Cliente</span>');
      if (c.isSupplier) types.push('<span class="badge bg-secondary">Fornecedor</span>');
      const actions = isAdmin()
        ? `<button class="btn btn-sm btn-outline-primary me-1" onclick="Clients.openForm('${c.id}')">✏️</button>
           <button class="btn btn-sm btn-outline-danger" onclick="Clients.remove('${c.id}','${c.name}')">🗑️</button>`
        : '—';
      return `<tr>
        <td>${c.name}</td>
        <td>${c.documentType}</td>
        <td>${Utils.formatDocument(c.documentNumber)}</td>
        <td>${c.email || '—'}</td>
        <td>${c.phone || '—'}</td>
        <td>${types.join(' ')}</td>
        <td>${actions}</td>
      </tr>`;
    }).join('');

    Utils.renderPagination('clients-pagination', { page, totalPages }, load);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar</td></tr>';
    Utils.showToast('Erro ao carregar registros', 'error');
  }
}

async function openForm(id = null) {
  document.getElementById('client-id').value = '';
  document.getElementById('client-name').value = '';
  document.getElementById('client-doc-type').value = 'CPF';
  document.getElementById('client-doc-number').value = '';
  document.getElementById('client-email').value = '';
  document.getElementById('client-phone').value = '';
  document.getElementById('client-address').value = '';
  document.getElementById('client-is-client').checked = true;
  document.getElementById('client-is-supplier').checked = false;

  if (id) {
    document.getElementById('clientModalTitle').textContent = 'Editar Cadastro';
    try {
      const c = await api.get(`/clients/${id}`);
      document.getElementById('client-id').value = c.id;
      document.getElementById('client-name').value = c.name;
      document.getElementById('client-doc-type').value = c.documentType;
      document.getElementById('client-doc-number').value = c.documentNumber;
      document.getElementById('client-email').value = c.email || '';
      document.getElementById('client-phone').value = c.phone || '';
      document.getElementById('client-address').value = c.address || '';
      document.getElementById('client-is-client').checked = c.isClient;
      document.getElementById('client-is-supplier').checked = c.isSupplier;
    } catch (e) { Utils.showToast('Erro ao carregar dados', 'error'); return; }
  } else {
    document.getElementById('clientModalTitle').textContent = 'Novo Cadastro';
  }
  clientModal.show();
}

async function save() {
  const id = document.getElementById('client-id').value;
  const docType = document.getElementById('client-doc-type').value;
  const docNumber = document.getElementById('client-doc-number').value.replace(/\D/g, '');

  // Validar documento
  if (docType === 'CPF' && !Utils.validateCPF(docNumber)) {
    Utils.showToast('CPF inválido', 'error'); return;
  }
  if (docType === 'CNPJ' && !Utils.validateCNPJ(docNumber)) {
    Utils.showToast('CNPJ inválido', 'error'); return;
  }

  const isClient = document.getElementById('client-is-client').checked;
  const isSupplier = document.getElementById('client-is-supplier').checked;
  if (!isClient && !isSupplier) {
    Utils.showToast('Marque pelo menos: Cliente ou Fornecedor', 'warning'); return;
  }

  const btn = document.getElementById('btn-save-client');
  Utils.setLoading(btn, true);
  try {
    const payload = {
      name: document.getElementById('client-name').value.trim(),
      documentType: docType,
      documentNumber: docNumber,
      email: document.getElementById('client-email').value.trim() || undefined,
      phone: document.getElementById('client-phone').value.trim() || undefined,
      address: document.getElementById('client-address').value.trim() || undefined,
      isClient,
      isSupplier
    };
    if (id) {
      await api.put(`/clients/${id}`, payload);
      Utils.showToast('Cadastro atualizado!');
    } else {
      await api.post('/clients', payload);
      Utils.showToast('Cadastro realizado!');
    }
    clientModal.hide();
    load(currentPage);
  } catch (e) {
    Utils.showToast(e.message || 'Erro ao salvar', 'error');
  } finally {
    Utils.setLoading(btn, false);
  }
}

async function remove(id, name) {
  if (!Utils.confirmAction(`Excluir o cadastro de "${name}"?`)) return;
  try {
    await api.delete(`/clients/${id}`);
    Utils.showToast('Cadastro excluído!');
    load(currentPage);
  } catch (e) {
    Utils.showToast(e.message || 'Erro ao excluir', 'error');
  }
}

document.getElementById('filter-search').addEventListener('input',
  Utils.debounce(() => load(1), 500)
);

window.Clients = { load, openForm, save, remove };
load();
