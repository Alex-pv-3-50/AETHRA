import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Отправка писем покупателю (продавец -> email).
 * Если SMTP не настроен — тихо логирует в консоль, чтобы прототип
 * работал без внешнего почтового сервиса.
 */
export async function sendEmail({ to, subject, text }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log(`[mail:mock] to=${to} subject="${subject}"\n${text}`);
    return { sent: false, mocked: true };
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'Aethra <no-reply@aethra.shop>',
    to,
    subject,
    text,
  });
  return { sent: true };
}
