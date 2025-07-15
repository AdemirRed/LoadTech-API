#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

console.log('🔍 Verificando colunas da tabela users...\n');

// Conecta ao banco usando DATABASE_URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

async function verificarColunas() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida!\n');

    // Lista todas as colunas da tabela users
    const [columns] = await sequelize.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('📋 COLUNAS DA TABELA USERS:');
    console.log('=' .repeat(70));
    
    columns.forEach((col, index) => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
      const defaultVal = col.column_default ? `default: ${col.column_default}` : '';
      console.log(`${(index + 1).toString().padStart(2)}. ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${nullable} ${defaultVal}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

verificarColunas();
