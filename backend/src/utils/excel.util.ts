// src/utils/excel.util.ts
// Geração de relatórios em Excel com ExcelJS

import ExcelJS from 'exceljs';

const BRAND_COLOR = '1a1a2e';
const ACCENT_COLOR = 'e63946';

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + BRAND_COLOR } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF' + ACCENT_COLOR } } };
  });
}

class ExcelUtil {
  async generateStockReport(data: { data: any[]; summary: any }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EstoqueCar';

    const sheet = workbook.addWorksheet('Estoque Atual', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    // Título
    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'EstoqueCar — Relatório de Estoque Atual';
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF' + BRAND_COLOR } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.getCell('A2').value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    sheet.getCell('A2').font = { size: 9, color: { argb: 'FF888888' } };
    sheet.getCell('A3').value = `Total: ${data.summary.totalProducts} produtos | Valor total: R$ ${data.summary.totalValue.toFixed(2)} | Críticos: ${data.summary.lowStockCount}`;
    sheet.getCell('A3').font = { size: 10 };

    // Header
    const headerRow = sheet.addRow(['Código', 'Produto', 'Categoria', 'Quantidade', 'Mínimo', 'Preço Unitário', 'Valor Total', 'Status']);
    applyHeaderStyle(headerRow);
    sheet.columns = [
      { key: 'code', width: 14 },
      { key: 'name', width: 30 },
      { key: 'category', width: 20 },
      { key: 'quantity', width: 12 },
      { key: 'minQuantity', width: 10 },
      { key: 'unitPrice', width: 15 },
      { key: 'totalValue', width: 15 },
      { key: 'status', width: 10 },
    ];

    data.data.forEach((item, idx) => {
      const row = sheet.addRow([
        item.code, item.name, item.category, item.quantity, item.minQuantity,
        item.unitPrice, item.totalValue, item.status,
      ]);

      row.getCell(6).numFmt = 'R$ #,##0.00';
      row.getCell(7).numFmt = 'R$ #,##0.00';

      if (item.status === 'CRÍTICO') {
        row.getCell(8).font = { color: { argb: 'FF' + ACCENT_COLOR }, bold: true };
        row.getCell(4).font = { color: { argb: 'FF' + ACCENT_COLOR } };
      }

      if (idx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        });
      }
    });

    /*sheet.autoFilter = { from: 'A4', to: 'H4' };

    return workbook.xlsx.writeBuffer() as Promise<Buffer>;*/

    sheet.autoFilter = { from: 'A4', to: 'H4' };
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);

  }

  async generateMovementsReport(data: { data: any[]; startDate: Date; endDate: Date }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Movimentações');

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'EstoqueCar — Relatório de Movimentações de Estoque';
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF' + BRAND_COLOR } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getCell('A2').value = `Período: ${data.startDate.toLocaleDateString('pt-BR')} a ${data.endDate.toLocaleDateString('pt-BR')}`;

    const headerRow = sheet.addRow(['Data', 'Tipo', 'Código', 'Produto', 'Quantidade', 'Usuário', 'Observações']);
    applyHeaderStyle(headerRow);

    sheet.columns = [
      { width: 14 }, { width: 10 }, { width: 14 }, { width: 30 },
      { width: 12 }, { width: 20 }, { width: 30 },
    ];

    data.data.forEach((item, idx) => {
      const row = sheet.addRow([
        new Date(item.date).toLocaleDateString('pt-BR'),
        item.type, item.productCode, item.productName,
        item.quantity, item.user, item.notes,
      ]);

      if (item.type === 'SAÍDA') {
        row.getCell(2).font = { color: { argb: 'FF' + ACCENT_COLOR }, bold: true };
      } else {
        row.getCell(2).font = { color: { argb: 'FF2d6a4f' }, bold: true };
      }

      if (idx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        });
      }
    });

    /*return workbook.xlsx.writeBuffer() as Promise<Buffer>;*/
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async generateOrdersReport(data: { data: any[]; startDate: Date; endDate: Date; totalRevenue: number }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Pedidos');

    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = 'EstoqueCar — Relatório de Pedidos';
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF' + BRAND_COLOR } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getCell('A2').value = `Período: ${data.startDate.toLocaleDateString('pt-BR')} a ${data.endDate.toLocaleDateString('pt-BR')} | Receita Total: R$ ${data.totalRevenue.toFixed(2)}`;

    const headerRow = sheet.addRow(['Nº Pedido', 'Data', 'Cliente', 'Status', 'Total (R$)', 'Criado por']);
    applyHeaderStyle(headerRow);
    sheet.columns = [{ width: 16 }, { width: 14 }, { width: 30 }, { width: 14 }, { width: 14 }, { width: 20 }];

    data.data.forEach((item, idx) => {
      const row = sheet.addRow([
        item.orderNumber,
        new Date(item.date).toLocaleDateString('pt-BR'),
        item.client, item.status, item.totalAmount, item.createdBy,
      ]);
      row.getCell(5).numFmt = 'R$ #,##0.00';
      if (idx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
        });
      }
    });

    /*return workbook.xlsx.writeBuffer() as Promise<Buffer>;*/
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

export default new ExcelUtil();
