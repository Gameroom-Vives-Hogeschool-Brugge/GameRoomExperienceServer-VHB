module.exports = class Database {
    constructor() {
        this.studentsFile = require("./storage/registeredStudents.json");
        this.exceptionsFile = require("./storage/registeredExceptions.json");
        this.profsFile = require("./storage/registeredProfs.json");
    }

    giveAllRegisterdPersonsOfACategory = (category) => {
        const fileName = category["fileName"];
        const personType = category["personType"];
        return fileName[personType];
    }

    findPerson = (person, by, category) => {
        const fileName = category["fileName"];
        const personType = category["personType"];
        return fileName[personType].find((registeredPerson) => {
            return registeredPerson[by] === person;
        });
    }
    
    searchWholeDatabase = (cardNumber) => {
        let personFound = undefined;

        const studentFound = this.findPerson(cardNumber, "cardNumber", {
            fileName: this.studentsFile,
            personType: "students"
        });

        if (studentFound) {
            personFound = studentFound;
        }
    
        const profFound = this.findPerson(cardNumber, "cardNumber", {
            fileName: this.profsFile,
            personType: "profs"
        });

        if (profFound) {
            personFound = profFound;
        }
    
        const exceptionFound = this.findPerson(cardNumber, "cardNumber", {
            fileName: this.exceptionsFile,
            personType: "exceptions"
        });
        
        if (exceptionFound) {
            personFound = exceptionFound;
        }

        return personFound;
    }
}
