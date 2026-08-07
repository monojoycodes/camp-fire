import Mailgen from "mailgen";
import nodemailer from "nodemailer";

// Configure the mail generator
const mailGenerator = new Mailgen({
  theme: "default",
  product: {
    name: "Camp Fire",
    link: process.env.FRONTEND_URL || "http://localhost:3000"
  }
});

// Configure the nodemailer transporter
const smtpConfig = {
  host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "2525", 10),
  secure: false, // port 2525 doesn't use TLS
  auth: {
    user: process.env.SMTP_USER || "e78e1aaf342aca",
    pass: process.env.SMTP_PASSWORD || "66bbc92699cb50"
  }
};

const transporter = nodemailer.createTransport(smtpConfig);

// Debug: Log the configuration
console.log("📧 Nodemailer Config:", {
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  user: smtpConfig.auth.user ? "***" : "undefined"
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer transporter error:", error);
  } else {
    console.log("Nodemailer transporter ready");
  }
});

// Main send email function
export const sendEmail = async (to, subject, htmlContent) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM_EMAIL || "noreply@yourapp.com",
      to,
      subject,
      html: htmlContent
    };

    console.log("📮 Sending email:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      htmlLength: htmlContent?.length
    });

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error;
  }
};

export const emailVerificationTemplate = (username, verifyUrl) => {
  return mailGenerator.generate({
    body: {
      name: username,
      intro: "Welcome! Please verify your email address.",
      action: {
        instructions: "Click the button below to verify your account:",
        button: {
          color: "#22BC66",
          text: "Verify Email",
          link: verifyUrl
        }
      },
      outro: "If you didn’t create this account, just ignore this email."
    }
  });
};

export const resetPasswordTemplate = (username, resetUrl) => {
  return mailGenerator.generate({
    body: {
      name: username,
      intro: "You requested a password reset.",
      action: {
        instructions: "Click the button below to reset your password:",
        button: {
          color: "#DC4D2F",
          text: "Reset Password",
          link: resetUrl
        }
      },
      outro: "If you didn't request this, your account is safe."
    }
  });
};