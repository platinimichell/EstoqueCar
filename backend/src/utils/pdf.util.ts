// src/utils/pdf.util.ts
// Geração de relatórios em PDF com PDFKit

import PDFDocument from 'pdfkit';

class PdfUtil {
  private addHeader(doc: PDFKit.PDFDocument, title: string) {
    doc
      .fontSize(20)
      .fillColor('#1a1a2e')
      .text('EstoqueCar', 50, 50)
      .fontSize(12)
      .fillColor('#666')
      .text('Sistema de Gerenciamento de Estoque para Oficinas', 50, 75)
      .moveTo(50, 95).lineTo(545, 95).strokeColor('#e63946').lineWidth(2).stroke()
      .fontSize(16).fillColor('#1a1a2e').text(title, 50, 110)
      .fontSize(10).fillColor('#666').text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 50, 135)
      .moveDown(2);
  }

  generateStockReport(data: { data: any[]; summary: any }): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    this.addHeader(doc, 'Relatório de Estoque Atual');

    // Sumário
    doc
      .fontSize(11).fillColor('#333')
      .text(`Total de Produtos: ${data.summary.totalProducts}`)
      .text(`Valor Total em Estoque: R$ ${data.summary.totalValue.toFixed(2)}`)
      .text(`Produtos com Estoque Crítico: ${data.summary.lowStockCount}`)
      .moveDown();

    // Tabela
    const tableTop = doc.y + 10;
    const colWidths = [70, 160, 80, 55, 55, 75, 55];
    const headers = ['Código', 'Produto', 'Categoria', 'Qtd', 'Mínimo', 'Valor Unit.', 'Status'];

    // Header da tabela
    let x = 50;
    doc.fontSize(9).fillColor('#fff');
    doc.rect(50, tableTop, 495, 20).fill('#1a1a2e');
    headers.forEach((h, i) => {
      doc.fillColor('#fff').text(h, x + 4, tableTop + 6, { width: colWidths[i] - 4 });
      x += colWidths[i];
    });

    // Linhas
    let y = tableTop + 20;
    data.data.forEach((item, idx) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      const bg = idx % 2 === 0 ? '#f8f9fa' : '#ffffff';
      doc.rect(50, y, 495, 18).fill(bg);

      x = 50;
      const row = [item.code, item.name, item.category, item.quantity, item.minQuantity,
        `R$ ${item.unitPrice.toFixed(2)}`, item.status];

      doc.fillColor(item.status === 'CRÍTICO' ? '#e63946' : '#333');
      row.forEach((val, i) => {
        doc.fontSize(8).text(String(val), x + 4, y + 5, { width: colWidths[i] - 4, ellipsis: true });
        x += colWidths[i];
      });

      y += 18;
    });

    doc.end();
    return doc;
  }

  generateMovementsReport(data: { data: any[]; startDate: Date; endDate: Date }): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    this.addHeader(doc, 'Relatório de Movimentações de Estoque');

    doc.fontSize(10).fillColor('#666')
      .text(`Período: ${data.startDate.toLocaleDateString('pt-BR')} a ${data.endDate.toLocaleDateString('pt-BR')}`)
      .moveDown();

    const entries = data.data.filter((m) => m.type === 'ENTRADA').length;
    const exits = data.data.filter((m) => m.type === 'SAÍDA').length;
    doc.fontSize(11).fillColor('#333')
      .text(`Total de Movimentações: ${data.data.length}`)
      .text(`Entradas: ${entries}  |  Saídas: ${exits}`)
      .moveDown();

    // Tabela simplificada
    const tableTop = doc.y + 5;
    doc.rect(50, tableTop, 495, 18).fill('#1a1a2e');
    doc.fontSize(8).fillColor('#fff')
      .text('Data', 54, tableTop + 5)
      .text('Tipo', 130, tableTop + 5)
      .text('Código', 185, tableTop + 5)
      .text('Produto', 240, tableTop + 5)
      .text('Qtd', 390, tableTop + 5)
      .text('Usuário', 420, tableTop + 5);

    let y = tableTop + 18;
    data.data.forEach((item, idx) => {
      if (y > 730) { doc.addPage(); y = 50; }
      doc.rect(50, y, 495, 16).fill(idx % 2 === 0 ? '#f8f9fa' : '#fff');
      doc.fillColor(item.type === 'SAÍDA' ? '#e63946' : '#2d6a4f').fontSize(7)
        .text(new Date(item.date).toLocaleDateString('pt-BR'), 54, y + 5)
        .text(item.type, 130, y + 5)
        .text(item.productCode, 185, y + 5)
        .text(item.productName, 240, y + 5, { width: 145, ellipsis: true })
        .text(String(item.quantity), 390, y + 5)
        .text(item.user, 420, y + 5, { width: 120, ellipsis: true });
      y += 16;
    });

    doc.end();
    return doc;
  }

  generateOrdersReport(data: { data: any[]; startDate: Date; endDate: Date; totalRevenue: number }): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    this.addHeader(doc, 'Relatório de Pedidos');

    doc.fontSize(10).fillColor('#666')
      .text(`Período: ${data.startDate.toLocaleDateString('pt-BR')} a ${data.endDate.toLocaleDateString('pt-BR')}`)
      .moveDown();

    doc.fontSize(11).fillColor('#333')
      .text(`Total de Pedidos: ${data.data.length}`)
      .text(`Receita Total (pedidos concluídos): R$ ${data.totalRevenue.toFixed(2)}`)
      .moveDown();

    const tableTop = doc.y + 5;
    doc.rect(50, tableTop, 495, 18).fill('#1a1a2e');
    doc.fontSize(8).fillColor('#fff')
      .text('Nº Pedido', 54, tableTop + 5)
      .text('Data', 130, tableTop + 5)
      .text('Cliente', 195, tableTop + 5)
      .text('Status', 340, tableTop + 5)
      .text('Total', 420, tableTop + 5);

    let y = tableTop + 18;
    const statusColors: Record<string, string> = {
      COMPLETED: '#2d6a4f', PENDING: '#e9c46a', SEPARATED: '#457b9d', CANCELLED: '#e63946',
    };

    data.data.forEach((item, idx) => {
      if (y > 730) { doc.addPage(); y = 50; }
      doc.rect(50, y, 495, 16).fill(idx % 2 === 0 ? '#f8f9fa' : '#fff');
      doc.fillColor(statusColors[item.status] || '#333').fontSize(7)
        .text(item.orderNumber, 54, y + 5)
        .text(new Date(item.date).toLocaleDateString('pt-BR'), 130, y + 5)
        .text(item.client, 195, y + 5, { width: 140, ellipsis: true })
        .text(item.status, 340, y + 5)
        .text(`R$ ${item.totalAmount.toFixed(2)}`, 420, y + 5);
      y += 16;
    });

    doc.end();
    return doc;
  }
}

export default new PdfUtil();
