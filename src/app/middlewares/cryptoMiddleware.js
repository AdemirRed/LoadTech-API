import cryptoUtils from '../../utils/crypto.js';

/**
 * Middleware para criptografia automática de respostas da API
 * Intercepta respostas e criptografa dados sensíveis automaticamente
 */

/**
 * Middleware que criptografa automaticamente as respostas da API
 * @param {object} options - Opções de configuração
 * @param {boolean} options.enabled - Se a criptografia está habilitada
 * @param {string[]} options.excludePaths - Rotas que não devem ser criptografadas
 * @param {string[]} options.includePaths - Apenas estas rotas serão criptografadas
 */
function cryptoMiddleware(options = {}) {
  const {
    enabled = process.env.CRYPTO_ENABLED === 'true',
    force = process.env.CRYPTO_FORCE === 'true',
    excludePaths = ['/health', '/login', '/cadastro'],
    includePaths = null, // Se especificado, apenas estas rotas serão criptografadas
    debug = process.env.NODE_ENV === 'development'
  } = options;

  return (req, res, next) => {
    // Pular se criptografia desabilitada
    if (!enabled) {
      if (debug) console.log(`🔐 Criptografia desabilitada para ${req.path}`);
      return next();
    }

    // Verificar se deve criptografar esta rota
    const shouldEncrypt = shouldEncryptPath(req.path, includePaths, excludePaths);
    
    if (debug) {
      console.log(`🔐 Rota ${req.path}:`, {
        shouldEncrypt,
        includePaths,
        excludePaths,
        enabled
      });
    }
    
    if (!shouldEncrypt) {
      if (debug) console.log(`🔐 Pulando criptografia para ${req.path}`);
      return next();
    }

    // Obter ou gerar session ID
    const sessionId = getSessionId(req);

    // Interceptar o método res.json original
    const originalJson = res.json;

    res.json = function(data) {
      try {
        // Verificar se cliente aceita dados criptografados OU se criptografia é forçada
        const acceptsCrypto = req.headers['x-accept-crypto'] === 'true' || force;
        
        if (debug) {
          console.log(`🔐 Headers recebidos para ${req.path}:`, {
            'x-accept-crypto': req.headers['x-accept-crypto'],
            acceptsCrypto,
            force,
            shouldEncrypt: acceptsCrypto
          });
        }
        
        if (!acceptsCrypto) {
          // Cliente não suporta criptografia e não é forçada, enviar dados normais
          if (debug) console.log(`🔐 Cliente não aceita criptografia para ${req.path}`);
          return originalJson.call(this, data);
        }

        // Criptografar dados
        const encryptedData = cryptoUtils.encrypt(data, sessionId);
        
        // Adicionar headers de criptografia
        res.set({
          'X-Encrypted': 'true',
          'X-Crypto-Version': '1.0',
          'X-Session-Id': sessionId
        });

        if (debug) {
          console.log(`🔐 Dados criptografados para ${req.path}:`, {
            sessionId: sessionId.substring(0, 8) + '...',
            dataSize: JSON.stringify(data).length,
            encryptedSize: JSON.stringify(encryptedData).length,
            success: true
          });
        }

        // Enviar dados criptografados
        return originalJson.call(this, {
          encrypted: true,
          payload: encryptedData
        });

      } catch (error) {
        console.error('❌ Erro na criptografia:', error.message);
        console.error('Stack:', error.stack);
        if (debug) {
          console.log(`🔐 Fallback: enviando dados sem criptografia para ${req.path}`);
        }
        // Em caso de erro, enviar dados sem criptografia
        return originalJson.call(this, data);
      }
    };

    next();
  };
}

/**
 * Middleware para descriptografar dados recebidos do frontend
 */
function decryptMiddleware(options = {}) {
  const {
    enabled = process.env.CRYPTO_ENABLED === 'true',
    debug = process.env.NODE_ENV === 'development'
  } = options;

  return (req, res, next) => {
    if (!enabled) {
      return next();
    }

    // Verificar se há dados criptografados no body
    if (req.body && req.body.encrypted && (req.body.payload || req.body.data)) {
      try {
        const sessionId = getSessionId(req);
        
        // Aceitar tanto 'payload' quanto 'data' para compatibilidade
        const encryptedPayload = req.body.payload || req.body.data;
        
        // Usar função híbrida que aceita ambos os formatos
        const decryptedData = cryptoUtils.decryptHybrid(encryptedPayload, sessionId);
        
        // Substituir body pelos dados descriptografados
        req.body = decryptedData;
        
        if (debug) {
          console.log(`🔓 Dados descriptografados de ${req.path}:`, {
            sessionId: sessionId.substring(0, 8) + '...',
            success: true,
            originalFormat: req.body.payload ? 'payload' : 'data',
            algorithm: encryptedPayload.algorithm || 'aes-256-gcm'
          });
        }

      } catch (error) {
        console.error('Erro na descriptografia:', error);
        return res.status(400).json({
          erro: 'Dados criptografados inválidos',
          codigo: 'CRYPTO_ERROR'
        });
      }
    }

    next();
  };
}

/**
 * Verifica se uma rota deve ser criptografada
 */
function shouldEncryptPath(path, includePaths, excludePaths) {
  // Se includePaths está definido, apenas essas rotas serão criptografadas
  if (includePaths) {
    return includePaths.some(p => path.startsWith(p));
  }

  // Senão, criptografar tudo exceto excludePaths
  return !excludePaths.some(p => path.startsWith(p));
}

/**
 * Obtém ou gera um session ID para o request
 */
function getSessionId(req) {
  // Tentar obter de diferentes fontes
  return req.headers['x-session-id'] || 
         req.sessionID || 
         req.user?.id || 
         req.ip + ':' + req.headers['user-agent'] ||
         'anonymous';
}

/**
 * Utilitário para criptografar dados manualmente em controllers
 */
function encryptResponse(data, req) {
  const sessionId = getSessionId(req);
  return cryptoUtils.encrypt(data, sessionId);
}

/**
 * Utilitário para descriptografar dados manualmente em controllers
 */
function decryptRequest(encryptedData, req) {
  const sessionId = getSessionId(req);
  return cryptoUtils.decrypt(encryptedData, sessionId);
}

export {
  cryptoMiddleware,
  decryptMiddleware,
  encryptResponse,
  decryptRequest,
  getSessionId
};

export default {
  encrypt: cryptoMiddleware,
  decrypt: decryptMiddleware,
  encryptResponse,
  decryptRequest
};
