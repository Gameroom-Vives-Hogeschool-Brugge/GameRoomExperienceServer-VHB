const nodemailer = require("nodemailer");

const sendEmail = async (email, subject, text) => {
  try {
    const transportConfig = {
        host: process.env.HOST,
        service: process.env.SERVICE,
        port: 465,
        secure: true,
        auth: {
            user: process.env.USER,
            pass: process.env.PASS,
        },
    }

    console.log(transportConfig);
    const transporter = nodemailer.createTransport(transportConfig);

    await transporter.sendMail({
      from: process.env.USER,
      to: email,
      subject: subject,
      text: text,
    });
    console.log("email sent sucessfully");
  } catch (error) {
    console.log("email not sent");
    console.log(error);
  }
};

module.exports = sendEmail;