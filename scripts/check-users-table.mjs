import { Sequelize } from 'sequelize';

const DATABASE_URL = "postgresql://loadtech_admin:SrJGSvNW6uCdYwy4fM9aJeX3OispKQ1S@dpg-d1r5ir8dl3ps73f3huc0-a.oregon-postgres.render.com/loadtech_master";

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: true, // Ativar logs para debug
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function checkUsersTable() {
  console.log('=== INVESTIGANDO TABELA USERS ===');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado');
    
    // Tentar acessar diretamente public.users
    try {
      const [users] = await sequelize.query('SELECT COUNT(*) as count FROM public.users;');
      console.log(`✅ Tabela public.users existe! Total de registros: ${users[0].count}`);
      
      // Verificar estrutura da tabela
      const [columns] = await sequelize.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Colunas da tabela users:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
      
    } catch (error) {
      console.log('❌ Tabela public.users não existe:', error.message);
    }
    
    // Verificar se existe em qualquer lugar
    const [anyUsers] = await sequelize.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE tablename LIKE '%user%';
    `);
    
    console.log('\n🔍 Tabelas com "user" no nome:');
    if (anyUsers.length === 0) {
      console.log('❌ Nenhuma tabela encontrada');
    } else {
      anyUsers.forEach(table => {
        console.log(`   - ${table.schemaname}.${table.tablename}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUsersTable();
