// ===========================
// reports.js
// ===========================
import { api } from './api.js';
import { Utils } from './utils.js';
import { requireAuth, initUserUI, isAdmin } from './auth.js';

requireAuth();
initUserUI();

if (!isAdmin()) {
  document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
}

function getParams(type) {
  const params = new URLSearchParams();
  if (type === 'movements') {
    const s = document.getElementById('mov-date-start').value;
    const e = document.getElementById('mov-date-end').value;
    if (s) params.append('startDate', s);
    if (e) params.append('endDate', e);
  } else if (type === 'orders') {
    const s = document.getElementById('ord-date-start').value;
    const e = document.getElementById('ord-date-end').value;
    if (s) params.append('startDate', s);
    if (e) params.append('endDate', e);
  }
  return params;
}

async function download(type, format) {

  const token = sessionStorage.getItem('ec_token') || localStorage.getItem('ec_token');
  //const token = localStorage.getItem('ec_token');


  const params = getParams(type);
  params.append('format', format);
  const url = `/reports/${type}?${params.toString()}`;

  Utils.showToast('Gerando relatório...', 'info');
  try {
    //const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const token = localStorage.getItem('ec_token');
    const BASE = window.API_BASE_URL || 'http://localhost:3000/api';
    const res = await fetch(`${BASE}${url}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const ext = format === 'pdf' ? 'pdf' : 'xlsx';
    a.download = `estoque-car-${type}-${new Date().toISOString().split('T')[0]}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
    Utils.showToast('Download iniciado!');
  } catch (e) {
    Utils.showToast(e.message || 'Erro ao gerar relatório', 'error');
  }
}


async function preview(type) {
  const params = getParams(type);
  params.append('format', 'json');
  const url = `/reports/${type}?${params.toString()}`;
  const section = document.getElementById('preview-section');
  const content = document.getElementById('preview-content');
  const title = document.getElementById('preview-title');

  content.innerHTML = '<div class="text-center py-4">Carregando...</div>';
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth' });
  
  try {
    const data = await api.get(url);

    const summary = data.summary || {};

    if (type === 'stock') {
      title.textContent = `Estoque — ${data.data?.length || 0} produtos`;
      const rows = (data.data || []).map(p => {
        const isLow = p.quantity <= p.minQuantity;
        return `<tr>
          <td>${p.code}</td><td>${p.name}</td><td>${p.category}</td>
          <td class="${isLow ? 'text-danger fw-bold' : ''}">${p.quantity}</td>
          <td>${p.minQuantity}</td>
          <td>${Utils.formatCurrency(p.unitPrice)}</td>
          <td>${Utils.formatCurrency(p.quantity * p.unitPrice)}</td>
          <td>${isLow ? '<span class="badge bg-danger">Crítico</span>' : '<span class="badge bg-success">Normal</span>'}</td>
        </tr>`;
      }).join('');
      content.innerHTML = `<table class="table table-sm table-hover mb-0">
        <thead><tr><th>Código</th><th>Nome</th><th>Categoria</th><th>Qtd</th><th>Mín.</th><th>Preço Unit.</th><th>Valor Total</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="6" class="text-end fw-bold">Valor total:</td><td colspan="2" class="fw-bold">${Utils.formatCurrency(summary.totalValue)}</td></tr></tfoot>
      </table>`;

    } else if (type === 'movements') {
      title.textContent = `Movimentações — ${data.data?.length || 0} registros`;
      const rows = (data.data || []).map(m => {
        const isEntry = m.type === 'ENTRADA';

        return `<tr>
          <td>${isEntry ? '<span class="badge bg-success">ENTRADA</span>' : '<span class="badge bg-danger">SAÍDA</span>'}</td>
          <td>${m.productName || '—'}</td>
          <td class="${isEntry ? 'text-success' : 'text-danger'} fw-bold">${isEntry ? '+' : '-'}${m.quantity}</td>
          <td>${m.referenceType === 'ORDER' ? `Pedido #${m.referenceId}` : 'Manual'}</td>
          <td>${Utils.formatDate(m.date)}</td>
        </tr>`;
      }).join('');

      content.innerHTML = `<table class="table table-sm table-hover mb-0">
        <thead><tr><th>Tipo</th><th>Produto</th><th>Qtd</th><th>Origem</th><th>Data</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    } else if (type === 'orders') {
      title.textContent = `Pedidos — ${data.data?.length || 0} registros`;
      
      const rows = (data.data || []).map(o => `<tr>
        <td>#${o.orderNumber}</td>
        <td>${o.client || '—'}</td>
        <td>${Utils.statusBadge(o.status)}</td>
        <td>${Utils.formatCurrency(o.totalAmount)}</td>
        <td>${Utils.formatDate(o.date)}</td>
      </tr>`).join('');
      content.innerHTML = `<table class="table table-sm table-hover mb-0">
        <thead><tr><th>Nº Pedido</th><th>Cliente</th><th>Status</th><th>Total</th><th>Data</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="3" class="text-end fw-bold">Total geral:</td><td colspan="2" class="fw-bold">${Utils.formatCurrency(summary.totalRevenue)}</td></tr></tfoot>
      </table>`;
    }
  } catch (e) {
    content.innerHTML = `<div class="text-center text-danger py-4">Erro ao carregar: ${e.message}</div>`;
  }
}

window.Reports = { download, preview };
