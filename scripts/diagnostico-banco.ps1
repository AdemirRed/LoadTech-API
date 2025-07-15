# Script para conectar e verificar o banco PostgreSQL do Render
# Execute este script para diagnósticar o estado atual do banco

$DATABASE_URL = "postgresql://loadtech_admin:SrJGSvNW6uCdYwy4fM9aJeX3OispKQ1S@dpg-d1r5ir8dl3ps73f3huc0-a.oregon-postgres.render.com/loadtech_master"

Write-Host "=== DIAGNÓSTICO DO BANCO POSTGRESQL ===" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 Verificando conectividade com o banco..." -ForegroundColor Yellow

# Teste usando Node.js para conectar no banco
$testScript = @"
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('$DATABASE_URL', {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida com sucesso!');
    
    // Verificar se tabela users existe
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );
    
    console.log('\n📋 Tabelas encontradas no banco:');
    if (results.length === 0) {
      console.log('❌ Nenhuma tabela encontrada - banco vazio!');
    } else {
      results.forEach(row => {
        console.log(`   - ` + row.table_name);
      });
    }
    
    // Verificar SequelizeMeta
    const metaExists = results.some(row => row.table_name === 'SequelizeMeta');
    if (metaExists) {
      console.log('\n📊 Verificando migrações executadas...');
      const [migrations] = await sequelize.query('SELECT * FROM "SequelizeMeta" ORDER BY name;');
      
      if (migrations.length === 0) {
        console.log('❌ Nenhuma migração foi executada!');
      } else {
        console.log('✅ Migrações encontradas:');
        migrations.forEach(migration => {
          console.log(`   - ` + migration.name);
        });
      }
    } else {
      console.log('\n❌ Tabela SequelizeMeta não existe - nenhuma migração foi executada!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
  } finally {
    await sequelize.close();
  }
}

testConnection();
"@

# Salvar script temporário
$testScript | Out-File -FilePath "test-db-connection.js" -Encoding UTF8

Write-Host "Executando teste de conexão..." -ForegroundColor Yellow
try {
    $result = node test-db-connection.js 2>&1
    Write-Host $result -ForegroundColor White
} catch {
    Write-Host "❌ Erro ao executar teste de conexão" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Limpar arquivo temporário
Remove-Item "test-db-connection.js" -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== ANÁLISE E PRÓXIMOS PASSOS ===" -ForegroundColor Green
Write-Host ""
Write-Host "Se o banco estiver vazio ou sem migracoes:" -ForegroundColor Yellow
Write-Host "   1. As migracoes nao rodaram durante o deploy" -ForegroundColor White
Write-Host "   2. Pode haver erro no script de build" -ForegroundColor White
Write-Host "   3. Variavel DATABASE_URL pode nao estar configurada no Render" -ForegroundColor White
Write-Host ""
Write-Host "SOLUCOES:" -ForegroundColor Yellow
Write-Host "   1. Verificar logs do deploy no dashboard do Render" -ForegroundColor White
Write-Host "   2. Executar migracoes manualmente" -ForegroundColor White
Write-Host "   3. Verificar configuracao das variaveis de ambiente" -ForegroundColor White
Write-Host "   4. Forcar novo deploy com correcoes" -ForegroundColor White
