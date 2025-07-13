# Teste de criação de nova loja
$baseUrl = "http://localhost:3001"

Write-Host "CRIANDO NOVA LOJA PARA ADEMIR" -ForegroundColor Green

$loginData = @{
    email = "ademir1de1oliveira@gmail.com"
    senha = "111111"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    
    Write-Host "✅ Login OK! User: $($loginResponse.user.nome)" -ForegroundColor Green
    Write-Host "🆔 User ID: $($loginResponse.user.id)" -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Primeiro verificar se já existe loja
    Write-Host "`n🔍 Verificando se já existe loja..." -ForegroundColor Yellow
    try {
        $lojaExistente = Invoke-RestMethod -Uri "$baseUrl/api/loja" -Method GET -Headers $headers
        Write-Host "❌ Usuário JÁ tem loja: $($lojaExistente.nome_loja)" -ForegroundColor Red
        return
    } catch {
        Write-Host "✅ Usuário não tem loja. Criando nova..." -ForegroundColor Green
    }
    
    # Criar nova loja
    Write-Host "`n🏪 Criando nova loja..." -ForegroundColor Yellow
    
    $dadosLoja = @{
        nome_loja = "Loja do Ademir"
        descricao = "Loja criada para o usuário Ademir"
        telefone_loja = "51997756708"
        email_loja = "loja@ademir.com"
        whatsapp = "51997756708"
        tema_cor_primaria = "#0066cc"
        tema_cor_secundaria = "#004499"
    } | ConvertTo-Json
    
    Write-Host "Dados da loja:" -ForegroundColor Cyan
    Write-Host $dadosLoja -ForegroundColor White
    
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/loja" -Method POST -Body $dadosLoja -Headers $headers
    
    Write-Host "`n🎉 LOJA CRIADA COM SUCESSO!" -ForegroundColor Green
    Write-Host "🆔 ID: $($createResponse.loja.id)" -ForegroundColor White
    Write-Host "🏪 Nome: $($createResponse.loja.nome_loja)" -ForegroundColor White
    Write-Host "🔗 Slug: $($createResponse.loja.slug)" -ForegroundColor White
    Write-Host "👤 User ID: $($createResponse.loja.user_id)" -ForegroundColor White
    
    # Agora tentar buscar a loja criada
    Write-Host "`n🔍 Verificando se consegue buscar a loja..." -ForegroundColor Yellow
    
    Start-Sleep -Seconds 2
    
    $lojaBuscada = Invoke-RestMethod -Uri "$baseUrl/api/loja" -Method GET -Headers $headers
    
    Write-Host "✅ LOJA ENCONTRADA APÓS CRIAÇÃO!" -ForegroundColor Green
    Write-Host "🆔 ID: $($lojaBuscada.id)" -ForegroundColor White
    Write-Host "🏪 Nome: $($lojaBuscada.nome_loja)" -ForegroundColor White
    
    Write-Host "`n🚀 PROBLEMA RESOLVIDO COMPLETAMENTE!" -ForegroundColor Magenta
    
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        try {
            $error = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "📝 Detalhes: $($error.erro)" -ForegroundColor Yellow
        } catch {
            Write-Host "📝 Resposta: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
    }
}
