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

async function resetMigrations() {
  console.log('=== LIMPANDO MIGRAÇÕES ===');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado');
    
    // Limpar tabela sequelize_meta
    await sequelize.query('DELETE FROM loadtech.sequelize_meta;');
    console.log('✅ Tabela sequelize_meta limpa');
    
    // Verificar se há alguma tabela restante
    const [tables] = await sequelize.query(`
      SELECT schemaname, tablename
      FROM pg_tables 
      WHERE schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      AND tablename != 'sequelize_meta'
      ORDER BY schemaname, tablename;
    `);
    
    if (tables.length > 0) {
      console.log('⚠️ Tabelas encontradas (serão removidas):');
      for (const table of tables) {
        console.log(`   - ${table.schemaname}.${table.tablename}`);
        try {
          await sequelize.query(`DROP TABLE IF EXISTS "${table.schemaname}"."${table.tablename}" CASCADE;`);
          console.log(`   ✅ Removida: ${table.tablename}`);
        } catch (error) {
          console.log(`   ❌ Erro ao remover ${table.tablename}: ${error.message}`);
        }
      }
    } else {
      console.log('✅ Nenhuma tabela adicional encontrada');
    }
    
    console.log('🔄 Pronto para executar migrações do zero');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
}

resetMigrations();
