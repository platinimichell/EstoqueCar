// ===========================
// users.js
// ===========================
import { api } from './api.js';
import { Utils } from './utils.js';
import { requireAuth, initUserUI, isAdmin } from './auth.js';

requireAuth();
initUserUI();

// Bloquear acesso para não-admin
if (!isAdmin()) {
  document.getElementById('users-section').style.display = 'none';
  document.getElementById('access-denied').classList.remove('d-none');
}

let currentPage = 1;
const userModal = new bootstrap.Modal(document.getElementById('userModal'));

async function load(page = 1) {
  currentPage = page;
  const search = document.getElementById('filter-search').value;
  const role = document.getElementById('filter-role').value;

  let url = `/users?page=${page}&limit=15`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (role) url += `&role=${role}`;

  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">Carregando...</td></tr>';

  try {
    const res = await api.get(url);
    const users = res.data || res;
    const totalPages = res.totalPages || 1;
    document.getElementById('users-count').textContent = `${res.total || users.length} usuário(s)`;

    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhum usuário encontrado</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role === 'ADMIN'
          ? '<span class="badge bg-primary">Administrador</span>'
          : '<span class="badge bg-secondary">Operador</span>'}</td>
        <td>${u.active
          ? '<span class="badge bg-success">Ativo</span>'
          : '<span class="badge bg-danger">Inativo</span>'}</td>
        <td>${u.firstLogin
          ? '<span class="badge bg-warning text-dark">Pendente</span>'
          : '<span class="text-muted small">Realizado</span>'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="Users.openForm('${u.id}')">✏️</button>
          <button class="btn btn-sm btn-outline-danger" onclick="Users.remove('${u.id}','${u.name}')">🗑️</button>
        </td>
      </tr>`).join('');

    Utils.renderPagination('users-pagination', { page, totalPages }, load);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar usuários</td></tr>';
    Utils.showToast('Erro ao carregar usuários', 'error');
  }
}

function openForm(id = null) {
  document.getElementById('user-id').value = '';
  document.getElementById('user-name').value = '';
  document.getElementById('user-email').value = '';
  document.getElementById('user-role').value = 'USER';
  document.getElementById('user-active').checked = true;

  if (id) {
    document.getElementById('userModalTitle').textContent = 'Editar Usuário';
    api.get(`/users/${id}`).then(u => {
      document.getElementById('user-id').value = u.id;
      document.getElementById('user-name').value = u.name;
      document.getElementById('user-email').value = u.email;
      document.getElementById('user-role').value = u.role;
      document.getElementById('user-active').checked = u.active;
    }).catch(() => Utils.showToast('Erro ao carregar usuário', 'error'));
  } else {
    document.getElementById('userModalTitle').textContent = 'Novo Usuário';
  }
  userModal.show();
}

async function save() {
  const id = document.getElementById('user-id').value;
  const btn = document.getElementById('btn-save-user');
  Utils.setLoading(btn, true);
  try {
    const payload = {
      name: document.getElementById('user-name').value.trim(),
      email: document.getElementById('user-email').value.trim(),
      role: document.getElementById('user-role').value,
      active: document.getElementById('user-active').checked
    };
    if (id) {
      await api.put(`/users/${id}`, payload);
      Utils.showToast('Usuário atualizado!');
    } else {
      await api.post('/users', payload);
      Utils.showToast('Usuário criado! Senha padrão: Mudar123@');
    }
    userModal.hide();
    load(currentPage);
  } catch (e) {
    Utils.showToast(e.message || 'Erro ao salvar usuário', 'error');
  } finally {
    Utils.setLoading(btn, false);
  }
}

async function remove(id, name) {
  if (!Utils.confirmAction(`Desativar/excluir o usuário "${name}"?`)) return;
  try {
    await api.delete(`/users/${id}`);
    Utils.showToast('Usuário removido!');
    load(currentPage);
  } catch (e) {
    Utils.showToast(e.message || 'Erro ao remover usuário', 'error');
  }
}

document.getElementById('filter-search').addEventListener('input',
  Utils.debounce(() => load(1), 500)
);

window.Users = { load, openForm, save, remove };
if (isAdmin()) load();
