import { Request, Response } from 'express';

export const getResumoDashboard = (req: Request, res: Response) => {
    // Mock agregando métricas para a tela inicial do frontend
    const metricas = {
        totalAlunosAtivos: 42,
        atendimentosMes: 128,
        alertasPendentes: 3
    };
    
    return res.status(200).json(metricas);
};