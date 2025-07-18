import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import User from '../models/User.js';
import Plano from '../models/Plano.js';
import Assinatura from '../models/Assinatura.js';
import authConfig from '../../config/auth.js';
import sendEmail from '../../utils/mailer.js';
import AsaasClient from '../../services/AsaasClient.js';

class UserController {
  // Registrar novo usuário
  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        nome: Yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
        email: Yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
        senha: Yup.string().min(6, 'Senha deve ter pelo menos 6 caracteres').required('Senha é obrigatória'),
        cpf_cnpj: Yup.string().required('CPF/CNPJ é obrigatório').min(11, 'CPF/CNPJ deve ter pelo menos 11 caracteres'),
        telefone: Yup.string().nullable(),
        plano_id: Yup.string().uuid('Plano inválido').nullable(),
        tipo_periodo: Yup.string().oneOf(['mensal', 'anual'], 'Tipo de período inválido').default('mensal'),
      });

      await schema.validate(req.body);

      const { nome, email, senha, cpf_cnpj, telefone, plano_id, tipo_periodo = 'mensal' } = req.body;

      // Verificar se usuário já existe
      const userExists = await User.findOne({ where: { email } });
      if (userExists) {
        return res.status(400).json({ erro: 'E-mail já está em uso.' });
      }

      // Validar plano se fornecido
      let plano = null;
      if (plano_id) {
        plano = await Plano.findByPk(plano_id);
        if (!plano || plano.status !== 'ativo') {
          return res.status(400).json({ erro: 'Plano inválido ou inativo.' });
        }
      }

      // Gerar código de verificação
      const codigoVerificacao = crypto.randomInt(100000, 999999).toString();
      const codigoExpiracao = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

      // Criar usuário
      const user = await User.create({
        nome,
        email,
        senha,
        cpf_cnpj,
        telefone,
        codigo_verificacao: codigoVerificacao,
        codigo_verificacao_expiracao: codigoExpiracao,
        status: 'pendente',
      });

      // 🔥 SINCRONIZAR AUTOMATICAMENTE COM ASAAS
      console.log(`🔄 Iniciando sincronização automática com Asaas para ${email}...`);
      try {
        const syncResult = await syncUserWithAsaas(user, {
          phone: telefone,
          mobilePhone: telefone
        });
        
        console.log(`📊 Resultado da sincronização:`, syncResult);
        
        if (syncResult.success) {
          if (syncResult.linked) {
            console.log(`🔗 Usuário ${email} vinculado ao cliente Asaas existente: ${syncResult.customerId}`);
          } else if (syncResult.created) {
            console.log(`✅ Cliente Asaas criado automaticamente para ${email}: ${syncResult.customerId}`);
          }
        } else {
          console.warn(`⚠️ Falha na sincronização com Asaas para ${email}:`, syncResult.error);
        }
      } catch (syncError) {
        console.error(`❌ Erro na sincronização automática com Asaas para ${email}:`, syncError);
        console.error('Stack trace:', syncError.stack);
        // Não interrompe o cadastro, apenas loga o erro
      }

      // Criar assinatura se plano foi selecionado
      if (plano) {
        const dataInicio = new Date();
        let dataFim = new Date();
        
        // Se tem período gratuito, usar ele primeiro
        if (plano.periodo_gratuito > 0) {
          dataFim.setDate(dataFim.getDate() + plano.periodo_gratuito);
        } else {
          // Senão, calcular baseado no tipo de período
          if (tipo_periodo === 'anual') {
            dataFim.setFullYear(dataFim.getFullYear() + 1);
          } else {
            dataFim.setMonth(dataFim.getMonth() + 1);
          }
        }

        await Assinatura.create({
          user_id: user.id,
          plano_id: plano.id,
          tipo_periodo,
          status: plano.periodo_gratuito > 0 ? 'periodo_gratuito' : 'ativa',
          data_inicio: dataInicio,
          data_fim: dataFim,
          valor_pago: plano.periodo_gratuito > 0 ? 0 : (tipo_periodo === 'anual' ? plano.getPrecoAnualComDesconto() : plano.preco_mensal),
          metodo_pagamento: plano.periodo_gratuito > 0 ? 'gratuito' : 'cartao_credito',
        });
      }

      // Enviar e-mail de verificação
      try {
        await sendEmail({
          to: email,
          subject: 'LoadTech - Bem-vindo! Confirme seu cadastro',
          text: `Prezado(a) ${nome},

Bem-vindo(a) à plataforma LoadTech!

Para completar seu cadastro e começar a usar nossa plataforma de e-commerce, confirme seu e-mail utilizando o código abaixo:

Código de verificação: ${codigoVerificacao}

Este código é válido por 30 minutos.

Caso não tenha se cadastrado em nossa plataforma, ignore este e-mail.

Atenciosamente,
Equipe LoadTech - Suporte ao Cliente`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">LoadTech</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Plataforma de E-commerce</p>
              </div>
              
              <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #28a745, #20c997); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 24px; color: white;">🎉</span>
                  </div>
                  <h2 style="color: #2c3e50; margin: 0; font-size: 24px; font-weight: 600;">Bem-vindo ao LoadTech!</h2>
                </div>

                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Olá <strong>${nome}</strong>,
                </p>
                
                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Obrigado por se cadastrar na <strong>LoadTech</strong>, sua nova plataforma de e-commerce! 
                  Para completar seu cadastro e começar a vender online, confirme seu e-mail utilizando o código abaixo:
                </p>

                <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
                  <p style="color: white; margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Código de Verificação</p>
                  <div style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                    ${codigoVerificacao}
                  </div>
                  <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 12px;">Válido por 30 minutos</p>
                </div>

                <div style="background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 15px; margin: 25px 0;">
                  <p style="color: #1565c0; margin: 0; font-size: 14px;">
                    <strong>🚀 Próximos passos:</strong> Após a confirmação, você poderá criar sua loja virtual, 
                    adicionar produtos e começar a vender online imediatamente!
                  </p>
                </div>

                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>⚠️ Importante:</strong> Este código é de uso pessoal e deve ser inserido na tela de ativação. 
                    Não compartilhe com terceiros.
                  </p>
                </div>

                <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 25px 0;">
                  <p style="color: #155724; margin: 0; font-size: 14px;">
                    <strong>💡 Dica:</strong> Caso não tenha se cadastrado na LoadTech, 
                    ignore este e-mail. Nenhuma ação adicional é necessária.
                  </p>
                </div>

                <hr style="border: none; height: 1px; background: #e9ecef; margin: 30px 0;">
                
                <div style="text-align: center;">
                  <p style="color: #6c757d; font-size: 13px; margin: 5px 0;">
                    Este é um e-mail automático da plataforma LoadTech
                  </p>
                  <p style="color: #6c757d; font-size: 13px; margin: 5px 0;">
                    Para suporte, entre em contato através do nosso site
                  </p>
                  <p style="color: #adb5bd; font-size: 12px; margin: 15px 0 0 0;">
                    LoadTech © ${new Date().getFullYear()} - Sua plataforma de e-commerce
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (error) {
        console.error('Erro ao enviar e-mail de verificação:', error);
        // Não retorna erro para o usuário, mas loga o problema
      }

      return res.status(201).json({
        mensagem: 'Usuário criado com sucesso! Verifique seu e-mail para ativar a conta.',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          status: user.status,
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Verificar e-mail
  async verifyEmail(req, res) {
    try {
      const schema = Yup.object().shape({
        email: Yup.string().email().required(),
        codigo: Yup.string().required(),
      });

      await schema.validate(req.body);

      const { email, codigo } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(400).json({ erro: 'Usuário não encontrado.' });
      }

      if (user.email_verificado) {
        return res.status(400).json({ erro: 'E-mail já verificado.' });
      }

      const agora = new Date();
      if (!user.codigo_verificacao || user.codigo_verificacao !== codigo || agora > user.codigo_verificacao_expiracao) {
        return res.status(400).json({ erro: 'Código inválido ou expirado.' });
      }

      // Verificar e-mail
      user.email_verificado = true;
      user.status = 'ativo';
      user.codigo_verificacao = null;
      user.codigo_verificacao_expiracao = null;
      await user.save();

      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          usuario_id: user.id,
          papel: user.papel,
          nome: user.nome,
        },
        authConfig.secret,
        { expiresIn: authConfig.expiresIn }
      );

      return res.json({
        mensagem: 'E-mail verificado com sucesso!',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          status: user.status,
          papel: user.papel,
        },
        token,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao verificar e-mail:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Reenviar código de verificação
  async resendVerificationCode(req, res) {
    try {
      const schema = Yup.object().shape({
        email: Yup.string().email().required(),
      });

      await schema.validate(req.body);

      const { email } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(400).json({ erro: 'Usuário não encontrado.' });
      }

      if (user.email_verificado) {
        return res.status(400).json({ erro: 'E-mail já verificado.' });
      }

      // Gerar novo código
      const codigoVerificacao = crypto.randomInt(100000, 999999).toString();
      const codigoExpiracao = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

      user.codigo_verificacao = codigoVerificacao;
      user.codigo_verificacao_expiracao = codigoExpiracao;
      await user.save();

      // Enviar e-mail
      try {
        await sendEmail({
          to: email,
          subject: 'LoadTech - Novo código de verificação',
          text: `Prezado(a) usuário(a),

Você solicitou um novo código de verificação para sua conta na LoadTech.

Código de verificação: ${codigoVerificacao}

Este código é válido por 30 minutos e substitui o código anterior.

Atenciosamente,
Equipe LoadTech - Suporte ao Cliente`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">LoadTech</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Plataforma de E-commerce</p>
              </div>
              
              <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ffc107, #fd7e14); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 24px; color: white;">🔄</span>
                  </div>
                  <h2 style="color: #2c3e50; margin: 0; font-size: 24px; font-weight: 600;">Novo Código de Verificação</h2>
                </div>

                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Prezado(a) usuário(a),
                </p>
                
                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Você solicitou um novo código de verificação para sua conta na <strong>LoadTech</strong>. 
                  Utilize o código abaixo para completar sua ativação:
                </p>

                <div style="background: linear-gradient(135deg, #ffc107, #fd7e14); padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
                  <p style="color: white; margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Novo Código de Verificação</p>
                  <div style="font-size: 32px; font-weight: bold, color: white, letter-spacing: 4px, font-family: 'Courier New', monospace;">
                    ${codigoVerificacao}
                  </div>
                  <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 12px;">Válido por 30 minutos</p>
                </div>

                <div style="background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 15px; margin: 25px 0;">
                  <p style="color: #1565c0; margin: 0; font-size: 14px;">
                    <strong>🔄 Código atualizado:</strong> Este novo código substitui o anterior. 
                    Códigos antigos não funcionarão mais.
                  </p>
                </div>

                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>⏰ Importante:</strong> Este código expira em 30 minutos. 
                    Complete a verificação o quanto antes.
                  </p>
                </div>

                <hr style="border: none; height: 1px; background: #e9ecef; margin: 30px 0;">
                
                <div style="text-align: center;">
                  <p style="color: #6c757d; font-size: 13px; margin: 5px 0;">
                    Este é um e-mail automático da plataforma LoadTech
                  </p>
                  <p style="color: #6c757d; font-size: 13px; margin: 5px 0;">
                    Para suporte, entre em contato através do nosso site
                  </p>
                  <p style="color: #adb5bd; font-size: 12px; margin: 15px 0 0 0;">
                    LoadTech © ${new Date().getFullYear()} - Sua plataforma de e-commerce
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (error) {
        return res.status(500).json({ erro: 'Erro ao enviar e-mail.' });
      }

      return res.json({
        mensagem: 'Novo código de verificação enviado.',
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Login
  async login(req, res) {
    try {
      const schema = Yup.object().shape({
        email: Yup.string().email().required(),
        senha: Yup.string().required(),
      });

      await schema.validate(req.body);

      const { email, senha } = req.body;

      const user = await User.findOne({ 
        where: { email },
        include: [
          {
            association: 'assinaturas',
            include: ['plano'],
            where: { status: ['ativa', 'periodo_gratuito'] },
            required: false,
          },
          {
            association: 'loja',
            required: false,
          },
        ],
      });

      if (!user) {
        return res.status(401).json({ erro: 'Credenciais inválidas.' });
      }

      if (!user.checkPassword(senha)) {
        return res.status(401).json({ erro: 'Credenciais inválidas.' });
      }

      if (!user.email_verificado) {
        return res.status(401).json({ erro: 'E-mail não verificado. Verifique sua caixa de entrada.' });
      }

      if (user.status !== 'ativo') {
        return res.status(401).json({ erro: 'Conta inativa. Entre em contato com o suporte.' });
      }

      // Atualizar último login
      user.ultimo_login = new Date();
      await user.save();

      // 🔥 VERIFICAR SINCRONIZAÇÃO COM ASAAS NO LOGIN
      if (!user.asaas_customer_id) {
        try {
          const syncResult = await syncUserWithAsaas(user, {
            phone: user.telefone,
            mobilePhone: user.telefone
          });
          
          if (syncResult.success) {
            if (syncResult.linked) {
              console.log(`🔗 Durante login: Usuário ${email} vinculado ao cliente Asaas existente`);
            } else if (syncResult.created) {
              console.log(`✅ Durante login: Cliente Asaas criado para ${email}`);
            }
          }
        } catch (syncError) {
          console.warn(`⚠️ Falha na sincronização durante login para ${email}:`, syncError);
        }
      }

      // Gerar token
      const token = jwt.sign(
        { 
          id: user.id, 
          usuario_id: user.id,
          papel: user.papel,
          nome: user.nome,
        },
        authConfig.secret,
        { expiresIn: authConfig.expiresIn }
      );

      return res.json({
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
          papel: user.papel,
          ultimo_login: user.ultimo_login,
          assinatura: user.assinaturas?.[0] || null,
          loja: user.loja || null,
        },
        token,
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro no login:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Obter dados do usuário atual
  async show(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            association: 'assinaturas',
            include: ['plano'],
            where: { status: ['ativa', 'periodo_gratuito'] },
            required: false,
          },
          {
            association: 'loja',
            required: false,
          },
        ],
      });

      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      return res.json(user);
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Atualizar dados do usuário
  async update(req, res) {
    try {
      const schema = Yup.object().shape({
        nome: Yup.string().min(2),
        email: Yup.string().email(),
        telefone: Yup.string().nullable(),
        cpf_cnpj: Yup.string().required('CPF/CNPJ é obrigatório').min(11, 'CPF/CNPJ deve ter pelo menos 11 caracteres'),
        postal_code: Yup.string().nullable(),
        company: Yup.string().nullable(),
        address: Yup.string().nullable(), // Logradouro
        address_number: Yup.string().nullable(), // Número
        complement: Yup.string().nullable(), // Complemento
        province: Yup.string().nullable(), // Bairro
        phone: Yup.string().nullable(), // Telefone fixo
        mobile_phone: Yup.string().nullable(), // Celular
        observations: Yup.string().nullable(),
        group_name: Yup.string().nullable(),
        // SEGURANÇA: Senha atual é OBRIGATÓRIA para confirmar identidade em qualquer alteração
        senha_atual: Yup.string().required('Senha atual é obrigatória como medida de segurança para alterar dados'),
        // OPCIONAL: Nova senha só é necessária se o usuário quiser alterá-la
        nova_senha: Yup.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres').nullable(),
        // OPCIONAL: Avatar/foto de perfil (URL)
        avatar_url: Yup.string().url('URL do avatar deve ser válida').nullable(),
      });

      await schema.validate(req.body);

      const { 
        nome, 
        email, 
        telefone, 
        cpf_cnpj, 
        postal_code, 
        company, 
        address, 
        address_number, 
        complement, 
        province, 
        phone, 
        mobile_phone, 
        observations, 
        group_name, 
        senha_atual, 
        nova_senha, // Campo opcional para alterar senha
        avatar_url // Campo opcional para avatar/foto de perfil
      } = req.body;

      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      // Verificar senha atual SEMPRE (obrigatória para qualquer alteração como medida de segurança)
      if (!user.checkPassword(senha_atual)) {
        return res.status(400).json({ erro: 'Senha atual incorreta. A senha é necessária como medida de segurança.' });
      }

      // Se está alterando email, verificar se não está em uso
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ 
          where: { 
            email,
            id: { [User.sequelize.Op.ne]: user.id }
          } 
        });
        if (emailExists) {
          return res.status(400).json({ erro: 'Este e-mail já está em uso por outro usuário.' });
        }
      }

      // Atualizar dados - incluir todos os campos possíveis
      const dadosAtualizacao = {};
      if (nome) dadosAtualizacao.nome = nome;
      if (email) dadosAtualizacao.email = email;
      if (telefone !== undefined) dadosAtualizacao.telefone = telefone;
      if (cpf_cnpj !== undefined) dadosAtualizacao.cpf_cnpj = cpf_cnpj;
      if (postal_code !== undefined) dadosAtualizacao.postal_code = postal_code;
      if (company !== undefined) dadosAtualizacao.company = company;
      if (address !== undefined) dadosAtualizacao.address = address;
      if (address_number !== undefined) dadosAtualizacao.address_number = address_number;
      if (complement !== undefined) dadosAtualizacao.complement = complement;
      if (province !== undefined) dadosAtualizacao.province = province;
      if (phone !== undefined) dadosAtualizacao.phone = phone;
      if (mobile_phone !== undefined) dadosAtualizacao.mobile_phone = mobile_phone;
      if (observations !== undefined) dadosAtualizacao.observations = observations;
      if (group_name !== undefined) dadosAtualizacao.group_name = group_name;
      if (avatar_url !== undefined) dadosAtualizacao.avatar_url = avatar_url;
      
      // OPCIONAL: Só atualizar senha se foi fornecida nova senha
      if (nova_senha) {
        dadosAtualizacao.senha = nova_senha;
      }

      console.log('🔄 Dados que serão atualizados:', dadosAtualizacao);

      await user.update(dadosAtualizacao);

      // Recarregar usuário para pegar dados atualizados
      await user.reload();

      // 🔥 SINCRONIZAR COM ASAAS APÓS ATUALIZAÇÃO
      console.log('🔄 Sincronizando dados atualizados com Asaas...');
      try {
        if (user.asaas_customer_id) {
          // Atualizar cliente existente no Asaas
          const asaasUpdateData = {
            name: user.nome,
            email: user.email,
            phone: user.phone || user.telefone,
            mobilePhone: user.mobile_phone || user.telefone,
            cpfCnpj: user.cpf_cnpj,
            postalCode: user.postal_code,
            company: user.company,
            address: user.address,
            addressNumber: user.address_number,
            complement: user.complement,
            province: user.province,
            observations: user.observations,
            groupName: user.group_name,
          };

          // Remover campos undefined/null/vazios
          Object.keys(asaasUpdateData).forEach(key => {
            if (asaasUpdateData[key] === undefined || asaasUpdateData[key] === null || asaasUpdateData[key] === '') {
              delete asaasUpdateData[key];
            }
          });

          const updatedCustomer = await AsaasClient.updateCustomer(user.asaas_customer_id, asaasUpdateData);
          console.log(`✅ Cliente Asaas atualizado com sucesso: ${user.asaas_customer_id}`);
        } else {
          // Se não tem cliente Asaas, criar automaticamente
          const syncResult = await syncUserWithAsaas(user, {
            phone: user.phone || user.telefone,
            mobilePhone: user.mobile_phone || user.telefone,
            cpfCnpj: user.cpf_cnpj,
            postalCode: user.postal_code,
            company: user.company,
            address: user.address,
            addressNumber: user.address_number,
            complement: user.complement,
            province: user.province,
            observations: user.observations,
            groupName: user.group_name,
          });

          if (syncResult.success) {
            console.log(`✅ Cliente Asaas criado automaticamente durante atualização: ${syncResult.customerId}`);
          } else {
            console.warn(`⚠️ Falha na criação do cliente Asaas:`, syncResult.error);
          }
        }
      } catch (asaasError) {
        console.error('❌ Erro na sincronização com Asaas:', asaasError);
        // Não falha a atualização por erro no Asaas, apenas loga
      }

      return res.json({
        mensagem: 'Dados atualizados com sucesso.',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
          cpf_cnpj: user.cpf_cnpj,
          postal_code: user.postal_code,
          company: user.company,
          address: user.address,
          address_number: user.address_number,
          complement: user.complement,
          province: user.province,
          phone: user.phone,
          mobile_phone: user.mobile_phone,
          observations: user.observations,
          group_name: user.group_name,
          asaas_customer_id: user.asaas_customer_id,
          avatar_url: user.avatar_url, // Incluir URL do avatar na resposta
        },
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ erro: error.message });
      }
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }

  // Sincronizar usuários órfãos com Asaas (rota administrativa)
  async syncAsaasOrphans(req, res) {
    try {
      // Verificar se é admin
      if (req.user.papel !== 'admin') {
        return res.status(403).json({ erro: 'Acesso negado. Apenas administradores.' });
      }

      console.log('🔄 Iniciando sincronização de usuários órfãos com Asaas...');

      // 1. Vincular clientes órfãos do Asaas
      const linkResult = await linkOrphanedAsaasCustomers();

      // 2. Criar clientes Asaas para usuários sem vinculação
      const usersWithoutAsaas = await User.findAll({
        where: { asaas_customer_id: null },
        limit: 50 // Limitar para não sobrecarregar
      });

      let syncedCount = 0;
      let errorCount = 0;

      for (const user of usersWithoutAsaas) {
        try {
          const syncResult = await syncUserWithAsaas(user, {
            phone: user.telefone,
            mobilePhone: user.telefone
          });

          if (syncResult.success) {
            syncedCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Erro ao sincronizar usuário ${user.email}:`, error);
          errorCount++;
        }
      }

      console.log(`✅ Sincronização concluída: ${syncedCount} usuários sincronizados, ${errorCount} erros`);

      return res.json({
        mensagem: 'Sincronização com Asaas concluída',
        usuarios_sincronizados: syncedCount,
        erros: errorCount,
        total_processados: usersWithoutAsaas.length
      });

    } catch (error) {
      console.error('Erro na sincronização com Asaas:', error);
      return res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
  }
}

/**
 * Função utilitária para sincronizar usuário com Asaas automaticamente
 * Busca cliente existente ou cria novo se necessário
 */
async function syncUserWithAsaas(user, additionalData = {}) {
  try {
    // Verificar se usuário já tem cliente Asaas
    if (user.asaas_customer_id) {
      console.log(`👤 Usuário ${user.email} já possui cliente Asaas: ${user.asaas_customer_id}`);
      return { success: true, linked: true, customerId: user.asaas_customer_id };
    }

    // Buscar cliente existente no Asaas por email, CPF ou nome
    const existingCustomer = await AsaasClient.findCustomerByIdentifier(user.email);
    
    if (existingCustomer) {
      // Cliente já existe no Asaas, apenas vincular
      await user.update({
        asaas_customer_id: existingCustomer.id,
        cpf_cnpj: existingCustomer.cpfCnpj
      });
      
      console.log(`🔗 Cliente Asaas existente vinculado: ${existingCustomer.id} -> ${user.email}`);
      return { success: true, linked: true, customerId: existingCustomer.id };
    }

    // Criar novo cliente no Asaas (mesmo sem CPF inicialmente)
    const customerData = {
      name: user.nome,
      email: user.email,
      phone: additionalData.phone || user.telefone,
      mobilePhone: additionalData.mobilePhone || user.telefone,
      externalReference: user.id.toString(),
      ...additionalData
    };

    // Adicionar CPF se disponível
    if (user.cpf_cnpj || additionalData.cpfCnpj) {
      customerData.cpfCnpj = user.cpf_cnpj || additionalData.cpfCnpj;
    }

    // Remover campos undefined/null/vazios
    Object.keys(customerData).forEach(key => {
      if (customerData[key] === undefined || customerData[key] === null || customerData[key] === '') {
        delete customerData[key];
      }
    });

    try {
      const newCustomer = await AsaasClient.createCustomer(customerData);
      
      const updateData = {
        asaas_customer_id: newCustomer.id
      };

      // Atualizar CPF se retornado pelo Asaas
      if (newCustomer.cpfCnpj && !user.cpf_cnpj) {
        updateData.cpf_cnpj = newCustomer.cpfCnpj;
      }

      await user.update(updateData);

      console.log(`✅ Novo cliente Asaas criado: ${newCustomer.id} -> ${user.email}`);
      return { success: true, created: true, customerId: newCustomer.id };
    } catch (createError) {
      console.error(`❌ Erro ao criar cliente Asaas para ${user.email}:`, createError.message);
      return { success: false, error: createError.message };
    }

  } catch (error) {
    console.error('Erro na sincronização com Asaas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Helper para buscar e vincular usuários órfãos do Asaas
 */
async function linkOrphanedAsaasCustomers() {
  try {
    // Buscar todos os clientes do Asaas
    const asaasCustomers = await AsaasClient.getCustomers({ limit: 100 });
    
    for (const customer of asaasCustomers.data || []) {
      // Verificar se existe usuário na API com este email
      const user = await User.findOne({ where: { email: customer.email } });
      
      if (user && !user.asaas_customer_id) {
        // Usuário existe na API mas não tem vinculação com Asaas
        user.asaas_customer_id = customer.id;
        if (customer.cpfCnpj) {
          user.cpf_cnpj = customer.cpfCnpj;
        }
        await user.save();
        console.log(`🔗 Vinculado usuário ${user.email} ao cliente Asaas órfão: ${customer.id}`);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao vincular clientes órfãos do Asaas:', error);
    return { success: false, error: error.message };
  }
}

export default new UserController();
export { syncUserWithAsaas, linkOrphanedAsaasCustomers };
