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

async function checkSchemas() {
  console.log('=== VERIFICACAO COMPLETA DO BANCO ===');
  console.log('');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão estabelecida');
    
    // Verificar schemas
    const [schemas] = await sequelize.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast');"
    );
    
    console.log('📋 SCHEMAS ENCONTRADOS:');
    schemas.forEach(row => {
      console.log(`   - ${row.schema_name}`);
    });
    
    // Verificar tabelas em cada schema
    for (const schema of schemas) {
      const schemaName = schema.schema_name;
      console.log(`\n📊 TABELAS NO SCHEMA "${schemaName}":`);
      
      const [tables] = await sequelize.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schemaName}';`
      );
      
      if (!tables || tables.length === 0) {
        console.log('   (nenhuma tabela)');
      } else {
        tables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
        
        // Se for o schema loadtech, verificar migrações
        if (schemaName === 'loadtech') {
          const hasSeqMeta = tables.some(row => row.table_name === 'sequelize_meta');
          if (hasSeqMeta) {
            const [migrations] = await sequelize.query('SELECT * FROM loadtech.sequelize_meta ORDER BY name;');
            console.log(`\n📄 MIGRAÇÕES NO SCHEMA LOADTECH: ${migrations.length}`);
            migrations.forEach(m => console.log(`   - ${m.name}`));
          }
          
          // Verificar tabela users
          const hasUsers = tables.some(row => row.table_name === 'users');
          if (hasUsers) {
            console.log('\n👥 VERIFICANDO USUÁRIOS:');
            try {
              const [userCount] = await sequelize.query('SELECT COUNT(*) as count FROM loadtech.users;');
              console.log(`   Total de usuários: ${userCount[0].count}`);
              
              if (userCount[0].count > 0) {
                const [users] = await sequelize.query('SELECT id, name, email FROM loadtech.users LIMIT 3;');
                console.log('   Primeiros usuários:');
                users.forEach(user => {
                  console.log(`   - ${user.name} (${user.email})`);
                });
              }
            } catch (error) {
              console.log(`   ❌ Erro ao consultar usuários: ${error.message}`);
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkSchemas();
