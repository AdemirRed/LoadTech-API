import { Model, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        nome: {
          type: DataTypes.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
            len: [2, 100],
          },
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        senha_hash: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        telefone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        papel: {
          type: DataTypes.ENUM('admin', 'usuario'),
          allowNull: false,
          defaultValue: 'usuario',
        },
        status: {
          type: DataTypes.ENUM('ativo', 'inativo', 'pendente'),
          allowNull: false,
          defaultValue: 'pendente',
        },
        email_verificado: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        codigo_verificacao: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        codigo_verificacao_expiracao: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        codigo_recuperacao: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        codigo_recuperacao_expiracao: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        tentativas_recuperacao: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        ultima_tentativa_recuperacao: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        ultimo_login: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        
        // ===== CAMPOS DO ASAAS CUSTOMER =====
        asaas_customer_id: {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
          comment: 'ID do cliente no Asaas',
        },
        cpf_cnpj: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'CPF ou CNPJ do cliente (obrigatório no Asaas)',
          validate: {
            is: /^[0-9]{11}$|^[0-9]{14}$/, // CPF (11) ou CNPJ (14) dígitos
          },
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Telefone fixo do cliente',
        },
        mobile_phone: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Telefone celular do cliente',
        },
        address: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Logradouro do endereço',
        },
        address_number: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Número do endereço',
        },
        complement: {
          type: DataTypes.STRING(255),
          allowNull: true,
          comment: 'Complemento do endereço (máx. 255 caracteres)',
        },
        province: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Bairro',
        },
        postal_code: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'CEP do endereço',
          validate: {
            is: /^[0-9]{5}-?[0-9]{3}$/, // Formato CEP brasileiro
          },
        },
        external_reference: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Identificador do cliente no nosso sistema',
        },
        notification_disabled: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          comment: 'true para desabilitar notificações de cobrança',
        },
        additional_emails: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Emails adicionais para notificações separados por vírgula',
        },
        municipal_inscription: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Inscrição municipal do cliente',
        },
        state_inscription: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Inscrição estadual do cliente',
        },
        observations: {
          type: DataTypes.TEXT,
          allowNull: true,
          comment: 'Observações adicionais sobre o cliente',
        },
        group_name: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Nome do grupo ao qual o cliente pertence',
        },
        company: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'Nome da empresa do cliente',
        },
        foreign_customer: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: false,
          comment: 'true caso seja pagador estrangeiro',
        },
        // ===== FIM CAMPOS ASAAS =====
        
        // ===== CAMPOS DE UPLOAD =====
        avatar_url: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'URL do avatar/foto de perfil do usuário',
        },
        logo_url: {
          type: DataTypes.STRING,
          allowNull: true,
          comment: 'URL da logo da loja do usuário',
        },
        // ===== FIM CAMPOS UPLOAD =====
        
        // ===== CAMPOS DE CONTROLE DE REMOÇÃO =====
        aviso_remocao_enviado: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Indica se o aviso de remoção da conta foi enviado',
        },
        data_aviso_remocao: {
          type: DataTypes.DATE,
          allowNull: true,
          comment: 'Data em que o aviso de remoção foi enviado',
        },
        // ===== FIM CAMPOS CONTROLE REMOÇÃO =====
        
        senha: {
          type: DataTypes.VIRTUAL,
          set(valor) {
            this.setDataValue('senha_hash', bcrypt.hashSync(valor, 8));
          },
        },
      },
      {
        sequelize,
        tableName: 'users',
        underscored: true,
      }
    );

    return this;
  }

  static associate(models) {
    this.hasMany(models.Assinatura, { 
      foreignKey: 'user_id', 
      as: 'assinaturas' 
    });
    
    this.hasOne(models.Loja, { 
      foreignKey: 'user_id', 
      as: 'loja' 
    });
  }

  // Método para verificar senha
  checkPassword(senha) {
    return bcrypt.compareSync(senha, this.senha_hash);
  }

  // Método para obter assinatura ativa
  async getAssinaturaAtiva() {
    const { Assinatura } = this.sequelize.models;
    return await Assinatura.findOne({
      where: { 
        user_id: this.id, 
        status: ['ativa', 'periodo_gratuito'] 
      },
      include: ['plano']
    });
  }

  // Método para verificar se tem plano ativo
  async temPlanoAtivo() {
    const assinatura = await this.getAssinaturaAtiva();
    return !!assinatura;
  }

  // Método para verificar se pode criar loja
  async podecriarLoja() {
    // Em desenvolvimento, permitir criação de loja mesmo sem assinatura
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    
    const assinatura = await this.getAssinaturaAtiva();
    return assinatura && ['ativa', 'periodo_gratuito'].includes(assinatura.status);
  }

  // Serialização para JSON (remove campos sensíveis)
  toJSON() {
    const values = { ...this.get() };
    delete values.senha_hash;
    delete values.codigo_verificacao;
    delete values.codigo_recuperacao;
    delete values.codigo_verificacao_expiracao;
    delete values.codigo_recuperacao_expiracao;
    return values;
  }
}

export default User;
