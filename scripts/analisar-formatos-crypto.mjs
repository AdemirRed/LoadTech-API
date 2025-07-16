#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🔍 Analisando diferenças de implementação...\n');

async function analisarImplementacoes() {
  try {
    // Teste 1: Login sem criptografia (para confirmar que funciona)
    console.log('1️⃣ Teste de controle - login sem criptografia:');
    const response1 = await fetch('https://loadtech-api.onrender.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://loadtech.netlify.app'
      },
      body: JSON.stringify({
        email: 'admin@loadtech.com.br',
        senha: 'LoadTech@2025!'
      })
    });
    
    console.log(`Status sem crypto: ${response1.status}`);
    if (response1.status === 200) {
      console.log('✅ Login sem criptografia: OK');
    }
    
    // Teste 2: Verificar o que o backend espera
    console.log('\n2️⃣ Testando diferentes formatos de dados criptografados:');
    
    // Formato 1: Dados criptografados diretos no body
    const testeCrypto1 = await fetch('https://loadtech-api.onrender.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Crypto-Enabled': 'true',
        'Origin': 'https://loadtech.netlify.app'
      },
      body: JSON.stringify({
        encrypted: true,
        data: 'test_encrypted_data',
        iv: '1234567890abcdef1234567890abcdef',
        tag: '1234567890abcdef1234567890abcdef'
      })
    });
    
    console.log(`Formato 1 status: ${testeCrypto1.status}`);
    
    // Formato 2: Envelope com payload
    const testeCrypto2 = await fetch('https://loadtech-api.onrender.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Crypto-Enabled': 'true',
        'Origin': 'https://loadtech.netlify.app'
      },
      body: JSON.stringify({
        encrypted: true,
        payload: {
          data: 'test_encrypted_data',
          iv: '1234567890abcdef1234567890abcdef',
          tag: '1234567890abcdef1234567890abcdef',
          timestamp: Date.now()
        }
      })
    });
    
    console.log(`Formato 2 status: ${testeCrypto2.status}`);
    
    // Vamos ver as respostas de erro
    const error1 = await testeCrypto1.text();
    const error2 = await testeCrypto2.text();
    
    console.log('\n📄 Respostas de erro:');
    console.log('Formato 1:', error1.substring(0, 100));
    console.log('Formato 2:', error2.substring(0, 100));
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

analisarImplementacoes();
