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
  sendEmailNotification,
};

