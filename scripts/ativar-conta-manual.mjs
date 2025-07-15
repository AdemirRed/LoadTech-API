#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Ativando manualmente conta do usuário...\n');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  logging: false
});

async function ativarConta() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco\n');

    const email = 'ademir1de1oliveira@gmail.com';

    // Verificar usuário atual
    const [userBefore] = await sequelize.query(
      `SELECT id, nome, email, status, email_verificado, created_at 
       FROM public.users 
       WHERE email = :email`,
      { replacements: { email } }
    );

    if (userBefore.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('📋 ANTES DA ATIVAÇÃO:');
    console.log(userBefore[0]);

    // Ativar conta
    const [result] = await sequelize.query(
      `UPDATE public.users 
       SET 
         status = 'ativo',
         email_verificado = true,
         email_verificado_em = NOW(),
         codigo_verificacao = NULL,
         codigo_verificacao_expiracao = NULL,
         updated_at = NOW()
       WHERE email = :email
       RETURNING id, nome, email, status, email_verificado`,
      { replacements: { email } }
    );

    if (result.length > 0) {
      console.log('\n✅ CONTA ATIVADA COM SUCESSO!');
      console.log('📋 DEPOIS DA ATIVAÇÃO:');
      console.log(result[0]);
      
      console.log('\n🎉 O usuário agora pode fazer login normalmente!');
      console.log(`📧 Email: ${email}`);
      console.log('🔐 Pode usar a senha que definiu no cadastro');
    } else {
      console.log('❌ Falha na ativação');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
    console.log('\n🔐 Conexão fechada');
  }
}

// Perguntar confirmação
console.log('⚠️  Isso irá ativar manualmente a conta do usuário:');
console.log('📧 Email: ademir1de1oliveira@gmail.com');
console.log('');
console.log('✅ Prosseguir com ativação manual...');

ativarConta();
