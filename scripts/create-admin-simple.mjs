// Script simples para criar usuário admin
import { Sequelize } from 'sequelize';

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
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco');
    
    // Senha hash pré-calculada para '123456' com bcrypt salt 10
    const senhaHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    // Verificar se usuário já existe
    const [existingUsers] = await sequelize.query(
      `SELECT * FROM loadtech.users WHERE email = 'admin@loadtech.com';`
    );
    
    if (existingUsers.length > 0) {
      console.log('⚠️ Usuário admin já existe');
      return;
    }
    
    // Criar usuário admin
    const adminId = '123e4567-e89b-12d3-a456-426614174000';
    
    await sequelize.query(`
      INSERT INTO loadtech.users (
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
    
    console.log('✅ Usuário admin criado!');
    console.log('📧 Email: admin@loadtech.com');
    console.log('🔑 Senha: 123456');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();
