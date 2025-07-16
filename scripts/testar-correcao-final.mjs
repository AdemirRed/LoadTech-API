#!/usr/bin/env node

import fetch from 'node-fetch';
import crypto from 'crypto';

console.log('🔧 Testando correção de compatibilidade...\n');

const MASTER_KEY = 'LoadTech2024SecretKey0123456789AB';

function encryptDataSimple(data, key) {
  try {
    // Método simples igual ao frontend
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
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('❌ Erro na criptografia:', error.message);
    return null;
  }
}

async function testarCorrecao() {
  // Aguardar deploy
  console.log('⏳ Aguardando deploy (30 segundos)...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  try {
    console.log('🧪 Testando com modo simples...');
    
    const dadosLogin = {
      email: 'admin@loadtech.com.br',
      senha: 'LoadTech@2025!'
    };
    
    const dadosCriptografados = encryptDataSimple(dadosLogin, MASTER_KEY);
    
    console.log('📋 Dados criptografados (método simples):');
    console.log('IV:', dadosCriptografados.iv.substring(0, 16) + '...');
    console.log('Data length:', dadosCriptografados.data.length);
    
    const response = await fetch('https://loadtech-api.onrender.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Crypto-Enabled': 'true',
        'Origin': 'https://loadtech.netlify.app'
      },
      body: JSON.stringify({
        encrypted: true,
        payload: dadosCriptografados
      })
    });

    console.log(`\n📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      console.log('🎉 SUCESSO! Criptografia compatível funcionando!');
      const responseData = await response.json();
      console.log('✅ Login realizado com sucesso');
      console.log('👤 Usuário:', responseData.user?.nome || 'Admin');
    } else {
      const errorData = await response.text();
      console.log('❌ Ainda com erro:', errorData.substring(0, 200));
      
      // Se ainda der erro, vamos tentar sem signature/sessionId
      console.log('\n🔄 Tentando versão ainda mais simples...');
      
      const response2 = await fetch('https://loadtech-api.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://loadtech.netlify.app'
        },
        body: JSON.stringify({
          encrypted: true,
          payload: {
            data: dadosCriptografados.data,
            iv: dadosCriptografados.iv,
            tag: dadosCriptografados.tag
          }
        })
      });
      
      console.log(`Status tentativa 2: ${response2.status}`);
      if (response2.status === 200) {
        console.log('✅ Versão simplificada funcionou!');
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testarCorrecao();
