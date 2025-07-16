#!/usr/bin/env node

/**
 * ⏰ CONFIGURAR CRON JOB - Limpeza Automática de Contas
 * ====================================================
 * 
 * Configura execução automática da limpeza de contas não verificadas
 * Recomendado: executar diariamente às 02:00
 */

import cron from 'node-cron';
import { fileURLToPath } from 'url';
import path from 'path';
import LimpadorContasNaoVerificadas from './limpar-contas-nao-verificadas.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CronLimpezaContas {
  
  constructor() {
    this.limpador = new LimpadorContasNaoVerificadas();
  }

  iniciar() {
    console.log('⏰ CONFIGURANDO CRON JOB - Limpeza de Contas');
    console.log('============================================\n');
    
    // Executar todos os dias às 02:00
    cron.schedule('0 2 * * *', async () => {
      console.log(`\n🕐 ${new Date().toISOString()} - Iniciando limpeza automática de contas`);
      
      try {
        await this.limpador.executar();
        console.log('✅ Limpeza automática concluída com sucesso');
      } catch (error) {
        console.error('❌ Erro na limpeza automática:', error);
      }
    }, {
      timezone: "America/Sao_Paulo"
    });

    // Executar relatório a cada 6 horas
    cron.schedule('0 */6 * * *', async () => {
      console.log(`\n📊 ${new Date().toISOString()} - Gerando relatório de contas`);
      
      try {
        await this.limpador.gerarRelatorio();
      } catch (error) {
        console.error('❌ Erro no relatório automático:', error);
      }
    }, {
      timezone: "America/Sao_Paulo"
    });

    console.log('✅ Cron jobs configurados:');
    console.log('   🧹 Limpeza: Todos os dias às 02:00 (GMT-3)');
    console.log('   📊 Relatório: A cada 6 horas');
    console.log('\n⚠️ Este processo deve ficar rodando continuamente');
    console.log('💡 Para usar em produção, configure um processo daemon\n');
  }

  // Método para executar teste imediato
  async testeImediato() {
    console.log('🧪 TESTE IMEDIATO - Limpeza de Contas');
    console.log('====================================\n');
    
    try {
      await this.limpador.executar();
      console.log('✅ Teste imediato concluído');
    } catch (error) {
      console.error('❌ Erro no teste imediato:', error);
    }
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);

async function main() {
  const cronManager = new CronLimpezaContas();
  
  if (args.includes('--teste') || args.includes('-t')) {
    // Executar teste imediato
    await cronManager.testeImediato();
    process.exit(0);
  } else if (args.includes('--relatorio') || args.includes('-r')) {
    // Apenas relatório
    await cronManager.limpador.gerarRelatorio();
    process.exit(0);
  } else {
    // Iniciar cron jobs
    cronManager.iniciar();
    
    // Manter o processo rodando
    process.on('SIGINT', () => {
      console.log('\n👋 Parando cron jobs...');
      process.exit(0);
    });
  }
}

// Verificar se foi executado diretamente
if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error);
}

export default CronLimpezaContas;
