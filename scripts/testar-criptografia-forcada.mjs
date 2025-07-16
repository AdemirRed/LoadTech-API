#!/usr/bin/env node

/**
 * 🔐 TESTE DE CRIPTOGRAFIA FORÇADA
 * ===============================
 * 
 * Testa se o backend está forçando criptografia mesmo
 * quando o frontend não envia o header x-accept-crypto
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'https://loadtech-api.onrender.com';
const MASTER_KEY = 'LoadTech2024SecretKey0123456789AB';

async function testarCriptografiaForcada() {
  console.log('🔐 TESTE DE CRIPTOGRAFIA FORÇADA');
  console.log('================================\n');

  // Primeiro fazer login para obter token
  console.log('1️⃣ Fazendo login...');
  const sessionId = crypto.randomBytes(16).toString('hex');
  
  // Criptografar dados de login
  const loginData = { email: 'admin@loadtech.com.br', senha: 'LoadTech@2025!' };
  const encryptedLogin = criptografarDados(loginData, sessionId);
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        encrypted: true,
        data: encryptedLogin
      })
    });

    const loginResult = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Login falhou:', loginResult);
      return;
    }

    console.log('✅ Login OK');
    const token = loginResult.token;

    // Teste 2: Acessar endpoint SEM header x-accept-crypto
    console.log('\n2️⃣ Testando endpoint SEM header x-accept-crypto...');
    const response1 = await fetch(`${BASE_URL}/api/usuario`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Session-ID': sessionId
        // NÃO enviando x-accept-crypto
      }
    });

    const result1 = await response1.json();
    console.log('Resposta sem header:', JSON.stringify(result1, null, 2));
    
    if (result1.encrypted) {
      console.log('✅ Criptografia FORÇADA funcionando - dados criptografados mesmo sem header');
    } else if (result1.nome) {
      console.log('❌ Dados descriptografados - criptografia NÃO está sendo forçada');
    } else {
      console.log('⚠️ Resposta inesperada');
    }

    // Teste 3: Acessar endpoint COM header x-accept-crypto
    console.log('\n3️⃣ Testando endpoint COM header x-accept-crypto...');
    const response2 = await fetch(`${BASE_URL}/api/usuario`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Session-ID': sessionId,
        'x-accept-crypto': 'true'
      }
    });

    const result2 = await response2.json();
    console.log('Resposta com header:', JSON.stringify(result2, null, 2));
    
    if (result2.encrypted) {
      console.log('✅ Criptografia com header funcionando');
    } else {
      console.log('❌ Criptografia com header falhou');
    }

    // Resumo
    console.log('\n📊 RESUMO:');
    console.log(`🔒 Sem header x-accept-crypto: ${result1.encrypted ? 'CRIPTOGRAFADO ✅' : 'DESCRIPTOGRAFADO ❌'}`);
    console.log(`🔐 Com header x-accept-crypto: ${result2.encrypted ? 'CRIPTOGRAFADO ✅' : 'DESCRIPTOGRAFADO ❌'}`);
    
    if (result1.encrypted && result2.encrypted) {
      console.log('\n🎉 CRIPTOGRAFIA FORÇADA FUNCIONANDO CORRETAMENTE!');
    } else if (!result1.encrypted && result2.encrypted) {
      console.log('\n⚠️ CRIPTOGRAFIA FUNCIONANDO APENAS COM HEADER - FORCE NÃO ESTÁ ATIVO');
    } else {
      console.log('\n❌ PROBLEMA NA CONFIGURAÇÃO DE CRIPTOGRAFIA');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

function criptografarDados(data, sessionId) {
  const plaintext = JSON.stringify(data);
  const key = crypto.pbkdf2Sync(MASTER_KEY, sessionId, 100000, 32, 'sha256');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  const timestamp = Date.now();
  
  const hmac = crypto.createHmac('sha256', MASTER_KEY);
  hmac.update(Buffer.from(encrypted, 'hex'));
  hmac.update(iv);
  hmac.update(tag);
  hmac.update(timestamp.toString());
  hmac.update(sessionId);
  const signature = hmac.digest('hex');
  
  return {
    data: encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    timestamp: timestamp,
    signature: signature
  };
}

testarCriptografiaForcada().catch(console.error);
