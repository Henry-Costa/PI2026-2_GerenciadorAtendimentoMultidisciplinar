import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import alunosRoutes from './routes/alunosRoutes';
import equipeRoutes from './routes/equipeRoutes';
import atendimentosRoutes from './routes/atendimentosRoutes';
import responsaveisRoutes from './routes/responsaveisRoutes';
import prontuariosRoutes from './routes/prontuariosRoutes';
import documentosRoutes from './routes/documentosRoutes';
import comunicacoesRoutes from './routes/comunicacoesRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import logsRoutes from './routes/logsRoutes';
import servicosRoutes from './routes/servicosRoutes';

const app = express();

app.use(cors({
    origin: '*', // Em produção, substitua pela URL oficial do front-end
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
})); // Permite que o frontend comunique com a API
app.use(express.json()); // Permite o parsing de JSON no corpo das requisições

// Registro das rotas principais
app.use('/api/auth', authRoutes);
app.use('/api/alunos', alunosRoutes);
app.use('/api/equipe', equipeRoutes);
app.use('/api/atendimentos', atendimentosRoutes);
app.use('/api/responsaveis', responsaveisRoutes);
app.use('/api/prontuarios', prontuariosRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/comunicacoes', comunicacoesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/servicos', servicosRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});