#!/usr/bin/env node

/**
 * 📊 RELATÓRIO DE CONTAS NÃO VERIFICADAS
 * ======================================
 * 
 * Exibe relatório de contas não verificadas sem fazer alterações
 */

import { fileURLToPath } from 'url';
import path from 'path';
import '../src/database/index.js';
import LimpadorContasNaoVerificadas from './limpar-contas-nao-verificadas.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function gerarRelatorio() {
  console.log('📊 RELATÓRIO DE CONTAS NÃO VERIFICADAS');
  console.log('=====================================\n');
  
  try {
    const limpador = new LimpadorContasNaoVerificadas();
    await limpador.gerarRelatorio();
    
    console.log('\n💡 Para executar a limpeza automática:');
    console.log('   node scripts/limpar-contas-nao-verificadas.mjs');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error);
    process.exit(1);
  }
}

gerarRelatorio();
