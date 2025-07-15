#!/usr/bin/env node

/**
 * Script para verificar e sincronizar migrações antes do deploy
 * Garante que todas as migrações sejam executadas na ordem correta
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkMigrations() {
  console.log('🔍 Verificando status das migrações...');
  
  try {
    // Verificar status atual
    const { stdout } = await execAsync('npx sequelize db:migrate:status');
    console.log('📊 Status atual das migrações:');
    console.log(stdout);
    
    // Contar migrações pendentes
    const pendingMigrations = (stdout.match(/down/g) || []).length;
    const completedMigrations = (stdout.match(/up/g) || []).length;
    
    console.log(`✅ Migrações executadas: ${completedMigrations}`);
    console.log(`⏳ Migrações pendentes: ${pendingMigrations}`);
    
    if (pendingMigrations > 0) {
      console.log('🔄 Executando migrações pendentes...');
      const { stdout: migrateOutput } = await execAsync('npx sequelize db:migrate');
      console.log(migrateOutput);
      console.log('✅ Todas as migrações foram executadas!');
    } else {
      console.log('✅ Banco de dados já está atualizado!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar migrações:', error.message);
    return false;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  checkMigrations().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default checkMigrations;
