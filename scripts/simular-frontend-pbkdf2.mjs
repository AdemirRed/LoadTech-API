#!/usr/bin/env node

/**
 * 🧪 TESTE - SIMULAÇÃO FRONTEND PBKDF2
 * ====================================
 * 
 * Simula como o frontend DEVERIA estar enviando dados
 * com PBKDF2, para validar se o backend funciona.
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'https://loadtech-api.onrender.com';
const MASTER_KEY = 'LoadTech2024SecretKey0123456789AB';

// Simulação exata do que o frontend DEVERIA fazer com PBKDF2
class FrontendPBKDF2Simulator {
  constructor() {
    this.MASTER_KEY = MASTER_KEY;
    this.ALGORITHM = 'aes-256-gcm';
    this.KEY_LENGTH = 32;
    this.IV_LENGTH = 16;
  }

  // PBKDF2 igual ao backend
  deriveKey(salt) {
    return crypto.pbkdf2Sync(this.MASTER_KEY, salt, 100000, this.KEY_LENGTH, 'sha256');
  }

  encrypt(data, sessionId = 'default') {
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = this.deriveKey(sessionId);
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    const timestamp = Date.now();
    
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      timestamp: timestamp,
      signature: this.generateSignature(Buffer.from(encrypted, 'hex'), iv, tag, timestamp, sessionId)
    };
  }

  generateSignature(encrypted, iv, tag, timestamp, sessionId) {
    const hmac = crypto.createHmac('sha256', this.MASTER_KEY);
    hmac.update(encrypted);
    hmac.update(iv);
    hmac.update(tag);
    hmac.update(timestamp.toString());
    hmac.update(sessionId);
    return hmac.digest('hex');
  }
}

async function testarFrontendPBKDF2Simulado() {
  console.log('🧪 TESTE - FRONTEND PBKDF2 SIMULADO');
  console.log('====================================');
  console.log('🎯 Objetivo: Validar se backend aceita PBKDF2 puro\n');

  const simulator = new FrontendPBKDF2Simulator();
  const sessionId = crypto.randomBytes(16).toString('hex');
  
  // Dados de login
  const loginData = {
    email: 'ademir.santos@loadtech.com.br',
    senha: 'LoadTech@2025!'
  };

  console.log('📊 Dados de teste:');
  console.log(`📧 Email: ${loginData.email}`);
  console.log(`🔑 Session ID: ${sessionId}`);
  console.log(`🔐 Método: PBKDF2 (100.000 iterações)\n`);

  try {
    // 1. Gerar chave PBKDF2
    const key = simulator.deriveKey(sessionId);
    console.log('1️⃣ Chave PBKDF2 gerada:');
    console.log(`🔑 ${key.toString('hex')}\n`);

    // 2. Criptografar dados
    const encryptedData = simulator.encrypt(loginData, sessionId);
    console.log('2️⃣ Dados criptografados:');
    console.log(`📦 Data: ${encryptedData.data.substring(0, 32)}...`);
    console.log(`🔢 IV: ${encryptedData.iv}`);
    console.log(`🏷️ Tag: ${encryptedData.tag}`);
    console.log(`⏰ Timestamp: ${encryptedData.timestamp}`);
    console.log(`✍️ Signature: ${encryptedData.signature.substring(0, 16)}...\n`);

    // 3. Enviar para API
    console.log('3️⃣ Enviando para API...');
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId,
        'Origin': 'https://loadtech.netlify.app'
      },
      body: JSON.stringify({
        encrypted: true,
        data: encryptedData
      })
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const result = await response.json();

    if (response.ok) {
      console.log('\n✅ SUCESSO - PBKDF2 FUNCIONANDO!');
      console.log('🎉 Backend aceita corretamente dados PBKDF2');
      console.log('👤 Usuário logado:', result.user?.name);
      console.log('🎫 Token gerado:', result.token ? 'SIM' : 'NÃO');
      
      return { success: true, token: result.token, sessionId };
    } else {
      console.log('\n❌ FALHA - PBKDF2 NÃO FUNCIONANDO');
      console.log('💡 Possíveis causas:');
      console.log('   • Backend ainda espera SHA256');
      console.log('   • Erro na descriptografia');
      console.log('   • Problema na assinatura');
      console.log('📄 Erro detalhado:', result);
      
      return { success: false, error: result };
    }

  } catch (error) {
    console.error('\n💥 ERRO FATAL:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  // Aguardar deploy
  console.log('⏳ Aguardando deploy no Render (10 segundos)...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));

  const result = await testarFrontendPBKDF2Simulado();

  console.log('\n📋 RELATÓRIO FINAL');
  console.log('==================');
  if (result.success) {
    console.log('✅ Backend está pronto para PBKDF2 puro');
    console.log('🚀 Pode remover modo de compatibilidade');
    console.log('🔒 Sistema 100% seguro');
  } else {
    console.log('❌ Backend ainda não aceita PBKDF2 puro');
    console.log('⚠️ Necessário manter compatibilidade temporária');
    console.log('🔧 Ou verificar configurações de deploy');
  }
}

main().catch(console.error);
