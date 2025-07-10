import { Model, DataTypes } from 'sequelize';

class Loja extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        user_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        nome_loja: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [2, 100],
          },
        },
        descricao: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isAlphanumeric: true,
            isLowercase: true,
          },
        },
        logo_url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        banner_url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        tema_cor_primaria: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: '#007bff',
          validate: {
            is: /^#[0-9A-Fa-f]{6}$/,
          },
        },
        tema_cor_secundaria: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: '#6c757d',
          validate: {
            is: /^#[0-9A-Fa-f]{6}$/,
          },
        },
        endereco: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        telefone_loja: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        email_loja: {
          type: DataTypes.STRING,
          allowNull: true,
          validate: {
            isEmail: true,
          },
        },
        whatsapp: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        redes_sociais: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        configuracoes_pagamento: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        status: {
          type: DataTypes.ENUM('ativa', 'inativa', 'suspensa'),
          allowNull: false,
          defaultValue: 'ativa',
        },
        dominio_personalizado: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
        },
        certificado_ssl: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        analytics_code: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        seo_titulo: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        seo_descricao: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        seo_palavras_chave: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'lojas',
        underscored: true,
        scopes: {
          ativas: {
            where: { status: 'ativa' },
          },
          inativas: {
            where: { status: 'inativa' },
          },
          suspensas: {
            where: { status: 'suspensa' },
          },
        },
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'proprietario' 
    });
  }

  // Método para gerar slug único
  static async gerarSlugUnico(nomeLoja) {
    let slug = nomeLoja
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);

    let contador = 1;
    let slugOriginal = slug;
    
    while (await this.findOne({ where: { slug } })) {
      slug = `${slugOriginal}${contador}`;
      contador++;
    }

    return slug;
  }

  // Método para verificar se está ativa
  isAtiva() {
    return this.status === 'ativa';
  }

  // Método para obter URL da loja
  getUrl() {
    if (this.dominio_personalizado) {
      const protocolo = this.certificado_ssl ? 'https' : 'http';
      return `${protocolo}://${this.dominio_personalizado}`;
    }
    return `https://loadtech.com/loja/${this.slug}`;
  }

  // Método para verificar se tem domínio personalizado
  temDominioPersonalizado() {
    return !!this.dominio_personalizado;
  }

  // Método para configurar tema
  async configurarTema(corPrimaria, corSecundaria) {
    this.tema_cor_primaria = corPrimaria;
    this.tema_cor_secundaria = corSecundaria;
    await this.save();
  }

  // Método para configurar SEO
  async configurarSEO({ titulo, descricao, palavrasChave }) {
    this.seo_titulo = titulo;
    this.seo_descricao = descricao;
    this.seo_palavras_chave = palavrasChave;
    await this.save();
  }

  // Método para configurar pagamento
  async configurarPagamento(configuracoes) {
    this.configuracoes_pagamento = configuracoes;
    await this.save();
  }

  // Método para suspender loja
  async suspender() {
    this.status = 'suspensa';
    await this.save();
  }

  // Método para ativar loja
  async ativar() {
    this.status = 'ativa';
    await this.save();
  }

  // Método para desativar loja
  async desativar() {
    this.status = 'inativa';
    await this.save();
  }

  // Método para obter dados para exibição pública
  getDadosPublicos() {
    return {
      nome_loja: this.nome_loja,
      descricao: this.descricao,
      slug: this.slug,
      logo_url: this.logo_url,
      banner_url: this.banner_url,
      tema_cor_primaria: this.tema_cor_primaria,
      tema_cor_secundaria: this.tema_cor_secundaria,
      telefone_loja: this.telefone_loja,
      email_loja: this.email_loja,
      whatsapp: this.whatsapp,
      redes_sociais: this.redes_sociais,
      seo_titulo: this.seo_titulo,
      seo_descricao: this.seo_descricao,
      endereco: this.endereco,
    };
  }
}

export default Loja;
