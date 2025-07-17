#!/usr/bin/env node

/**
 * 🧪 TESTE DE COMPATIBILIDADE FRONTEND-BACKEND
 * ===========================================
 * 
 * Testa se o backend consegue descriptografar dados
 * no formato enviado pelo frontend (AES-CBC)
 */

import fetch from 'node-fetch';

const BASE_URL = 'https://loadtech-api.onrender.com';

async function testarCompatibilidadeFrontend() {
  console.log('🧪 TESTE DE COMPATIBILIDADE FRONTEND-BACKEND');
  console.log('============================================\n');

  // Simular exatamente o formato que o frontend está enviando
  const payloadFrontend = {
    "data": "5e49dc8181a1c72ec2e8008b00e32086d02a08cb3e0e0995eab8eee850f1e97e6a01f2013382c8938ca041a52bc6ae61ef913ef72319f29accc174816eea6f4d",
    "iv": "3decb5127160446c68f2a15bd0659924",
    "salt": "eabaec00f866072b302b4ed1b91ad0cb",
    "tag": "37ecb55cf516619921effa686d0e156f8780060ff43931118e0c1cb47d169056",
    "algorithm": "aes-256-cbc",
    "iterations": 100000,
    "keyLength": 256
  };

  console.log('📦 Payload do frontend a ser testado:');
  console.log(JSON.stringify(payloadFrontend, null, 2));

  try {
    console.log('\n🔐 Enviando para API...');
    
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': 'test-frontend-compatibility'
      },
      body: JSON.stringify({
        encrypted: true,
        data: payloadFrontend
      })
    });

    console.log(`📊 Status da resposta: ${response.status}`);
    
    const result = await response.json();
    console.log('📥 Resposta da API:');
    console.log(JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ COMPATIBILIDADE FUNCIONANDO!');
      console.log('🎉 Backend conseguiu descriptografar formato do frontend');
    } else {
      console.log('\n❌ PROBLEMA DE COMPATIBILIDADE');
      console.log('🔧 Backend não conseguiu processar formato do frontend');
      
      // Verificar se é erro de descriptografia
      if (result.codigo === 'CRYPTO_ERROR') {
        console.log('🚨 Erro específico de criptografia detectado');
      }
    }

  } catch (error) {
    console.error('💥 Erro na requisição:', error.message);
  }

  // Teste com formato backend (para comparação)
  console.log('\n🔄 Testando formato backend para comparação...');
  
  try {
    // Formato que o backend espera (GCM)
    const payloadBackend = {
      "data": "8523b53a5a4719ebd4b8a62a5876966a2dace8ff169a9249b0ff2c955ba1b4d177fee608",
      "iv": "173781be93609ad90aced0c8d7842466",
      "tag": "81a31e6c0d9ede53e4ff298d6b38d3af",
      "timestamp": Date.now() - 60000, // 1 minuto atrás
      "signature": "9209bfa1b9b2d51104f4f82cab561374d80d7a01b377a6589b79b970e3fd6c71"
    };

    const response2 = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': 'test-backend-format'
      },
      body: JSON.stringify({
        encrypted: true,
        data: payloadBackend
      })
    });

    console.log(`📊 Status formato backend: ${response2.status}`);
    const result2 = await response2.json();
    
    if (response2.ok) {
      console.log('✅ Formato backend também funciona');
    } else {
      console.log('❌ Formato backend não funciona:', result2.erro || result2.message);
    }

  } catch (error) {
    console.error('💥 Erro no teste backend:', error.message);
  }

  console.log('\n🏁 CONCLUSÃO:');
  console.log('Verifique os logs acima para determinar a compatibilidade');
}

testarCompatibilidadeFrontend().catch(console.error);
