import { Request, Response } from 'express';

let prontuariosMock = [
    { id: 1, alunoId: 1, profissionalId: 1, data: '2026-11-03', anotacao: 'Sessão focada em leitura silábica. Boa evolução.' },
    { id: 2, alunoId: 2, profissionalId: 2, data: '2026-11-04', anotacao: 'Exercícios de articulação. Criança apresentou resistência inicial.' }
];

export const getProntuarios = (req: Request, res: Response) => {
    // Pode receber o ID do aluno por query param ou params da rota futuramente
    return res.status(200).json(prontuariosMock);
};

export const createProntuario = (req: Request, res: Response) => {
    const novoProntuario = {
        id: prontuariosMock.length + 1,
        ...req.body,
        data: new Date().toISOString().split('T')[0]
    };
    
    prontuariosMock.push(novoProntuario);
    return res.status(201).json({ message: 'Evolução registrada no prontuário', data: novoProntuario });
};