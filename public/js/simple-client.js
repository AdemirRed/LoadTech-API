/**
 * Cliente simplificado para teste das APIs sem criptografia
 */

class SimpleAPIClient {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
  }

  async fetch(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      defaultOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(fullUrl, defaultOptions);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data: data,
      json: async () => data
    };
  }

  async get(url, options = {}) {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  async post(url, body, options = {}) {
    return this.fetch(url, { ...options, method: 'POST', body });
  }

  async put(url, body, options = {}) {
    return this.fetch(url, { ...options, method: 'PUT', body });
  }

  async delete(url, options = {}) {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }

  // Métodos dummy para compatibilidade
  encrypt(data) {
    return Promise.resolve(data);
  }

  decrypt(data) {
    return Promise.resolve(data);
  }

  setEnabled(enabled) {
    // Não faz nada no cliente simples
  }

  setDebug(debug) {
    // Não faz nada no cliente simples
  }
}

// Compatibilidade com o código existente
window.LoadTechCrypto = {
  LoadTechCryptoClient: SimpleAPIClient,
  initCrypto: (options = {}) => new SimpleAPIClient(options.baseURL),
  getCryptoClient: () => new SimpleAPIClient()
};
