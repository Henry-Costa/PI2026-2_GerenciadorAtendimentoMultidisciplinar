import { Request, Response } from 'express';
import supabase from '../database';

export const getAtendimentos = async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                id,
                assignment_id,
                starts_at,
                ends_at,
                charged_amount,
                status,
                reminder_recipient,
                created_by
            `);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar atendimentos: ' + err.message });
    }
};

export const createAtendimento = async (req: Request, res: Response): Promise<any> => {
    const novoAtendimento = req.body;

    try {
        // Insere o agendamento na tabela 'appointments' respeitando o esquema do banco
        const { data, error } = await supabase
            .from('appointments')
            .insert([
                {
                    assignment_id: novoAtendimento.assignment_id,
                    starts_at: novoAtendimento.starts_at,
                    ends_at: novoAtendimento.ends_at,
                    charged_amount: novoAtendimento.charged_amount,
                    status: novoAtendimento.status || 'scheduled',
                    reminder_recipient: novoAtendimento.reminder_recipient,
                    created_by: novoAtendimento.created_by
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(201).json({ message: 'Atendimento marcado com sucesso!', data });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao criar atendimento: ' + err.message });
    }
};