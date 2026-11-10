import { Request, Response } from 'express';
import supabase from '../database';

export const getAlunos = async (req: Request, res: Response): Promise<any> => {
    try {
        // Busca todos os alunos juntamente com seus identificadores usando o recurso de join do Supabase
        const { data, error } = await supabase
            .from('students')
            .select(`
                id,
                full_name,
                birth_date,
                care_started_at,
                created_at,
                student_identifiers (
                    cpf,
                    rg,
                    cns
                )
            `);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar alunos: ' + err.message });
    }
};

export const createAluno = async (req: Request, res: Response): Promise<any> => {
    const novoAluno = req.body;
    
    // Passo 1: Inserir usando os nomes exatos das colunas do banco
    const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert([
            {
                full_name: novoAluno.nome,
                birth_date: novoAluno.data_nascimento,
                care_started_at: novoAluno.inicio_atendimentos
            }
        ])
        .select()
        .single(); 

    if (studentError) {
        return res.status(400).json({ error: studentError.message });
    }

    // Passo 2: Inserir os identificadores
    const { error: identifierError } = await supabase
        .from('student_identifiers')
        .insert([
            {
                student_id: studentData.id,
                cpf: novoAluno.cpf,
                rg: novoAluno.rg
            }
        ]);

    if (identifierError) {
        return res.status(400).json({ error: "Erro ao gravar documentos: " + identifierError.message });
    }

    return res.status(201).json({ message: 'Aluno registrado com sucesso!', data: studentData });
};