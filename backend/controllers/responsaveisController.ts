import { Request, Response } from 'express';
import supabase from '../database';

function formatResponsibleForFront(row: any) {
    return {
        id: row.id,
        patientId: row.student_id,
        student_id: row.student_id,
        patientName: row.students?.full_name || '',
        name: row.full_name,
        full_name: row.full_name,
        cpf: row.cpf,
        phone: row.phone,
        email: row.email,
        maritalStatus: row.marital_status || '',
        placeOfBirth: row.place_of_birth || '',
        occupation: row.occupation || '',
        incomeAmount: row.income_amount,
        hourlyRate: row.hourly_rate
    };
}

export const getResponsaveis = async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabase
            .from('financial_responsibles')
            .select(`
                id,
                student_id,
                full_name,
                cpf,
                phone,
                email,
                marital_status,
                place_of_birth,
                occupation,
                income_amount,
                hourly_rate,
                students ( full_name )
            `)
            .order('full_name', { ascending: true });

        if (error) return res.status(400).json({ error: error.message });

        return res.status(200).json((data || []).map(formatResponsibleForFront));
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar responsáveis: ' + err.message });
    }
};

export const getResponsavelById = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    try {
        const { data, error } = await supabase
            .from('financial_responsibles')
            .select(`*, students ( id, full_name )`)
            .eq('id', id)
            .single();

        if (error) return res.status(404).json({ error: 'Responsável não encontrado: ' + error.message });

        return res.status(200).json(formatResponsibleForFront(data));
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar responsável: ' + err.message });
    }
};

export const createResponsavel = async (req: Request, res: Response): Promise<any> => {
    const body = req.body;
    try {
        const { data, error } = await supabase
            .from('financial_responsibles')
            .insert([{
                student_id: body.patientId || body.student_id || body.alunoId,
                full_name: body.name || body.nome || body.full_name,
                cpf: body.cpf,
                phone: body.phone || body.telefone,
                email: body.email,
                marital_status: body.maritalStatus || body.estado_civil || body.marital_status || null,
                place_of_birth: body.placeOfBirth || body.naturalidade || body.place_of_birth || null,
                occupation: body.occupation || body.ocupacao || null,
                income_amount: body.incomeAmount ?? body.remuneracao ?? body.income_amount ?? null,
                hourly_rate: body.hourlyRate ?? body.valor_hora ?? body.hourly_rate ?? null
            }])
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });

        return res.status(201).json({
            message: 'Responsável cadastrado com sucesso!',
            data: formatResponsibleForFront(data)
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao criar responsável: ' + err.message });
    }
};

export const updateResponsavel = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const body = req.body;
    try {
        const { data, error } = await supabase
            .from('financial_responsibles')
            .update({
                student_id: body.patientId || body.student_id || body.alunoId,
                full_name: body.name || body.nome || body.full_name,
                cpf: body.cpf,
                phone: body.phone || body.telefone,
                email: body.email,
                marital_status: body.maritalStatus || body.estado_civil || body.marital_status,
                place_of_birth: body.placeOfBirth || body.naturalidade || body.place_of_birth,
                occupation: body.occupation || body.ocupacao,
                income_amount: body.incomeAmount ?? body.remuneracao ?? body.income_amount,
                hourly_rate: body.hourlyRate ?? body.valor_hora ?? body.hourly_rate
            })
            .eq('id', id)
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });

        return res.status(200).json({
            message: 'Responsável atualizado com sucesso!',
            data: formatResponsibleForFront(data)
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao atualizar responsável: ' + err.message });
    }
};

export const deleteResponsavel = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('financial_responsibles').delete().eq('id', id);
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ message: 'Responsável excluído com sucesso!' });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao excluir responsável: ' + err.message });
    }
};