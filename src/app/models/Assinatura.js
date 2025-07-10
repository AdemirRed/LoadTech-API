import { Model, DataTypes } from 'sequelize';

class Assinatura extends Model {
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
        plano_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        tipo_periodo: {
          type: DataTypes.ENUM('mensal', 'anual'),
          allowNull: false,
          defaultValue: 'mensal',
        },
        status: {
          type: DataTypes.ENUM('ativa', 'cancelada', 'suspensa', 'expirada', 'periodo_gratuito'),
          allowNull: false,
          defaultValue: 'periodo_gratuito',
        },
        data_inicio: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        data_fim: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        data_proxima_cobranca: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        valor_pago: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        desconto_aplicado: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: 0,
        },
        metodo_pagamento: {
          type: DataTypes.ENUM('cartao_credito', 'cartao_debito', 'pix', 'boleto', 'gratuito'),
          allowNull: false,
          defaultValue: 'gratuito',
        },
        gateway_assinatura_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        auto_renovacao: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        data_cancelamento: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        motivo_cancelamento: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
      },
      {
        sequelize,
        tableName: 'assinaturas',
        underscored: true,
        scopes: {
          ativas: {
            where: { status: ['ativa', 'periodo_gratuito'] },
          },
          expiradas: {
            where: { status: 'expirada' },
          },
          canceladas: {
            where: { status: 'cancelada' },
          },
        },
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'usuario' 
    });
    
    this.belongsTo(models.Plano, { 
      foreignKey: 'plano_id', 
      as: 'plano' 
    });
    
    this.hasMany(models.Pagamento, { 
      foreignKey: 'assinatura_id', 
      as: 'pagamentos' 
    });
  }

  // Método para verificar se está ativa
  isAtiva() {
    return ['ativa', 'periodo_gratuito'].includes(this.status) && 
           new Date() < new Date(this.data_fim);
  }

  // Método para verificar se está no período gratuito
  isPeriodoGratuito() {
    return this.status === 'periodo_gratuito';
  }

  // Método para verificar se pode ser renovada
  podeSerRenovada() {
    return this.status === 'ativa' && this.auto_renovacao;
  }

  // Método para calcular dias restantes
  getDiasRestantes() {
    const hoje = new Date();
    const dataFim = new Date(this.data_fim);
    const diferencaMs = dataFim - hoje;
    return Math.ceil(diferencaMs / (1000 * 60 * 60 * 24));
  }

  // Método para verificar se está próxima do vencimento
  isProximaVencimento(dias = 7) {
    return this.getDiasRestantes() <= dias && this.getDiasRestantes() > 0;
  }

  // Método para cancelar assinatura
  async cancelar(motivo = null) {
    this.status = 'cancelada';
    this.data_cancelamento = new Date();
    this.motivo_cancelamento = motivo;
    this.auto_renovacao = false;
    await this.save();
  }

  // Método para suspender assinatura
  async suspender() {
    this.status = 'suspensa';
    await this.save();
  }

  // Método para reativar assinatura
  async reativar() {
    if (this.status === 'suspensa') {
      this.status = 'ativa';
      await this.save();
    }
  }

  // Método para renovar assinatura
  async renovar() {
    const novaDataFim = new Date(this.data_fim);
    
    if (this.tipo_periodo === 'mensal') {
      novaDataFim.setMonth(novaDataFim.getMonth() + 1);
    } else {
      novaDataFim.setFullYear(novaDataFim.getFullYear() + 1);
    }

    this.data_fim = novaDataFim;
    this.data_proxima_cobranca = novaDataFim;
    
    if (this.status === 'periodo_gratuito') {
      this.status = 'ativa';
    }
    
    await this.save();
  }

  // Método para converter período gratuito em ativo
  async ativarAposPeriodoGratuito() {
    if (this.status === 'periodo_gratuito') {
      this.status = 'ativa';
      await this.save();
    }
  }
}

export default Assinatura;
