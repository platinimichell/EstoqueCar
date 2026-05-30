// ===========================
// dashboard.js
// ===========================
import { api } from './api.js';
import { Utils } from './utils.js';
import { requireAuth, initUserUI } from './auth.js';

requireAuth();
initUserUI();

let salesChart = null;
let categoryChart = null;

/*
async function loadKPIs() {
  try {
    const [stockData, ordersData, lowData] = await Promise.all([
      api.get('/reports/stock?format=json'),
      api.get('/reports/orders?format=json'),
      api.get('/stock/low')
    ]);

    document.getElementById('kpiTotal').textContent = stockData.totalProducts ?? '—';
    document.getElementById('kpiValue').textContent = Utils.formatCurrency(stockData.totalValue);
    document.getElementById('kpiLow').textContent = lowData.length ?? '—';
    document.getElementById('kpiOrders').textContent = ordersData.orders?.filter(o => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length ?? '—';
  } catch (e) {
    Utils.showToast('Erro ao carregar KPIs', 'error');
  }
}
*/

/*
async function loadKPIs() {
  try {
    const [totalProducts, totalValue, ordersData, lowData] = await Promise.all([
      api.get('/reports/stock?format=json'),
      api.get('/reports/stock/sumary'),
      api.get('/reports/orders?format=json'),
      api.get('/stock/low')
      //api.get('/reports/stock?format=json'),
      //api.get('/reports/orders?format=json'),
      //api.get('/stock/low')
    ]);

    // Total de produtos
    document.getElementById('kpiTotal').textContent =
      totalProducts.totalProducts ?? '0';

      document.getElementById('kpiValue').textContent =
      totalValue.formatCurrency(totalValue.totalValue ?? 0)
    // Valor em estoque
    //document.getElementById('kpiValue').textContent =
      //Utils.formatCurrency(stockData.totalValue || 0);

    // Estoque crítico
    document.getElementById('kpiLow').textContent =
      lowStockCount.length ?? '0';

    // Pedidos pendentes
    const pendingOrders = (ordersData.orders || []).filter(
      o => o.status === 'PENDING'
    );

    document.getElementById('kpiOrders').textContent =
      pendingOrders.length;

  } catch (e) {
    console.error(e);
    Utils.showToast('Erro ao carregar KPIs', 'error');
  }
}
*/

async function loadKPIs() {
  try {
    const [stockData, ordersData] = await Promise.all([
      api.get('/reports/stock?format=json'),
      api.get('/reports/orders?format=json')
    ]);

    //console.log(stockData);
    //console.log('ordersData:', ordersData);

    const summary = stockData.summary || {};

    // Total de produtos
    document.getElementById('kpiTotal').textContent =
      summary.totalProducts ?? 0;

    // Valor em estoque
    document.getElementById('kpiValue').textContent =
      Utils.formatCurrency(summary.totalValue || 0);

    // Estoque crítico
    document.getElementById('kpiLow').textContent =
      summary.lowStockCount ?? 0;

    // Pedidos pendentes
    const pendingOrders = (ordersData.data || []).filter(
      o => o.status === "PENDING"
    );

    document.getElementById('kpiOrders').textContent =
      pendingOrders.length;

  } catch (e) {
    console.error('Erro KPIs:', e);
    Utils.showToast('Erro ao carregar KPIs', 'error');
  }
}

async function loadLowStockTable() {
  try {
    const items = await api.get('/stock/low');
    const tbody = document.getElementById('lowStockTable');
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Nenhum item crítico</td></tr>';
      return;
    }
    tbody.innerHTML = items.slice(0, 10).map(p => `
      <tr>
        <td>${p.code}</td>
        <td>${p.name}</td>
        <td>${p.category.name}</td>
        <td><span class="badge bg-danger">${p.quantity}</span></td>
        <td>${p.minQuantity}</td>
      </tr>`).join('');

  } catch (e) {
    console.error(e);
  }
}



async function loadCharts() {
  try {
    const movData = await api.get('/reports/movements?format=json');
    const movements = movData.data || [];

    // Montar dados dos últimos 7 dias
    const days = [];
    const entries = [];
    const exits = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      days.push(label);

      ;

      const dayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      
      const ent = movements.filter( m => m.type === 'ENTRADA' && m.date?.startsWith(dayStr))
      .reduce((acc, m) => acc + Number(m.quantity || 0), 0);

      const ext = movements.filter(m => m.type === 'SAÍDA' && m.date?.startsWith(dayStr))
      .reduce((acc, m) => acc + Number(m.quantity || 0), 0);

      entries.push(ent);

      exits.push(ext);
    }

    const ctx1 = document.getElementById('chartMovements')?.getContext('2d');

    if (ctx1) {
      if (salesChart) salesChart.destroy();
      salesChart = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: days,
          datasets: [
            { label: 'Entradas', data: entries, borderColor: '#2e7d32', backgroundColor: 'rgba(46,125,50,.1)', tension: .4, fill: true },
            { label: 'Saídas', data: exits, borderColor: '#c62828', backgroundColor: 'rgba(198,40,40,.1)', tension: .4, fill: true }
          ]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
      });
    }

    // Gráfico por categoria

    const stockData = await api.get('/reports/stock?format=json');
    const categories = {};

    // Agrupa quantidade por categoria
    (stockData.data || []).forEach(p => {
      const categoryName = p.category || 'Sem Categoria';

      categories[categoryName] = (categories[categoryName] || 0) + p.quantity;
    });

    // Total geral para cálculo das porcentagens
    const total = Object.values(categories)
      .reduce((sum, qty) => sum + qty, 0);

    const labels = Object.keys(categories);
    const values = Object.values(categories);

    const ctx2 = document.getElementById('chartCategory')?.getContext('2d');

    if (ctx2) {
      if (categoryChart) {
        categoryChart.destroy();
      }
      
      categoryChart = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: [
              '#1565c0',
              '#2e7d32',
              '#e65100',
              '#6a1b9a',
              '#00838f',
              '#ad1457',
              '#f57f17'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                generateLabels(chart) {
                  const data = chart.data.datasets[0].data;
                  const total = data.reduce((a, b) => a + b, 0);

                  return chart.data.labels.map((label, index) => {
                    const value = data[index];
                    const percent = ((value / total) * 100).toFixed(1);

                    return {
                      text: `${label} (${percent}%)`,
                      fillStyle: chart.data.datasets[0].backgroundColor[index],
                      hidden: false,
                      index
                    };
                  });
                }
              }
            },
            tooltip: {
              callbacks: {
                label(context) {
                  const value = context.raw;
                  const percent = ((value / total) * 100).toFixed(1);

                  return `${context.label}: ${value} unidades (${percent}%)`;
                }
              }
            }
          }
        }
      });
    }

  } catch (e) {
    console.error('Erro ao carregar charts', e);
  }
}

// Inicializar

(async () => {
  await Promise.all([
    loadKPIs(),
    loadLowStockTable(),
    loadCharts()
  ]);
})();