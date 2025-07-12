/**
 * Loja Pública - JavaScript
 * Funcionalidades para as páginas públicas das lojas
 */

class PublicShop {
  constructor() {
    this.init();
  }

  init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupContactActions();
    this.setupLazyLoading();
    this.setupAnalytics();
  }

  /**
   * Configura o tema personalizado da loja
   */
  setupTheme() {
    const lojaData = window.LOJA_DATA;
    if (!lojaData) return;

    // Aplicar cores personalizadas
    if (lojaData.tema_cor_primaria) {
      document.documentElement.style.setProperty('--cor-primaria', lojaData.tema_cor_primaria);
    }
    
    if (lojaData.tema_cor_secundaria) {
      document.documentElement.style.setProperty('--cor-secundaria', lojaData.tema_cor_secundaria);
    }

    // Aplicar banner personalizado
    const banner = document.querySelector('.shop-banner');
    if (banner && lojaData.banner_url) {
      banner.style.backgroundImage = `url(${lojaData.banner_url})`;
      banner.classList.add('with-image');
    }
  }

  /**
   * Configura navegação ativa
   */
  setupNavigation() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.shop-nav a');
    
    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentPath) {
        link.classList.add('active');
      }
    });

    // Menu mobile toggle
    this.setupMobileMenu();
  }

  /**
   * Configura menu mobile
   */
  setupMobileMenu() {
    const navbar = document.querySelector('.shop-navbar');
    const nav = document.querySelector('.shop-nav');
    
    if (!navbar || !nav) return;

    // Criar botão do menu mobile
    const menuButton = document.createElement('button');
    menuButton.className = 'mobile-menu-toggle';
    menuButton.innerHTML = '☰';
    menuButton.style.display = 'none';
    
    navbar.appendChild(menuButton);

    // Toggle do menu
    menuButton.addEventListener('click', () => {
      nav.classList.toggle('mobile-open');
    });

    // Responsive behavior
    const checkMobile = () => {
      if (window.innerWidth <= 768) {
        menuButton.style.display = 'block';
        nav.classList.add('mobile-nav');
      } else {
        menuButton.style.display = 'none';
        nav.classList.remove('mobile-nav', 'mobile-open');
      }
    };

    window.addEventListener('resize', checkMobile);
    checkMobile();
  }

  /**
   * Configura ações de contato
   */
  setupContactActions() {
    this.setupWhatsAppLink();
    this.setupEmailLinks();
    this.setupPhoneLinks();
  }

  /**
   * Configura link do WhatsApp
   */
  setupWhatsAppLink() {
    const lojaData = window.LOJA_DATA;
    const whatsappButtons = document.querySelectorAll('[data-whatsapp]');
    
    whatsappButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const phone = lojaData?.whatsapp || button.dataset.whatsapp;
        const message = button.dataset.message || `Olá! Vim através da loja online ${lojaData?.nome_loja || ''}.`;
        
        if (phone) {
          const cleanPhone = phone.replace(/\D/g, '');
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
          
          // Track analytics
          this.trackEvent('contact', 'whatsapp_click', lojaData?.nome_loja);
        }
      });
    });
  }

  /**
   * Configura links de email
   */
  setupEmailLinks() {
    const emailLinks = document.querySelectorAll('[data-email]');
    
    emailLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.trackEvent('contact', 'email_click', link.dataset.email);
      });
    });
  }

  /**
   * Configura links de telefone
   */
  setupPhoneLinks() {
    const phoneLinks = document.querySelectorAll('[data-phone]');
    
    phoneLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.trackEvent('contact', 'phone_click', link.dataset.phone);
      });
    });
  }

  /**
   * Configura lazy loading para imagens
   */
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Configura analytics básico
   */
  setupAnalytics() {
    // Track page view
    this.trackPageView();
    
    // Track scroll depth
    this.trackScrollDepth();
    
    // Track time on page
    this.trackTimeOnPage();
  }

  /**
   * Track page view
   */
  trackPageView() {
    const lojaData = window.LOJA_DATA;
    this.trackEvent('page', 'view', window.location.pathname, {
      loja: lojaData?.nome_loja,
      slug: lojaData?.slug
    });
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth() {
    let maxScroll = 0;
    const depths = [25, 50, 75, 90];
    const tracked = new Set();

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        depths.forEach(depth => {
          if (scrollPercent >= depth && !tracked.has(depth)) {
            tracked.add(depth);
            this.trackEvent('engagement', 'scroll_depth', `${depth}%`);
          }
        });
      }
    });
  }

  /**
   * Track time on page
   */
  trackTimeOnPage() {
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', () => {
      const timeOnPage = Math.round((Date.now() - startTime) / 1000);
      this.trackEvent('engagement', 'time_on_page', `${timeOnPage}s`);
    });
  }

  /**
   * Track custom event
   */
  trackEvent(category, action, label, extra = {}) {
    const lojaData = window.LOJA_DATA;
    
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        loja_nome: lojaData?.nome_loja,
        loja_slug: lojaData?.slug,
        ...extra
      });
    }
    
    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
      fbq('track', 'CustomEvent', {
        category,
        action,
        label,
        loja: lojaData?.nome_loja
      });
    }
    
    // Console para debug
    if (process.env.NODE_ENV === 'development') {
      console.log('Track Event:', { category, action, label, extra });
    }
  }

  /**
   * Utilitários
   */
  static formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
  }

  static formatCEP(cep) {
    const cleaned = cep.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{5})(\d{3})$/);
    
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    
    return cep;
  }

  static showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.insertBefore(messageDiv, document.body.firstChild);
    
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }

  static showLoading(show = true) {
    let loading = document.querySelector('.loading-overlay');
    
    if (show && !loading) {
      loading = document.createElement('div');
      loading.className = 'loading-overlay';
      loading.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
      loading.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255,255,255,0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      `;
      document.body.appendChild(loading);
    } else if (!show && loading) {
      loading.remove();
    }
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new PublicShop();
});

// Estilos adicionais para menu mobile
const mobileStyles = `
  .mobile-menu-toggle {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--cor-primaria);
    cursor: pointer;
    padding: 0.5rem;
  }
  
  .mobile-nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    box-shadow: var(--sombra);
    flex-direction: column;
    padding: 1rem;
    display: none;
  }
  
  .mobile-nav.mobile-open {
    display: flex;
  }
  
  .mobile-nav a {
    padding: 1rem;
    border-bottom: 1px solid var(--cor-borda);
  }
  
  .loading-overlay .loading {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: var(--sombra-hover);
  }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = mobileStyles;
document.head.appendChild(styleSheet);
