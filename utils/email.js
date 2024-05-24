const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const path = require("path");

//load the environment variables
dotenv.config({
  path: "./.env",
});

module.exports = class EmailSender {
  constructor() {
    this.verificatieEmailFormat = {
      subject: "Verifieer uw email adres bij de Game Experience Room VIVES",
      attachments: [
        {
          filename: "regelementGameExperienceRoomVIVES.pdf",
          path: path.join(
            __dirname,
            "../storage/regelementGameExperienceRoomVIVES.pdf"
          ),
          contentType: "application/pdf",
        },
        {
          filename: "logoVives.png",
          path: path.join(__dirname, "../storage/logoVives.png"),
          cid: "logoVives",
        }
      ],
    },
      this.userCreatedEmailFormat = {
        subject: "Uw account is aangemaakt bij de Game Experience Room VIVES",
        message:
          "Uw account is aangemaakt bij de Game Experience Room VIVES. U kan nu inloggen met uw email adres en wachtwoord. Gelieve aandachtig de regels van de Game Experience Room VIVES door te nemen. Deze kan u terugvinden in de bijlage van deze email.",
        attachments: [
          {
            filename: "regelementGameExperienceRoomVIVES.pdf",
            path: path.join(
              __dirname,
              "../storage/regelementGameExperienceRoomVIVES.pdf"
            ),
            contentType: "application/pdf",
          },
          {
            filename: "logoVives.png",
            path: path.join(__dirname, "../storage/logoVives.png"),
            cid: "logoVives",
          }
        ],
      },
      this.reservationCreatedFormat = {
        subject:
          "Uw reservatie is aangemaakt bij de Game Experience Room VIVES",
        attachments: [
          {
            filename: "logoVives.png",
            path: path.join(__dirname, "../storage/logoVives.png"),
            cid: "logoVives",
          }
        ],
      },
      this.reservationDeletedFormat = {
        subject:
          "Uw reservatie is verwijderd bij de Game Experience Room VIVES",
        attachments: [
          {
            filename: "logoVives.png",
            path: path.join(__dirname, "../storage/logoVives.png"),
            cid: "logoVives",
          }
        ]
      },
      this.transportConfig = {
        host: process.env.HOST,
        service: process.env.SERVICE,
        port: 465,
        secure: true,
        auth: {
          user: process.env.USER,
          pass: process.env.PASS,
        },
      },
      this.transporter = nodemailer.createTransport(this.transportConfig);
  }

  sendEmail = async (email, subject, text, attachments) => {
    try {
      await this.transporter.sendMail({
        from: process.env.USER,
        to: email,
        subject: subject,
        text: text,
        attachments: attachments,
      });
    } catch (error) {
      console.log(error);
    }
  };

  createVerificationEmailTemplate = (verificationLink) => {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="nl">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Verificatie</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f3f3f3;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #fff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                  text-align: center;
                  margin-bottom: 20px;
              }
              .header img {
                  max-width: 200px;
                  height: auto;
              }
              h1 {
                  color: #333;
              }
              p {
                  color: #666;
                  margin-bottom: 10px;
              }
              .primary-color-btn {
                  display: inline-block;
                  background-color: #E00020 !important;
                  color: #FFFFFF !important;
                  text-decoration: none;
                  padding: 10px 20px;
                  border-radius: 5px;
                  transition: background-color 0.3s;
              }
              .primary-color-btn:hover {
                  background-color: #C4001C !important;
              }
              .report-link {
                  color: #007bff;
                  text-decoration: underline;
                  margin-top: 20px;
                  display: block;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <img src="cid:logoVives" alt="Vives Hogeschool Logo">
              </div>
              <h1>Account Verificatie</h1>
              <p>Welkom bij Vives Hogeschool! Klik op de onderstaande knop om uw account te verifiëren:</p>
              <a href="${verificationLink}" class="primary-color-btn">Verifieer Account</a>
              <p>Als u denkt dat dit account niet door u is gemaakt, kunt u het rapporteren door op onderstaande link te klikken:</p>
              <a href="mailto:ronny.mees@vives.be?subject=Rapportage van ongeautoriseerd account&body=Geef alstublieft aan waarom u denkt dat dit account niet door u is aangemaakt." class="report-link">Rapporteer Account</a>
          </div>
      </body>
      </html>
    `

    return htmlTemplate
  }

  createReservationCreatedTemplate = (reservation) => {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservatie Aangemaakt</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f3f3f3;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #fff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                  text-align: center;
                  margin-bottom: 20px;
              }
              .header img {
                  max-width: 200px;
                  height: auto;
              }
              h1 {
                  color: #333;
              }
              p {
                  color: #666;
                  margin-bottom: 10px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <img src="cid:logoVives" alt="Vives Hogeschool Logo">
              </div>
              <h1>Reservatie Aangemaakt</h1>
              <p>Jouw reservatie is aangemaakt. Hier zijn de details:</p>
              <p><strong>Naam:</strong> ${reservation.user}</p>
              <p><strong>Toestel:</strong> ${reservation.room}</p>
              <p><strong>Datum:</strong> ${reservation.date}</p>
              <p><strong>Duur:</strong> ${reservation.duration} uur</p>
          </div>
      </body>
      </html>   
      `

    return htmlTemplate
  }

  createReservationDeletedTemplate = (reservation) => {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reservatie Verwijderd</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  background-color: #f3f3f3;
                  margin: 0;
                  padding: 0;
              }
              .container {
                  max-width: 600px;
                  margin: 20px auto;
                  background-color: #fff;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                  text-align: center;
                  margin-bottom: 20px;
              }
              .header img {
                  max-width: 200px;
                  height: auto;
              }
              h1 {
                  color: #333;
              }
              p {
                  color: #666;
                  margin-bottom: 10px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <img src="cid:logoVives" alt="Vives Hogeschool Logo">
              </div>
              <h1>Reservatie Verdwijderd</h1>
              <p>Jouw reservatie is verwijderd. Hier zijn de details:</p>
              <p><strong>Naam:</strong> ${reservation.user}</p>
              <p><strong>Toestel:</strong> ${reservation.room}</p>
              <p><strong>Datum:</strong> ${reservation.date}</p>
              <p><strong>Duur:</strong> ${reservation.duration} uur</p>
          </div>
      </body>
      </html>   
      `

    return htmlTemplate
  }

  createUserCreatedTemplate = () => {
    const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="nl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Aangemaakt</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f3f3f3;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #fff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .header img {
                max-width: 200px;
                height: auto;
            }
            h1 {
                color: #333;
            }
            p {
                color: #666;
                margin-bottom: 10px;
            }
            .primary-color-btn {
                display: inline-block;
                background-color: #007bff;
                color: #fff;
                text-decoration: none;
                padding: 10px 20px;
                border-radius: 5px;
                transition: background-color 0.3s;
            }
            .primary-color-btn:hover {
                background-color: #0056b3;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="cid:logoVives" alt="Vives Hogeschool Logo">
            </div>
            <h1>Account Aangemaakt</h1>
            <p>Er is een nieuw account voor u aangemaakt. U kan nu inloggen met uw nieuwe account.</p>
            <p>Klik hier om in te loggen:</p>
            <a href="${process.env.FRONT_END_URL}" class="primary-color-btn">Inloggen</a>
        </div>
    </body>
    </html>
    `;

    return htmlTemplate;
  }

  sendVerificationEmail = async (email, cardNumber, token) => {
    const verificationLink = `${process.env.BACK_END_URL}/user/verify/${cardNumber}/${token}`;
    const html = this.createVerificationEmailTemplate(verificationLink);

    try {
      await this.transporter.sendMail({
        from: process.env.USER,
        to: email,
        subject: this.verificatieEmailFormat.subject,
        html: html,
        attachments: this.verificatieEmailFormat.attachments,
      });
    } catch (error) {
      console.log(error);
    }
  };

  sendUserCreatedEmail = async (email) => {
    try {
      const htmlTemplate = this.createUserCreatedTemplate();

      await this.transporter.sendMail({
        from: process.env.USER,
        to: email,
        subject: this.userCreatedEmailFormat.subject,
        html: htmlTemplate,
        attachments: this.userCreatedEmailFormat.attachments,
      });
    } catch (error) {
      console.log(error);
    }
  };

  sendReservationCreatedEmail = async (email, reservation) => {
    try {
      const htmlTemplate = this.createReservationCreatedTemplate(reservation);

      await this.transporter.sendMail({
        from: process.env.USER,
        to: email,
        subject: this.reservationCreatedFormat.subject,
        html: htmlTemplate,
        attachments: this.reservationCreatedFormat.attachments
      });
    } catch (error) {
      console.log(error);
    }
  };

  sendReservationDeletedEmail = async (email, reservation) => {
    try {
      const htmlTemplate = this.createReservationDeletedTemplate(reservation);

      await this.transporter.sendMail({
        from: process.env.USER,
        to: email,
        subject: this.reservationDeletedFormat.subject,
        html: htmlTemplate,
        attachments: this.reservationDeletedFormat.attachments
      });
    } catch (error) {
      console.log(error);
    }
  };
  
};
