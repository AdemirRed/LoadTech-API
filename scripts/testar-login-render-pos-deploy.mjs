#!/usr/bin/env node

import fetch from 'node-fetch';
import crypto from 'crypto';

console.log('🔐 Testando login no Render após deploy...\n');

// Função para descriptografar respostas (se necessário)
function tryDecrypt(encryptedResponse, masterKey) {
  try {
    if (!encryptedResponse.encrypted || !encryptedResponse.payload) {
      return encryptedResponse; // Não está criptografado
    }

    const { data, iv, tag } = encryptedResponse.payload;
    const key = crypto.createHash('sha256').update(masterKey).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(Buffer.from(data, 'hex'), null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    return { erro_descriptografia: error.message, original: encryptedResponse };
  }
}

async function testarLoginRender() {
  const cenarios = [
    {
      nome: 'Login Ademir (usuário ativo)',
      dados: {
        email: 'ademir1de1oliveira@gmail.com',
        senha: 'MinhaSenh@123'
      }
    },
    {
      nome: 'Login Admin (usuário ativo)',
      dados: {
        email: 'admin@loadtech.com.br',
        senha: 'LoadTech@2025!'
      }
    }
  ];

  for (const cenario of cenarios) {
    try {
      console.log(`\n🧪 ${cenario.nome}`);
      console.log('📧 Email:', cenario.dados.email);
      
      const response = await fetch('https://loadtech-api.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://loadtech.netlify.app',
          'User-Agent': 'LoadTech-Test/1.0'
        },
        body: JSON.stringify(cenario.dados)
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      // Headers importantes
      const encryption = response.headers.get('x-encrypted');
      const contentType = response.headers.get('content-type');
      console.log(`🔐 Encrypted: ${encryption}`);
      console.log(`📄 Content-Type: ${contentType}`);

      const responseText = await response.text();
      
      try {
        const jsonResponse = JSON.parse(responseText);
        
        // Tentar descriptografar se necessário
        const finalResponse = tryDecrypt(jsonResponse, 'loadtech_crypto_master_key_2025_muito_segura_producao_deve_ser_diferente');
        
        if (response.status === 200) {
          console.log('✅ LOGIN SUCESSO!');
          if (finalResponse.user) {
            console.log(`👤 Usuário: ${finalResponse.user.nome}`);
            console.log(`👑 Papel: ${finalResponse.user.papel}`);
            console.log('🎫 Token gerado com sucesso');
          }
        } else {
          console.log('❌ ERRO DE LOGIN:');
          if (finalResponse.erro) {
            console.log(`🚨 Erro: ${finalResponse.erro}`);
          } else {
            console.log('📄 Resposta:', finalResponse);
          }
        }
        
      } catch (parseError) {
        console.log('⚠️ Resposta não é JSON:');
        console.log(responseText.substring(0, 200));
      }

    } catch (error) {
      console.error(`❌ Erro na requisição ${cenario.nome}:`, error.message);
    }

    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Aguardar um pouco para o deploy terminar
console.log('⏳ Aguardando deploy do Render (30 segundos)...');
setTimeout(() => {
  console.log('🚀 Iniciando testes...');
  testarLoginRender();
}, 30000);
