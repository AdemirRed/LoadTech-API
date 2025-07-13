// 🔐 Configuração de Criptografia LoadTech
// Arquivo para configurar no frontend

export const CRYPTO_CONFIG = {
    // 🔑 MESMA CHAVE DO BACKEND
    MASTER_KEY: 'loadtech_crypto_master_key_2025_muito_segura_producao_deve_ser_diferente',
    
    // 🔧 Configurações da API
    API_URL: 'http://localhost:3001',
    
    // 📝 Headers obrigatórios
    HEADERS: {
        'Content-Type': 'application/json',
        'x-accept-crypto': 'true'
    },
    
    // ⚙️ Configurações de ambiente
    DEBUG: process.env.NODE_ENV === 'development',
    
    // 🚨 Estado da API (configurar conforme .env do backend)
    API_CRYPTO_STATE: {
        ENABLED: true,      // CRYPTO_ENABLED=true
        FORCE: true,        // CRYPTO_FORCE=true  
        ALLOW_PLAIN: false, // CRYPTO_ALLOW_PLAINTEXT=false
        DEBUG: false        // CRYPTO_DEBUG=false
    }
};

// ℹ️ Estados possíveis da API:
// FORCE=true  → API sempre espera dados criptografados
// FORCE=false → API detecta header x-accept-crypto
// ENABLED=false → API não usa criptografia

export default CRYPTO_CONFIG;
