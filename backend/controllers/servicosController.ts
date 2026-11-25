import { Request, Response } from 'express';
import supabase from '../database';

function formatServiceForFront(row: any) {
    return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        duration: row.default_duration_minutes,
        default_duration_minutes: row.default_duration_minutes,
        status: row.is_active ? 'Ativo' : 'Inativo',
        is_active: row.is_active
    };
}

export const getServicos = async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabase
            .from('service_types')
            .select('*')
            .order('name', { ascending: true });

        if (error) return res.status(400).json({ error: error.message });

        return res.status(200).json((data || []).map(formatServiceForFront));
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar serviços: ' + err.message });
    }
};

export const createServico = async (req: Request, res: Response): Promise<any> => {
    const body = req.body;

    try {
        const { data, error } = await supabase
            .from('service_types')
            .insert([{
                name: body.name || body.nome,
                description: body.description || body.descricao || null,
                default_duration_minutes: Number(body.duration || body.duracao || body.default_duration_minutes) || 50,
                is_active: true
            }])
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });

        return res.status(201).json({
            message: 'Serviço cadastrado com sucesso!',
            data: formatServiceForFront(data)
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao cadastrar serviço: ' + err.message });
    }
};