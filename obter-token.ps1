# 🔑 Obter Token Válido - LoadTech
$baseUrl = "http://localhost:3333"

Write-Host "🔑 Obtendo token válido para LoadTech..." -ForegroundColor Cyan

# Credenciais para teste - AJUSTE CONFORME NECESSÁRIO
$email = "admin@loadtech.com.br"  # Substitua por um email válido
$senha = "123456"                 # Substitua pela senha correta

Write-Host "`n📧 Tentando login com: $email" -ForegroundColor Yellow

$loginData = @{
    email = $email
    senha = $senha
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginData -ContentType "application/json"
    
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "Usuário: $($response.usuario.nome)" -ForegroundColor White
    Write-Host "Email: $($response.usuario.email)" -ForegroundColor White
    Write-Host "ID: $($response.usuario.id)" -ForegroundColor White
    
    $token = $response.token
    Write-Host "`n🎫 TOKEN OBTIDO:" -ForegroundColor Green
    Write-Host $token -ForegroundColor Yellow
    
    Write-Host "`n📋 Para usar em seus testes:" -ForegroundColor Cyan
    Write-Host "`$token = `"$token`"" -ForegroundColor White
    
    # Salvar token em arquivo para reutilização
    $token | Out-File -FilePath "token.txt" -Encoding UTF8
    Write-Host "✅ Token salvo em 'token.txt'" -ForegroundColor Green
    
    # Teste rápido do token
    Write-Host "`n🧪 Testando token..." -ForegroundColor Yellow
    $headers = @{
        'Authorization' = "Bearer $token"
        'Content-Type' = 'application/json'
    }
    
    $userCheck = Invoke-RestMethod -Uri "$baseUrl/usuario" -Method GET -Headers $headers
    Write-Host "✅ Token funcionando! Usuário: $($userCheck.nome)" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Falha no login!" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "Credenciais incorretas. Verifique email e senha." -ForegroundColor Yellow
        
        Write-Host "`n💡 Opções:" -ForegroundColor Cyan
        Write-Host "1. Verifique se existe um usuário com email: $email" -ForegroundColor White
        Write-Host "2. Confirme se a senha está correta: $senha" -ForegroundColor White
        Write-Host "3. Cadastre um novo usuário se necessário" -ForegroundColor White
        
        # Oferecer cadastro automático
        $cadastro = Read-Host "`n❓ Deseja cadastrar um novo usuário? (s/n)"
        
        if ($cadastro -eq "s" -or $cadastro -eq "S") {
            Write-Host "`n📝 Cadastrando novo usuário..." -ForegroundColor Yellow
            
            $novoEmail = "teste$(Get-Random -Maximum 9999)@loadtech.com.br"
            $cadastroData = @{
                nome = "Usuário Teste $(Get-Date -Format 'HHmm')"
                email = $novoEmail
                senha = "123456"
                cpf_cnpj = "12345678901"
                telefone = "11999999999"
            } | ConvertTo-Json
            
            try {
                $cadastroResponse = Invoke-RestMethod -Uri "$baseUrl/cadastro" -Method POST -Body $cadastroData -ContentType "application/json"
                Write-Host "✅ Usuário cadastrado!" -ForegroundColor Green
                Write-Host "Email: $novoEmail" -ForegroundColor White
                Write-Host "Senha: 123456" -ForegroundColor White
                
                # Login automático
                $loginData = @{
                    email = $novoEmail
                    senha = "123456"
                } | ConvertTo-Json
                
                $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginData -ContentType "application/json"
                $token = $loginResponse.token
                
                Write-Host "`n🎫 TOKEN DO NOVO USUÁRIO:" -ForegroundColor Green
                Write-Host $token -ForegroundColor Yellow
                
                $token | Out-File -FilePath "token.txt" -Encoding UTF8
                Write-Host "✅ Token salvo em 'token.txt'" -ForegroundColor Green
                
            } catch {
                Write-Host "❌ Erro no cadastro: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
    } else {
        Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n🎯 Script concluído!" -ForegroundColor Cyan
