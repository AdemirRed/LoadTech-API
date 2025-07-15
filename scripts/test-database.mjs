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

async function testDatabase() {
  console.log('=== TESTE DE CONEXAO COM BANCO ===');
  console.log('');
  
  try {
    await sequelize.authenticate();
    console.log('✅ CONEXAO OK: Banco acessivel');
    
    // Verificar tabelas
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    
    console.log(`📊 TABELAS ENCONTRADAS: ${tables ? tables.length : 0}`);
    if (!tables || tables.length === 0) {
      console.log('❌ PROBLEMA: Banco vazio - nenhuma tabela criada');
      console.log('🔍 CAUSA: Migrações não foram executadas durante o deploy');
      console.log('');
      console.log('💡 SOLUÇÕES:');
      console.log('   1. Verificar logs do deploy no Render');
      console.log('   2. Confirmar se DATABASE_URL está nas variáveis de ambiente');
      console.log('   3. Executar migrações manualmente');
      console.log('   4. Verificar se script de build está correto');
    } else {
      console.log('📋 TABELAS:');
      tables.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      
      // Verificar migrações
      const hasSeqMeta = tables.some(row => row.table_name === 'SequelizeMeta');
      if (hasSeqMeta) {
        const [migrations] = await sequelize.query('SELECT * FROM "SequelizeMeta" ORDER BY name;');
        console.log(`✅ MIGRAÇÕES EXECUTADAS: ${migrations.length}`);
        if (migrations.length > 0) {
          console.log('📄 Lista de migrações:');
          migrations.forEach(m => console.log(`   - ${m.name}`));
        }
      } else {
        console.log('❌ PROBLEMA: SequelizeMeta não existe - nenhuma migração foi executada');
      }
      
      // Verificar se tabela users existe
      const hasUsers = tables.some(row => row.table_name === 'users');
      if (hasUsers) {
        console.log('✅ Tabela users encontrada');
        try {
          const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM users;');
          console.log(`👥 Usuários cadastrados: ${userCount[0].count}`);
        } catch (error) {
          console.log('⚠️ Erro ao contar usuários:', error.message);
        }
      } else {
        console.log('❌ Tabela users não encontrada');
      }
    }
    
  } catch (error) {
    console.error('❌ ERRO DE CONEXÃO:', error.message);
    console.log('');
    console.log('🔍 POSSÍVEIS CAUSAS:');
    console.log('   1. URL de conexão incorreta');
    console.log('   2. Credenciais inválidas');
    console.log('   3. Banco PostgreSQL não está rodando');
    console.log('   4. Problemas de rede/firewall');
  } finally {
    await sequelize.close();
  }
}

testDatabase();
