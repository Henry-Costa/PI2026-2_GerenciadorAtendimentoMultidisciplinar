import { Request, Response } from 'express';
import supabase from '../database';

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
                hourly_rate
            `);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar responsáveis: ' + err.message });
    }
};

export const createResponsavel = async (req: Request, res: Response): Promise<any> => {
    const novoResponsavel = req.body;

    try {
        const { data, error } = await supabase
            .from('financial_responsibles')
            .insert([
                {
                    student_id: novoResponsavel.student_id || novoResponsavel.alunoId,
                    full_name: novoResponsavel.nome || novoResponsavel.full_name,
                    cpf: novoResponsavel.cpf,
                    phone: novoResponsavel.telefone || novoResponsavel.phone,
                    email: novoResponsavel.email,
                    marital_status: novoResponsavel.estado_civil || novoResponsavel.marital_status,
                    place_of_birth: novoResponsavel.naturalidade || novoResponsavel.place_of_birth,
                    occupation: novoResponsavel.ocupacao || novoResponsavel.occupation,
                    income_amount: novoResponsavel.remuneracao || novoResponsavel.income_amount,
                    hourly_rate: novoResponsavel.valor_hora || novoResponsavel.hourly_rate
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(201).json({ message: 'Responsável cadastrado com sucesso!', data });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao criar responsável: ' + err.message });
    }
};