import { createClient } from '@supabase/supabase-js';

// As variáveis de ambiente carregadas do .env
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Ao usar a chave service_role, o backend ganha acesso total ao banco
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;