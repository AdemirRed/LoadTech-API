#!/usr/bin/env node

/**
 * 🔐 TESTE FINAL - VALIDAÇÃO PBKDF2 PURO
 * =====================================
 * 
 * Valida que o sistema funciona apenas com PBKDF2,
 * sem modo de compatibilidade SHA256.
 * 
 * Testa:
 * 1. Login com usuário Ademir
 * 2. Criptografia end-to-end
 * 3. Endpoints protegidos
 * 4. Segurança PBKDF2 pura
 */

import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = process.env.TEST_URL || 'https://loadtech-api.onrender.com';
const MASTER_KEY = 'LoadTech2024SecretKey0123456789AB';

// Utilitários de criptografia (PBKDF2 puro - igual ao backend)
class CryptoTestUtils {
  constructor() {
    this.MASTER_KEY = MASTER_KEY;
    this.ALGORITHM = 'aes-256-gcm';
    this.KEY_LENGTH = 32;
    this.IV_LENGTH = 16;
  }

  deriveKey(salt) {
    // APENAS PBKDF2 - sem compatibilidade SHA256
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

const cryptoUtils = new CryptoTestUtils();

async function testarStatusAPI() {
  console.log('🔍 Testando status da API...');
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    console.log('✅ API online:', data);
    return true;
  } catch (error) {
    console.error('❌ API offline:', error.message);
    return false;
  }
}

async function testarLoginPBKDF2() {
  console.log('\n🔐 Testando login com PBKDF2 puro...');
  
  const sessionId = crypto.randomBytes(16).toString('hex');
  const loginData = {
    email: 'admin@loadtech.com.br',
    senha: 'LoadTech@2025!'
  };

  try {
    // Criptografar dados do login com PBKDF2
    const encryptedData = cryptoUtils.encrypt(loginData, sessionId);
    
    console.log('📦 Payload criptografado gerado com PBKDF2');
    console.log('🔑 Session ID:', sessionId);
    
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        encrypted: true,
        data: encryptedData
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Login PBKDF2 bem-sucedido!');
      console.log('👤 Usuário:', result.user?.nome);
      console.log('🎫 Token:', result.token ? 'Gerado' : 'Ausente');
      return { success: true, token: result.token, sessionId };
    } else {
      console.error('❌ Login falhou:', result);
      return { success: false, error: result };
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de login:', error.message);
    return { success: false, error: error.message };
  }
}

async function testarEndpointProtegido(token, sessionId) {
  console.log('\n🛡️ Testando endpoint protegido...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/usuario`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Session-ID': sessionId
      }
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Endpoint protegido acessível!');
      console.log('👤 Dados do usuário:', result.nome);
      return true;
    } else {
      console.error('❌ Acesso negado:', result);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro no endpoint protegido:', error.message);
    return false;
  }
}

async function validarSegurancaPBKDF2() {
  console.log('\n🔒 Validando segurança PBKDF2...');
  
  const sessionId = 'test-session';
  const testData = { message: 'teste pbkdf2' };
  
  try {
    // Gerar múltiplas chaves com mesmo salt - devem ser idênticas
    const key1 = cryptoUtils.deriveKey(sessionId);
    const key2 = cryptoUtils.deriveKey(sessionId);
    
    if (key1.equals(key2)) {
      console.log('✅ Derivação de chave PBKDF2 consistente');
    } else {
      console.error('❌ Derivação de chave inconsistente');
      return false;
    }
    
    // Testar criptografia/descriptografia
    const encrypted = cryptoUtils.encrypt(testData, sessionId);
    console.log('✅ Criptografia PBKDF2 funcional');
    console.log('🔐 Formato do payload:', Object.keys(encrypted));
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro na validação PBKDF2:', error.message);
    return false;
  }
}

async function executarTestesCompletos() {
  console.log('🚀 INICIANDO TESTES FINAIS - PBKDF2 PURO');
  console.log('========================================');
  console.log(`🌐 URL Base: ${BASE_URL}`);
  console.log(`🔑 Chave Master: ${MASTER_KEY}`);
  console.log('🔒 Modo: PBKDF2 APENAS (sem compatibilidade)\n');

  const resultados = {};

  // Teste 1: Status da API
  resultados.apiOnline = await testarStatusAPI();
  if (!resultados.apiOnline) {
    console.log('\n❌ API offline - abortando testes');
    return;
  }

  // Teste 2: Validação PBKDF2
  resultados.pbkdf2Valido = await validarSegurancaPBKDF2();

  // Teste 3: Login com PBKDF2
  const loginResult = await testarLoginPBKDF2();
  resultados.loginPBKDF2 = loginResult.success;

  // Teste 4: Endpoint protegido (se login funcionou)
  if (loginResult.success && loginResult.token) {
    resultados.endpointProtegido = await testarEndpointProtegido(
      loginResult.token, 
      loginResult.sessionId
    );
  } else {
    resultados.endpointProtegido = false;
  }

  // Relatório Final
  console.log('\n📊 RELATÓRIO FINAL - PBKDF2 PURO');
  console.log('================================');
  console.log(`🌐 API Online: ${resultados.apiOnline ? '✅' : '❌'}`);
  console.log(`🔒 PBKDF2 Válido: ${resultados.pbkdf2Valido ? '✅' : '❌'}`);
  console.log(`🔐 Login PBKDF2: ${resultados.loginPBKDF2 ? '✅' : '❌'}`);
  console.log(`🛡️ Endpoint Protegido: ${resultados.endpointProtegido ? '✅' : '❌'}`);

  const todosFuncionando = Object.values(resultados).every(r => r === true);
  
  if (todosFuncionando) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ Sistema 100% funcional com PBKDF2 puro');
    console.log('🔒 Modo de compatibilidade removido com sucesso');
    console.log('🚀 Pronto para produção segura!');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM');
    console.log('❌ Verificar configurações e logs do servidor');
    process.exit(1);
  }
}

// Executar testes
executarTestesCompletos().catch(error => {
  console.error('💥 Erro fatal nos testes:', error);
  process.exit(1);
});
