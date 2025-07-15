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

async function listAllTables() {
  console.log('=== LISTANDO TODAS AS TABELAS ===');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado');
    
    // Buscar todas as tabelas em todos os schemas
    const [tables] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        tableowner
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schemaname, tablename;
    `);
    
    console.log('📊 TABELAS ENCONTRADAS:');
    if (tables.length === 0) {
      console.log('❌ Nenhuma tabela encontrada!');
    } else {
      let currentSchema = '';
      tables.forEach(table => {
        if (table.schemaname !== currentSchema) {
          currentSchema = table.schemaname;
          console.log(`\n📋 Schema: ${currentSchema}`);
        }
        console.log(`   - ${table.tablename}`);
      });
    }
    
    // Verificar especificamente a tabela users
    console.log('\n🔍 PROCURANDO TABELA USERS:');
    const [usersSearch] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename
      FROM pg_tables 
      WHERE tablename = 'users';
    `);
    
    if (usersSearch.length === 0) {
      console.log('❌ Tabela users não encontrada em nenhum schema');
    } else {
      usersSearch.forEach(table => {
        console.log(`✅ Encontrada: ${table.schemaname}.${table.tablename}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

listAllTables();
