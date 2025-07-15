# Script para monitorar o deploy no Render
# Execute este script após fazer o deploy para validar se tudo está funcionando

Write-Host "=== MONITOR DE DEPLOY - LOADTECH API ===" -ForegroundColor Green
Write-Host ""

# URL base da API no Render (você deve substituir pela URL real)
$BASE_URL = "https://loadtech-api.onrender.com"  # Substitua pela sua URL real
$API_URL = "$BASE_URL/api"

Write-Host "Testando conectividade com o servidor..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method GET -TimeoutSec 30
    Write-Host "✅ Servidor online!" -ForegroundColor Green
    Write-Host "Status: $($response.status)" -ForegroundColor White
} catch {
    Write-Host "❌ Erro ao conectar com o servidor" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "1. Deploy ainda em andamento" -ForegroundColor White
    Write-Host "2. URL incorreta (verifique no dashboard do Render)" -ForegroundColor White
    Write-Host "3. Erro nas migrações do banco" -ForegroundColor White
    Write-Host "4. Problemas com variáveis de ambiente" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Testando endpoint de login..." -ForegroundColor Yellow

# Dados de teste para login
$loginData = @{
    email = "admin@loadtech.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginData -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ Login funcionando!" -ForegroundColor Green
    
    $token = $loginResponse.token
    Write-Host "Token obtido: $($token.Substring(0, 20))..." -ForegroundColor White
    
    # Salvar token para outros testes
    $token | Out-File -FilePath "token-deploy.txt" -Encoding UTF8
    
    Write-Host ""
    Write-Host "Testando endpoint protegido..." -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $userResponse = Invoke-RestMethod -Uri "$API_URL/auth/me" -Method GET -Headers $headers -TimeoutSec 30
    Write-Host "✅ Autenticação funcionando!" -ForegroundColor Green
    Write-Host "Usuário: $($userResponse.name) ($($userResponse.email))" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erro no teste de login" -ForegroundColor Red
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testando sistema de upload..." -ForegroundColor Yellow

try {
    $uploadTestResponse = Invoke-RestMethod -Uri "$API_URL/upload/test" -Method GET -TimeoutSec 30
    Write-Host "✅ Sistema de upload acessível!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Sistema de upload pode não estar funcionando" -ForegroundColor Yellow
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== RESUMO DO DEPLOY ===" -ForegroundColor Green
Write-Host "📊 Para acompanhar logs detalhados:" -ForegroundColor White
Write-Host "   1. Acesse o dashboard do Render" -ForegroundColor White
Write-Host "   2. Vá em 'Logs' do seu serviço" -ForegroundColor White
Write-Host "   3. Verifique se as migrações rodaram com sucesso" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Para verificar variáveis de ambiente:" -ForegroundColor White
Write-Host "   1. Vá em 'Environment' no dashboard" -ForegroundColor White
Write-Host "   2. Confirme se DATABASE_URL está configurada" -ForegroundColor White
Write-Host "   3. Verifique ASAAS_API_KEY e JWT_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "📁 URLs importantes:" -ForegroundColor White
Write-Host "   API Base: $BASE_URL" -ForegroundColor White
Write-Host "   Docs: $BASE_URL/docs" -ForegroundColor White
Write-Host "   Health: $BASE_URL/health" -ForegroundColor White
