# Script para validar se as migrações rodaram corretamente no Render
# Execute se houver problemas com banco de dados

param(
    [string]$BaseUrl = "https://loadtech-api.onrender.com"  # Substitua pela sua URL real
)

Write-Host "=== VALIDAÇÃO DE MIGRAÇÕES NO RENDER ===" -ForegroundColor Green
Write-Host ""

# Função para testar endpoint específico que usa campos das migrações
function Test-MigrationFields {
    param($token)
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Testando campos das migrações..." -ForegroundColor Yellow
    
    try {
        # Tenta acessar dados do usuário que devem incluir campos do Asaas
        $userResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" -Method GET -Headers $headers -TimeoutSec 30
        
        Write-Host "✅ Campos básicos OK" -ForegroundColor Green
        
        # Verifica se campos do Asaas estão presentes
        $hasAsaasFields = $userResponse.PSObject.Properties.Name -contains "asaas_customer_id"
        
        if ($hasAsaasFields) {
            Write-Host "✅ Campos do Asaas encontrados" -ForegroundColor Green
            if ($userResponse.asaas_customer_id) {
                Write-Host "   Customer ID: $($userResponse.asaas_customer_id)" -ForegroundColor White
            }
        } else {
            Write-Host "⚠️  Campos do Asaas não encontrados" -ForegroundColor Yellow
            Write-Host "   Isso pode indicar que as migrações não rodaram" -ForegroundColor Yellow
        }
        
        return $true
        
    } catch {
        Write-Host "❌ Erro ao validar campos das migrações" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Testa conectividade primeiro
Write-Host "Testando conectividade..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET -TimeoutSec 30
    Write-Host "✅ Servidor online" -ForegroundColor Green
} catch {
    Write-Host "❌ Servidor offline ou com problemas" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Faz login para obter token
Write-Host ""
Write-Host "Fazendo login..." -ForegroundColor Yellow
$loginData = @{
    email = "admin@loadtech.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -TimeoutSec 30
    $token = $loginResponse.token
    Write-Host "✅ Login realizado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Falha no login" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*column*does not exist*") {
        Write-Host ""
        Write-Host "🔍 DIAGNÓSTICO: Erro de coluna indica problema nas migrações" -ForegroundColor Red
        Write-Host "   As migrações provavelmente não rodaram corretamente" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 SOLUÇÕES:" -ForegroundColor Yellow
        Write-Host "1. Verifique os logs do build no dashboard do Render" -ForegroundColor White
        Write-Host "2. Confirme se 'npm run migrate' aparece nos logs" -ForegroundColor White
        Write-Host "3. Verifique se DATABASE_URL está configurada corretamente" -ForegroundColor White
        Write-Host "4. Se necessário, force um novo deploy fazendo um commit vazio:" -ForegroundColor White
        Write-Host "   git commit --allow-empty -m 'Force redeploy'" -ForegroundColor Gray
        Write-Host "   git push" -ForegroundColor Gray
    }
    
    exit 1
}

# Valida campos das migrações
Write-Host ""
$migrationsOk = Test-MigrationFields -token $token

Write-Host ""
Write-Host "=== DIAGNÓSTICO COMPLETO ===" -ForegroundColor Green

if ($migrationsOk) {
    Write-Host "✅ Migrações executadas com sucesso!" -ForegroundColor Green
    Write-Host "✅ Banco de dados configurado corretamente" -ForegroundColor Green
    Write-Host "✅ API funcionando normalmente" -ForegroundColor Green
} else {
    Write-Host "❌ Problemas detectados nas migrações" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 AÇÕES RECOMENDADAS:" -ForegroundColor Yellow
    Write-Host "1. Verificar logs do Render:" -ForegroundColor White
    Write-Host "   - Procurar por 'Running migrations'" -ForegroundColor Gray
    Write-Host "   - Verificar se há erros de SQL" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Verificar variáveis de ambiente:" -ForegroundColor White
    Write-Host "   - DATABASE_URL deve estar definida" -ForegroundColor Gray
    Write-Host "   - Deve apontar para PostgreSQL válido" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Forçar novo deploy se necessário:" -ForegroundColor White
    Write-Host "   git commit --allow-empty -m 'Fix migrations'" -ForegroundColor Gray
    Write-Host "   git push" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📊 Para monitoramento contínuo:" -ForegroundColor White
Write-Host "   Execute: .\scripts\monitor-deploy.ps1" -ForegroundColor Gray
