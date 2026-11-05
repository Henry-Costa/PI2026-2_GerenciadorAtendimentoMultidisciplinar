import { Request, Response } from 'express';

let responsaveisMock = [
    { id: 1, alunoId: 1, nome: 'Ana Silva', vinculo: 'Mãe', telefone: '19999999999', financeiro: true },
    { id: 2, alunoId: 2, nome: 'Marcos Souza', vinculo: 'Pai', telefone: '19888888888', financeiro: true }
];

export const getResponsaveis = (req: Request, res: Response) => {
    return res.status(200).json(responsaveisMock);
};

export const createResponsavel = (req: Request, res: Response) => {
    const novoResponsavel = {
        id: responsaveisMock.length + 1,
        ...req.body
    };
    
    responsaveisMock.push(novoResponsavel);
    return res.status(201).json({ message: 'Responsável cadastrado com sucesso', data: novoResponsavel });
};