const xlsx = require('xlsx');
const fs = require('fs');

module.exports = class ExcelParser {
    constructor(file) {
        this.file = file;
    }

    giveAllRegistrationsInJSON = async () => {
        const registrations = "Alle inschrijvingen"

        //async check if the files exists
        if (!fs.existsSync(this.file)) {
            console.log("File does not exist, checking for emails");
            await this.checkForEmails();
        }

        const workbook = xlsx.readFile(this.file);
        const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[registrations]);

        return xlData;
    }

    removeAllRegistrationNotFromBrugge = (registrations) => {
        const bruggeRegistrations = registrations.filter((registration) => {
            return registration.Opleiding === "PBA Elektronica-ICT (Brugge)";
        });

        return bruggeRegistrations;
    }

    giveTheNamesFromAllRegistrations = (registrations) => {
        const names = registrations.map((registration) => {
            return {firstName: registration.Voornaam, lastName: registration.Familienaam};
        });

        return names;
    }

    findPersonInRegistrations(person, registrations){
        const personFound = registrations.find((registration) => {
            return registration.Voornaam === person.firstName && registration.Familienaam === person.lastName;
        });

        return personFound;
    }

    async checkForEmails (){
        //imports
        const EmailParser = require('./emailParser');

        //variables
        const emailParser = new EmailParser();

        //fetch attachments
        await emailParser.fetchAttachments();

        //wait 10 seconds for the attachments to be saved
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
}