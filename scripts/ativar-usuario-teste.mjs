/**
 * 🔧 ATIVAR USUÁRIO DE TESTE - Corrigir status e email verificado
 */

import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';

const DATABASE_URL = 'postgresql://loadtech_admin:SrJGSvNW6uCdYwy4fM9aJeX3OispKQ1S@dpg-d1r5ir8dl3ps73f3huc0-a.oregon-postgres.render.com/loadtech_master';

console.log('🔧 Ativando usuário de teste...');

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  ssl: true,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false // Desabilitar logs para simplicidade
});

async function ativarUsuario() {
  try {
    const email = 'ademir2de2oliveira@gmail.com';
    const novaSenha = '123456';
    
    console.log(`🔍 Buscando usuário: ${email}`);
    
    // Buscar usuário
    const [users] = await sequelize.query(`
      SELECT id, nome, email, status, email_verificado 
      FROM users 
      WHERE email = ?
    `, {
      replacements: [email]
    });
    
    if (users.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    const user = users[0];
    console.log('📋 Usuário atual:', user);
    
    // Criptografar nova senha
    const senhaHash = await bcrypt.hash(novaSenha, 8);
    
    // Atualizar usuário
    console.log('🔄 Atualizando usuário...');
    await sequelize.query(`
      UPDATE users 
      SET 
        status = 'ativo',
        email_verificado = true,
        senha_hash = ?,
        updated_at = NOW()
      WHERE email = ?
    `, {
      replacements: [senhaHash, email]
    });
    
    console.log('✅ Usuário atualizado com sucesso!');
    
    // Verificar resultado
    const [updatedUsers] = await sequelize.query(`
      SELECT id, nome, email, status, email_verificado 
      FROM users 
      WHERE email = ?
    `, {
      replacements: [email]
    });
    
    console.log('📊 Usuário após atualização:', updatedUsers[0]);
    console.log(`🔐 Nova senha definida: ${novaSenha}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

ativarUsuario();
