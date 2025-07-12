import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sistema simples de renderização de templates HTML
 */
class TemplateRenderer {
  static templateCache = new Map();
  
  /**
   * Renderiza template HTML com dados
   */
  static render(templatePath, data = {}) {
    try {
      // Carregar template
      let template = this.templateCache.get(templatePath);
      
      if (!template) {
        const fullPath = path.join(__dirname, '../../../public', templatePath);
        template = fs.readFileSync(fullPath, 'utf-8');
        this.templateCache.set(templatePath, template);
      }
      
      // Processar dados padrão
      const processedData = this.processData(data);
      
      // Substituir placeholders
      let rendered = template;
      
      for (const [key, value] of Object.entries(processedData)) {
        const placeholder = `{{${key}}}`;
        rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
      }
      
      return rendered;
    } catch (error) {
      console.error('Erro ao renderizar template:', error);
      throw error;
    }
  }
  
  /**
   * Processa dados para o template
   */
  static processData(data) {
    const processed = { ...data };
    
    // Dados padrão
    processed.CURRENT_YEAR = new Date().getFullYear();
    
    // Processar dados da loja
    if (data.loja) {
      const loja = data.loja;
      
      processed.LOJA_NOME = loja.nome_loja || '';
      processed.LOJA_SLUG = loja.slug || '';
      processed.LOJA_DESCRICAO = loja.descricao || '';
      processed.LOJA_DESCRICAO_LONGA = loja.descricao || 'Uma loja incrível com produtos de qualidade e atendimento excepcional.';
      processed.LOJA_COR_PRIMARIA = loja.tema_cor_primaria || '#007bff';
      processed.LOJA_COR_SECUNDARIA = loja.tema_cor_secundaria || '#6c757d';
      processed.LOJA_LOGO_URL = loja.logo_url || '/shop/img/default-logo.png';
      processed.LOJA_BANNER_URL = loja.banner_url || '';
      processed.LOJA_URL = loja.url_base || '';
      processed.LOJA_BASE_URL = loja.url_base || '';
      
      // Contato
      processed.LOJA_WHATSAPP = loja.whatsapp || '';
      processed.LOJA_TELEFONE = loja.telefone_loja || '';
      processed.LOJA_TELEFONE_CLEAN = (loja.telefone_loja || '').replace(/\D/g, '');
      processed.LOJA_EMAIL = loja.email_loja || '';
      
      // Endereço
      const endereco = loja.endereco || {};
      processed.LOJA_ENDERECO_JSON = JSON.stringify(endereco);
      processed.ENDERECO_COMPLETO = this.formatEndereco(endereco);
      
      // Redes sociais
      const redes = loja.redes_sociais || {};
      processed.LOJA_REDES_SOCIAIS_JSON = JSON.stringify(redes);
      processed.INSTAGRAM_URL = redes.instagram || '';
      processed.FACEBOOK_URL = redes.facebook || '';
      processed.TWITTER_URL = redes.twitter || '';
      processed.YOUTUBE_URL = redes.youtube || '';
      
      // SEO
      processed.LOJA_PALAVRAS_CHAVE = loja.seo_palavras_chave || '';
      processed.ANALYTICS_CODE = loja.analytics_code || '';
      
      // Displays condicionais
      processed.LOJA_LOGO_DISPLAY = loja.logo_url ? 'block' : 'none';
      processed.WHATSAPP_DISPLAY = loja.whatsapp ? 'block' : 'none';
      processed.TELEFONE_DISPLAY = loja.telefone_loja ? 'block' : 'none';
      processed.EMAIL_DISPLAY = loja.email_loja ? 'block' : 'none';
      processed.ENDERECO_DISPLAY = this.hasEndereco(endereco) ? 'block' : 'none';
      processed.REDES_SOCIAIS_DISPLAY = this.hasRedesSociais(redes) ? 'flex' : 'none';
      processed.INSTAGRAM_DISPLAY = redes.instagram ? 'inline-flex' : 'none';
      processed.FACEBOOK_DISPLAY = redes.facebook ? 'inline-flex' : 'none';
      processed.TWITTER_DISPLAY = redes.twitter ? 'inline-flex' : 'none';
      processed.YOUTUBE_DISPLAY = redes.youtube ? 'inline-flex' : 'none';
    }
    
    return processed;
  }
  
  /**
   * Formata endereço completo
   */
  static formatEndereco(endereco) {
    if (!endereco || typeof endereco !== 'object') return '';
    
    const partes = [];
    
    if (endereco.logradouro) {
      let linha = endereco.logradouro;
      if (endereco.numero) linha += `, ${endereco.numero}`;
      if (endereco.complemento) linha += ` - ${endereco.complemento}`;
      partes.push(linha);
    }
    
    if (endereco.bairro) partes.push(endereco.bairro);
    
    const cidadeEstado = [];
    if (endereco.cidade) cidadeEstado.push(endereco.cidade);
    if (endereco.estado) cidadeEstado.push(endereco.estado);
    if (cidadeEstado.length > 0) partes.push(cidadeEstado.join(' - '));
    
    if (endereco.cep) partes.push(`CEP: ${this.formatCEP(endereco.cep)}`);
    
    return partes.join('<br>');
  }
  
  /**
   * Verifica se tem endereço
   */
  static hasEndereco(endereco) {
    if (!endereco || typeof endereco !== 'object') return false;
    return !!(endereco.logradouro || endereco.cidade || endereco.estado);
  }
  
  /**
   * Verifica se tem redes sociais
   */
  static hasRedesSociais(redes) {
    if (!redes || typeof redes !== 'object') return false;
    return !!(redes.instagram || redes.facebook || redes.twitter || redes.youtube);
  }
  
  /**
   * Formata CEP
   */
  static formatCEP(cep) {
    const cleaned = cep.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{5})(\d{3})$/);
    
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    
    return cep;
  }
  
  /**
   * Limpa cache (útil para desenvolvimento)
   */
  static clearCache() {
    this.templateCache.clear();
  }
}

export default TemplateRenderer;
