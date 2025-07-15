# Build command executado no Render
echo "🚀 Iniciando build LoadTech API"
echo "==============================="

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Executar script de deploy (que inclui migrações)
echo "🔧 Executando deploy script..."
npm run deploy

echo "✅ Build concluído com sucesso!"
