/**
 * Script para verificar e corrigir estrutura do banco
 */

import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function checkDatabaseStructure() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    user: process.env.DB_USERNAME || 'loadtech_admin',
    password: process.env.DB_PASSWORD || 'LoadTech@2025!',
    database: process.env.DB_DATABASE || 'loadtech_master'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');

    // Verificar colunas da tabela users
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Estrutura atual da tabela users:');
    console.log('='.repeat(50));
    result.rows.forEach(row => {
      console.log(`${row.column_name} | ${row.data_type} | ${row.is_nullable}`);
    });

    // Verificar migrações executadas
    const migrations = await client.query(`
      SELECT name FROM loadtech.sequelize_meta 
      ORDER BY name;
    `);

    console.log('\n📋 Migrações executadas:');
    console.log('='.repeat(50));
    migrations.rows.forEach(row => {
      console.log(`✅ ${row.name}`);
    });

    // Marcar migração problemática como executada
    await client.query(`
      INSERT INTO loadtech.sequelize_meta (name) 
      VALUES ('20250711032600-add-asaas-customer-to-users.js') 
      ON CONFLICT DO NOTHING;
    `);

    console.log('\n✅ Migração problemática marcada como executada');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabaseStructure();
