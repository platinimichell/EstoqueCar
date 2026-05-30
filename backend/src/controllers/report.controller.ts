// src/controllers/report.controller.ts

import { Request, Response, NextFunction } from 'express';
import reportService, { ReportFormat } from '../services/report.service';

export class ReportController {
  async stock(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as ReportFormat) || 'json';
      const result = await reportService.getStockReport(format);

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-estoque.pdf"');
        /*(result as Buffer).pipe(res);*/
        (result as any).pipe(res);
        //res.send(result as Buffer);
        return;
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-estoque.xlsx"');
        res.send(result as Buffer);
        return;
      }

      res.json(result);
    } catch (err) { next(err); }
  }

  async movements(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as ReportFormat) || 'json';
      const startDate = new Date((req.query.startDate as string) || new Date(new Date().setDate(1)));
      const endDate = new Date((req.query.endDate as string) || new Date());

      const result = await reportService.getMovementsReport(startDate, endDate, format);

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-movimentacoes.pdf"');
        /*(result as any).pipe(res);*/
        (result as any).pipe(res);
        //res.send(result as Buffer);
        return;
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-movimentacoes.xlsx"');
        res.send(result as Buffer);
        return;
      }

      res.json(result);
    } catch (err) { next(err); }
  }

  async orders(req: Request, res: Response, next: NextFunction) {
    try {
      const format = (req.query.format as ReportFormat) || 'json';
      /*
      const startDate = new Date((req.query.startDate as string) || new Date(new Date().setDate(1)));
      const endDate = new Date((req.query.endDate as string) || new Date());
      */

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().setDate(1));

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      endDate.setHours(23, 59, 59, 999);
      const result = await reportService.getOrdersReport(startDate, endDate, format);

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-pedidos.pdf"');
        (result as any).pipe(res);
        return;
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="relatorio-pedidos.xlsx"');
        res.send(result as Buffer);
        return;
      }

      res.json(result);
    } catch (err) { next(err); }
  }
}

export default new ReportController();
