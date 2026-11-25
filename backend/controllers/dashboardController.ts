import { Request, Response } from 'express';
import supabase from '../database';

export const getResumoDashboard = async (req: Request, res: Response): Promise<any> => {
    try {
        // Define o início e o fim do mês atual em formato ISO
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
        const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59).toISOString();

        // Executa as 3 contagens em paralelo no Supabase
        const [alunosRes, atendimentosRes, pendentesRes] = await Promise.all([
            supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true),

            supabase
                .from('appointments')
                .select('*', { count: 'exact', head: true })
                .gte('starts_at', inicioMes)
                .lte('starts_at', fimMes)
                .neq('status', 'cancelled'),

            supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
        ]);

        if (alunosRes.error || atendimentosRes.error || pendentesRes.error) {
            return res.status(400).json({
                error: alunosRes.error?.message || atendimentosRes.error?.message || pendentesRes.error?.message
            });
        }

        const metricas = {
            totalAlunosAtivos: alunosRes.count ?? 0,
            atendimentosMes: atendimentosRes.count ?? 0,
            alertasPendentes: pendentesRes.count ?? 0
        };

        return res.status(200).json(metricas);
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao calcular métricas do dashboard: ' + err.message });
    }
};