import { Request, Response } from 'express';

export const getEquipe = (req: Request, res: Response) => {
    // Mock simulando o retorno do banco de dados
    const equipeMock = [
        { id: 1, nome: 'Bianca Petenão', especialidade: 'Psicopedagoga', registro: '12345' },
        { id: 2, nome: 'Carlos Mendes', especialidade: 'Fonoaudiólogo', registro: '67890' }
    ];
    return res.status(200).json(equipeMock);
};

export const createMembroEquipe = (req: Request, res: Response) => {
    const novoMembro = req.body;
    return res.status(201).json({ message: 'Profissional adicionado com sucesso', data: novoMembro });
};