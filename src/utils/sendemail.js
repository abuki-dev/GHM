const { transporter } = require("../config/email");

module.exports.sendEmail = async (message, user) => {
  const info = await transporter.sendMail({
    from: `Server Notification (No-Reply)" <Titians Gymr support team>`,
    to: user.email,
    subject: message.subject,
    text: message.text,
    html: `<h3>Hello ${user.name}!</h3><p>${message.html}</p>`,
  });

  console.log("Email sent successfully:", info.messageId);
  return { success: true, messageId: info.messageId };
};
