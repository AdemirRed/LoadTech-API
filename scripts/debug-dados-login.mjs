#!/usr/bin/env node

/**
 * 🔬 DEBUG - DADOS DE LOGIN
 * =========================
 * 
 * Analisa exatamente quais dados estão sendo enviados
 * e como estão sendo interpretados pelo backend.
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'https://loadtech-api.onrender.com';
const MASTER_KEY = 'LoadTech2024SecretKey0123456789AB';

class CryptoTester {
  constructor() {
    this.MASTER_KEY = MASTER_KEY;
  }

  deriveKey(salt) {
    return crypto.pbkdf2Sync(this.MASTER_KEY, salt, 100000, 32, 'sha256');
  }

  encrypt(data, sessionId) {
    const plaintext = JSON.stringify(data);
    const iv = crypto.randomBytes(16);
    const key = this.deriveKey(sessionId);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    const timestamp = Date.now();
    
    const hmac = crypto.createHmac('sha256', this.MASTER_KEY);
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
}

async function debugLogin() {
  console.log('🔬 DEBUG - ANÁLISE DE DADOS DE LOGIN');
  console.log('====================================\n');

  const tester = new CryptoTester();
  const sessionId = 'debug-session-123';

  // Teste 1: Dados básicos
  console.log('1️⃣ TESTE COM DADOS BÁSICOS');
  console.log('---------------------------');
  const dadosBasicos = {
    email: 'ademir.santos@loadtech.com.br',
    senha: 'LoadTech@2025!'
  };

  console.log('📦 Dados originais:');
  console.log(JSON.stringify(dadosBasicos, null, 2));

  console.log('\n📝 Dados como string JSON:');
  const jsonString = JSON.stringify(dadosBasicos);
  console.log(jsonString);

  const encrypted1 = tester.encrypt(dadosBasicos, sessionId);
  
  console.log('\n📊 Payload criptografado:');
  console.log(`Data length: ${encrypted1.data.length}`);
  console.log(`IV: ${encrypted1.iv}`);
  console.log(`Tag: ${encrypted1.tag}`);

  // Enviar para API
  console.log('\n🚀 Enviando para API...');
  try {
    const response1 = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        encrypted: true,
        data: encrypted1
      })
    });

    console.log(`Status: ${response1.status} ${response1.statusText}`);
    
    const result1 = await response1.json();
    console.log('Resposta:', JSON.stringify(result1, null, 2));
    
  } catch (error) {
    console.error('Erro:', error.message);
  }

  // Teste 2: Comparação com login não-criptografado
  console.log('\n\n2️⃣ TESTE SEM CRIPTOGRAFIA (COMPARAÇÃO)');
  console.log('---------------------------------------');
  
  try {
    const response2 = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosBasicos)
    });

    console.log(`Status: ${response2.status} ${response2.statusText}`);
    
    const result2 = await response2.json();
    console.log('Resposta:', JSON.stringify(result2, null, 2));
    
  } catch (error) {
    console.error('Erro:', error.message);
  }

  // Teste 3: Diferentes variações de dados
  console.log('\n\n3️⃣ TESTE COM VARIAÇÕES DE DADOS');
  console.log('--------------------------------');
  
  const variacoes = [
    { email: 'ademir.santos@loadtech.com.br', senha: 'LoadTech@2025!' },
    { email: 'ademir.santos@loadtech.com.br', password: 'LoadTech@2025!' },
    { usuario: 'ademir.santos@loadtech.com.br', senha: 'LoadTech@2025!' }
  ];

  for (let i = 0; i < variacoes.length; i++) {
    const variacao = variacoes[i];
    console.log(`\n📋 Variação ${i + 1}:`, JSON.stringify(variacao));
    
    const encryptedVar = tester.encrypt(variacao, `${sessionId}-${i}`);
    
    try {
      const responseVar = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': `${sessionId}-${i}`
        },
        body: JSON.stringify({
          encrypted: true,
          data: encryptedVar
        })
      });

      const resultVar = await responseVar.json();
      console.log(`Status: ${responseVar.status}`, resultVar.erro || resultVar.message || 'OK');
      
    } catch (error) {
      console.error('Erro:', error.message);
    }
  }
}

debugLogin().catch(console.error);
