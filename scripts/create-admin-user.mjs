// Script para criar usuário admin no banco PostgreSQL do Render
import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcrypt';

const DATABASE_URL = "postgresql://loadtech_admin:SrJGSvNW6uCdYwy4fM9aJeX3OispKQ1S@dpg-d1r5ir8dl3ps73f3huc0-a.oregon-postgres.render.com/loadtech_master";

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function createAdminUser() {
  console.log('=== CRIANDO USUÁRIO ADMIN ===');
  console.log('');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco');
    
    // Hash da senha
    const senhaHash = await bcrypt.hash('123456', 10);
    
    // Verificar se usuário já existe
    const [existingUsers] = await sequelize.query(
      `SELECT * FROM users WHERE email = 'admin@loadtech.com';`
    );
    
    if (existingUsers.length > 0) {
      console.log('⚠️ Usuário admin já existe');
      console.log(`ID: ${existingUsers[0].id}`);
      console.log(`Nome: ${existingUsers[0].nome}`);
      console.log(`Email: ${existingUsers[0].email}`);
      return;
    }
    
    // Criar usuário admin
    const adminId = '123e4567-e89b-12d3-a456-426614174000'; // UUID fixo para admin
    
    await sequelize.query(`
      INSERT INTO users (
        id, nome, email, senha_hash, telefone, papel, status, 
        email_verificado, created_at, updated_at
      ) VALUES (
        '${adminId}',
        'Administrador LoadTech',
        'admin@loadtech.com',
        '${senhaHash}',
        '(11) 99999-9999',
        'admin',
        'ativo',
        true,
        NOW(),
        NOW()
      );
    `);
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email: admin@loadtech.com');
    console.log('🔑 Senha: 123456');
    console.log(`🆔 ID: ${adminId}`);
    
    // Verificar se foi criado
    const [newUser] = await sequelize.query(
      `SELECT id, nome, email, papel, status FROM users WHERE email = 'admin@loadtech.com';`
    );
    
    if (newUser.length > 0) {
      console.log('');
      console.log('📊 Dados do usuário criado:');
      console.log(`   ID: ${newUser[0].id}`);
      console.log(`   Nome: ${newUser[0].nome}`);
      console.log(`   Email: ${newUser[0].email}`);
      console.log(`   Papel: ${newUser[0].papel}`);
      console.log(`   Status: ${newUser[0].status}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error.message);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();
