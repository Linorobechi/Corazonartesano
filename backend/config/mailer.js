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
 * Obtiene la configuración de correo si existe en variables de entorno
 */
export const getMailConfig = () => {
  const host =
    process.env.EMAIL_HOST ||
    process.env.SMTP_HOST ||
    process.env.MAIL_HOST ||
    "smtp.gmail.com";

  const rawPort = process.env.EMAIL_PORT || process.env.SMTP_PORT || process.env.MAIL_PORT;
  const port = rawPort ? Number(rawPort) : 587;

  const secure =
    process.env.EMAIL_SECURE !== undefined
      ? process.env.EMAIL_SECURE === "true"
      : port === 465;

  const user =
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    process.env.MAIL_USER ||
    process.env.GMAIL_USER ||
    null;

  const pass =
    process.env.EMAIL_PASS ||
    process.env.SMTP_PASS ||
    process.env.MAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    null;

  const from =
    process.env.EMAIL_FROM ||
    (user ? `"Corazón Artesano" <${user}>` : '"Corazón Artesano" <no-reply@corazonartesano.com>');

  return { host, port, secure, user, pass, from };
};

// IPs IPv4 de respaldo para smtp.gmail.com
const GMAIL_IPV4_FALLBACKS = [
  "172.253.147.109",
  "172.253.147.108",
  "142.250.141.108",
  "142.250.141.109",
];

/**
 * Crea el transportador de Nodemailer sólo si existen credenciales configuradas
 */
export const createTransporter = (options = {}) => {
  const { host, port, user, pass } = getMailConfig();

  if (!user || !pass) {
    return null;
  }

  const isGmail = (host || "").includes("gmail") || (user || "").endsWith("@gmail.com");
  const targetPort = options.port || port || 587;
  const isSecure = targetPort === 465;
  const targetHost = options.host || (isGmail ? GMAIL_IPV4_FALLBACKS[0] : host);

  return nodemailer.createTransport({
    host: targetHost,
    port: targetPort,
    secure: isSecure,
    servername: isGmail ? "smtp.gmail.com" : targetHost,
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    auth: { user, pass },
    tls: {
      servername: isGmail ? "smtp.gmail.com" : targetHost,
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
  });
};

export const transporter = null;

/**
 * Envío opcional de notificaciones por correo (órdenes/compras)
 * Si no hay credenciales configuradas, finaliza de manera silenciosa sin advertencias en la terminal.
 */
/**
 * Envío opcional de notificaciones por correo (órdenes/compras)
 * Si no hay credenciales configuradas, finaliza de manera silenciosa sin advertencias en la terminal.
 */
export const sendEmailNotification = async ({ to, subject, html, text }) => {
  const { user, pass, from } = getMailConfig();

  if (!user || !pass) {
    return { success: true, realEmailSent: false, simulated: true };
  }

  try {
    const directTransporter = createTransporter();
    if (!directTransporter) {
      return { success: true, realEmailSent: false, simulated: true };
    }

    const info = await directTransporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    return { success: true, messageId: info.messageId, realEmailSent: true };
  } catch (_err) {
    return { success: false, realEmailSent: false };
  }
};

/**
 * Plantilla y envío de correo para recuperación de contraseña de Corazón Artesano
 */
export const sendPasswordResetEmail = async ({ to, resetUrl, userName = "Usuario" }) => {
  const subject = "Recuperación de Contraseña - Corazón Artesano";

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f4ef; margin: 0; padding: 0; color: #2d3748; }
        .container { max-width: 580px; margin: 30px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #ebdcd0; }
        .header { background: linear-gradient(135deg, #8b5e3c 0%, #6e462b 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; color: #f5ede6; }
        .content { padding: 36px 30px; }
        .content h2 { color: #8b5e3c; font-size: 20px; margin-top: 0; }
        .content p { font-size: 15px; line-height: 1.6; color: #4a5568; margin: 16px 0; }
        .btn-wrapper { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #8b5e3c; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(139, 94, 60, 0.35); transition: background-color 0.2s ease; }
        .btn:hover { background-color: #754d31; }
        .alert-box { background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 14px 16px; border-radius: 8px; font-size: 13px; color: #7c2d12; margin: 24px 0; }
        .footer { background-color: #fcfaf7; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #ebdcd0; }
        .fallback-link { word-break: break-all; font-size: 12px; color: #8b5e3c; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Corazón Artesano</h1>
          <p>Autenticidad, Tradición y Seguridad</p>
        </div>
        <div class="content">
          <h2>Hola, ${userName}</h2>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Corazón Artesano</strong>.</p>
          <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
          
          <div class="btn-wrapper">
            <a href="${resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">RESTABLECER MI CONTRASEÑA</a>
          </div>

          <div class="alert-box">
            ⏰ <strong>Importante:</strong> Este enlace es de un solo uso y expirará en <strong>1 hora</strong> por motivos de seguridad.
          </div>

          <p style="font-size: 13px; color: #718096;">
            Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
            <a href="${resetUrl}" class="fallback-link">${resetUrl}</a>
          </p>

          <p style="font-size: 12px; color: #a0aec0; margin-top: 24px;">
            Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual seguirá siendo válida.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Corazón Artesano. Todos los derechos reservados.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Hola ${userName},\n\nPara restablecer tu contraseña en Corazón Artesano, abre el siguiente enlace en tu navegador:\n${resetUrl}\n\nEste enlace expirará en 1 hora.\nSi tú no solicitaste este cambio, puedes ignorar este mensaje.`;

  const result = await sendEmailNotification({ to, subject, html, text });

  // En consola siempre mostramos el enlace para desarrollo local y testing
  console.log("\n==================================================================");
  console.log("🔑 [CORAZÓN ARTESANO] RECUPERACIÓN DE CONTRASEÑA");
  console.log(`   Destinatario: ${to}`);
  console.log(`   Enlace de restablecimiento:\n   ${resetUrl}`);
  console.log(`   Envío real SMTP: ${result.realEmailSent ? "✅ Enviado por correo" : "ℹ️ Simulado en consola (sin credenciales SMTP activas)"}`);
  console.log("==================================================================\n");

  return result;
};

export default {
  transporter,
  createTransporter,
  getMailConfig,
  sendEmailNotification,
  sendPasswordResetEmail,
};
