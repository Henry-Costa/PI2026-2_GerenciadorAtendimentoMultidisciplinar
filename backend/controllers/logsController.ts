import { Request, Response } from 'express';

export const getLogs = (req: Request, res: Response) => {
    // Mock do histórico de ações
    const logsMock = [
        { id: 1, usuario: 'Bianca (Admin)', acao: 'Excluiu agendamento', data: '2026-11-04T14:30:00Z' },
        { id: 2, usuario: 'Carlos (Fono)', acao: 'Preencheu prontuário', data: '2026-11-04T15:00:00Z' }
    ];
    
    return res.status(200).json(logsMock);
};