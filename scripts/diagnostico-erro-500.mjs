/**
 * 🔍 TESTE DIAGNÓSTICO - Identificar erro 500 no login
 */

import fetch from 'node-fetch';

console.log('🔍 Testando login SEM criptografia para identificar erro 500...');

// Teste 1: Login simples sem criptografia
const loginData = { 
  email: 'ademir2de2oliveira@gmail.com', 
  senha: '123456' 
};

console.log('📤 Enviando dados NÃO criptografados...');

fetch('https://loadtech-api.onrender.com/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData)
})
.then(async res => {
  console.log(`📡 Status: ${res.status}`);
  const data = await res.json();
  console.log('📦 Resposta:', JSON.stringify(data, null, 2));
  
  if (res.status === 500) {
    console.log('❌ ERRO 500: Problema interno do servidor');
    console.log('🔍 Possíveis causas:');
    console.log('  - Erro na validação Yup');
    console.log('  - Erro na consulta do banco');
    console.log('  - Erro no método checkPassword');
    console.log('  - Erro na geração do JWT');
  }
})
.catch(err => console.error('❌ Erro na requisição:', err.message));
