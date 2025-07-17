import crypto from 'crypto';

/**
 * Utilitários de criptografia para comunicação segura entre Backend e Frontend
 * Implementa criptografia AES-256-GCM com chaves compartilhadas
 */

class CryptoUtils {
  constructor() {
    // Chave mestra do ambiente (deve estar em .env em produção)
    this.MASTER_KEY = process.env.CRYPTO_MASTER_KEY || 'loadtech_default_key_2025_muito_segura';
    this.ALGORITHM = 'aes-256-gcm';
    this.KEY_LENGTH = 32; // 256 bits
    this.IV_LENGTH = 16;  // 128 bits
    this.TAG_LENGTH = 16; // 128 bits
  }

  /**
   * Gera uma chave derivada da chave mestra usando PBKDF2
   * @param {string} salt - Salt único para derivação
   * @returns {Buffer} Chave derivada
   */
  deriveKey(salt) {
    // Método seguro com PBKDF2 (100.000 iterações, salt único)
    return crypto.pbkdf2Sync(this.MASTER_KEY, salt, 100000, this.KEY_LENGTH, 'sha256');
  }

  /**
   * Criptografa dados para envio seguro
   * @param {string|object} data - Dados para criptografar
   * @param {string} sessionId - ID da sessão (usado como salt)
   * @returns {object} Dados criptografados com metadados
   */
  encrypt(data, sessionId = 'default') {
    try {
      // Converter dados para string JSON se necessário
      const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Gerar IV aleatório
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      // Derivar chave única para esta sessão
      const key = this.deriveKey(sessionId);
      
      // Criar cipher
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      
      // Criptografar
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Obter tag de autenticação
      const tag = cipher.getAuthTag();
      
      // Timestamp para evitar replay attacks
      const timestamp = Date.now();
      
      // Retornar dados criptografados
      return {
        data: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        timestamp: timestamp,
        signature: this.generateSignature(Buffer.from(encrypted, 'hex'), iv, tag, timestamp, sessionId)
      };
    } catch (error) {
      throw new Error(`Erro na criptografia: ${error.message}`);
    }
  }

  /**
   * Descriptografa dados recebidos
   * @param {object} encryptedData - Dados criptografados
   * @param {string} sessionId - ID da sessão
   * @param {number} maxAge - Idade máxima em ms (default: 5 min)
   * @returns {string|object} Dados descriptografados
   */
  decrypt(encryptedData, sessionId = 'default', maxAge = 300000) {
    try {
      const { data, iv, tag, timestamp, signature } = encryptedData;
      
      // Verificar timestamp (proteção contra replay)
      if (Date.now() - timestamp > maxAge) {
        throw new Error('Dados expirados');
      }
      
      // Converter de hex
      const encrypted = data;
      const ivBuffer = Buffer.from(iv, 'hex');
      const tagBuffer = Buffer.from(tag, 'hex');
      
      // Verificar assinatura
      const expectedSignature = this.generateSignature(Buffer.from(encrypted, 'hex'), ivBuffer, tagBuffer, timestamp, sessionId);
      if (signature !== expectedSignature) {
        throw new Error('Assinatura inválida');
      }
      
      // Derivar chave
      const key = this.deriveKey(sessionId);
      
      // Criar decipher
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
      decipher.setAuthTag(tagBuffer);
      
      // Descriptografar
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Tentar fazer parse como JSON, senão retornar string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      throw new Error(`Erro na descriptografia: ${error.message}`);
    }
  }

  /**
   * Descriptografa dados no formato do frontend (AES-256-CBC com salt)
   * @param {object} encryptedData - Dados do frontend
   * @param {string} sessionId - ID da sessão (usado como base para salt)
   * @returns {string|object} Dados descriptografados
   */
  decryptFrontendFormat(encryptedData) {
    try {
      const { data, iv, salt, tag, algorithm, iterations, keyLength } = encryptedData;
      
      // Verificar se é o formato do frontend
      if (algorithm !== 'aes-256-cbc' || iterations !== 100000) {
        throw new Error('Formato não suportado');
      }
      
      // Derivar chave usando o salt do frontend
      const key = crypto.pbkdf2Sync(this.MASTER_KEY, salt, iterations, keyLength / 8, 'sha256');
      
      // Descriptografar usando AES-256-CBC
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
      
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Tentar fazer parse como JSON
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      throw new Error(`Erro na descriptografia frontend: ${error.message}`);
    }
  }

  /**
   * Função híbrida que aceita ambos os formatos
   * @param {object} encryptedData - Dados criptografados
   * @param {string} sessionId - ID da sessão
   * @param {number} maxAge - Idade máxima em ms
   * @returns {string|object} Dados descriptografados
   */
  decryptHybrid(encryptedData, sessionId = 'default', maxAge = 300000) {
    try {
      // Verificar se é formato do frontend (tem algorithm e salt)
      if (encryptedData.algorithm && encryptedData.salt) {
        console.log('🔓 Detectado formato frontend (AES-CBC)');
        return this.decryptFrontendFormat(encryptedData);
      }
      
      // Senão, usar formato backend (GCM)
      console.log('🔓 Detectado formato backend (AES-GCM)');
      return this.decrypt(encryptedData, sessionId, maxAge);
      
    } catch (error) {
      throw new Error(`Erro na descriptografia híbrida: ${error.message}`);
    }
  }

  /**
   * Gera assinatura HMAC para verificação de integridade
   * @param {Buffer} encrypted - Dados criptografados
   * @param {Buffer} iv - Vetor de inicialização
   * @param {Buffer} tag - Tag de autenticação
   * @param {number} timestamp - Timestamp
   * @param {string} sessionId - ID da sessão
   * @returns {string} Assinatura HMAC
   */
  generateSignature(encrypted, iv, tag, timestamp, sessionId) {
    const hmac = crypto.createHmac('sha256', this.MASTER_KEY);
    hmac.update(encrypted);
    hmac.update(iv);
    hmac.update(tag);
    hmac.update(timestamp.toString());
    hmac.update(sessionId);
    return hmac.digest('hex');
  }

  /**
   * Gera um token seguro para sessão
   * @returns {string} Token único
   */
  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Gera hash seguro para senhas ou dados sensíveis
   * @param {string} data - Dados para hash
   * @param {string} salt - Salt opcional
   * @returns {string} Hash seguro
   */
  hash(data, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512');
    return `${actualSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verifica hash
   * @param {string} data - Dados originais
   * @param {string} hashedData - Hash para verificar
   * @returns {boolean} True se válido
   */
  verifyHash(data, hashedData) {
    try {
      const [salt, hash] = hashedData.split(':');
      const newHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
      return hash === newHash.toString('hex');
    } catch {
      return false;
    }
  }
}

// Instância singleton
const cryptoUtils = new CryptoUtils();

export default cryptoUtils;
export { CryptoUtils };
