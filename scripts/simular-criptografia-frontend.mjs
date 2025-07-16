#!/usr/bin/env node

import crypto from 'crypto';
import fetch from 'node-fetch';

console.log('🔐 Simulando criptografia exata do frontend...\n');

// Função para criptografar dados como o frontend faz
function encryptLikeFrontend(data, sessionId = 'default') {
  try {
    const masterKey = 'loadtech_crypto_master_key_2025_muito_segura_producao_deve_ser_diferente';
    const plaintext = JSON.stringify(data);
    
    // Gerar IV aleatório
    const iv = crypto.randomBytes(16);
    
    // Derivar chave usando PBKDF2 (como no backend)
    const key = crypto.pbkdf2Sync(masterKey, sessionId, 100000, 32, 'sha256');
    
    // Criar cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    // Criptografar
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Obter tag de autenticação
    const tag = cipher.getAuthTag();
    
    const timestamp = Date.now();
    
    // Gerar assinatura HMAC
    const hmac = crypto.createHmac('sha256', masterKey);
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
      timestamp,
      signature
    };
    
  } catch (error) {
    console.error('Erro na criptografia:', error);
    return null;
  }
}

async function testarCriptografiaReal() {
  const dadosLogin = {
    email: 'admin@loadtech.com.br',
    senha: 'LoadTech@2025!'
  };

  console.log('📋 Dados originais:', dadosLogin);

  // Simular ID de sessão (como o frontend geraria)
  const sessionId = crypto.randomBytes(16).toString('hex');
  console.log('🔑 Session ID:', sessionId.substring(0, 16) + '...');

  // Criptografar dados
  const encryptedPayload = encryptLikeFrontend(dadosLogin, sessionId);
  
  if (!encryptedPayload) {
    console.error('❌ Falha na criptografia');
    return;
  }

  console.log('🔐 Dados criptografados:');
  console.log('IV:', encryptedPayload.iv.substring(0, 16) + '...');
  console.log('Data length:', encryptedPayload.data.length);
  console.log('Tag:', encryptedPayload.tag.substring(0, 16) + '...');

  // Montar payload como o frontend enviaria
  const requestBody = {
    encrypted: true,
    payload: encryptedPayload
  };

  try {
    console.log('\n📤 Enviando dados criptografados para o backend...');
    
    const response = await fetch('https://loadtech-api.onrender.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://loadtech.netlify.app',
        'X-Accept-Crypto': 'true',
        'X-Session-Id': sessionId
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    
    if (response.status === 200) {
      console.log('✅ SUCESSO! Criptografia funcionando');
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.user) {
          console.log('👤 Login realizado:', jsonResponse.user.nome);
        }
      } catch (e) {
        console.log('📄 Resposta:', responseText.substring(0, 100));
      }
    } else {
      console.log('❌ ERRO na requisição criptografada:');
      console.log('Resposta:', responseText.substring(0, 200));
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testarCriptografiaReal();
