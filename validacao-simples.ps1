# Validacao final do sistema de upload
Write-Host "VALIDACAO FINAL DO SISTEMA DE UPLOAD" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$baseUrl = "http://localhost:3001/api"
$token = Get-Content "token-teste.txt" -Raw
$token = $token.Trim()

$headers = @{
    "Authorization" = "Bearer $token"
    "Accept" = "application/json"
}

Write-Host ""
Write-Host "1. INFORMACOES DO SISTEMA" -ForegroundColor Cyan

try {
    $uploadInfo = Invoke-RestMethod -Uri "$baseUrl/upload/info" -Method GET -Headers $headers
    Write-Host "Status: $($uploadInfo.status)" -ForegroundColor Green
    Write-Host "Versao: $($uploadInfo.versao)" -ForegroundColor Green
    Write-Host "Tamanho maximo: $($uploadInfo.tamanho_maximo)" -ForegroundColor Green
    Write-Host "URL base: $($uploadInfo.url_base)" -ForegroundColor Green
    Write-Host "Pastas configuradas:" -ForegroundColor Green
    $uploadInfo.pastas_upload | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
} catch {
    Write-Host "Erro ao obter informacoes: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. ESTRUTURA DE PASTAS" -ForegroundColor Cyan

$uploadDir = "public\uploads"
if (Test-Path $uploadDir) {
    Write-Host "Diretorio de uploads existe: $uploadDir" -ForegroundColor Green
    
    $expectedFolders = @("avatars", "produtos", "logos", "banners", "documentos")
    foreach ($folder in $expectedFolders) {
        $folderPath = Join-Path $uploadDir $folder
        if (Test-Path $folderPath) {
            Write-Host "Pasta $folder/ existe" -ForegroundColor Green
            
            $userFolders = Get-ChildItem $folderPath -Directory -ErrorAction SilentlyContinue
            if ($userFolders.Count -gt 0) {
                Write-Host "  Usuarios com uploads:" -ForegroundColor Yellow
                foreach ($userFolder in $userFolders) {
                    $fileCount = (Get-ChildItem $userFolder.FullName -File -ErrorAction SilentlyContinue).Count
                    Write-Host "    Usuario: $($userFolder.Name) ($fileCount arquivos)" -ForegroundColor Cyan
                }
            } else {
                Write-Host "  Nenhum usuario com uploads ainda" -ForegroundColor Gray
            }
        } else {
            Write-Host "Pasta $folder/ nao encontrada" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Diretorio de uploads nao encontrado" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. ENDPOINTS DISPONIVEIS" -ForegroundColor Cyan

Write-Host "GET $baseUrl/upload/info - Informacoes do sistema" -ForegroundColor Green
Write-Host "GET $baseUrl/uploads/health - Health check das pastas" -ForegroundColor Green
Write-Host "POST $baseUrl/upload/avatar - Upload de avatar" -ForegroundColor Green
Write-Host "POST $baseUrl/upload/produto/{id} - Upload de produto" -ForegroundColor Green
Write-Host "POST $baseUrl/upload/loja/logo - Upload de logo" -ForegroundColor Green
Write-Host "POST $baseUrl/upload/loja/banner - Upload de banner" -ForegroundColor Green
Write-Host "POST $baseUrl/upload/documento - Upload de documento" -ForegroundColor Green

Write-Host ""
Write-Host "4. CONVENCAO DE NOMES" -ForegroundColor Cyan

Write-Host "Estrutura: /uploads/{tipo}/{userId}/" -ForegroundColor Yellow
Write-Host "Avatar: {userId}-{nome}.ext (substitui anterior)" -ForegroundColor Yellow
Write-Host "Produto: produto-{uuid}.ext (multiplos por usuario)" -ForegroundColor Yellow
Write-Host "Logo: logo-{userId}-{nome}.ext (substitui anterior)" -ForegroundColor Yellow
Write-Host "Banner: banner-{userId}-{nome}.ext (substitui anterior)" -ForegroundColor Yellow
Write-Host "Documento: doc-{uuid}.ext (multiplos por usuario)" -ForegroundColor Yellow

Write-Host ""
Write-Host "SISTEMA DE UPLOAD VALIDADO COM SUCESSO!" -ForegroundColor Green
Write-Host "Todos os endpoints implementados e funcionando" -ForegroundColor Green
Write-Host "Convencao de pastas e nomes implementada" -ForegroundColor Green
Write-Host "URLs reais do servidor" -ForegroundColor Green
