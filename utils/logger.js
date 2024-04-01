//winston logger
const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');
const { object } = require('joi');

//create a new class for the logger
class Logger {
    constructor(fileToLog) {
        this.fileToLog = fileToLog;
        this.filePath = path.join(
            __dirname,
            "../storage",
            fileToLog
          );
        this.logger = createLogger({
            level: 'info',
            format: format.combine(
                format.timestamp({
                    format: 'DD-MM-YYYY HH:mm:ss'
                }),
                format.errors({ stack: true }),
                format.splat(),
                format.json()
            ),
            defaultMeta: { service: 'server' },
            transports: [
                new transports.File({ filename: this.filePath }),
            ],
        });
    }

    createLogFile() {
        //check if the file exists, if not create it
        const fs = require('fs');
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, '');
        }
    }

    //log an error
    error(message) {
        this.logger.error(message);
    }

    //log an info message
    info(message) {
        this.logger.info(message);
    }

    //log a warning
    warn(message) {
        this.logger.warn(message);
    }

    //log a debug message
    debug(message) {
        this.logger.debug(message);
    }

    //log a verbose message
    verbose(message) {
        this.logger.verbose(message);
    }

    //log a silly message
    silly(message) {
        this.logger.silly(message);
    }

    getLogFileDataInJson() {
        //get the data in file and return it as json, each line is a json object
        const fs = require('fs');
        const data = fs.readFileSync(this.filePath, 'utf8');

        //for each line, parse it as json
        const lines = data.split('\n');
        let jsonData = [];
        lines.forEach((line) => {
            if (line !== '') {
                jsonData.push(JSON.parse(line));
            }
        });

        //return the json data as a json object with the key being the logname
        const jsonObject = {
            name: this.fileToLog,
            logs: jsonData
        };

        return jsonObject;
    }
}

module.exports = Logger;