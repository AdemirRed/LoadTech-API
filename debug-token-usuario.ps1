# Debug detalhado - Token e usuário
$baseUrl = "http://localhost:3001"

Write-Host "DEBUG DETALHADO - Token e Usuário" -ForegroundColor Cyan

$loginData = @{
    email = "ademir1de1oliveira@gmail.com"
    senha = "111111"
} | ConvertTo-Json

Write-Host "1. Login..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    
    Write-Host "Login OK!" -ForegroundColor Green
    Write-Host "Usuario ID: $($loginResponse.usuario.id)" -ForegroundColor Cyan
    Write-Host "Usuario Nome: $($loginResponse.usuario.nome)" -ForegroundColor Cyan
    Write-Host "Usuario Email: $($loginResponse.usuario.email)" -ForegroundColor Cyan
    Write-Host "Token (primeiros 50 chars): $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Cyan
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Vou tentar buscar o usuário para verificar se o token está funcionando
    Write-Host "2. Verificando token via /usuario..." -ForegroundColor Yellow
    
    try {
        $usuarioResponse = Invoke-RestMethod -Uri "$baseUrl/usuario" -Method GET -Headers $headers
        Write-Host "Token funcionando! Usuario recuperado: $($usuarioResponse.nome)" -ForegroundColor Green
        Write-Host "ID do usuario: $($usuarioResponse.id)" -ForegroundColor Cyan
    }
    catch {
        Write-Host "Erro ao verificar usuario: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "3. Tentando /minha-loja..." -ForegroundColor Yellow
    $minhaLojaResponse = Invoke-RestMethod -Uri "$baseUrl/minha-loja" -Method GET -Headers $headers
    
    Write-Host "LOJA ENCONTRADA:" -ForegroundColor Green
    Write-Host "ID: $($minhaLojaResponse.id)" -ForegroundColor Green
    Write-Host "Nome: $($minhaLojaResponse.nome_loja)" -ForegroundColor Green
    Write-Host "User ID: $($minhaLojaResponse.user_id)" -ForegroundColor Green
    
}
catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        try {
            $error = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Detalhes: $($error.erro)" -ForegroundColor Yellow
        } catch {
            Write-Host "Resposta bruta: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
    }
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}
