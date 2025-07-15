import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false
});

(async () => {
  try {
    console.log('=== VERIFICANDO MIGRAÇÕES EXECUTADAS ===');
    const result = await sequelize.query('SELECT * FROM loadtech.sequelize_meta ORDER BY name;');
    console.log('📋 Migrações executadas:');
    result[0].forEach(row => console.log(`   - ${row.name}`));
    
    console.log('\n=== VERIFICANDO SE TABELA USERS EXISTE ===');
    try {
      const usersResult = await sequelize.query('SELECT * FROM loadtech.users LIMIT 1;');
      console.log('✅ Tabela users existe no schema loadtech');
    } catch (err) {
      console.log('❌ Tabela users não existe no schema loadtech:', err.message);
    }
    
    try {
      const usersResult = await sequelize.query('SELECT * FROM public.users LIMIT 1;');
      console.log('✅ Tabela users existe no schema public');
    } catch (err) {
      console.log('❌ Tabela users não existe no schema public:', err.message);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await sequelize.close();
  }
})();
