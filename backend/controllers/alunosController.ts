import { Request, Response } from 'express';

export const getAlunos = (req: Request, res: Response) => {
    // Retorno de dados simulados para o frontend
    const alunosMock = [
        { id: 1, nome: 'João Silva', idade: 8, status: 'Em acompanhamento' },
        { id: 2, nome: 'Maria Souza', idade: 10, status: 'Em acompanhamento' }
    ];
    
    return res.status(200).json(alunosMock);
};

export const createAluno = (req: Request, res: Response) => {
    const novoAluno = req.body;
    // Aqui entrará a lógica de inserção no banco de dados posteriormente
    return res.status(201).json({ message: 'Aluno registado com sucesso', data: novoAluno });
};