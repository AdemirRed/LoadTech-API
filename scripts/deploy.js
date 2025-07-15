#!/usr/bin/env node

/**
 * Script de deploy para o Render
 * Executa migrações e verificações antes de iniciar a aplicação
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`✅ ${description} concluído com sucesso`);
    return true;
  } catch (error) {
    console.error(`❌ Erro em ${description}:`, error.message);
    return false;
  }
}

async function deploy() {
  console.log('🚀 Iniciando processo de deploy LoadTech API');
  console.log('===========================================');

  // 1. Verificar se o banco está acessível
  console.log('📍 Etapa 1: Verificando conexão com banco de dados');
  const dbConnected = await runCommand(
    'npx sequelize db:migrate:status', 
    'Verificando status das migrações'
  );

  if (!dbConnected) {
    console.error('❌ Falha na conexão com banco de dados');
    process.exit(1);
  }

  // 2. Executar migrações
  console.log('📍 Etapa 2: Executando migrações do banco');
  const migrationsOk = await runCommand(
    'node scripts/check-migrations.js', 
    'Verificando e executando migrações'
  );

  if (!migrationsOk) {
    console.error('❌ Falha na execução das migrações');
    process.exit(1);
  }

  // 3. Verificar estrutura de upload
  console.log('📍 Etapa 3: Verificando estrutura de upload');
  const uploadOk = await runCommand(
    'node scripts/check-upload-system.js', 
    'Verificando sistema de upload'
  );

  if (!uploadOk) {
    console.warn('⚠️ Sistema de upload com problemas, mas continuando deploy');
  }

  console.log('');
  console.log('🎉 Deploy concluído com sucesso!');
  console.log('✅ Banco de dados atualizado');
  console.log('✅ Migrações aplicadas');
  console.log('✅ Sistema pronto para iniciar');
  console.log('');
  console.log('🔗 A aplicação estará disponível em alguns segundos...');
}

// Executar apenas se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy().catch(error => {
    console.error('💥 Falha crítica no deploy:', error);
    process.exit(1);
  });
}

export default deploy;
