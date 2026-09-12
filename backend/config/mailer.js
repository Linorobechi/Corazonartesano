import dns from "node:dns";
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

/**
 * Obtiene la configuración del transportador priorizando variables EMAIL_*
 */
export const getMailConfig = () => {
  const host =
    process.env.EMAIL_HOST ||
    process.env.SMTP_HOST ||
    process.env.MAIL_HOST ||
    "smtp.gmail.com";

  const port = Number(
    process.env.EMAIL_PORT ||
    process.env.SMTP_PORT ||
    process.env.MAIL_PORT ||
    465
  );

  const secure =
    process.env.EMAIL_SECURE === "true" ||
    process.env.SMTP_SECURE === "true" ||
    process.env.MAIL_SECURE === "true" ||
    port === 465;

  const user =
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    process.env.GMAIL_USER;

  const pass =
    process.env.EMAIL_PASS ||
    process.env.SMTP_PASS ||
    process.env.MAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD;

  const from =
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.MAIL_FROM ||
    (user ? `"Corazón Artesano" <${user}>` : '"Corazón Artesano" <no-reply@corazonartesano.com>');

  return { host, port, secure, user, pass, from };
};

/**
 * Crea o reutiliza el transportador de Nodemailer optimizado para Render y Producción
 */
export const createTransporter = () => {
  const { host, port, secure, user, pass } = getMailConfig();

  if (!user || !pass) {
    console.warn("⚠️ [MAILER] Faltan credenciales de correo (EMAIL_USER / EMAIL_PASS).");
    return null;
  }

  const isGmail = (host || "").includes("gmail") || (user || "").endsWith("@gmail.com");

  // Para Gmail en Render (Linux), service: 'gmail' fuerza IPv4 y previene el error ENETUNREACH de IPv6
  if (isGmail) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return nodemailer.createTransport({
    host: host || "smtp.gmail.com",
    port: port || 465,
    secure: secure !== undefined ? secure : true,
    family: 4, // Fuerza IPv4 directo
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const transporter = createTransporter();

const LOGO_CDN_URL = "https://nuhsooerkqwuwcucwxcf.supabase.co/storage/v1/object/public/productos/logo.jpeg";

/**
 * Envía el correo de recuperación de contraseña con plantilla visual artesanal y logo oficial
 * @param {string} toEmail - Correo del destinatario
 * @param {string} resetToken - Token de seguridad generado
 * @param {string} [baseUrl] - URL base del frontend
 */
export const sendResetPasswordEmail = async (toEmail, resetToken, baseUrl) => {
  const mailTransporter = transporter || createTransporter();
  const { from } = getMailConfig();

  // Determinar origen del frontend priorizando producción (Vercel)
  let origin = process.env.FRONTEND_URL || process.env.VERCEL_FRONTEND_URL || "https://corazonartesano.vercel.app";
  if (!origin || origin.includes("localhost")) {
    if (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes("localhost")) {
      origin = process.env.FRONTEND_URL;
    } else {
      origin = "https://corazonartesano.vercel.app";
    }
  }
  const cleanOrigin = origin.replace(/\/$/, "");

  // URL de restablecimiento en producción
  const resetUrl = `${cleanOrigin}/restablecer-password?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperación de Contraseña - Corazón Artesano</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f4f0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d2420;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f7f4f0; padding: 35px 12px;">
        <tr>
          <td align="center">
            <!-- Contenedor Principal -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 24px rgba(60, 40, 25, 0.08); border: 1px solid #e8ded4;">
              
              <!-- Cabecera Artesanal con Logo Oficial CDN -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #7a4b2c 0%, #4a2e1b 100%); padding: 36px 24px; color: #ffffff;">
                  <table border="0" cellpadding="0" cellspacing="0" align="center">
                    <tr>
                      <td align="center" style="padding-bottom: 12px;">
                        <img src="${LOGO_CDN_URL}" alt="Corazón Artesano" width="80" height="80" style="display: block; width: 80px; height: 80px; object-fit: contain; border-radius: 18px; border: 2px solid rgba(255,255,255,0.25); background-color: rgba(255,255,255,0.1);" />
                      </td>
                    </tr>
                    <tr>
                      <td align="center">
                        <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; color: #ffffff;">Corazón Artesano</h1>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: #ebdcd0; letter-spacing: 1.5px; text-transform: uppercase;">Sincelejo, Sucre - Colombia</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Cuerpo del Mensaje -->
              <tr>
                <td style="padding: 36px 32px 28px 32px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #7a4b2c; font-weight: 700;">
                    Solicitud de Restablecimiento de Contraseña
                  </h2>
                  <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #4a3e39;">
                    Estimado usuario,
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4a3e39;">
                    Hemos recibido una solicitud para restablecer la contraseña de acceso a tu cuenta en la plataforma <strong>Corazón Artesano</strong>.
                  </p>
                  <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #4a3e39;">
                    Para ingresar una nueva contraseña, haz clic en el siguiente enlace de seguridad:
                  </p>

                  <!-- Botón CTA -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       target="_blank"
                       style="background-color: #8b5e3c; color: #ffffff; padding: 15px 36px; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 14px rgba(139, 94, 60, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                      Restablecer Contraseña
                    </a>
                  </div>

                  <!-- Enlace Alternativo de respaldo -->
                  <div style="background-color: #fbf8f5; border: 1px solid #ebdcd0; border-radius: 12px; padding: 16px; margin: 28px 0 20px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #736259; font-weight: 600;">
                      Si tienes problemas con el botón, copia y pega este enlace directo en tu navegador:
                    </p>
                    <p style="margin: 0; font-size: 12px; word-break: break-all; color: #8b5e3c;">
                      <a href="${resetUrl}" style="color: #8b5e3c; text-decoration: underline;">${resetUrl}</a>
                    </p>
                  </div>

                  <!-- Avisos de Seguridad -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f0e6dc; margin-top: 24px; padding-top: 18px;">
                    <tr>
                      <td style="font-size: 12px; color: #8c7b72; line-height: 1.6;">
                        • Este enlace de seguridad tiene una validez de <strong>1 hora</strong> a partir de su emisión.<br>
                        • Si no realizaste esta solicitud, puedes desestimar este mensaje; tu cuenta permanece protegida.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Pie de Página -->
              <tr>
                <td style="background-color: #f7f3ee; padding: 22px 30px; text-align: center; border-top: 1px solid #ebe2d8;">
                  <p style="margin: 0; font-size: 12px; font-weight: 600; color: #6e5445;">
                    © ${new Date().getFullYear()} Corazón Artesano. Todos los derechos reservados.
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #9c8b82;">
                    Plataforma de comercio electrónico y capacitación para artesanos de Sincelejo, Sucre.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textContent = `Corazón Artesano - Recuperación de Contraseña\n\n` +
    `Estimado usuario,\n\n` +
    `Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Corazón Artesano.\n\n` +
    `Para crear una nueva contraseña, ingresa al siguiente enlace:\n` +
    `${resetUrl}\n\n` +
    `Este enlace es válido por 1 hora.\n` +
    `Si no solicitaste este cambio, puedes ignorar este mensaje.\n\n` +
    `© Corazón Artesano - Sincelejo, Sucre`;

  if (!mailTransporter) {
    console.log("==========================================");
    console.log(`[SIMULATED EMAIL TO: ${toEmail}]`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("==========================================");
    return { success: true, simulated: true, resetUrl };
  }

  const mailOptions = {
    from,
    to: toEmail,
    subject: "Recuperación de Contraseña - Corazón Artesano",
    text: textContent,
    html: htmlContent,
    priority: "high",
    headers: {
      "X-Priority": "1",
      "X-MSMail-Priority": "High",
      Importance: "high",
    },
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`[EMAIL DELIVERED] A: ${toEmail} | Id: ${info.messageId} | Link: ${resetUrl}`);
    return { success: true, messageId: info.messageId, resetUrl, realEmailSent: true };
  } catch (err) {
    console.error(`[ERROR ENVIANDO CORREO REAL A ${toEmail}]:`, err.message);
    return { success: true, error: err.message, resetUrl, realEmailSent: false, simulated: true };
  }
};

/**
 * Envío genérico de notificaciones por correo (órdenes, avisos de compra, etc.)
 */
export const sendEmailNotification = async ({ to, subject, html, text }) => {
  const mailTransporter = transporter || createTransporter();

  if (mailTransporter) {
    try {
      const fromUser =
        process.env.SMTP_FROM ||
        process.env.EMAIL_FROM ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER ||
        "Corazón Artesano <no-reply@corazonartesano.com>";

      const info = await mailTransporter.sendMail({
        from: fromUser,
        to,
        subject,
        text,
        html,
      });

      console.log(`[REAL EMAIL DELIVERED TO: ${to}] MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId, realEmailSent: true };
    } catch (err) {
      console.error(`[ERROR ENVIANDO CORREO A ${to}]:`, err.message);
      return { success: false, error: err.message, realEmailSent: false };
    }
  }

  // Fallback simulador para desarrollo cuando no están configuradas las variables SMTP
  console.log("==========================================");
  console.log(`[SIMULATED EMAIL NOTIFICATION SENT TO: ${to}]`);
  console.log(`Asunto: ${subject}`);
  console.log(text || html);
  console.log("AVISO: Para envío real de correos, configura EMAIL_USER y EMAIL_PASS en .env o Render.");
  console.log("==========================================");

  return { success: true, realEmailSent: false };
};

export default {
  transporter,
  createTransporter,
  getMailConfig,
  sendResetPasswordEmail,
  sendEmailNotification,
};

