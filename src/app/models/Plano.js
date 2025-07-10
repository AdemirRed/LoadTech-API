import { Model, DataTypes } from 'sequelize';

class Plano extends Model {
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
        descricao: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        preco_mensal: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        preco_anual: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
          validate: {
            min: 0,
          },
        },
        desconto_anual: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
            max: 100,
          },
        },
        limite_produtos: {
          type: DataTypes.INTEGER,
          allowNull: true, // null = ilimitado
          validate: {
            min: 0,
          },
        },
        limite_vendas_mes: {
          type: DataTypes.INTEGER,
          allowNull: true, // null = ilimitado
          validate: {
            min: 0,
          },
        },
        taxa_transacao: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
            max: 100,
          },
        },
        funcionalidades: {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: [],
        },
        status: {
          type: DataTypes.ENUM('ativo', 'inativo'),
          allowNull: false,
          defaultValue: 'ativo',
        },
        periodo_gratuito: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          validate: {
            min: 0,
          },
        },
        destaque: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        ordem_exibicao: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
      },
      {
        sequelize,
        tableName: 'planos',
        schema: 'public',
        underscored: true,
        scopes: {
          ativos: {
            where: { status: 'ativo' },
          },
          destaque: {
            where: { destaque: true },
          },
        },
      }
    );

    return this;
  }

  static associate(models) {
    this.hasMany(models.Assinatura, { 
      foreignKey: 'plano_id', 
      as: 'assinaturas' 
    });
  }

  // Método para calcular preço com desconto anual
  getPrecoAnualComDesconto() {
    if (!this.preco_anual) {
      const precoAnualBase = this.preco_mensal * 12;
      const desconto = (precoAnualBase * this.desconto_anual) / 100;
      return precoAnualBase - desconto;
    }
    return this.preco_anual;
  }

  // Método para verificar se tem limite de produtos
  temLimiteProdutos() {
    return this.limite_produtos !== null;
  }

  // Método para verificar se tem limite de vendas
  temLimiteVendas() {
    return this.limite_vendas_mes !== null;
  }

  // Método para verificar se tem período gratuito
  temPeriodoGratuito() {
    return this.periodo_gratuito > 0;
  }

  // Método para verificar se funcionalidade está disponível
  temFuncionalidade(funcionalidade) {
    return this.funcionalidades.includes(funcionalidade);
  }

  // Método para obter economia anual
  getEconomiaAnual() {
    if (this.desconto_anual === 0) return 0;
    const precoAnualSemDesconto = this.preco_mensal * 12;
    const precoAnualComDesconto = this.getPrecoAnualComDesconto();
    return precoAnualSemDesconto - precoAnualComDesconto;
  }
}

export default Plano;
