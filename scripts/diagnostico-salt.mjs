#!/usr/bin/env node

/**
 * 🔧 Script para testar a descriptografia com diferentes interpretações do salt
 */

import crypto from 'crypto';

const MASTER_KEY = 'LoadTech2024SecretKey0123456789AB';

// Dados do payload real do frontend
const payload = {
    "data": "5e49dc8181a1c72ec2e8008b00e32086d02a08cb3e0e0995eab8eee850f1e97e6a01f2013382c8938ca041a52bc6ae61ef913ef72319f29accc174816eea6f4d",
    "iv": "3decb5127160446c68f2a15bd0659924",
    "salt": "eabaec00f866072b302b4ed1b91ad0cb",
    "tag": "37ecb55cf516619921effa686d0e156f8780060ff43931118e0c1cb47d169056",
    "algorithm": "aes-256-cbc",
    "iterations": 100000,
    "keyLength": 256
};

console.log('🔧 Testando diferentes interpretações do salt...\n');

// Teste 1: Salt como hex string (interpretação atual)
function testSaltAsHex() {
    console.log('📝 Teste 1: Salt como hex string');
    try {
        const key = crypto.pbkdf2Sync(MASTER_KEY, Buffer.from(payload.salt, 'hex'), payload.iterations, payload.keyLength / 8, 'sha256');
        console.log('✅ Chave gerada (hex):', key.toString('hex').substring(0, 16) + '...');
        
        const decipher = crypto.createDecipheriv(payload.algorithm, key, Buffer.from(payload.iv, 'hex'));
        let decrypted = decipher.update(payload.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        console.log('✅ Descriptografia bem-sucedida:', decrypted.substring(0, 50) + '...');
        return decrypted;
    } catch (error) {
        console.log('❌ Falhou:', error.message);
        return null;
    }
}

// Teste 2: Salt como string direta
function testSaltAsString() {
    console.log('\n📝 Teste 2: Salt como string direta');
    try {
        const key = crypto.pbkdf2Sync(MASTER_KEY, payload.salt, payload.iterations, payload.keyLength / 8, 'sha256');
        console.log('✅ Chave gerada (string):', key.toString('hex').substring(0, 16) + '...');
        
        const decipher = crypto.createDecipheriv(payload.algorithm, key, Buffer.from(payload.iv, 'hex'));
        let decrypted = decipher.update(payload.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        console.log('✅ Descriptografia bem-sucedida:', decrypted.substring(0, 50) + '...');
        return decrypted;
    } catch (error) {
        console.log('❌ Falhou:', error.message);
        return null;
    }
}

// Teste 3: Salt como base64
function testSaltAsBase64() {
    console.log('\n📝 Teste 3: Salt como base64');
    try {
        const key = crypto.pbkdf2Sync(MASTER_KEY, Buffer.from(payload.salt, 'base64'), payload.iterations, payload.keyLength / 8, 'sha256');
        console.log('✅ Chave gerada (base64):', key.toString('hex').substring(0, 16) + '...');
        
        const decipher = crypto.createDecipheriv(payload.algorithm, key, Buffer.from(payload.iv, 'hex'));
        let decrypted = decipher.update(payload.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        console.log('✅ Descriptografia bem-sucedida:', decrypted.substring(0, 50) + '...');
        return decrypted;
    } catch (error) {
        console.log('❌ Falhou:', error.message);
        return null;
    }
}

// Teste 4: Verificar se o problema é no IV
function testIVVariations() {
    console.log('\n📝 Teste 4: Testando variações do IV');
    
    const saltBuffer = Buffer.from(payload.salt, 'hex');
    const key = crypto.pbkdf2Sync(MASTER_KEY, saltBuffer, payload.iterations, payload.keyLength / 8, 'sha256');
    
    // IV como hex (padrão)
    try {
        const decipher = crypto.createDecipheriv(payload.algorithm, key, Buffer.from(payload.iv, 'hex'));
        let decrypted = decipher.update(payload.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        console.log('✅ IV como hex funcionou:', decrypted.substring(0, 50) + '...');
        return decrypted;
    } catch (error) {
        console.log('❌ IV como hex falhou:', error.message);
    }
    
    // IV como base64
    try {
        const decipher = crypto.createDecipheriv(payload.algorithm, key, Buffer.from(payload.iv, 'base64'));
        let decrypted = decipher.update(payload.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        console.log('✅ IV como base64 funcionou:', decrypted.substring(0, 50) + '...');
        return decrypted;
    } catch (error) {
        console.log('❌ IV como base64 falhou:', error.message);
    }
    
    return null;
}

// Teste 5: Verificar dados criptografados
function testDataVariations() {
    console.log('\n📝 Teste 5: Testando variações dos dados');
    
    const saltBuffer = Buffer.from(payload.salt, 'hex');
    const key = crypto.pbkdf2Sync(MASTER_KEY, saltBuffer, payload.iterations, payload.keyLength / 8, 'sha256');
    const ivBuffer = Buffer.from(payload.iv, 'hex');
    
    // Dados como hex (padrão)
    try {
        const decipher = crypto.createDecipheriv(payload.algorithm, key, ivBuffer);
        let decrypted = decipher.update(payload.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        console.log('✅ Dados como hex funcionou:', decrypted.substring(0, 50) + '...');
        return decrypted;
    } catch (error) {
        console.log('❌ Dados como hex falhou:', error.message);
    }
    
    // Dados como base64
    try {
        const decipher = crypto.createDecipheriv(payload.algorithm, key, ivBuffer);
        let decrypted = decipher.update(payload.data, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        console.log('✅ Dados como base64 funcionou:', decrypted.substring(0, 50) + '...');
        return decrypted;
    } catch (error) {
        console.log('❌ Dados como base64 falhou:', error.message);
    }
    
    return null;
}

// Executar todos os testes
async function runTests() {
    console.log('🔍 Diagnosticando problema de descriptografia...\n');
    
    const results = [
        testSaltAsHex(),
        testSaltAsString(),
        testSaltAsBase64(),
        testIVVariations(),
        testDataVariations()
    ];
    
    const successCount = results.filter(r => r !== null).length;
    
    console.log('\n📊 === RESULTADOS ===');
    console.log(`✅ Testes bem-sucedidos: ${successCount}/5`);
    console.log(`❌ Testes falharam: ${5 - successCount}/5`);
    
    if (successCount === 0) {
        console.log('\n💡 === POSSÍVEIS CAUSAS ===');
        console.log('1. MASTER_KEY diferente entre frontend e backend');
        console.log('2. Algoritmo de hash diferente na derivação da chave');
        console.log('3. Número de iterações PBKDF2 diferente');
        console.log('4. Dados foram criptografados com parâmetros diferentes');
        console.log('5. Corrupção dos dados durante transmissão');
        
        console.log('\n🔧 === PRÓXIMOS PASSOS ===');
        console.log('1. Verificar exatamente como o frontend criptografa os dados');
        console.log('2. Comparar MASTER_KEY do frontend com backend');
        console.log('3. Verificar se frontend usa crypto-js ou WebCrypto API');
    }
}

runTests().catch(console.error);
