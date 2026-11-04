import { Request, Response } from 'express';

let documentosMock = [
    { id: 1, alunoId: 1, tipo: 'Contrato', nomeArquivo: 'contrato_joao.pdf', status: 'Assinado' },
    { id: 2, alunoId: 2, tipo: 'Laudo Médico', nomeArquivo: 'laudo_fono_maria.pdf', status: 'Anexado' }
];

export const getDocumentos = (req: Request, res: Response) => {
    return res.status(200).json(documentosMock);
};

export const createDocumento = (req: Request, res: Response) => {
    // Futuramente aqui entrará a lógica de upload de arquivos (Multer, Supabase Storage, etc.)
    const novoDocumento = {
        id: documentosMock.length + 1,
        ...req.body
    };
    
    documentosMock.push(novoDocumento);
    return res.status(201).json({ message: 'Documento salvo com sucesso', data: novoDocumento });
};