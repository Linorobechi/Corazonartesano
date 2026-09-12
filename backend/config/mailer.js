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

import dnsPromises from "node:dns/promises";
import net from "node:net";

// Lista de IPs IPv4 oficiales de respaldo de Google smtp.gmail.com
const GMAIL_IPV4_FALLBACKS = [
  "172.253.147.109",
  "172.253.147.108",
  "142.250.141.108",
  "142.250.141.109",
  "74.125.137.108",
  "74.125.137.109",
  "142.251.2.108",
  "142.251.2.109",
];

/**
 * Resuelve dinámicamente direcciones IPv4 activas de Gmail sin tocar jamás IPv6
 */
export const getGmailIPv4Candidates = async () => {
  try {
    const resolved = await dnsPromises.resolve4("smtp.gmail.com");
    if (resolved && resolved.length > 0) {
      const unique = Array.from(new Set([...resolved, ...GMAIL_IPV4_FALLBACKS]));
      return unique.sort(() => Math.random() - 0.5);
    }
  } catch (err) {
    console.warn("⚠️ [MAILER] Error resolviendo DNS de smtp.gmail.com, usando IPs fijas:", err.message);
  }
  return GMAIL_IPV4_FALLBACKS.sort(() => Math.random() - 0.5);
};

/**
 * Crea el transportador de Nodemailer conectándose directamente por IP numérica IPv4
 */
export const createTransporter = (options = {}) => {
  const { host, port, user, pass } = getMailConfig();

  if (!user || !pass) {
    console.warn("⚠️ [MAILER] Faltan credenciales de correo (EMAIL_USER / EMAIL_PASS).");
    return null;
  }

  const isGmail = (host || "").includes("gmail") || (user || "").endsWith("@gmail.com");
  const targetPort = options.port || port || 587;
  const isSecure = targetPort === 465;
  // Usar la IP IPv4 provista o la primera IP de respaldo de Gmail
  const targetHost = options.host || (isGmail ? GMAIL_IPV4_FALLBACKS[0] : host);

  return nodemailer.createTransport({
    host: targetHost,
    port: targetPort,
    secure: isSecure,
    servername: isGmail ? "smtp.gmail.com" : targetHost,
    connectionTimeout: 12000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: { user, pass },
    tls: {
      servername: isGmail ? "smtp.gmail.com" : targetHost,
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
  });
};

/**
 * Envío de correo mediante Resend API por HTTPS (Puerto 443 estándar)
 * Inmune a bloqueos de puertos (25, 465, 587) y problemas de IPv6 en Render.
 */
export const sendViaResend = async ({ to, subject, html, text }) => {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) return null;

  const from =
    process.env.RESEND_FROM ||
    "Corazón Artesano <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn("⚠️ [RESEND API ERROR]:", data);
      throw new Error(data.message || (typeof data === "object" ? JSON.stringify(data) : "Error en Resend"));
    }

    return {
      success: true,
      messageId: data.id,
      provider: "resend",
    };
  } catch (err) {
    console.error("❌ [RESEND API EXCEPTION]:", err.message);
    throw err;
  }
};

/**
 * Envío de correo mediante Brevo API por HTTPS (Puerto 443 estándar)
 * Permite enviar a CUALQUIER destinatario del mundo sin necesidad de comprar dominio.
 */
