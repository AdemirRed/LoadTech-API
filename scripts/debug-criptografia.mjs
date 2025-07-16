#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🔍 Testando criptografia frontend/backend...\n');

async function testarCriptografia() {
  const dadosLogin = {
    email: 'admin@loadtech.com.br',
    senha: 'LoadTech@2025!'
  };

  // Teste 1: Requisição SEM criptografia (normal)
  console.log('1️⃣ Teste SEM criptografia...');
  try {
    const response1 = await fetch('https://loadtech-api.onrender.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://loadtech.netlify.app'
      },
      body: JSON.stringify(dadosLogin)
    });

    console.log(`Status: ${response1.status}`);
    if (response1.status === 200) {
      console.log('✅ Login SEM criptografia OK');
    } else {
      const error = await response1.text();
      console.log('❌ Erro:', error.substring(0, 100));
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }

  // Teste 2: Requisição COM headers de criptografia
  console.log('\n2️⃣ Teste COM headers de criptografia...');
  try {
    const response2 = await fetch('https://loadtech-api.onrender.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://loadtech.netlify.app',
        'X-Accept-Crypto': 'true',
        'X-Crypto-Enabled': 'true'
      },
      body: JSON.stringify(dadosLogin)
    });

    console.log(`Status: ${response2.status}`);
    console.log('Headers de resposta:');
    console.log('X-Encrypted:', response2.headers.get('x-encrypted'));
    console.log('X-Crypto-Version:', response2.headers.get('x-crypto-version'));

    const responseText = await response2.text();
    
    try {
      const jsonResponse = JSON.parse(responseText);
      if (jsonResponse.encrypted) {
        console.log('🔐 Resposta criptografada recebida');
        console.log('IV:', jsonResponse.payload.iv?.substring(0, 16) + '...');
        console.log('Data length:', jsonResponse.payload.data?.length);
      } else {
        console.log('📄 Resposta normal:', jsonResponse);
      }
    } catch (parseError) {
      console.log('❌ Resposta não é JSON:', responseText.substring(0, 100));
    }

  } catch (error) {
    console.error('❌ Erro na requisição com crypto:', error.message);
  }

  // Teste 3: Simulando dados criptografados inválidos
  console.log('\n3️⃣ Teste com dados criptografados inválidos...');
  try {
    const dadosCriptoInvalidos = {
      encrypted: true,
      payload: {
        data: 'dados_invalidos',
        iv: 'iv_invalido',
        tag: 'tag_invalida',
        timestamp: Date.now()
      }
    };

    const response3 = await fetch('https://loadtech-api.onrender.com/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://loadtech.netlify.app'
      },
      body: JSON.stringify(dadosCriptoInvalidos)
    });

    console.log(`Status: ${response3.status}`);
    const errorResponse = await response3.text();
    console.log('Resposta de erro:', errorResponse.substring(0, 150));

  } catch (error) {
    console.error('❌ Erro no teste de dados inválidos:', error.message);
  }
}

testarCriptografia();
