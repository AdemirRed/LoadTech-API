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
    debug = process.env.CRYPTO_DEBUG === 'true'
  } = options;

  return (req, res, next) => {
    if (!enabled) {
      if (debug) console.log('🔐 [DECRYPT] Middleware desabilitado');
      return next();
    }

    // Verificar se há dados criptografados no body
    if (req.body && (req.body.encrypted || req.body.algorithm)) {
      try {
        const sessionId = getSessionId(req);
        
        if (debug) {
          console.log(`🔓 [DECRYPT] Processando ${req.path}:`, {
            hasEncrypted: !!req.body.encrypted,
            hasPayload: !!req.body.payload,
            hasData: !!req.body.data,
            hasAlgorithm: !!req.body.algorithm,
            algorithm: req.body.algorithm || req.body.payload?.algorithm || req.body.data?.algorithm,
            sessionId: sessionId.substring(0, 8) + '...'
          });
        }
        
        let encryptedPayload;
        
        // Determinar formato dos dados
        if (req.body.encrypted && (req.body.payload || req.body.data)) {
          // Formato padrão do backend: { encrypted: true, payload: {...} }
          encryptedPayload = req.body.payload || req.body.data;
          if (debug) console.log('🔓 [DECRYPT] Formato backend detectado');
        } else if (req.body.algorithm) {
          // Formato direto do frontend: { algorithm: "aes-256-cbc", data: "...", ... }
          encryptedPayload = req.body;
          if (debug) console.log('🔓 [DECRYPT] Formato frontend detectado');
        } else {
          if (debug) console.log('🔓 [DECRYPT] Formato não reconhecido, pulando');
          return next();
        }
        
        // Usar função híbrida para descriptografar
        const decryptedData = cryptoUtils.decryptHybrid(encryptedPayload, sessionId);
        
        // Substituir body pelos dados descriptografados
        req.body = decryptedData;
        
        if (debug) {
          console.log(`✅ [DECRYPT] Sucesso em ${req.path}:`, {
            algorithm: encryptedPayload.algorithm || 'aes-256-gcm',
            decryptedType: typeof decryptedData,
            decryptedKeys: typeof decryptedData === 'object' ? Object.keys(decryptedData) : 'N/A'
          });
        }

      } catch (error) {
        console.error('❌ [DECRYPT] Erro na descriptografia:', {
          path: req.path,
          error: error.message,
          algorithm: req.body.algorithm || req.body.payload?.algorithm || 'unknown',
          hasPayload: !!req.body.payload,
          hasData: !!req.body.data
        });
        
        return res.status(400).json({
          erro: 'Dados criptografados inválidos',
          codigo: 'CRYPTO_ERROR',
          detalhes: debug ? error.message : 'Erro na descriptografia'
        });
      }
    } else if (debug) {
      console.log(`🔓 [DECRYPT] Sem dados criptografados em ${req.path}`);
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