export const sendViaBrevo = async ({ to, subject, html, text }) => {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) return null;

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || "corazonartesano395@gmail.com";
  const senderName = process.env.BREVO_SENDER_NAME || "Corazón Artesano";

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn("⚠️ [BREVO API ERROR]:", data);
      throw new Error(data.message || (typeof data === "object" ? JSON.stringify(data) : "Error en Brevo"));
    }

    return {
      success: true,
      messageId: data.messageId,
      provider: "brevo",
    };
  } catch (err) {
    console.error("❌ [BREVO API EXCEPTION]:", err.message);
    throw err;
  }
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

  // 1. PRIORIDAD A: Si está configurado BREVO_API_KEY, enviar por Brevo HTTPS (envía a CUALQUIER destinatario sin exigir dominio)
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== "") {
    try {
      const brevoRes = await sendViaBrevo({
        to: toEmail,
        subject: "Recuperación de Contraseña - Corazón Artesano",
        text: textContent,
        html: htmlContent,
      });

      if (brevoRes && brevoRes.success) {
        console.log(`[EMAIL DELIVERED VIA BREVO HTTPS] A: ${toEmail} | Id: ${brevoRes.messageId} | Link: ${resetUrl}`);
        return { success: true, messageId: brevoRes.messageId, resetUrl, realEmailSent: true, provider: "brevo" };
      }
    } catch (brevoErr) {
      console.warn(`[AVISO BREVO FALLÓ, INTENTANDO SIGUIENTE MÉTODO]: ${brevoErr.message}`);
    }
  }

  // 1. PRIORIDAD B: Si está configurado RESEND_API_KEY, enviar por Resend HTTPS
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== "") {
    try {
      const resendRes = await sendViaResend({
        to: toEmail,
        subject: "Recuperación de Contraseña - Corazón Artesano",
        text: textContent,
        html: htmlContent,
      });

      if (resendRes && resendRes.success) {
        console.log(`[EMAIL DELIVERED VIA RESEND HTTPS] A: ${toEmail} | Id: ${resendRes.messageId} | Link: ${resetUrl}`);
        return { success: true, messageId: resendRes.messageId, resetUrl, realEmailSent: true, provider: "resend" };
      }
    } catch (resendErr) {
      console.warn(`[AVISO RESEND FALLÓ, INTENTANDO SMTP DE RESPALDO]: ${resendErr.message}`);
    }
  }

  // 2. Si no hay Resend ni transportador SMTP configurado, simular en consola
  const mailTransporter = transporter || createTransporter();
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

  // 2. RESPALDO: Intentar envío a través de las IPs numéricas IPv4 de Google (100% libre de IPv6 / ENETUNREACH)
  const candidateIps = await getGmailIPv4Candidates();
  const portsToTry = [587, 465];

  for (const ip of candidateIps.slice(0, 4)) {
    for (const testPort of portsToTry) {
      try {
        const directTransporter = createTransporter({ host: ip, port: testPort });
        if (!directTransporter) continue;
        const info = await directTransporter.sendMail(mailOptions);
        console.log(`[EMAIL DELIVERED VIA IPv4 ${ip}:${testPort}] A: ${toEmail} | Id: ${info.messageId} | Link: ${resetUrl}`);
        return { success: true, messageId: info.messageId, resetUrl, realEmailSent: true, provider: "smtp" };
      } catch (err) {
        console.warn(`[INTENTO MAILER ${ip}:${testPort}]: ${err.message}`);
      }
    }
  }

  console.error(`[ERROR FATAL ENVIANDO CORREO REAL A ${toEmail}]: Se agotaron las opciones de envío.`);
  return { success: true, error: "Timeout en servidores SMTP", resetUrl, realEmailSent: false, simulated: true };
};

/**
 * Envío genérico de notificaciones por correo (órdenes, avisos de compra, etc.)
 */
export const sendEmailNotification = async ({ to, subject, html, text }) => {
  // 1. PRIORIDAD A: Si está configurado BREVO_API_KEY, enviar por Brevo HTTPS
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim() !== "") {
    try {
      const brevoRes = await sendViaBrevo({ to, subject, html, text });
      if (brevoRes && brevoRes.success) {
        console.log(`[REAL EMAIL DELIVERED VIA BREVO HTTPS TO: ${to}] Id: ${brevoRes.messageId}`);
        return { success: true, messageId: brevoRes.messageId, realEmailSent: true, provider: "brevo" };
      }
    } catch (brevoErr) {
      console.warn(`[BREVO NOTIFICACION FALLÓ, INTENTANDO SIGUIENTE]: ${brevoErr.message}`);
    }
  }

  // 1. PRIORIDAD B: Si está configurado RESEND_API_KEY, enviar por HTTPS
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== "") {
    try {
      const resendRes = await sendViaResend({ to, subject, html, text });
      if (resendRes && resendRes.success) {
        console.log(`[REAL EMAIL DELIVERED VIA RESEND HTTPS TO: ${to}] Id: ${resendRes.messageId}`);
        return { success: true, messageId: resendRes.messageId, realEmailSent: true, provider: "resend" };
      }
    } catch (resendErr) {
      console.warn(`[RESEND NOTIFICACION FALLÓ, INTENTANDO SMTP]: ${resendErr.message}`);
    }
  }

  const { user, pass, from } = getMailConfig();

  if (!user || !pass) {
    console.log("==========================================");
    console.log(`[SIMULATED EMAIL NOTIFICATION SENT TO: ${to}]`);
    console.log(`Asunto: ${subject}`);
    console.log(text || html);
    console.log("==========================================");
    return { success: true, realEmailSent: false };
  }

  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };

  const candidateIps = await getGmailIPv4Candidates();
  for (const ip of candidateIps.slice(0, 3)) {
    for (const testPort of [587, 465]) {
      try {
        const directTransporter = createTransporter({ host: ip, port: testPort });
        if (!directTransporter) continue;
        const info = await directTransporter.sendMail(mailOptions);
        console.log(`[REAL EMAIL DELIVERED TO: ${to} VIA ${ip}:${testPort}] MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId, realEmailSent: true };
      } catch (err) {
        console.warn(`[FALLO NOTIFICACION ${ip}:${testPort}]: ${err.message}`);
      }
    }
  }

  return { success: false, realEmailSent: false };
};

export default {
  transporter,
  createTransporter,
  getMailConfig,
  sendResetPasswordEmail,
  sendEmailNotification,
};

