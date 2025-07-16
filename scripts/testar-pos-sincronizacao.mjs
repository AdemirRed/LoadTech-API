#!/usr/bin/env node

import fetch from 'node-fetch';
import crypto from 'crypto';

console.log('🔑 Testando criptografia após sincronização de chaves...\n');

// Mesma chave que o frontend agora
const MASTER_KEY = 'LoadTech2024SecretKey0123456789AB';

function encryptData(data, key) {
  try {
    const iv = crypto.randomBytes(16);
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      timestamp: Date.now(),
      algorithm: 'aes-256-gcm'
    };
  } catch (error) {
    console.error('❌ Erro na criptografia:', error.message);
    return null;
  }
}

async function testarAposSincronizacao() {
  // Aguardar deploy
  console.log('⏳ Aguardando deploy no Render (30 segundos)...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    console.log('🧪 Testando com chaves sincronizadas...');
    
    const dadosLogin = {
      email: 'admin@loadtech.com.br',
      senha: 'LoadTech@2025!'
    };
    
    const dadosCriptografados = encryptData(dadosLogin, MASTER_KEY);
    
    if (!dadosCriptografados) {
      console.error('❌ Falha na criptografia local');
      return;
    }
    
    console.log('📋 Dados criptografados gerados:');
    console.log('IV:', dadosCriptografados.iv.substring(0, 16) + '...');
    console.log('Data length:', dadosCriptografados.data.length);
    
    const response = await fetch('https://loadtech-api.onrender.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Crypto-Enabled': 'true',
        'X-Accept-Crypto': 'true',
        'Origin': 'https://loadtech.netlify.app'
      },
      body: JSON.stringify(dadosCriptografados)
    });

    console.log(`\n📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('🎉 SUCESSO! Criptografia funcionando!');
      const responseData = await response.json();
      
      if (responseData.encrypted) {
        console.log('✅ Resposta também criptografada');
      } else {
        console.log('📄 Resposta:', responseData.user?.nome || 'Login OK');
      }
    } else {
      const errorData = await response.text();
      console.log('❌ Ainda há erro:', errorData.substring(0, 100));
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarAposSincronizacao();
