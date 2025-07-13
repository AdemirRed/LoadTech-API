/**
 * 🔄 Exemplo Prático: Fluxo de Assinatura com Confirmação Asaas
 * 
 * Este exemplo demonstra como implementar o fluxo:
 * 1. Criar pagamento no Asaas
 * 2. Aguardar confirmação do pagamento
 * 3. Ativar plano no servidor LoadTech
 */

import React, { useState } from 'react';
import paymentService from '../services/paymentService';
import { useAssinaturas } from '../hooks/useAssinaturas';

const ExemploAssinaturaSegura = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const { assinaturas, fetchAssinaturas } = useAssinaturas();

  const adicionarLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const exemploFluxoCompleto = async () => {
    setLoading(true);
    setStep(2);
    setLogs([]);
    
    try {
      adicionarLog('🚀 Iniciando fluxo de assinatura segura', 'info');
      
      // Dados de exemplo
      const dadosAssinatura = {
        planoId: 1, // ID do plano escolhido
        dadosPessoais: {
          name: 'João Silva',
          email: 'joao@email.com',
          cpfCnpj: '12345678901',
          phone: '11999999999'
        },
        dadosCartao: {
          number: '4111111111111111', // Cartão de teste
          expiryMonth: '12',
          expiryYear: '2025',
          cvv: '123',
          holderName: 'JOAO SILVA'
        }
      };

      adicionarLog('📋 Dados validados, iniciando processo...', 'info');

      // ETAPA 1: Criar assinatura no Asaas
      adicionarLog('🔄 Etapa 1: Criando assinatura no Asaas...', 'info');
      
      const assinaturaAsaas = await criarAssinaturaAsaas(dadosAssinatura);
      
      if (!assinaturaAsaas.success) {
        throw new Error(assinaturaAsaas.error);
      }
      
      adicionarLog(`✅ Assinatura criada no Asaas: ${assinaturaAsaas.subscriptionId}`, 'success');

      // ETAPA 2: Aguardar confirmação do pagamento
      adicionarLog('⏳ Etapa 2: Aguardando confirmação do pagamento...', 'info');
      
      const confirmacao = await aguardarConfirmacao(
        assinaturaAsaas.subscriptionId,
        assinaturaAsaas.paymentId
      );
      
      if (!confirmacao.success) {
        throw new Error('Pagamento não foi confirmado');
      }
      
      adicionarLog(`💳 Pagamento confirmado: ${confirmacao.data.status}`, 'success');

      // ETAPA 3: Ativar plano no servidor LoadTech
      adicionarLog('🔧 Etapa 3: Ativando plano no servidor LoadTech...', 'info');
      
      const ativacao = await ativarPlanoServidor({
        asaasSubscriptionId: assinaturaAsaas.subscriptionId,
        asaasPaymentId: assinaturaAsaas.paymentId,
        planoId: dadosAssinatura.planoId,
        confirmacaoAsaas: confirmacao.data
      });
      
      if (!ativacao.success) {
        throw new Error(ativacao.error);
      }
      
      adicionarLog('🎉 Plano ativado com sucesso!', 'success');
      
      setResultado({
        success: true,
        assinatura: ativacao.assinatura,
        message: 'Assinatura criada e ativada com sucesso!'
      });
      
      setStep(3);
      
      // Atualizar lista de assinaturas
      await fetchAssinaturas();
      
    } catch (error) {
      console.error('❌ Erro no fluxo:', error);
      adicionarLog(`❌ Erro: ${error.message}`, 'error');
      setResultado({
        success: false,
        error: error.message
      });
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  // Simular criação de assinatura no Asaas
  const criarAssinaturaAsaas = async (dados) => {
    adicionarLog('📡 Enviando dados para Asaas...', 'info');
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simular resposta do Asaas
    return {
      success: true,
      subscriptionId: 'sub_' + Math.random().toString(36).substr(2, 9),
      paymentId: 'pay_' + Math.random().toString(36).substr(2, 9),
      status: 'PENDING'
    };
  };

  // Simular aguardo de confirmação
  const aguardarConfirmacao = async (subscriptionId, paymentId) => {
    const maxTentativas = 6; // 30 segundos total
    
    for (let i = 1; i <= maxTentativas; i++) {
      adicionarLog(`🔍 Verificando pagamento (${i}/${maxTentativas})...`, 'info');
      
      // Simular delay de verificação
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Simular confirmação aleatória após algumas tentativas
      if (i >= 3 && Math.random() > 0.3) {
        return {
          success: true,
          data: {
            paymentId,
            subscriptionId,
            status: 'CONFIRMED',
            confirmedAt: new Date().toISOString(),
            value: 29.90
          }
        };
      }
    }
    
    throw new Error('Timeout: Pagamento não confirmado');
  };

  // Ativar plano no servidor LoadTech
  const ativarPlanoServidor = async (dados) => {
    adicionarLog('📡 Enviando confirmação para servidor LoadTech...', 'info');
    
    try {
      // Fazer requisição real para a API
      const response = await fetch('/api/assinaturas/confirmar-asaas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          asaas_subscription_id: dados.asaasSubscriptionId,
          asaas_payment_id: dados.asaasPaymentId,
          plano_id: dados.planoId,
          confirmacao_asaas: dados.confirmacaoAsaas,
          confirmed_at: new Date().toISOString()
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.erro || 'Erro ao ativar plano');
      }
      
      return result;
      
    } catch (error) {
      adicionarLog(`❌ Erro na comunicação com servidor: ${error.message}`, 'error');
      throw error;
    }
  };

  const resetarExemplo = () => {
    setStep(1);
    setLogs([]);
    setResultado(null);
    setLoading(false);
  };

  return (
    <div className="exemplo-assinatura">
      <h2>🔄 Exemplo: Fluxo de Assinatura Segura</h2>
      <p>Demonstração do fluxo: Asaas → Confirmação → Ativação Servidor</p>
      
      {step === 1 && (
        <div className="step-inicial">
          <h3>🚀 Pronto para iniciar?</h3>
          <p>Este exemplo irá:</p>
          <ol>
            <li>Criar uma assinatura no Asaas</li>
            <li>Aguardar confirmação do pagamento</li>
            <li>Ativar o plano no servidor LoadTech</li>
          </ol>
          
          <button 
            onClick={exemploFluxoCompleto}
            disabled={loading}
            className="btn-primary"
          >
            🎯 Iniciar Exemplo
          </button>
        </div>
      )}

      {(step === 2) && (
        <div className="step-processando">
          <h3>🔄 Processando...</h3>
          
          <div className="progress-steps">
            <div className="step completed">✅ Dados validados</div>
            <div className="step processing">⏳ Confirmando pagamento...</div>
            <div className="step pending">⏸️ Ativando plano</div>
          </div>
          
          <div className="logs">
            <h4>📝 Log do Processo:</h4>
            <div className="log-container">
              {logs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.type}`}>
                  <span className="timestamp">[{log.timestamp}]</span>
                  <span className="message">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && resultado?.success && (
        <div className="step-sucesso">
          <h3>🎉 Sucesso!</h3>
          <p>Assinatura criada e ativada com sucesso!</p>
          
          <div className="resultado-detalhes">
            <h4>📋 Detalhes da Assinatura:</h4>
            <ul>
              <li><strong>ID:</strong> {resultado.assinatura?.id}</li>
              <li><strong>Plano:</strong> {resultado.assinatura?.plano}</li>
              <li><strong>Status:</strong> {resultado.assinatura?.status}</li>
              <li><strong>Valor:</strong> R$ {resultado.assinatura?.valor}</li>
            </ul>
          </div>
          
          <button onClick={resetarExemplo} className="btn-secondary">
            🔄 Executar Novamente
          </button>
        </div>
      )}

      {step === 4 && resultado?.success === false && (
        <div className="step-erro">
          <h3>❌ Erro no Processo</h3>
          <p className="error-message">{resultado.error}</p>
          
          <button onClick={resetarExemplo} className="btn-secondary">
            🔄 Tentar Novamente
          </button>
        </div>
      )}

      <div className="assinaturas-atuais">
        <h4>📋 Suas Assinaturas:</h4>
        {assinaturas.length === 0 ? (
          <p>Nenhuma assinatura encontrada.</p>
        ) : (
          <ul>
            {assinaturas.map(assinatura => (
              <li key={assinatura.id}>
                <strong>{assinatura.plano?.nome}</strong> - 
                Status: {assinatura.status} - 
                R$ {assinatura.valor}/mês
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ExemploAssinaturaSegura;
