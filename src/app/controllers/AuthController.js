/* eslint-disable no-unused-vars */
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import 'dotenv/config';
import sendEmail from '../../utils/mailer.js';
import User from '../models/User.js';

const RECOVERY_LIMIT_TIME = 15 * 60 * 1000; // 15 minutos
const RECOVERY_ATTEMPT_LIMIT = 3;

class AuthController {
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(200).json({
          mensagem: 'Se o e-mail estiver cadastrado em nosso sistema, um código de recuperação foi enviado para o endereço informado.',
        });
      }

      const now = new Date();
      const lastAttempt = user.ultima_tentativa_recuperacao || 0;
      const attemptCount = user.tentativas_recuperacao || 0;

      // Verifica se o limite de tentativas foi excedido
      if (attemptCount >= RECOVERY_ATTEMPT_LIMIT && now - lastAttempt < RECOVERY_LIMIT_TIME) {
        return res.status(429).json({
          erro: 'Limite de tentativas de recuperação excedido. Por segurança, aguarde alguns minutos antes de tentar novamente.',
        });
      }

      // Reseta o contador se o tempo limite passou
      if (now - lastAttempt >= RECOVERY_LIMIT_TIME) {
        user.tentativas_recuperacao = 0;
      }

      // Atualiza as tentativas e o timestamp
      user.tentativas_recuperacao = (user.tentativas_recuperacao || 0) + 1;
      user.ultima_tentativa_recuperacao = now;
      await user.save();

      const codigo = crypto.randomInt(100000, 999999).toString();
      user.codigo_recuperacao = codigo;

      // Define a expiração do código (ex.: 5 minutos a partir de agora)
      user.codigo_recuperacao_expiracao = new Date(now.getTime() + 5 * 60 * 1000);
      await user.save();

      try {
        await sendEmail({
          to: email,
          subject: 'LoadTech - Código de Recuperação de Senha',
          text: `Prezado(a) usuário(a),

Recebemos uma solicitação de recuperação de senha para sua conta na plataforma LoadTech.

Código de verificação: ${codigo}

Este código é válido por 5 minutos e deve ser utilizado apenas por você.

Caso não tenha solicitado esta alteração, recomendamos que ignore este e-mail. Sua conta permanece segura.

Atenciosamente,
Equipe LoadTech - Suporte Técnico`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background-color: #f8f9fa;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 300;">LoadTech</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Plataforma de E-commerce</p>
              </div>
              
              <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ff6b6b, #ee5a24); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 24px; color: white;">🔐</span>
                  </div>
                  <h2 style="color: #2c3e50; margin: 0; font-size: 24px; font-weight: 600;">Recuperação de Senha</h2>
                </div>

                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Prezado(a) usuário(a),
                </p>
                
                <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Recebemos uma solicitação de recuperação de senha para sua conta na plataforma <strong>LoadTech</strong>. 
                  Para prosseguir com a redefinição, utilize o código de verificação abaixo:
                </p>

                <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0;">
                  <p style="color: white; margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">Código de Verificação</p>
                  <div style="font-size: 32px; font-weight: bold; color: white; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                    ${codigo}
                  </div>
                  <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 12px;">Válido por 5 minutos</p>
                </div>

                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 25px 0;">
                  <p style="color: #856404; margin: 0; font-size: 14px;">
                    <strong>⚠️ Importante:</strong> Este código é de uso pessoal e intransferível. 
                    Não compartilhe com terceiros.
                  </p>
                </div>

                <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 25px 0;">
                  <p style="color: #155724; margin: 0; font-size: 14px;">
                    <strong>🛡️ Segurança:</strong> Caso não tenha solicitado esta recuperação, 
                    ignore este e-mail. Sua conta permanece protegida.
                  </p>
                </div>

                <hr style="border: none; height: 1px; background: #e9ecef; margin: 30px 0;">
                
                <div style="text-align: center;">
                  <p style="color: #6c757d; font-size: 13px; margin: 5px 0;">
                    Este é um e-mail automático do sistema LoadTech
                  </p>
                  <p style="color: #6c757d; font-size: 13px; margin: 5px 0;">
                    Por favor, não responda a este e-mail
                  </p>
                  <p style="color: #adb5bd; font-size: 12px; margin: 15px 0 0 0;">
                    LoadTech © ${new Date().getFullYear()} - Todos os direitos reservados
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (error) {
        return res.status(500).json({
          erro: 'Erro ao enviar e-mail. Por favor, tente novamente mais tarde.',
        });
      }

      return res.status(200).json({
        mensagem: 'Código de recuperação enviado com sucesso! Verifique seu e-mail para prosseguir com a redefinição de senha.',
      });
    } catch (error) {
      return res.status(500).json({
        erro: 'Erro interno ao processar a solicitação. Tente novamente mais tarde.',
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, codigo, novaSenha } = req.body;

      const user = await User.findOne({ where: { email } });

      // Verifica se o código é válido e não expirou
      const now = new Date();
      if (!user || user.codigo_recuperacao !== codigo || now > user.codigo_recuperacao_expiracao) {
        return res.status(400).json({ 
          erro: 'Código de recuperação inválido ou expirado. Solicite um novo código para prosseguir.' 
        });
      }

      const senhaHash = await bcrypt.hash(novaSenha, 8);
      user.senha_hash = senhaHash;
      user.codigo_recuperacao = null;
      user.codigo_recuperacao_expiracao = null; // Limpa a expiração
      await user.save();

      return res
        .status(200)
        .json({ 
          mensagem: 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.' 
        });
    } catch (error) {
      return res.status(500).json({
        erro: 'Erro interno ao redefinir senha. Por favor, tente novamente mais tarde.',
      });
    }
  }
}

export default new AuthController();
