// ===========================
// utils.js — Funções utilitárias globais
// ===========================

// ---------- Toast ----------
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✔', error: '✖', warning: '⚠', info: 'ℹ' };
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toast-container';
  div.style.cssText = 'position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;';
  document.body.appendChild(div);
  return div;
}

// ---------- Formatação ----------
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateStr));
}

function formatDocument(doc) {
  if (!doc) return '—';
  const d = doc.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return doc;
}

// ---------- Badges de status ----------
const STATUS_LABELS = {
  PENDING: 'Pendente', SEPARATED: 'Separado',
  COMPLETED: 'Concluído', CANCELLED: 'Cancelado'
};
const STATUS_COLORS = {
  PENDING: 'warning', SEPARATED: 'info',
  COMPLETED: 'success', CANCELLED: 'danger'
};

function statusBadge(status) {
  const label = STATUS_LABELS[status] || status;
  const color = STATUS_COLORS[status] || 'secondary';
  return `<span class="badge bg-${color}">${label}</span>`;
}

// ---------- Paginação ----------
function renderPagination(containerId, { page, totalPages }, onPageChange) {
  const el = document.getElementById(containerId);
  if (!el || totalPages <= 1) { if (el) el.innerHTML = ''; return; }
  let html = '<nav><ul class="pagination pagination-sm mb-0">';
  html += `<li class="page-item ${page <= 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}">‹</a></li>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }
  html += `<li class="page-item ${page >= totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}">›</a></li>`;
  html += '</ul></nav>';
  el.innerHTML = html;
  el.querySelectorAll('[data-page]').forEach(a =>
    a.addEventListener('click', e => { e.preventDefault(); onPageChange(parseInt(a.dataset.page)); })
  );
}

// ---------- Loading ----------
function setLoading(btnEl, loading = true) {
  if (!btnEl) return;
  if (loading) {
    btnEl.dataset.originalText = btnEl.innerHTML;
    btnEl.disabled = true;
    btnEl.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Aguarde...';
  } else {
    btnEl.disabled = false;
    btnEl.innerHTML = btnEl.dataset.originalText || 'OK';
  }
}

// ---------- Confirmação ----------
function confirmAction(message = 'Confirma esta ação?') {
  return window.confirm(message);
}

// ---------- Validação CPF/CNPJ ----------
function validateCPF(cpf) {
  const c = cpf.replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
  let r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(c[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
  r = (sum * 10) % 11; if (r === 10 || r === 11) r = 0;
  return r === parseInt(c[10]);
}

function validateCNPJ(cnpj) {
  const c = cnpj.replace(/\D/g, '');
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const calc = (n, weights) => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += parseInt(n[i]) * weights[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  return calc(c, w1) === parseInt(c[12]) && calc(c, w2) === parseInt(c[13]);
}

// ---------- Debounce ----------
function debounce(fn, delay = 400) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ---------- Exportar para global ----------
/*window.Utils = {
  showToast, formatCurrency, formatDate, formatDocument,
  statusBadge, renderPagination, setLoading, confirmAction,
  validateCPF, validateCNPJ, debounce
};*/

export const Utils = {
  showToast, formatCurrency, formatDate, formatDocument,
  statusBadge, renderPagination, setLoading, confirmAction,
  validateCPF, validateCNPJ, debounce
};
