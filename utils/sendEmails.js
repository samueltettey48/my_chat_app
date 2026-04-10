

// utils/sendMail.js
import nodemailer from "nodemailer";

const sendMail = async (to, subject, html) => {
  try {
    // 1️⃣ Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,      // your email
        pass: process.env.EMAIL_PASS,      // your app password
      },
    });

    // 2️⃣ Mail options
    const mailOptions = {
      from: `"Auth App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    // 3️⃣ Send email
    await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

export default sendMail;