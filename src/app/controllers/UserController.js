import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as Yup from 'yup';
import User from '../models/User.js';
import Plano from '../models/Plano.js';
import Assinatura from '../models/Assinatura.js';
import authConfig from '../../config/auth.js';
import sendEmail from '../../utils/mailer.js';

class UserController {
  // Registrar novo usuário
  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        nome: Yup.string().required('Nome é obrigatório').min(2, 'Nome deve ter pelo menos 2 caracteres'),
        email: Yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
        senha: Yup.string().min(6, 'Senha deve ter pelo menos 6 caracteres').required('Senha é obrigatória'),
        telefone: Yup.string().nullable(),
        plano_id: Yup.string().uuid('Plano inválido').nullable(),
        tipo_periodo: Yup.string().oneOf(['mensal', 'anual'], 'Tipo de período inválido').default('mensal'),
      });

      await schema.validate(req.body);

      const { nome, email, senha, telefone, plano_id, tipo_periodo = 'mensal' } = req.body;

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
        telefone,
        codigo_verificacao: codigoVerificacao,
        codigo_verificacao_expiracao: codigoExpiracao,
        status: 'pendente',
      });

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
          subject: 'Bem-vindo ao LoadTech - Verifique seu e-mail',
          text: `Olá ${nome}, bem-vindo ao LoadTech! Seu código de verificação é: ${codigoVerificacao}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #333;">Bem-vindo ao LoadTech!</h2>
              <p>Olá <strong>${nome}</strong>,</p>
              <p>Obrigado por se cadastrar no LoadTech! Para completar seu cadastro, utilize o código de verificação abaixo:</p>
              <div style="font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0; text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                ${codigoVerificacao}
              </div>
              <p>Este código é válido por 30 minutos.</p>
              <p>Se você não se cadastrou no LoadTech, ignore este e-mail.</p>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #aaa;">LoadTech - Sua plataforma de e-commerce © ${new Date().getFullYear()}</p>
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
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <h2>Novo código de verificação</h2>
              <p>Seu novo código de verificação é:</p>
              <div style="font-size: 24px; font-weight: bold; color: #007bff; text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                ${codigoVerificacao}
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
        telefone: Yup.string().nullable(),
        senha_atual: Yup.string().when('senha', (senha, field) =>
          senha ? field.required('Senha atual é obrigatória para alterar a senha') : field
        ),
        senha: Yup.string().min(6),
      });

      await schema.validate(req.body);

      const { nome, telefone, senha_atual, senha } = req.body;

      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
      }

      // Se está alterando senha, verificar senha atual
      if (senha && !user.checkPassword(senha_atual)) {
        return res.status(400).json({ erro: 'Senha atual incorreta.' });
      }

      // Atualizar dados
      const dadosAtualizacao = {};
      if (nome) dadosAtualizacao.nome = nome;
      if (telefone !== undefined) dadosAtualizacao.telefone = telefone;
      if (senha) dadosAtualizacao.senha = senha;

      await user.update(dadosAtualizacao);

      return res.json({
        mensagem: 'Dados atualizados com sucesso.',
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
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
}

export default new UserController();
