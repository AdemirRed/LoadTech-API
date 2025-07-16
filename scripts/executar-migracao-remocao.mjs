#!/usr/bin/env node

/**
 * 🔧 EXECUTAR MIGRAÇÃO - Campos de Controle de Remoção
 * ===================================================
 * 
 * Executa a migração para adicionar campos de controle
 * de avisos de remoção na tabela users
 */

import { fileURLToPath } from 'url';
import path from 'path';
import '../src/database/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executarMigracaoRemocao() {
  console.log('🔧 EXECUTANDO MIGRAÇÃO - Campos de Controle de Remoção');
  console.log('====================================================\n');
  
  try {
    // Importar a migração dinamicamente
    const { up } = await import('../src/database/migrations/20250716-add-removal-warning-fields.js');
    
    // Obter referência do sequelize da conexão do banco
    const database = await import('../src/database/index.js');
    const sequelize = database.default.connection;
    const queryInterface = sequelize.getQueryInterface();
    
    console.log('📋 Executando migração...');
    await up(queryInterface, sequelize.constructor);
    
    console.log('✅ Migração executada com sucesso!');
    console.log('\n📊 Campos adicionados:');
    console.log('   • aviso_remocao_enviado (BOOLEAN, default: false)');
    console.log('   • data_aviso_remocao (DATE, nullable)');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

executarMigracaoRemocao();
