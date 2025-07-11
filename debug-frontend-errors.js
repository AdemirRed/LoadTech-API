/**
 * Script para diagnosticar erros do frontend
 * - Testar rota de planos
 * - Testar criação de loja
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  info: '\x1b[36m',
  warning: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testPlanosRoute() {
  log('🧪 TESTANDO ROTA DE PLANOS', colors.info);
  log('=' .repeat(50), colors.info);
  
  try {
    const response = await fetch(`${API_BASE}/planos`);
    const data = await response.json();
    
    log(`Status: ${response.status}`, response.ok ? colors.success : colors.error);
    log(`Headers: ${JSON.stringify([...response.headers], null, 2)}`, colors.info);
    
    if (response.ok) {
      log(`✅ Planos carregados com sucesso!`, colors.success);
      log(`Quantidade de planos: ${Array.isArray(data) ? data.length : 'Não é array'}`, colors.info);
      
      if (Array.isArray(data) && data.length > 0) {
        log(`Primeiro plano:`, colors.info);
        log(JSON.stringify(data[0], null, 2), colors.info);
      }
    } else {
      log(`❌ Erro na requisição:`, colors.error);
      log(JSON.stringify(data, null, 2), colors.error);
    }
  } catch (error) {
    log(`❌ Erro de conexão: ${error.message}`, colors.error);
  }
}

async function testLogin() {
  log('\n🧪 TESTANDO LOGIN PARA TESTE DE LOJA', colors.info);
  log('=' .repeat(50), colors.info);
  
  // Primeiro, vamos tentar criar um usuário de teste
  const testUser = {
    nome: 'Teste Debug',
    email: 'debug@teste.com',
    senha: '123456',
    telefone: '11999999999'
  };
  
  try {
    // Tentar cadastrar
    log('Tentando cadastrar usuário de teste...', colors.info);
    const registerResponse = await fetch(`${API_BASE}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const registerData = await registerResponse.json();
    log(`Cadastro - Status: ${registerResponse.status}`, registerResponse.ok ? colors.success : colors.warning);
    
    // Tentar fazer login
    log('Tentando fazer login...', colors.info);
    const loginResponse = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        senha: testUser.senha
      })
    });
    
    const loginData = await loginResponse.json();
    log(`Login - Status: ${loginResponse.status}`, loginResponse.ok ? colors.success : colors.error);
    
    if (loginResponse.ok && loginData.token) {
      log(`✅ Token obtido: ${loginData.token.substring(0, 20)}...`, colors.success);
      return loginData.token;
    } else {
      log(`❌ Erro no login:`, colors.error);
      log(JSON.stringify(loginData, null, 2), colors.error);
      return null;
    }
  } catch (error) {
    log(`❌ Erro de conexão no login: ${error.message}`, colors.error);
    return null;
  }
}

async function testCriarLoja(token) {
  log('\n🧪 TESTANDO CRIAÇÃO DE LOJA', colors.info);
  log('=' .repeat(50), colors.info);
  
  if (!token) {
    log('❌ Token não disponível, pulando teste de loja', colors.error);
    return;
  }
  
  const lojaData = {
    nome: 'Loja Debug Teste',
    descricao: 'Loja para teste de debug',
    categoria: 'Eletrônicos'
  };
  
  try {
    const response = await fetch(`${API_BASE}/loja`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(lojaData)
    });
    
    const data = await response.json();
    
    log(`Status: ${response.status}`, response.ok ? colors.success : colors.error);
    log(`Headers: ${JSON.stringify([...response.headers], null, 2)}`, colors.info);
    
    if (response.ok) {
      log(`✅ Loja criada com sucesso!`, colors.success);
      log(JSON.stringify(data, null, 2), colors.success);
    } else {
      log(`❌ Erro na criação da loja:`, colors.error);
      log(JSON.stringify(data, null, 2), colors.error);
    }
  } catch (error) {
    log(`❌ Erro de conexão na criação da loja: ${error.message}`, colors.error);
  }
}

async function runDiagnostics() {
  log('🔍 DIAGNÓSTICO DOS ERROS DO FRONTEND', colors.info);
  log('=' .repeat(60), colors.info);
  
  // Teste 1: Rota de planos
  await testPlanosRoute();
  
  // Teste 2: Login e criação de loja
  const token = await testLogin();
  await testCriarLoja(token);
  
  log('\n🎯 RESUMO DOS TESTES:', colors.warning);
  log('1. Se a rota /planos retornou dados, o problema é no frontend (JavaScript)', colors.info);
  log('2. Se o login funcionou mas a loja deu erro, verificar validação', colors.info);
  log('3. Se tudo funcionou, o problema pode ser CORS ou URL no navegador', colors.info);
}

// Executar diagnóstico
runDiagnostics().catch(error => {
  log(`❌ Erro no diagnóstico: ${error.message}`, colors.error);
});
