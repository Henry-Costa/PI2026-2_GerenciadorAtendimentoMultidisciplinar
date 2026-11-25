import { Request, Response } from 'express';
import supabase from '../database';

export const getDocumentos = async (req: Request, res: Response): Promise<any> => {
    try {
        const { data, error } = await supabase
            .from('student_documents')
            .select(`
                id,
                student_id,
                kind,
                title,
                storage_path,
                mime_type,
                file_size_bytes,
                notes,
                created_at,
                students (
                    full_name
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar documentos: ' + err.message });
    }
};

export const createDocumento = async (req: Request, res: Response): Promise<any> => {
    const novoDoc = req.body;

    // Mapeia termos em português (caso enviados pelo front-end) para o enum do banco
    const mapaTipos: Record<string, string> = {
        'Contrato': 'contract',
        'Laudo Médico': 'medical_report',
        'Documento de Identidade': 'identity_document',
        'Outro': 'other'
    };

    const tipoFormatado = mapaTipos[novoDoc.tipo] || novoDoc.kind || 'other';

    try {
        const { data, error } = await supabase
            .from('student_documents')
            .insert([
                {
                    student_id: novoDoc.student_id || novoDoc.alunoId,
                    kind: tipoFormatado,
                    title: novoDoc.titulo || novoDoc.title || novoDoc.nomeArquivo,
                    storage_path: novoDoc.storage_path || `manual/${novoDoc.nomeArquivo || 'documento.pdf'}`,
                    mime_type: novoDoc.mime_type || 'application/pdf',
                    file_size_bytes: novoDoc.file_size_bytes || null,
                    notes: novoDoc.observacoes || novoDoc.notes || null,
                    uploaded_by: novoDoc.uploaded_by || null
                }
            ])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        return res.status(201).json({ message: 'Documento registrado com sucesso!', data });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao registrar documento: ' + err.message });
    }
};