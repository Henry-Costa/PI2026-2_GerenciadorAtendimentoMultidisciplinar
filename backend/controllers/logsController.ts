import { Request, Response } from 'express';
import supabase from '../database';

export const getLogs = async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                id,
                table_name,
                record_id,
                action,
                old_values,
                new_values,
                created_at,
                profiles:actor_id (
                    full_name,
                    email,
                    role
                )
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar logs de auditoria: ' + err.message });
    }
};