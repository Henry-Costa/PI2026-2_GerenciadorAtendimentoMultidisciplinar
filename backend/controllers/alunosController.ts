import { Request, Response } from 'express';
import supabase from '../database';

function formatStudentForFront(row: any) {
    const identifiers = Array.isArray(row.student_identifiers)
        ? row.student_identifiers[0]
        : row.student_identifiers;

    const responsible = Array.isArray(row.financial_responsibles)
        ? row.financial_responsibles[0]
        : row.financial_responsibles;

    const assignments = Array.isArray(row.student_service_assignments)
        ? row.student_service_assignments
        : [];

    return {
        id: row.id,
        name: row.full_name,
        full_name: row.full_name,
        birthDate: row.birth_date,
        birth_date: row.birth_date,
        careStartedAt: row.care_started_at,
        status: row.is_active ? 'Ativo' : 'Inativo',
        is_active: row.is_active,
        cpf: identifiers?.cpf || '',
        rg: identifiers?.rg || '',
        cns: identifiers?.cns || '',
        guardianName: responsible?.full_name || '',
        guardianPhone: responsible?.phone || '',
        guardianEmail: responsible?.email || '',
        responsibleId: responsible?.id || null,
        serviceIds: [...new Set(assignments.map((a: any) => a.service_type_id).filter(Boolean))],
        professionalIds: [...new Set(assignments.map((a: any) => a.professional_id).filter(Boolean))]
    };
}

export const getAlunos = async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                id,
                full_name,
                birth_date,
                care_started_at,
                is_active,
                created_at,
                student_identifiers ( cpf, rg, cns ),
                financial_responsibles ( id, full_name, phone, email ),
                student_service_assignments ( professional_id, service_type_id )
            `)
            .order('full_name', { ascending: true });

        if (error) return res.status(400).json({ error: error.message });

        return res.status(200).json((data || []).map(formatStudentForFront));
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar alunos: ' + err.message });
    }
};

export const getAlunoById = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                student_identifiers (*),
                financial_responsibles (*),
                student_service_assignments (
                    id,
                    is_active,
                    professional_id,
                    service_type_id,
                    profiles:professional_id (id, full_name, specialty),
                    service_types:service_type_id (id, name)
                ),
                student_documents (*)
            `)
            .eq('id', id)
            .single();

        if (error) return res.status(404).json({ error: 'Aluno não encontrado: ' + error.message });

        return res.status(200).json({
            ...formatStudentForFront(data),
            documents: data.student_documents || [],
            assignments: data.student_service_assignments || []
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar perfil do aluno: ' + err.message });
    }
};

export const createAluno = async (req: Request, res: Response): Promise<any> => {
    const body = req.body;

    try {
        const { data: studentData, error: studentError } = await supabase
            .from('students')
            .insert([{
                full_name: body.name || body.nome || body.full_name,
                birth_date: body.birthDate || body.data_nascimento || body.birth_date,
                care_started_at: body.careStartedAt || body.inicio_atendimentos || body.care_started_at || new Date().toISOString().split('T')[0],
                is_active: body.status ? body.status === 'Ativo' : true
            }])
            .select()
            .single();

        if (studentError) return res.status(400).json({ error: studentError.message });

        if (body.cpf) {
            const { error: idError } = await supabase
                .from('student_identifiers')
                .insert([{
                    student_id: studentData.id,
                    cpf: body.cpf,
                    rg: body.rg || null,
                    cns: body.cns || null
                }]);

            if (idError) return res.status(400).json({ error: 'Erro ao gravar documentos: ' + idError.message });
        }

        return res.status(201).json({
            message: 'Aluno registrado com sucesso!',
            data: formatStudentForFront(studentData)
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao cadastrar aluno: ' + err.message });
    }
};

export const updateAluno = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const body = req.body;

    try {
        const { data: studentData, error: studentError } = await supabase
            .from('students')
            .update({
                full_name: body.name || body.nome || body.full_name,
                birth_date: body.birthDate || body.data_nascimento || body.birth_date,
                care_started_at: body.careStartedAt || body.inicio_atendimentos || body.care_started_at,
                is_active: body.status !== undefined ? body.status === 'Ativo' : (body.is_active ?? true)
            })
            .eq('id', id)
            .select()
            .single();

        if (studentError) return res.status(400).json({ error: studentError.message });

        if (body.cpf !== undefined || body.rg !== undefined || body.cns !== undefined) {
            const { error: idError } = await supabase
                .from('student_identifiers')
                .upsert({
                    student_id: id,
                    cpf: body.cpf,
                    rg: body.rg || null,
                    cns: body.cns || null
                }, { onConflict: 'student_id' });

            if (idError) return res.status(400).json({ error: 'Erro ao atualizar identificadores: ' + idError.message });
        }

        return res.status(200).json({
            message: 'Cadastro do aluno atualizado com sucesso!',
            data: formatStudentForFront(studentData)
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao atualizar aluno: ' + err.message });
    }
};

export const deleteAluno = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) return res.status(400).json({ error: 'Não foi possível excluir o aluno: ' + error.message });
        return res.status(200).json({ message: 'Aluno removido com sucesso!' });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao excluir aluno: ' + err.message });
    }
};