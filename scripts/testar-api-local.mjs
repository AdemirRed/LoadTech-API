#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🔐 Testando API local (localhost:3001)...\n');

async function testarApiLocal() {
  try {
    // Primeiro, teste de saúde
    console.log('1️⃣ Testando endpoint de saúde...');
    try {
      const healthResponse = await fetch('http://localhost:3001/api/health');
      console.log(`Health Status: ${healthResponse.status}`);
    } catch (healthError) {
      console.log('❌ Health check falhou:', healthError.message);
    }

    // Teste de login
    console.log('\n2️⃣ Testando login...');
    const loginData = {
      email: 'ademir1de1oliveira@gmail.com',
      senha: 'MinhaSenh@123'
    };

    const response = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:4173',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify(loginData)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    // Verificar headers de resposta
    console.log('\n📋 Headers de resposta:');
    ['access-control-allow-origin', 'content-type', 'x-encrypted'].forEach(header => {
      const value = response.headers.get(header);
      if (value) console.log(`${header}: ${value}`);
    });

    const responseText = await response.text();
    console.log('\n📄 Resposta:', responseText);

    if (response.status === 400) {
      console.log('\n🚨 ERRO 400 DETECTADO!');
      try {
        const jsonError = JSON.parse(responseText);
        console.log('Erro específico:', jsonError);
      } catch (e) {
        console.log('Resposta não é JSON válido');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUÇÃO: A API não está rodando. Execute:');
      console.log('npm run dev');
    }
  }
}

testarApiLocal();
