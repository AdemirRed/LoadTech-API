#!/usr/bin/env node

import crypto from 'crypto';

console.log('🔧 Testando descriptografia direta...\n');

// Dados criptografados do teste anterior (extraídos do output)
const encryptedData = {
  data: "98daad9071180bfa96ff367279402306bd4f745f3766cf43dd837e93459e9f46687eb0dc",
  iv: "c93a8c877d465e12c12ce3653160ed0f",
  tag: "e0ea956f7189de45c8b897e538386dc6",
  timestamp: Date.now() - 1000, // Aproximadamente quando foi gerado
  signature: "alguma_assinatura"
};

const sessionId = "df049a9d7136b302"; // Do teste anterior
const masterKey = "loadtech_crypto_master_key_2025_muito_segura_producao_deve_ser_diferente";

function descriptografarDados(payload, sessionId, masterKey) {
  try {
    console.log('🔍 Iniciando descriptografia...');
    console.log('Session ID:', sessionId);
    console.log('IV:', payload.iv);
    console.log('Data length:', payload.data.length);
    console.log('Tag:', payload.tag);

    // Derivar chave usando PBKDF2 (igual ao backend)
    const key = crypto.pbkdf2Sync(masterKey, sessionId, 100000, 32, 'sha256');
    console.log('✅ Chave derivada');

    // Converter dados de hex
    const ivBuffer = Buffer.from(payload.iv, 'hex');
    const tagBuffer = Buffer.from(payload.tag, 'hex');
    const encrypted = payload.data;

    console.log('✅ Buffers convertidos');

    // Criar decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
    decipher.setAuthTag(tagBuffer);
    console.log('✅ Decipher criado');

    // Descriptografar
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    console.log('✅ Descriptografia realizada');

    console.log('🔓 Dados descriptografados:', decrypted);

    // Tentar fazer parse como JSON
    const jsonData = JSON.parse(decrypted);
    console.log('✅ JSON parseado:', jsonData);

    return jsonData;

  } catch (error) {
    console.error('❌ Erro na descriptografia:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Executar teste
const resultado = descriptografarDados(encryptedData, sessionId, masterKey);

if (resultado) {
  console.log('\n🎉 SUCESSO! Descriptografia funcionou');
  console.log('Email:', resultado.email);
  console.log('Senha presente:', !!resultado.senha);
} else {
  console.log('\n❌ FALHA na descriptografia');
  console.log('\n💡 Possíveis causas:');
  console.log('1. SessionId diferente entre frontend e backend');
  console.log('2. Master key diferente');
  console.log('3. Algoritmo de derivação diferente');
  console.log('4. Formato dos dados diferente');
}
