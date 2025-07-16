import crypto from 'crypto';
import fetch from 'node-fetch';

const CRYPTO_KEY = 'LoadTech2024SecretKey0123456789AB';

// Função de derivação simples (igual ao frontend)
function deriveKeySimple(masterKey) {
    return crypto.createHash('sha256').update(masterKey).digest();
}

// Criptografia simples
function encryptSimple(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return { iv: iv.toString('hex'), encryptedData: encrypted };
}

// Criptografia AES-GCM
function encryptAESGCM(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM('aes-256-gcm', key);
    cipher.setIVLength(16);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted,
        authTag: authTag.toString('hex')
    };
}

// Teste múltiplos formatos
async function testarFormatos() {
    console.log('🔧 Testando múltiplos formatos de criptografia...\n');
    
    const userData = {
        email: 'test@loadtech.com',
        senha: 'MinhaSenh@123'
    };
    
    const key = deriveKeySimple(CRYPTO_KEY);
    
    // Formato 1: Simples com createCipher
    console.log('📋 Teste 1: Formato createCipher');
    try {
        const encrypted1 = encryptSimple(JSON.stringify(userData), key);
        console.log('IV:', encrypted1.iv.substring(0, 16) + '...');
        console.log('Data:', encrypted1.encryptedData.substring(0, 50) + '...');
        
        const response1 = await fetch('https://loadtech-api.onrender.com/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Crypto-IV': encrypted1.iv,
                'X-Encrypted': 'true'
            },
            body: JSON.stringify({ encryptedData: encrypted1.encryptedData })
        });
        
        console.log('Status:', response1.status);
        const result1 = await response1.text();
        console.log('Response:', result1.substring(0, 200));
        console.log('---\n');
    } catch (err) {
        console.log('Erro:', err.message);
        console.log('---\n');
    }
    
    // Formato 2: AES-GCM
    console.log('📋 Teste 2: Formato AES-GCM');
    try {
        const encrypted2 = encryptAESGCM(JSON.stringify(userData), key);
        console.log('IV:', encrypted2.iv.substring(0, 16) + '...');
        console.log('AuthTag:', encrypted2.authTag);
        
        const response2 = await fetch('https://loadtech-api.onrender.com/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Crypto-IV': encrypted2.iv,
                'X-Crypto-Tag': encrypted2.authTag,
                'X-Encrypted': 'true'
            },
            body: JSON.stringify({ encryptedData: encrypted2.encryptedData })
        });
        
        console.log('Status:', response2.status);
        const result2 = await response2.text();
        console.log('Response:', result2.substring(0, 200));
        console.log('---\n');
    } catch (err) {
        console.log('Erro:', err.message);
        console.log('---\n');
    }
    
    // Formato 3: Dados não criptografados (controle)
    console.log('📋 Teste 3: Dados não criptografados (controle)');
    try {
        const response3 = await fetch('https://loadtech-api.onrender.com/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        console.log('Status:', response3.status);
        const result3 = await response3.text();
        console.log('Response:', result3.substring(0, 200));
        console.log('---\n');
    } catch (err) {
        console.log('Erro:', err.message);
        console.log('---\n');
    }
    
    // Formato 4: Simular exatamente o frontend Vite
    console.log('📋 Teste 4: Simulando formato frontend Vite');
    try {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-cbc', CRYPTO_KEY);
        
        let encrypted = cipher.update(JSON.stringify(userData), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const response4 = await fetch('https://loadtech-api.onrender.com/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Crypto-IV': iv.toString('hex'),
                'X-Encrypted': 'true'
            },
            body: JSON.stringify({ encryptedData: encrypted })
        });
        
        console.log('Status:', response4.status);
        const result4 = await response4.text();
        console.log('Response:', result4.substring(0, 200));
        console.log('---\n');
    } catch (err) {
        console.log('Erro:', err.message);
        console.log('---\n');
    }
}

await testarFormatos();
