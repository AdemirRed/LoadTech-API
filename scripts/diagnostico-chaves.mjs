#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO DE CRIPTOGRAFIA
 * =============================
 * 
 * Analisa problemas de criptografia entre frontend e backend
 * para identificar incompatibilidades na derivação de chaves.
 */

import crypto from 'crypto';

const MASTER_KEY = 'LoadTech2024SecretKey0123456789AB';
const SESSION_ID = 'test-session';

console.log('🔍 DIAGNÓSTICO DE CRIPTOGRAFIA');
console.log('===============================');
console.log(`🔑 Master Key: ${MASTER_KEY}`);
console.log(`🎫 Session ID: ${SESSION_ID}\n`);

// Teste 1: Método SHA256 (compatibilidade)
console.log('1️⃣ MÉTODO SHA256 (COMPATIBILIDADE)');
console.log('----------------------------------');
const sha256Key = crypto.createHash('sha256').update(MASTER_KEY).digest();
console.log(`Chave SHA256: ${sha256Key.toString('hex')}`);
console.log(`Tamanho: ${sha256Key.length} bytes`);

// Teste 2: Método PBKDF2 (seguro)
console.log('\n2️⃣ MÉTODO PBKDF2 (SEGURO)');
console.log('-------------------------');
const pbkdf2Key = crypto.pbkdf2Sync(MASTER_KEY, SESSION_ID, 100000, 32, 'sha256');
console.log(`Chave PBKDF2: ${pbkdf2Key.toString('hex')}`);
console.log(`Tamanho: ${pbkdf2Key.length} bytes`);

// Teste 3: Comparação das chaves
console.log('\n3️⃣ COMPARAÇÃO DAS CHAVES');
console.log('------------------------');
const saoIguais = sha256Key.equals(pbkdf2Key);
console.log(`Chaves são iguais: ${saoIguais ? '✅ SIM' : '❌ NÃO'}`);

if (!saoIguais) {
  console.log('⚠️ INCOMPATIBILIDADE DETECTADA!');
  console.log('Frontend e backend usam métodos diferentes');
}

// Teste 4: Criptografia com cada método
console.log('\n4️⃣ TESTE DE CRIPTOGRAFIA');
console.log('-------------------------');

const testData = JSON.stringify({ email: 'test@test.com', senha: 'test123' });
const iv = crypto.randomBytes(16);

// Criptografia com SHA256
console.log('\n📦 SHA256:');
const cipher1 = crypto.createCipheriv('aes-256-gcm', sha256Key, iv);
let encrypted1 = cipher1.update(testData, 'utf8', 'hex');
encrypted1 += cipher1.final('hex');
const tag1 = cipher1.getAuthTag();
console.log(`IV: ${iv.toString('hex')}`);
console.log(`Data: ${encrypted1}`);
console.log(`Tag: ${tag1.toString('hex')}`);

// Criptografia com PBKDF2
console.log('\n📦 PBKDF2:');
const cipher2 = crypto.createCipheriv('aes-256-gcm', pbkdf2Key, iv);
let encrypted2 = cipher2.update(testData, 'utf8', 'hex');
encrypted2 += cipher2.final('hex');
const tag2 = cipher2.getAuthTag();
console.log(`IV: ${iv.toString('hex')}`);
console.log(`Data: ${encrypted2}`);
console.log(`Tag: ${tag2.toString('hex')}`);

// Teste 5: Descriptografia cruzada
console.log('\n5️⃣ TESTE DE DESCRIPTOGRAFIA CRUZADA');
console.log('------------------------------------');

try {
  console.log('\n🔓 PBKDF2 descriptografando SHA256:');
  const decipher1 = crypto.createDecipheriv('aes-256-gcm', pbkdf2Key, iv);
  decipher1.setAuthTag(tag1);
  let decrypted1 = decipher1.update(encrypted1, 'hex', 'utf8');
  decrypted1 += decipher1.final('utf8');
  console.log('✅ Sucesso:', decrypted1);
} catch (error) {
  console.log('❌ Falhou:', error.message);
}

try {
  console.log('\n🔓 SHA256 descriptografando PBKDF2:');
  const decipher2 = crypto.createDecipheriv('aes-256-gcm', sha256Key, iv);
  decipher2.setAuthTag(tag2);
  let decrypted2 = decipher2.update(encrypted2, 'hex', 'utf8');
  decrypted2 += decipher2.final('utf8');
  console.log('✅ Sucesso:', decrypted2);
} catch (error) {
  console.log('❌ Falhou:', error.message);
}

console.log('\n📊 CONCLUSÃO');
console.log('=============');
if (saoIguais) {
  console.log('✅ Métodos compatíveis - sem problemas');
} else {
  console.log('❌ Métodos incompatíveis - é necessário:');
  console.log('   • Frontend usar PBKDF2 OU');
  console.log('   • Backend manter compatibilidade temporária OU');
  console.log('   • Sincronização completa de ambos');
}
