import { Request, Response } from 'express';

export const getAtendimentos = (req: Request, res: Response) => {
    const atendimentosMock = [
        { id: 1, alunoId: 1, profissionalId: 1, dataHora: '2026-11-10T14:00:00Z', status: 'Agendado' },
        { id: 2, alunoId: 2, profissionalId: 2, dataHora: '2026-11-10T15:30:00Z', status: 'Realizado' }
    ];
    return res.status(200).json(atendimentosMock);
};

export const createAtendimento = (req: Request, res: Response) => {
    const novoAtendimento = req.body;
    return res.status(201).json({ message: 'Atendimento marcado com sucesso', data: novoAtendimento });
};