#!/usr/bin/env node

/**
 * 🔍 DEBUG SIMPLES - Testar descriptografia PBKDF2
 * ===============================================
 * 
 * Teste focado em verificar se o problema é na criptografia ou no middleware
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'https://loadtech-api.onrender.com';
const MASTER_KEY = 'LoadTech2024SecretKey0123456789AB';

async function testeSimples() {
  console.log('🧪 TESTE SIMPLES DE DESCRIPTOGRAFIA\n');

  // Teste 1: Login sem criptografia (deve funcionar)
  console.log('1️⃣ Testando login SEM criptografia...');
  try {
    const response1 = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ademir.santos@loadtech.com.br',
        senha: 'LoadTech@2025!'
      })
    });

    const result1 = await response1.json();
    console.log(`Status: ${response1.status}`);
    
    if (response1.ok) {
      console.log('✅ Login sem criptografia OK');
      console.log(`👤 Usuário: ${result1.user?.nome}`);
    } else {
      console.log('❌ Login sem criptografia falhou:', result1);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 2: Verificar se middleware de descriptografia está ativo
  console.log('\n2️⃣ Testando se middleware de descriptografia está ativo...');
  const sessionId = 'test-session-simple';
  
  // Simular dados criptografados inválidos
  try {
    const response2 = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId 
      },
      body: JSON.stringify({
        encrypted: true,
        data: {
          data: 'dados_invalidos',
          iv: 'iv_invalido',
          tag: 'tag_invalida',
          timestamp: Date.now(),
          signature: 'signature_invalida'
        }
      })
    });

    const result2 = await response2.json();
    console.log(`Status: ${response2.status}`);
    console.log(`Resposta:`, result2);
    
    if (result2.codigo === 'CRYPTO_ERROR') {
      console.log('✅ Middleware de descriptografia ESTÁ ativo');
    } else {
      console.log('❌ Middleware de descriptografia NÃO está ativo');
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }

  // Teste 3: Testar com a mesma criptografia do backend
  console.log('\n3️⃣ Testando criptografia compatível...');
  try {
    // Usar mesmo algoritmo do backend
    const plaintext = JSON.stringify({
      email: 'ademir.santos@loadtech.com.br',
      senha: 'LoadTech@2025!'
    });
    
    const key = crypto.pbkdf2Sync(MASTER_KEY, sessionId, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    const timestamp = Date.now();
    
    // Gerar signature
    const hmac = crypto.createHmac('sha256', MASTER_KEY);
    hmac.update(Buffer.from(encrypted, 'hex'));
    hmac.update(iv);
    hmac.update(tag);
    hmac.update(timestamp.toString());
    hmac.update(sessionId);
    const signature = hmac.digest('hex');
    
    const encryptedPayload = {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      timestamp: timestamp,
      signature: signature
    };
    
    console.log('📦 Payload gerado:');
    console.log('🔑 Session ID:', sessionId);
    console.log('📊 Tamanho encrypted:', encrypted.length);
    
    const response3 = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId 
      },
      body: JSON.stringify({
        encrypted: true,
        data: encryptedPayload
      })
    });

    const result3 = await response3.json();
    console.log(`Status: ${response3.status}`);
    
    if (response3.ok) {
      console.log('✅ Login com criptografia PBKDF2 funcionou!');
      console.log(`👤 Usuário: ${result3.user?.nome}`);
    } else {
      console.log('❌ Login com criptografia falhou:', result3);
    }
    
  } catch (error) {
    console.log('❌ Erro no teste de criptografia:', error.message);
  }
}

testeSimples().catch(console.error);
