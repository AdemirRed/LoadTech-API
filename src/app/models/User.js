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
