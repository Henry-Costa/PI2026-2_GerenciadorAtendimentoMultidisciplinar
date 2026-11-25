import { Request, Response } from 'express';
import supabase from '../database';

const statusToFront: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    completed: 'Realizado',
    cancelled: 'Cancelado'
};

const statusToDb: Record<string, string> = {
    Agendado: 'scheduled',
    Confirmado: 'confirmed',
    Realizado: 'completed',
    Cancelado: 'cancelled',
    scheduled: 'scheduled',
    confirmed: 'confirmed',
    completed: 'completed',
    cancelled: 'cancelled'
};

const attendanceToFront: Record<string, string> = {
    pending: 'Pendente',
    present: 'Presente',
    absent: 'Falta',
    justified_absence: 'Falta Justificada'
};

const attendanceToDb: Record<string, string> = {
    Pendente: 'pending',
    Presente: 'present',
    Falta: 'absent',
    'Falta Justificada': 'justified_absence',
    pending: 'pending',
    present: 'present',
    absent: 'absent',
    justified_absence: 'justified_absence'
};

function formatAppointmentForFront(row: any) {
    const start = new Date(row.starts_at);
    const end = new Date(row.ends_at);
    const durationMinutes = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));

    // Extrai data (YYYY-MM-DD) e hora (HH:mm) no fuso local/ISO
    const date = start.toISOString().split('T')[0];
    const time = start.toTimeString().slice(0, 5);

    const assignment = Array.isArray(row.student_service_assignments)
        ? row.student_service_assignments[0]
        : row.student_service_assignments;

    const att = Array.isArray(row.attendance) ? row.attendance[0] : row.attendance;

    return {
        id: row.id,
        assignmentId: row.assignment_id,
        patientId: assignment?.student_id || null,
        patientName: assignment?.students?.full_name || '',
        professionalId: assignment?.professional_id || null,
        professionalName: assignment?.profiles?.full_name || '',
        serviceId: assignment?.service_type_id || null,
        serviceName: assignment?.service_types?.name || '',
        date,
        time,
        duration: durationMinutes,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        status: statusToFront[row.status] || row.status,
        attendanceStatus: att ? (attendanceToFront[att.status] || att.status) : 'Pendente',
        chargedAmount: row.charged_amount,
        notes: att?.notes || ''
    };
}

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
                student_service_assignments (
                    student_id,
                    professional_id,
                    service_type_id,
                    students ( full_name ),
                    profiles ( full_name ),
                    service_types ( name )
                ),
                attendance (
                    id,
                    status,
                    recorded_at,
                    notes
                )
            `)
            .order('starts_at', { ascending: true });

        if (error) return res.status(400).json({ error: error.message });

        const mapped = (data || []).map(formatAppointmentForFront);
        return res.status(200).json(mapped);
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao buscar atendimentos: ' + err.message });
    }
};

export const createAtendimento = async (req: Request, res: Response): Promise<any> => {
    const body = req.body;

    try {
        // 1. Resolve o assignment_id a partir de patientId + professionalId + serviceId caso não venha pronto
        let assignmentId = body.assignment_id || body.assignmentId;

        if (!assignmentId && body.patientId && body.professionalId && body.serviceId) {
            const { data: existingAssign } = await supabase
                .from('student_service_assignments')
                .select('id')
                .eq('student_id', body.patientId)
                .eq('professional_id', body.professionalId)
                .eq('service_type_id', body.serviceId)
                .maybeSingle();

            if (existingAssign) {
                assignmentId = existingAssign.id;
            } else {
                const { data: newAssign, error: assignErr } = await supabase
                    .from('student_service_assignments')
                    .insert([{
                        student_id: body.patientId,
                        professional_id: body.professionalId,
                        service_type_id: body.serviceId,
                        is_active: true
                    }])
                    .select('id')
                    .single();

                if (assignErr) return res.status(400).json({ error: 'Erro ao vincular aluno/profissional: ' + assignErr.message });
                assignmentId = newAssign.id;
            }
        }

        // 2. Calcula starts_at e ends_at a partir de date + time + duration caso venham no formato do front
        let startsAt = body.starts_at;
        let endsAt = body.ends_at;

        if (!startsAt && body.date && body.time) {
            const startObj = new Date(`${body.date}T${body.time}:00`);
            const durationMin = Number(body.duration) || 50;
            const endObj = new Date(startObj.getTime() + durationMin * 60000);
            startsAt = startObj.toISOString();
            endsAt = endObj.toISOString();
        }

        const { data, error } = await supabase
            .from('appointments')
            .insert([{
                assignment_id: assignmentId,
                starts_at: startsAt,
                ends_at: endsAt,
                charged_amount: body.charged_amount ?? body.chargedAmount ?? 0,
                status: statusToDb[body.status] || 'scheduled',
                reminder_recipient: body.reminder_recipient || null,
                created_by: body.created_by || null
            }])
            .select(`
                *,
                student_service_assignments (
                    student_id,
                    professional_id,
                    service_type_id,
                    students ( full_name ),
                    profiles ( full_name ),
                    service_types ( name )
                ),
                attendance ( id, status, recorded_at, notes )
            `)
            .single();

        if (error) return res.status(400).json({ error: error.message });

        return res.status(201).json({
            message: 'Atendimento marcado com sucesso!',
            data: formatAppointmentForFront(data)
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao criar atendimento: ' + err.message });
    }
};

export const updateAtendimento = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    const body = req.body;

    try {
        const camposAtualizar: Record<string, any> = {};

        if (body.date && body.time) {
            const startObj = new Date(`${body.date}T${body.time}:00`);
            const durationMin = Number(body.duration) || 50;
            camposAtualizar.starts_at = startObj.toISOString();
            camposAtualizar.ends_at = new Date(startObj.getTime() + durationMin * 60000).toISOString();
        } else {
            if (body.starts_at !== undefined) camposAtualizar.starts_at = body.starts_at;
            if (body.ends_at !== undefined) camposAtualizar.ends_at = body.ends_at;
        }

        if (body.charged_amount !== undefined || body.chargedAmount !== undefined) {
            camposAtualizar.charged_amount = body.charged_amount ?? body.chargedAmount;
        }
        if (body.status !== undefined) {
            camposAtualizar.status = statusToDb[body.status] || body.status;
        }

        let updatedData = null;

        if (Object.keys(camposAtualizar).length > 0) {
            const { data, error } = await supabase
                .from('appointments')
                .update(camposAtualizar)
                .eq('id', id)
                .select(`
                    *,
                    student_service_assignments (
                        student_id,
                        professional_id,
                        service_type_id,
                        students ( full_name ),
                        profiles ( full_name ),
                        service_types ( name )
                    ),
                    attendance ( id, status, recorded_at, notes )
                `)
                .single();

            if (error) return res.status(400).json({ error: error.message });
            updatedData = formatAppointmentForFront(data);
        }

        const rawAttendance = body.attendance_status || body.attendanceStatus;
        if (rawAttendance) {
            const dbAttendance = attendanceToDb[rawAttendance] || rawAttendance;
            const notes = body.attendance_notes || body.notes || null;

            const { error: rpcError } = await supabase.rpc('record_attendance', {
                p_appointment_id: id,
                p_status: dbAttendance,
                p_notes: notes
            });

            if (rpcError) {
                const { error: attError } = await supabase
                    .from('attendance')
                    .update({
                        status: dbAttendance,
                        notes,
                        recorded_at: new Date().toISOString()
                    })
                    .eq('appointment_id', id);

                if (attError) return res.status(400).json({ error: 'Erro ao registrar presença: ' + attError.message });
            }
        }

        return res.status(200).json({
            message: 'Atendimento atualizado com sucesso!',
            data: updatedData
        });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao atualizar atendimento: ' + err.message });
    }
};

export const deleteAtendimento = async (req: Request, res: Response): Promise<any> => {
    const { id } = req.params;
    try {
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ message: 'Atendimento excluído com sucesso!' });
    } catch (err: any) {
        return res.status(500).json({ error: 'Erro interno ao excluir atendimento: ' + err.message });
    }
};