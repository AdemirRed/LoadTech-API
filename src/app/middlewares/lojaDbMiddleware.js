import Loja from '../models/Loja.js';
import pkg from 'pg';
const { Client } = pkg;
import 'dotenv/config';

/**
 * Middleware multi-tenant: conecta ao banco da loja pelo slug
 * A criptografia será feita pelo cryptoMiddleware aplicado nas rotas
 */
export async function lojaDbMiddleware(req, res, next) {
  const slug = req.params.slug;
  if (!slug) {
    return res.status(400).json({ erro: 'Slug da loja não informado.' });
  }

  // Busca loja pelo slug
  const loja = await Loja.findOne({ where: { slug } });
  if (!loja) {
    return res.status(404).json({ erro: 'Loja não encontrada.' });
  }

  // Monta nome do banco
  const dbName = `loja_${slug.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()}`;

  // Cria client para o banco da loja
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'loadtech_admin',
    password: process.env.DB_PASSWORD || 'LoadTech@2025!',
    database: dbName
  });

  try {
    await client.connect();
    req.lojaDbClient = client; // Disponibiliza client para uso posterior
    req.loja = loja;
    next();
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao conectar ao banco da loja.' });
  }
}
