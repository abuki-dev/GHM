const { transporter } = require("../config/email");
const env = require("../config/env");

module.exports.sendEmail = async (message, user) => {
  if (!user?.email) throw new Error("Cannot send email: recipient email is missing.");

  const info = await transporter.sendMail({
    from: `"Titans Gym" <${env.EMAIL_USER}>`,
    to: user.email,
    subject: message.subject,
    text: message.text,
    html: `<h3>Hello ${user.full_name || "member"}!</h3>${message.html}`,
  });

  return { success: true, messageId: info.messageId };
};