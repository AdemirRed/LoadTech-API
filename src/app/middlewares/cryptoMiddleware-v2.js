import cryptoUtils from '../../utils/crypto.js';

/**
 * Middleware para criptografia de ponta a ponta
 * Versão 2.0 - Com controle total via ENV
 */

/**
 * Configurações de criptografia baseadas no .env
 */
const getCryptoConfig = () => {
  return {
    // Criptografia habilitada globalmente
    enabled: process.env.CRYPTO_ENABLED === 'true',
    
    // Forçar criptografia sempre (ignorar header x-accept-crypto)
    forceEncryption: process.env.CRYPTO_FORCE === 'true',
    
    // Permitir dados não criptografados (para desenvolvimento)
    allowPlaintext: process.env.CRYPTO_ALLOW_PLAINTEXT === 'true',
    
    // Debug detalhado
    debug: process.env.NODE_ENV === 'development' || process.env.CRYPTO_DEBUG === 'true',
    
    // Rotas que NUNCA são criptografadas (saúde, uploads, etc)
    excludePaths: [
      '/health', 
      '/uploads', 
      '/docs', 
      '/api-docs',
      '/swagger',
      '/webhooks'  // Webhooks externos geralmente não suportam crypto
    ],
    
    // Rotas que são SEMPRE criptografadas (dados sensíveis)
    forcePaths: [
      '/usuario',
      '/payment',
      '/assinatura', 
      '/loja',
      '/admin'
    ]
  };
};

/**
 * Middleware que criptografa automaticamente as respostas da API
 */
function cryptoMiddleware(options = {}) {
  const config = { ...getCryptoConfig(), ...options };

  return (req, res, next) => {
    // Pular se criptografia totalmente desabilitada
    if (!config.enabled) {
      if (config.debug) console.log(`🔓 Criptografia desabilitada globalmente para ${req.path}`);
      return next();
    }

    // Verificar se deve criptografar esta rota
    const shouldEncrypt = shouldEncryptPath(req.path, config);
    
    if (config.debug) {
      console.log(`🔐 Análise de criptografia para ${req.path}:`, {
        shouldEncrypt,
        forceEncryption: config.forceEncryption,
        allowPlaintext: config.allowPlaintext,
        isExcluded: config.excludePaths.some(p => req.path.startsWith(p)),
        isForced: config.forcePaths.some(p => req.path.startsWith(p))
      });
    }
    
    if (!shouldEncrypt) {
      if (config.debug) console.log(`🔓 Pulando criptografia para ${req.path}`);
      return next();
    }

    // Obter session ID
    const sessionId = getSessionId(req);

    // Interceptar res.json
    const originalJson = res.json;

    res.json = function(data) {
      try {
        // Verificar política de criptografia
        const shouldSendEncrypted = determineSendPolicy(req, config);
        
        if (config.debug) {
          console.log(`🔐 Política de envio para ${req.path}:`, {
            shouldSendEncrypted,
            clientHeader: req.headers['x-accept-crypto'],
            forceEncryption: config.forceEncryption,
            allowPlaintext: config.allowPlaintext
          });
        }

        if (!shouldSendEncrypted) {
          if (config.debug) console.log(`🔓 Enviando dados não criptografados para ${req.path}`);
          return originalJson.call(this, data);
        }

        // Criptografar dados
        const encryptedData = cryptoUtils.encrypt(data, sessionId);
        
        // Headers de criptografia
        res.set({
          'X-Encrypted': 'true',
          'X-Crypto-Version': '2.0',
          'X-Session-Id': sessionId,
          'X-Crypto-Policy': config.forceEncryption ? 'forced' : 'negotiated'
        });

        if (config.debug) {
          console.log(`🔐 Dados criptografados para ${req.path}:`, {
            sessionId: sessionId.substring(0, 8) + '...',
            originalSize: JSON.stringify(data).length,
            encryptedSize: JSON.stringify(encryptedData).length,
            policy: config.forceEncryption ? 'forced' : 'negotiated'
          });
        }

        // Enviar dados criptografados
        return originalJson.call(this, {
          encrypted: true,
          version: '2.0',
          payload: encryptedData
        });

      } catch (error) {
        console.error('❌ Erro na criptografia:', error.message);
        
        // Se erro na criptografia e permitido plaintext, enviar normal
        if (config.allowPlaintext) {
          console.warn('⚠️ Fallback para dados não criptografados devido ao erro');
          return originalJson.call(this, data);
        }
        
        // Senão, retornar erro
        return originalJson.call(this, {
          erro: 'Erro interno na criptografia',
          codigo: 'CRYPTO_ENCRYPT_ERROR'
        });
      }
    };

    next();
  };
}

