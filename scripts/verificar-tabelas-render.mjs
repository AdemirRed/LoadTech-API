#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

console.log('🔍 Verificando tabelas no banco de produção do Render...\n');

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

async function verificarTabelas() {
  try {
    // Teste de conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida com sucesso!\n');

    // Lista todas as tabelas no schema public
    const [results] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('📋 TABELAS NO SCHEMA PUBLIC:');
    console.log('=' .repeat(50));
    
    if (results.length === 0) {
      console.log('❌ Nenhuma tabela encontrada no schema public');
    } else {
      results.forEach((table, index) => {
        console.log(`${index + 1}. ${table.tablename} (owner: ${table.tableowner})`);
      });
    }

    console.log('\n🔍 VERIFICANDO ESTRUTURA DAS TABELAS PRINCIPAIS:');
    console.log('=' .repeat(50));

    // Tabelas esperadas
    const tabelasEsperadas = ['users', 'planos', 'assinaturas', 'lojas', 'pagamentos', 'sequelize_meta'];

    for (const tabela of tabelasEsperadas) {
      try {
        const [columns] = await sequelize.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = '${tabela}' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `);

        if (columns.length > 0) {
          console.log(`\n✅ Tabela '${tabela}' (${columns.length} colunas):`);
          columns.slice(0, 5).forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
          });
          if (columns.length > 5) {
            console.log(`   ... e mais ${columns.length - 5} colunas`);
          }
        } else {
          console.log(`❌ Tabela '${tabela}' não encontrada`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela '${tabela}': ${error.message}`);
      }
    }

    // Verifica se existe algum dado nas tabelas
    console.log('\n📊 CONTAGEM DE REGISTROS:');
    console.log('=' .repeat(50));

    for (const tabela of ['users', 'planos', 'assinaturas', 'lojas', 'pagamentos']) {
      try {
        const [count] = await sequelize.query(`SELECT COUNT(*) as total FROM public.${tabela};`);
        console.log(`${tabela}: ${count[0].total} registros`);
      } catch (error) {
        console.log(`${tabela}: Erro - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
    if (error.parent) {
      console.error('Erro detalhado:', error.parent.message);
    }
  } finally {
    await sequelize.close();
    console.log('\n🔐 Conexão fechada.');
  }
}

// Executa a verificação
verificarTabelas();
