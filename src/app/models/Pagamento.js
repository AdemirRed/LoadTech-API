import { Model, DataTypes } from 'sequelize';

class Pagamento extends Model {
  static init(sequelize) {
    super.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        assinatura_id: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        valor: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          validate: {
            min: 0,
          },
        },
        status: {
          type: DataTypes.ENUM('pendente', 'aprovado', 'recusado', 'cancelado', 'estornado'),
          allowNull: false,
          defaultValue: 'pendente',
        },
        metodo_pagamento: {
          type: DataTypes.ENUM('cartao_credito', 'cartao_debito', 'pix', 'boleto'),
          allowNull: false,
        },
        gateway: {
          type: DataTypes.ENUM('mercadopago', 'pagseguro', 'stripe', 'paypal'),
          allowNull: false,
        },
        gateway_transacao_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        gateway_response: {
          type: DataTypes.JSON,
          allowNull: true,
        },
        data_vencimento: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        data_pagamento: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        descricao: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        taxa_gateway: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        valor_liquido: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'pagamentos',
        underscored: true,
        scopes: {
          aprovados: {
            where: { status: 'aprovado' },
          },
          pendentes: {
            where: { status: 'pendente' },
          },
          recusados: {
            where: { status: 'recusado' },
          },
        },
      }
    );

    return this;
  }

  static associate(models) {
    this.belongsTo(models.Assinatura, { 
      foreignKey: 'assinatura_id', 
      as: 'assinatura' 
    });
  }

  // Método para verificar se está aprovado
  isAprovado() {
    return this.status === 'aprovado';
  }

  // Método para verificar se está pendente
  isPendente() {
    return this.status === 'pendente';
  }

  // Método para verificar se foi recusado
  isRecusado() {
    return this.status === 'recusado';
  }

  // Método para verificar se está vencido (para boletos)
  isVencido() {
    if (!this.data_vencimento) return false;
    return new Date() > new Date(this.data_vencimento) && this.status === 'pendente';
  }

  // Método para aprovar pagamento
  async aprovar(dadosGateway = {}) {
    this.status = 'aprovado';
    this.data_pagamento = new Date();
    this.gateway_response = { ...this.gateway_response, ...dadosGateway };
    await this.save();
  }

  // Método para recusar pagamento
  async recusar(motivoRecusa = null) {
    this.status = 'recusado';
    if (motivoRecusa) {
      this.gateway_response = { 
        ...this.gateway_response, 
        motivo_recusa: motivoRecusa 
      };
    }
    await this.save();
  }

  // Método para cancelar pagamento
  async cancelar() {
    this.status = 'cancelado';
    await this.save();
  }

  // Método para estornar pagamento
  async estornar(dadosEstorno = {}) {
    this.status = 'estornado';
    this.gateway_response = { 
      ...this.gateway_response, 
      estorno: { 
        data: new Date(), 
        ...dadosEstorno 
      } 
    };
    await this.save();
  }

  // Método para calcular valor líquido
  calcularValorLiquido() {
    return parseFloat(this.valor) - parseFloat(this.taxa_gateway);
  }

  // Método para obter descrição do status
  getDescricaoStatus() {
    const descricoes = {
      pendente: 'Pagamento pendente',
      aprovado: 'Pagamento aprovado',
      recusado: 'Pagamento recusado',
      cancelado: 'Pagamento cancelado',
      estornado: 'Pagamento estornado',
    };
    return descricoes[this.status] || 'Status desconhecido';
  }

  // Método para obter descrição do método de pagamento
  getDescricaoMetodoPagamento() {
    const descricoes = {
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      pix: 'PIX',
      boleto: 'Boleto Bancário',
    };
    return descricoes[this.metodo_pagamento] || 'Método desconhecido';
  }

  // Método para gerar referência única
  static gerarReferencia(assinaturaId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `LT-${assinaturaId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
  }
}

export default Pagamento;
