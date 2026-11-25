import { Request, Response } from 'express';
import supabase from '../database';

function formatProfessionalForFront(row: any) {
    const links = Array.isArray(row.professional_service_types)
        ? row.professional_service_types
        : [];

    return {
        id: row.id,
        name: row.full_name,
        full_name: row.full_name,
        email: row.email,
        phone: row.phone || '',
        role: row.specialty || 'Profissional',
        specialty: row.specialty || '',
        accessRole: row.role,
        status: row.is_active ? 'Ativo' : 'Inativo',
        is_active: row.is_active,
        serviceIds: links.map((l: any) => l.service_types?.id || l.service_type_id).filter(Boolean),
        services: links.map((l: any) => l.service_types?.name).filter(Boolean)
    };
}

export const getEquipe = async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id,
                full_name,
                email,
                phone,
                specialty,
                role,
                is_active,
                professional_service_types (
                    service_type_id,
                    service_types ( id, name )
                )
            `)
            .order('full_name', { ascending: true });

        if (error) return res.status(400).json({ error: error.message });

        return res.status(200).json((data || []).map(formatProfessionalForFront));
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar equipe: ' + err.message });
    }
};

export const createMembroEquipe = async (req: Request, res: Response): Promise<any> => {
    const body = req.body;
    const email = body.email;
    const password = body.password || body.senha || 'SenhaTemporaria@123';

    try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError || !authData.user) {
            return res.status(400).json({ error: authError?.message || 'Erro ao criar credencial.' });
        }

        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .insert([{
                id: authData.user.id,
                full_name: body.name || body.nome || body.full_name,
                email,
                phone: body.phone || body.telefone || null,
                specialty: body.specialty || body.role || body.especialidade || null,
                role: body.accessRole === 'admin' ? 'admin' : 'user',
                is_active: true
            }])
            .select()
            .single();

        if (profileError) return res.status(400).json({ error: profileError.message });

        const serviceIds: string[] = body.serviceIds || (body.service_type_id ? [body.service_type_id] : []);
        if (serviceIds.length > 0) {
            await supabase
                .from('professional_service_types')
                .insert(serviceIds.map((sid) => ({
                    professional_id: authData.user.id,
                    service_type_id: sid
                })));
        }

        return res.status(201).json({
            message: 'Profissional adicionado com sucesso!',
            data: formatProfessionalForFront(profileData)
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao cadastrar profissional: ' + err.message });
    }
};