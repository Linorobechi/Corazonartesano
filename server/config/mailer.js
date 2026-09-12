import nodemailer from "nodemailer";
import "dotenv/config";

/**
 * Obtiene la configuración del transportador soportando variables MAIL_*, SMTP_* y EMAIL_*
 */
export const getMailConfig = () => {
  const host =
    process.env.MAIL_HOST ||
    process.env.SMTP_HOST ||
    process.env.EMAIL_HOST ||
    "smtp.gmail.com";

  const port = Number(
    process.env.MAIL_PORT ||
    process.env.SMTP_PORT ||
    process.env.EMAIL_PORT ||
    465
  );

  const secure =
    process.env.MAIL_SECURE === "true" ||
    process.env.SMTP_SECURE === "true" ||
    port === 465;

  const user =
    process.env.MAIL_USER ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER;

  const pass =
    process.env.MAIL_PASS ||
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD;

  const from =
    process.env.MAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.EMAIL_FROM ||
    (user ? `"Corazón Artesano" <${user}>` : '"Corazón Artesano" <no-reply@corazonartesano.com>');

  return { host, port, secure, user, pass, from };
};

/**
 * Crea o reutiliza el transportador de Nodemailer
 */
export const createTransporter = () => {
  const { host, port, secure, user, pass } = getMailConfig();

  if (!user || !pass) {
    console.warn("⚠️ [MAILER] Faltan credenciales de correo (MAIL_USER / MAIL_PASS o SMTP_USER / SMTP_PASS).");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

export const transporter = createTransporter();

/**
 * Envía el correo de recuperación de contraseña con plantilla visual artesanal
 * @param {string} toEmail - Correo del destinatario
 * @param {string} resetToken - Token de seguridad generado
 * @param {string} [baseUrl] - URL base del frontend (ej: http://localhost:5173 o https://corazonartesano.vercel.app)
 */
export const sendResetPasswordEmail = async (toEmail, resetToken, baseUrl) => {
  const mailTransporter = transporter || createTransporter();
  const { from } = getMailConfig();

  // Determinar origen del frontend dinámicamente
  let origin = baseUrl;
  if (!origin) {
    origin = process.env.FRONTEND_URL || "https://corazonartesano.vercel.app";
  }
  const cleanOrigin = origin.replace(/\/$/, "");

  // URL de restablecimiento (compatible con /restablecer-password y /reset-password)
  const resetUrl = `${cleanOrigin}/restablecer-password?token=${resetToken}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperación de Contraseña - Corazón Artesano</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4efe9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2d2420;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f4efe9; padding: 30px 10px;">
        <tr>
          <td align="center">
            <!-- Contenedor Principal -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(139, 94, 60, 0.08); border: 1px solid #e9e0d6;">
              
              <!-- Cabecera Artesanal -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #8b5e3c 0%, #6e462b 100%); padding: 36px 20px; color: #ffffff;">
                  <div style="font-size: 32px; line-height: 1; margin-bottom: 8px;">✨ 🧵 ✨</div>
                  <h1 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; color: #ffffff;">Corazón Artesano</h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #f2decb; letter-spacing: 1px; text-transform: uppercase;">Tradición, Pasión y Cultura Hecha a Mano</p>
                </td>
              </tr>

              <!-- Cuerpo del Mensaje -->
              <tr>
                <td style="padding: 36px 32px 28px 32px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #8b5e3c; font-weight: 600;">
                    Recuperación de Contraseña
                  </h2>
                  <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #4a3e39;">
                    Hola,
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #4a3e39;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>Corazón Artesano</strong>. Para crear tu nueva contraseña, haz clic en el siguiente botón:
                  </p>

                  <!-- Botón CTA -->
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}" 
                       target="_blank"
                       style="background-color: #8b5e3c; color: #ffffff; padding: 15px 34px; text-decoration: none; border-radius: 12px; font-size: 15px; font-weight: bold; display: inline-block; box-shadow: 0 4px 14px rgba(139, 94, 60, 0.35); transition: background-color 0.2s ease;">
                      Restablecer mi Contraseña
                    </a>
                  </div>

                  <!-- Enlace Alternativo de respaldo -->
                  <div style="background-color: #fbf8f5; border: 1px solid #ebdcd0; border-radius: 10px; padding: 16px; margin: 24px 0 16px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #736259; font-weight: 600;">
                      ¿No funciona el botón? Copia y pega este enlace en tu navegador:
                    </p>
                    <p style="margin: 0; font-size: 12px; word-break: break-all; color: #8b5e3c;">
                      <a href="${resetUrl}" style="color: #8b5e3c; text-decoration: underline;">${resetUrl}</a>
                    </p>
                  </div>

                  <!-- Avisos de Seguridad -->
                  <p style="margin: 20px 0 6px 0; font-size: 13px; color: #8c7b72; line-height: 1.5;">
                    ⏱️ Este enlace de seguridad es válido por <strong>1 hora</strong>.
                  </p>
                  <p style="margin: 0; font-size: 13px; color: #8c7b72; line-height: 1.5;">
                    🔒 Si no solicitaste este cambio, puedes ignorar este correo; tu cuenta seguirá segura.
                  </p>
                </td>
              </tr>

              <!-- Pie de Página -->
              <tr>
                <td style="background-color: #f7f3ee; padding: 22px 30px; text-align: center; border-top: 1px solid #ebe2d8;">
                  <p style="margin: 0; font-size: 12px; color: #8a7a72;">
                    © ${new Date().getFullYear()} Corazón Artesano • Hecho con amor artesanal.
                  </p>
                  <p style="margin: 6px 0 0 0; font-size: 11px; color: #ab9c94;">
                    Este es un correo automático, por favor no respondas directamente a este mensaje.
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
    `Hola,\n\n` +
    `Recibimos una solicitud para restablecer la contraseña de tu cuenta en Corazón Artesano.\n\n` +
    `Para crear una nueva contraseña, ingresa al siguiente enlace:\n` +
    `${resetUrl}\n\n` +
    `Este enlace es válido por 1 hora.\n` +
    `Si no solicitaste este cambio, puedes ignorar este mensaje.\n\n` +
    `© Corazón Artesano`;

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
  };

  const info = await mailTransporter.sendMail(mailOptions);
  console.log(`[EMAIL DELIVERED] A: ${toEmail} | Id: ${info.messageId} | Link: ${resetUrl}`);
  return { success: true, messageId: info.messageId, resetUrl, realEmailSent: true };
};

export default {
  transporter,
  createTransporter,
  getMailConfig,
  sendResetPasswordEmail,
};
