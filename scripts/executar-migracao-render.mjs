/**
 * 🔧 EXECUTAR MIGRAÇÃO NO RENDER - Campos de aviso de remoção
 */

import { Sequelize } from 'sequelize';

const DATABASE_URL = 'postgresql://loadtech_admin:SrJGSvNW6uCdYwy4fM9aJeX3OispKQ1S@dpg-d1r5ir8dl3ps73f3huc0-a.oregon-postgres.render.com/loadtech_master';

console.log('🔧 Executando migração dos campos de aviso de remoção...');

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  ssl: true,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: console.log
});

async function executarMigracao() {
  try {
    // Testar conexão
    console.log('🔗 Testando conexão com banco...');
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco com sucesso');
    
    // Verificar se as colunas já existem
    console.log('🔍 Verificando se as colunas já existem...');
    
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('aviso_remocao_enviado', 'data_aviso_remocao')
    `);
    
    console.log('📋 Colunas encontradas:', results);
    
    if (results.length === 0) {
      console.log('➕ Adicionando colunas...');
      
      // Adicionar coluna aviso_remocao_enviado
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN aviso_remocao_enviado BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Coluna aviso_remocao_enviado adicionada');
      
      // Adicionar coluna data_aviso_remocao
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN data_aviso_remocao TIMESTAMP WITH TIME ZONE
      `);
      console.log('✅ Coluna data_aviso_remocao adicionada');
      
    } else if (results.length === 1) {
      console.log('⚠️ Apenas uma coluna existe, adicionando a que falta...');
      
      const existingColumn = results[0].column_name;
      
      if (existingColumn === 'aviso_remocao_enviado') {
        await sequelize.query(`
          ALTER TABLE users 
          ADD COLUMN data_aviso_remocao TIMESTAMP WITH TIME ZONE
        `);
        console.log('✅ Coluna data_aviso_remocao adicionada');
      } else {
        await sequelize.query(`
          ALTER TABLE users 
          ADD COLUMN aviso_remocao_enviado BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ Coluna aviso_remocao_enviado adicionada');
      }
    } else {
      console.log('✅ Ambas as colunas já existem');
    }
    
    // Verificar resultado final
    const [finalResults] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('aviso_remocao_enviado', 'data_aviso_remocao')
      ORDER BY column_name
    `);
    
    console.log('📊 Estado final das colunas:');
    finalResults.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.error('📋 Stack:', error.stack);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexão fechada');
  }
}

executarMigracao();
