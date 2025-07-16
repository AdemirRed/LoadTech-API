#!/usr/bin/env node

/**
 * 🧹 LIMPEZA DE CONTAS NÃO VERIFICADAS
 * ===================================
 * 
 * Este script:
 * 1. Encontra contas não verificadas há mais de 5 dias
 * 2. Envia email de aviso (2 dias para verificar)
 * 3. Remove contas que não foram verificadas após 7 dias total
 * 
 * Uso: node scripts/limpar-contas-nao-verificadas.mjs
 */

import { fileURLToPath } from 'url';
import path from 'path';
import '../src/database/index.js'; // Conectar ao banco
import User from '../src/app/models/User.js';
import sendEmail from '../src/utils/mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações
const CONFIG = {
  DIAS_PARA_AVISO: 5,        // Após 5 dias sem verificar, envia aviso
  DIAS_PARA_REMOCAO: 7,      // Após 7 dias total, remove a conta
  DIAS_AVISO_ANTECEDENCIA: 2 // Quantos dias de antecedência no aviso
};

class LimpadorContasNaoVerificadas {
  
  async executar() {
    console.log('🧹 INICIANDO LIMPEZA DE CONTAS NÃO VERIFICADAS');
    console.log('===============================================\n');
    
    try {
      // Passo 1: Enviar avisos para contas que precisam verificar
      await this.enviarAvisos();
      
      // Passo 2: Remover contas que expiraram
      await this.removerContasExpiradas();
      
      console.log('\n✅ Limpeza concluída com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      throw error;
    }
  }

  async enviarAvisos() {
    console.log('📧 ETAPA 1: Enviando avisos de expiração...\n');
    
    // Encontrar contas não verificadas há 5+ dias que ainda não receberam aviso
    const dataLimiteAviso = new Date();
    dataLimiteAviso.setDate(dataLimiteAviso.getDate() - CONFIG.DIAS_PARA_AVISO);
    
    const contasParaAviso = await User.findAll({
      where: {
        email_verificado: false,
        aviso_remocao_enviado: false,
        createdAt: {
          [User.sequelize.Sequelize.Op.lte]: dataLimiteAviso
        }
      }
    });

    console.log(`🔍 Encontradas ${contasParaAviso.length} contas para enviar aviso`);

    let avisosEnviados = 0;
    let errosEnvio = 0;

    for (const user of contasParaAviso) {
      try {
        await this.enviarEmailAviso(user);
        
        // Marcar que o aviso foi enviado
        await user.update({
          aviso_remocao_enviado: true,
          data_aviso_remocao: new Date()
        });
        
        avisosEnviados++;
        console.log(`✅ Aviso enviado para: ${user.email}`);
        
      } catch (error) {
        errosEnvio++;
        console.error(`❌ Erro ao enviar aviso para ${user.email}:`, error.message);
      }
    }

    console.log(`\n📊 Resumo dos avisos:`);
    console.log(`   ✅ Enviados: ${avisosEnviados}`);
    console.log(`   ❌ Erros: ${errosEnvio}`);
  }

  async removerContasExpiradas() {
    console.log('\n🗑️ ETAPA 2: Removendo contas expiradas...\n');
    
    // Encontrar contas não verificadas há 7+ dias
    const dataLimiteRemocao = new Date();
    dataLimiteRemocao.setDate(dataLimiteRemocao.getDate() - CONFIG.DIAS_PARA_REMOCAO);
    
    const contasParaRemover = await User.findAll({
      where: {
        email_verificado: false,
        createdAt: {
          [User.sequelize.Sequelize.Op.lte]: dataLimiteRemocao
        }
      }
    });

    console.log(`🔍 Encontradas ${contasParaRemover.length} contas para remoção`);

    let contasRemovidas = 0;
    let errosRemocao = 0;

    for (const user of contasParaRemover) {
      try {
        // Log antes de remover
        console.log(`🗑️ Removendo conta: ${user.email} (criada em ${user.createdAt.toLocaleDateString()})`);
        
        // Remover a conta
        await user.destroy();
        
        contasRemovidas++;
        
      } catch (error) {
        errosRemocao++;
        console.error(`❌ Erro ao remover ${user.email}:`, error.message);
      }
    }

    console.log(`\n📊 Resumo das remoções:`);
    console.log(`   🗑️ Removidas: ${contasRemovidas}`);
    console.log(`   ❌ Erros: ${errosRemocao}`);
  }

  async enviarEmailAviso(user) {
    const dataExpiracao = new Date(user.createdAt);
    dataExpiracao.setDate(dataExpiracao.getDate() + CONFIG.DIAS_PARA_REMOCAO);
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>⚠️ Sua conta LoadTech será removida</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ Ação Necessária - LoadTech</h1>
                <p>Olá, <strong>${user.nome}</strong>!</p>
            </div>
            
            <div class="warning">
                <h2>🚨 Sua conta será removida em breve</h2>
                <p>Sua conta no LoadTech ainda não foi verificada e será <strong>removida automaticamente</strong> em:</p>
                <p><strong>📅 ${dataExpiracao.toLocaleDateString('pt-BR')}</strong></p>
            </div>
            
            <h3>Para manter sua conta ativa:</h3>
            <ol>
                <li>Acesse seu email e procure nosso email de verificação</li>
                <li>Clique no link de verificação</li>
                <li>Se não encontrou o email, verifique a pasta de spam/lixo eletrônico</li>
            </ol>
            
            <p>Se você não recebeu o email de verificação, você pode:</p>
            <a href="${process.env.FRONTEND_URL}/reenviar-verificacao?email=${encodeURIComponent(user.email)}" class="button">
                📧 Solicitar Novo Email de Verificação
            </a>
            
            <h3>⏰ Dados da sua conta:</h3>
            <ul>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Nome:</strong> ${user.nome}</li>
                <li><strong>Cadastro:</strong> ${user.createdAt.toLocaleDateString('pt-BR')}</li>
                <li><strong>Remoção prevista:</strong> ${dataExpiracao.toLocaleDateString('pt-BR')}</li>
            </ul>
            
            <div class="footer">
                <p><strong>Por que removemos contas não verificadas?</strong></p>
                <p>Para manter a segurança e qualidade da nossa plataforma, removemos contas que não foram verificadas. Isso nos ajuda a garantir que todos os usuários são reais e protege contra spam.</p>
                
                <p>Se você não deseja mais usar o LoadTech, pode ignorar este email e sua conta será removida automaticamente.</p>
                
                <hr>
                <p>
                    <strong>LoadTech</strong><br>
                    Este é um email automático. Para suporte, responda este email ou acesse nosso site.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `
⚠️ SUA CONTA LOADTECH SERÁ REMOVIDA

Olá, ${user.nome}!

Sua conta no LoadTech ainda não foi verificada e será REMOVIDA AUTOMATICAMENTE em: ${dataExpiracao.toLocaleDateString('pt-BR')}

Para manter sua conta ativa:
1. Acesse seu email e procure nosso email de verificação
2. Clique no link de verificação
3. Se não encontrou, verifique a pasta de spam

Dados da sua conta:
- Email: ${user.email}
- Nome: ${user.nome}
- Cadastro: ${user.createdAt.toLocaleDateString('pt-BR')}
- Remoção prevista: ${dataExpiracao.toLocaleDateString('pt-BR')}

Se você não deseja mais usar o LoadTech, pode ignorar este email.

LoadTech - Sistema automatizado
    `;

    await sendEmail({
      to: user.email,
      subject: '⚠️ Sua conta LoadTech será removida em 2 dias',
      text: textContent,
      html: htmlContent
    });
  }

  async gerarRelatorio() {
    console.log('\n📊 RELATÓRIO DE CONTAS NÃO VERIFICADAS');
    console.log('=====================================\n');
    
    const agora = new Date();
    
    // Contas criadas mas não verificadas
    const totalNaoVerificadas = await User.count({
      where: { email_verificado: false }
    });
    
    // Contas que receberão aviso em breve (4+ dias)
    const dataQuasePrazo = new Date();
    dataQuasePrazo.setDate(dataQuasePrazo.getDate() - 4);
    
    const contasQuasePrazo = await User.count({
      where: {
        email_verificado: false,
        aviso_remocao_enviado: false,
        createdAt: {
          [User.sequelize.Sequelize.Op.lte]: dataQuasePrazo
        }
      }
    });
    
    // Contas que já receberam aviso
    const contasComAviso = await User.count({
      where: {
        email_verificado: false,
        aviso_remocao_enviado: true
      }
    });
    
    // Contas que serão removidas em breve
    const dataRemocao = new Date();
    dataRemocao.setDate(dataRemocao.getDate() - CONFIG.DIAS_PARA_REMOCAO);
    
    const contasParaRemover = await User.count({
      where: {
        email_verificado: false,
        createdAt: {
          [User.sequelize.Sequelize.Op.lte]: dataRemocao
        }
      }
    });
    
    console.log(`📈 Total de contas não verificadas: ${totalNaoVerificadas}`);
    console.log(`⏰ Receberão aviso em breve: ${contasQuasePrazo}`);
    console.log(`📧 Já receberam aviso: ${contasComAviso}`);
    console.log(`🗑️ Serão removidas na próxima execução: ${contasParaRemover}`);
    
    return {
      totalNaoVerificadas,
      contasQuasePrazo,
      contasComAviso,
      contasParaRemover
    };
  }
}

// Função principal
async function main() {
  try {
    const limpador = new LimpadorContasNaoVerificadas();
    
    // Gerar relatório antes
    console.log('📋 Relatório antes da limpeza:');
    await limpador.gerarRelatorio();
    
    // Executar limpeza
    await limpador.executar();
    
    // Gerar relatório depois
    console.log('\n📋 Relatório após a limpeza:');
    await limpador.gerarRelatorio();
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${__filename}`) {
  main();
}

export default LimpadorContasNaoVerificadas;
