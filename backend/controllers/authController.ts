import { Request, Response } from 'express';
import supabase from '../database';

export const login = async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }

    try {
        // Autentica o usuário diretamente no Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({ message: 'Credenciais inválidas', error: error.message });
        }

        // Retorna o token de acesso (JWT real gerado pelo Supabase) e os dados do usuário
        return res.status(200).json({
            message: 'Autenticação bem-sucedida',
            token: data.session?.access_token,
            user: {
                id: data.user?.id,
                email: data.user?.email
            }
        });
    } catch (err: any) {
        return res.status(500).json({ message: 'Erro interno no servidor', error: err.message });
    }
};