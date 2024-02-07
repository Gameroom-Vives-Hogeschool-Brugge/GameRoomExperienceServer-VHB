const xlsx = require('xlsx');

module.exports = class ExcelParser {
    constructor(file) {
        this.file = file;
    }

    giveAllRegistrationsInJSON = () => {
        const registrations = "Alle inschrijvingen"
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
}