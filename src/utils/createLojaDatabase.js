import pkg from 'pg';
import 'dotenv/config';

const { Client } = pkg;

/**
 * Cria um banco de dados exclusivo para uma loja
 * @param {string} nomeLoja - Nome único da loja (slug)
 */
export async function createLojaDatabase(nomeLoja) {
  const dbName = `loja_${nomeLoja.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()}`;
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'loadtech_admin',
    password: process.env.DB_PASSWORD || 'LoadTech@2025!',
    database: 'postgres' // Usar banco padrão para criar outros
  });

  try {
    await client.connect();
    // Verifica se já existe
    const exists = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (exists.rowCount > 0) {
      console.log(`Banco ${dbName} já existe.`);
      return false;
    }
    // Cria o banco
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Banco de dados criado: ${dbName}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar banco da loja:', error.message);
    return false;
  } finally {
    await client.end();
  }
}

// Exemplo de uso:
// createLojaDatabase('francieli');
