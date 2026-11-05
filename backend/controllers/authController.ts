import { Request, Response } from 'express';

export const login = (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Simulação de validação
    if (email === 'admin@espacobianca.com.br' && password === 'senha123') {
        return res.status(200).json({
            message: 'Autenticação bem-sucedida',
            token: 'mock-jwt-token-12345',
            user: { nome: 'Administrador', email }
        });
    }

    return res.status(401).json({ message: 'Credenciais inválidas' });
};