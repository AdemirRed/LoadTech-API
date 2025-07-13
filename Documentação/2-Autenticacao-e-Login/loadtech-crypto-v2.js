// 🔐 LoadTech Crypto - Utilitário para Frontend
// Versão 2.0 - Compatível com crypto-js (React/Vue/Angular)

// INSTALAÇÃO: npm install crypto-js

import CryptoJS from 'crypto-js';

class LoadTechCrypto {
    constructor(masterKey = 'loadtech_crypto_master_key_2025_muito_segura_producao_deve_ser_diferente') {
        this.masterKey = masterKey;
        this.debugMode = process.env.NODE_ENV === 'development';
    }

    /**
     * Criptografa dados para envio à API
     * @param {any} data - Dados para criptografar (string, object, array)
     * @returns {string} - Dados criptografados
     */
    encrypt(data) {
        try {
            const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
            const encrypted = CryptoJS.AES.encrypt(jsonString, this.masterKey).toString();
            
            if (this.debugMode) {
                console.log('🔐 [CRYPTO] Dados criptografados:', {
                    original: data,
                    encrypted: encrypted.substring(0, 50) + '...'
                });
            }
            
            return encrypted;
        } catch (error) {
            console.error('❌ [CRYPTO] Erro ao criptografar:', error);
            throw new Error('Falha na criptografia');
        }
    }

    /**
     * Descriptografa dados recebidos da API
     * @param {string} encryptedData - Dados criptografados
     * @returns {any} - Dados descriptografados
     */
    decrypt(encryptedData) {
        try {
            const decrypted = CryptoJS.AES.decrypt(encryptedData, this.masterKey);
            const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedString) {
                throw new Error('Dados descriptografados estão vazios');
            }

            // Tenta fazer parse como JSON, senão retorna string
            try {
                const parsed = JSON.parse(decryptedString);
                
                if (this.debugMode) {
                    console.log('🔓 [CRYPTO] Dados descriptografados:', parsed);
                }
                
                return parsed;
            } catch {
                if (this.debugMode) {
                    console.log('🔓 [CRYPTO] Dados descriptografados (string):', decryptedString);
                }
                return decryptedString;
            }
        } catch (error) {
            console.error('❌ [CRYPTO] Erro ao descriptografar:', error);
            throw new Error('Falha na descriptografia');
        }
    }

    /**
     * Verifica se os dados estão criptografados
     * @param {any} data - Dados para verificar
     * @returns {boolean} - true se estiver criptografado
     */
    isEncrypted(data) {
        if (typeof data !== 'string') return false;
        try {
            const decrypted = CryptoJS.AES.decrypt(data, this.masterKey);
            return decrypted.toString(CryptoJS.enc.Utf8).length > 0;
        } catch {
            return false;
        }
    }

    /**
     * Verifica se a resposta da API está no formato criptografado
     * @param {any} responseData - Dados da resposta
     * @returns {boolean} - true se for resposta criptografada
     */
    isCryptoResponse(responseData) {
        return responseData && 
               typeof responseData === 'object' && 
               responseData.encrypted && 
               typeof responseData.encrypted === 'string';
    }

    /**
     * Helper para log de debug
     * @param {string} message - Mensagem
     * @param {any} data - Dados para log
     */
    log(message, data = null) {
        if (this.debugMode) {
            console.log(`🔐 [CRYPTO] ${message}`, data || '');
        }
    }
}

export default LoadTechCrypto;

// EXEMPLO DE USO:
/*
import LoadTechCrypto from './loadtech-crypto';

const crypto = new LoadTechCrypto();

// Criptografar dados
const userData = { email: 'user@test.com', password: '123456' };
const encrypted = crypto.encrypt(userData);

// Descriptografar dados
const decrypted = crypto.decrypt(encrypted);

// Verificar se está criptografado
const isEncrypted = crypto.isEncrypted(someData);
*/