/**
 * Middleware que descriptografa automaticamente requisições
 */
function decryptMiddleware(options = {}) {
  const config = { ...getCryptoConfig(), ...options };

  return (req, res, next) => {
    if (!config.enabled) {
      return next();
    }

    // Verificar se há dados criptografados no body
    if (req.body && req.body.encrypted && req.body.payload) {
      try {
        const sessionId = getSessionId(req);
        
        // Descriptografar dados
        const decryptedData = cryptoUtils.decrypt(req.body.payload, sessionId);
        
        // Substituir body pelos dados descriptografados
        req.body = decryptedData;
        
        if (config.debug) {
          console.log(`🔓 Dados descriptografados de ${req.path}:`, {
            sessionId: sessionId.substring(0, 8) + '...',
            success: true,
            version: req.body.version || '1.0'
          });
        }

      } catch (error) {
        console.error('❌ Erro na descriptografia:', error.message);
        
        // Se permitido plaintext, continuar com body original
        if (config.allowPlaintext) {
          console.warn('⚠️ Continuando com dados não criptografados devido ao erro');
          return next();
        }
        
        // Senão, retornar erro
        return res.status(400).json({
          erro: 'Dados criptografados inválidos',
          codigo: 'CRYPTO_DECRYPT_ERROR',
          detalhes: 'Não foi possível descriptografar os dados da requisição'
        });
      }
    } else if (config.forceEncryption && shouldRequireEncryption(req.path, config)) {
      // Se criptografia é forçada e rota requer, mas dados não estão criptografados
      if (config.debug) {
        console.log(`❌ Dados não criptografados rejeitados para ${req.path} (criptografia forçada)`);
      }
      
      return res.status(400).json({
        erro: 'Esta rota requer dados criptografados',
        codigo: 'CRYPTO_REQUIRED',
        detalhes: 'Configure seu cliente para enviar dados criptografados'
      });
    }

    next();
  };
}

/**
 * Determina se deve enviar dados criptografados
 */
function determineSendPolicy(req, config) {
  // Se criptografia é forçada, sempre criptografar
  if (config.forceEncryption) {
    return true;
  }
  
  // Se plaintext não é permitido, sempre criptografar
  if (!config.allowPlaintext) {
    return true;
  }
  
  // Se rota está na lista de forçadas
  if (config.forcePaths.some(p => req.path.startsWith(p))) {
    return true;
  }
  
  // Senão, respeitar header do cliente (comportamento legacy)
  return req.headers['x-accept-crypto'] === 'true';
}

/**
 * Verifica se uma rota deve ser criptografada
 */
function shouldEncryptPath(path, config) {
  // Rotas excluídas nunca são criptografadas
  if (config.excludePaths.some(p => path.startsWith(p))) {
    return false;
  }
  
  // Se há rotas forçadas definidas, verificar se está nelas
  if (config.forcePaths.length > 0) {
    return config.forcePaths.some(p => path.startsWith(p));
  }
  
  // Por padrão, criptografar tudo que não está excluído
  return true;
}

/**
 * Verifica se uma rota requer criptografia obrigatória
 */
function shouldRequireEncryption(path, config) {
  return config.forcePaths.some(p => path.startsWith(p));
}

/**
 * Obtém ou gera session ID
 */
function getSessionId(req) {
  // Prioridade: header > session > gerado
  return req.headers['x-session-id'] || 
         req.session?.id || 
         `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Exportar middleware e utilitários
export {
  cryptoMiddleware,
  decryptMiddleware,
  getCryptoConfig
};

// Exportações para compatibilidade
export default {
  encrypt: cryptoMiddleware,
  decrypt: decryptMiddleware,
  config: getCryptoConfig
};
