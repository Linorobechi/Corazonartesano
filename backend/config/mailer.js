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

export default {
  transporter,
  createTransporter,
  getMailConfig,
  sendEmailNotification,
};
