const Imap = require("node-imap");
const fs = require("fs");
const { simpleParser } = require("mailparser");
const dotenv = require("dotenv");
const path = require("path");

class EmailParser {
  constructor() {
    dotenv.config({
      path: "./keys.env",
    });

    this.imap = new Imap({
      user: process.env.USER,
      password: process.env.PASS,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false, servername: "imap.gmail.com" },
      connTimeout: 10000,
      authTimeout: 5000,
      debug: null,
      mailbox: "INBOX", // mailbox to monitor
      searchFilter: ["UNSEEN", "FLAGGED"], // the search filter being used after an IDLE notification has been retrieved
      markSeen: true, // all fetched email will be marked as seen and not fetched next time
      fetchUnreadOnStart: true, // use it only if you want to get all unread email on lib start. Default is `false`,
      mailParserOptions: { streamAttachments: true }, // options to be passed to mailParser lib.
      attachments: true, // download attachments as they are encountered to the project directory
      attachmentOptions: { directory: path.join(__dirname, "../storage") }, // specify a download directory for attachments
    });

    this.emailArray = [];
  }

  openInbox(cb) {
    this.imap.openBox("INBOX", false, cb);
  }

  async fetchAttachments() {
    return new Promise((resolve, reject) => {
      this.imap.once("ready", () => {
        console.log("Start opening inbox...");
        this.openInbox((err, box) => {
          if (err) {
            reject(err);
            return;
          }

          this.imap.search(
            ["UNSEEN", ["SINCE", new Date()]],
            (err, results) => {
              if (err) {
                reject(err);
                return;
              }

              if (!results || !results.length) {
                console.log(
                  "The server didn't find any emails matching the specified criteria"
                );
                this.imap.end();
                resolve(this.emailArray);
                return;
              }

              const fetch = this.imap.fetch(results, {
                bodies: "",
                struct: true,
              });

              fetch.on("message", async (msg, seqno) => {
                console.log(`Message #${seqno}`);
                const prefix = `(#${seqno})`;

                msg.on("body", function (stream, info) {
                  //Retrieve the 'from' header and buffer the entire body of the newest message:
                  var buffer = "",
                    count = 0;

                  //stream the email body, this means: get the body of the email
                  stream.on("data", async function (chunk) {
                    count += chunk.length;
                    buffer += chunk.toString("utf8");
                  });

                  //when the stream is finished, get the attachment of the email
                  stream.once("end", async () => {
                    const parsedEmail = await simpleParser(buffer);
                    const attachments = parsedEmail.attachments;

                    for (let i = 0; i < attachments.length; i++) {
                      const attachment = attachments[i];
                      const attachmentContent = attachment.content;
                      const filename = attachment.filename;
                      let filePath = path.join(
                        __dirname,
                        "../storage",
                        filename
                      );

                      console.log("filepath:", filePath);

                      fs.writeFile(filePath, attachmentContent, (err) => {
                        if (err) {
                          console.error("Error saving attachment:", err);
                        } else {
                          console.log("Attachment saved:", filename);
                        }
                      });
                    }
                  });
                });

                //mark attributes email as read in inbox
                msg.once("attributes", (attrs) => {
                  const uid = attrs.uid;
                  this.imap.addFlags(uid, ["\\Seen"], (err) => {
                    if (err) {
                      console.log(`Error marking email as read: ${err}`);
                    }
                  });
                });


                msg.once("end", function () {
                  console.log(prefix + "Finished");
                });
              });

              fetch.once("error", (err) => {
                console.log(`Fetch error: ${err}`);
              });

              fetch.once("end", () => {
                console.log("Done fetching all messages!");
                this.imap.end();
                resolve(this.emailArray);
              });
            }
          );
        });
      });

      this.imap.once("error", (err) => {
        console.log(`Error when connecting to IMAP: ${err}`);
        reject(err);
      });

      this.imap.once("close", () => {
        console.log("Connection ended");
      });

      this.imap.connect();
    });
  }
}

module.exports = EmailParser;
