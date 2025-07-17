#!/usr/bin/env node

/**
 * 🔍 Script de debug para diagnosticar problemas de criptografia no login
 * Simula exatamente o payload do frontend para encontrar a causa do erro 400
 */

import crypto from 'crypto';
import fetch from 'node-fetch';

// Chave mestra (deve ser igual ao .env)
const MASTER_KEY = 'LoadTech2024SecretKey0123456789AB';

console.log('\n🔍 === DEBUG CRIPTOGRAFIA LOGIN ===\n');

// Simular exatamente o payload do frontend
const frontendPayload = {
    "data": "5e49dc8181a1c72ec2e8008b00e32086d02a08cb3e0e0995eab8eee850f1e97e6a01f2013382c8938ca041a52bc6ae61ef913ef72319f29accc174816eea6f4d",
    "iv": "3decb5127160446c68f2a15bd0659924",
    "salt": "eabaec00f866072b302b4ed1b91ad0cb",
    "tag": "37ecb55cf516619921effa686d0e156f8780060ff43931118e0c1cb47d169056",
    "algorithm": "aes-256-cbc",
    "iterations": 100000,
    "keyLength": 256
};

console.log('📦 Payload do frontend:', JSON.stringify(frontendPayload, null, 2));

// Tentar descriptografar localmente
function testLocalDecryption() {
    console.log('\n🔓 === TESTE DE DESCRIPTOGRAFIA LOCAL ===');
    
    try {
        const { data, iv, salt, algorithm, iterations, keyLength } = frontendPayload;
        
        console.log('🔑 Derivando chave com PBKDF2...');
        const key = crypto.pbkdf2Sync(MASTER_KEY, salt, iterations, keyLength / 8, 'sha256');
        console.log('✅ Chave derivada:', key.toString('hex').substring(0, 16) + '...');
        
        console.log('🔓 Descriptografando com AES-256-CBC...');
        const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
        
        let decrypted = decipher.update(data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        console.log('✅ Dados descriptografados:', decrypted);
        
        try {
            const parsed = JSON.parse(decrypted);
            console.log('✅ JSON válido:', parsed);
            return parsed;
        } catch (e) {
            console.log('⚠️  Não é JSON válido, mas descriptografia funcionou');
            return decrypted;
        }
        
    } catch (error) {
        console.error('❌ Erro na descriptografia local:', error.message);
        return null;
    }
}

// Testar envio para a API
async function testAPICall() {
    console.log('\n🌐 === TESTE DE ENVIO PARA API ===');
    
    try {
        const response = await fetch('https://loadtech-api.onrender.com/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Accept-Crypto': 'true'
            },
            body: JSON.stringify(frontendPayload)
        });
        
        console.log('📡 Status da resposta:', response.status);
        console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📡 Corpo da resposta:', responseText);
        
        if (response.status === 400) {
            console.log('❌ Erro 400 confirmado - problema na descriptografia do backend');
        }
        
    } catch (error) {
        console.error('❌ Erro na chamada da API:', error.message);
    }
}

// Testar formato esperado pelo backend
function testBackendFormat() {
    console.log('\n🔄 === CONVERTENDO PARA FORMATO BACKEND ===');
    
    const backendPayload = {
        encrypted: true,
        payload: frontendPayload
    };
    
    console.log('📦 Payload para backend:', JSON.stringify(backendPayload, null, 2));
    return backendPayload;
}

// Executar todos os testes
async function runAllTests() {
    console.log('🚀 Iniciando testes de debug...\n');
    
    // 1. Testar descriptografia local
    const localResult = testLocalDecryption();
    
    // 2. Testar formato backend
    const backendFormat = testBackendFormat();
    
    // 3. Testar envio para API
    await testAPICall();
    
    console.log('\n📋 === RESUMO DOS TESTES ===');
    console.log('✅ Descriptografia local:', localResult ? 'SUCESSO' : 'FALHOU');
    console.log('✅ Formato backend:', backendFormat ? 'CRIADO' : 'FALHOU');
    console.log('⚠️  API retornou 400 - investigar logs do backend');
    
    console.log('\n🔧 === RECOMENDAÇÕES ===');
    console.log('1. Verificar se o backend está usando decryptHybrid()');
    console.log('2. Verificar se CRYPTO_DEBUG=true está ativo');
    console.log('3. Verificar logs do Render para erro específico');
    console.log('4. Confirmar CRYPTO_MASTER_KEY igual em frontend e backend');
}

// Executar
runAllTests().catch(console.error);
