import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import alunosRoutes from './routes/alunosRoutes';
import equipeRoutes from './routes/equipeRoutes';
import atendimentosRoutes from './routes/atendimentosRoutes';

const app = express();

app.use(cors()); // Permite que o frontend comunique com a API
app.use(express.json()); // Permite o parsing de JSON no corpo das requisições

// Registo das rotas principais
app.use('/api/auth', authRoutes);
app.use('/api/alunos', alunosRoutes);
app.use('/api/equipe', equipeRoutes);
app.use('/api/atendimentos', atendimentosRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor a correr na porta ${PORT}`);
});