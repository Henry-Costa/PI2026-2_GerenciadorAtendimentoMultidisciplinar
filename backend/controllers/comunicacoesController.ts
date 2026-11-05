import { Request, Response } from 'express';

let comunicacoesMock = [
    { id: 1, titulo: 'Recesso de Fim de Ano', mensagem: 'Informamos que entraremos em recesso no dia 20/12.', publico: 'Todos' },
    { id: 2, titulo: 'Reunião de Pais', mensagem: 'Lembrete: Reunião bimestral nesta sexta-feira.', publico: 'Responsáveis' }
];

export const getComunicacoes = (req: Request, res: Response) => {
    return res.status(200).json(comunicacoesMock);
};

export const createComunicacao = (req: Request, res: Response) => {
    const novaComunicacao = {
        id: comunicacoesMock.length + 1,
        ...req.body
    };
    
    comunicacoesMock.push(novaComunicacao);
    return res.status(201).json({ message: 'Comunicado enviado', data: novaComunicacao });
};