module.exports = class Database {
    constructor() {
        this.studentsFile = require("./storage/registeredStudents.json");
        this.exceptionsFile = require("./storage/registeredExceptions.json");
        this.profsFile = require("./storage/registeredProfs.json");
        this.types = {
            students: "students",
            profs: "profs",
            exceptions: "exceptions"
        }
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
            personType: this.types.students
        });

        if (studentFound) {
            personFound = studentFound;
        }
    
        const profFound = this.findPerson(cardNumber, "cardNumber", {
            fileName: this.profsFile,
            personType: this.types.profs
        });

        if (profFound) {
            personFound = profFound;
        }
    
        const exceptionFound = this.findPerson(cardNumber, "cardNumber", {
            fileName: this.exceptionsFile,
            personType: this.types.exceptions
        });
        
        if (exceptionFound) {
            personFound = exceptionFound;
        }

        return personFound;
    }

    addPerson = (person, type) => {
        const fs = require("fs");
        let succes = true;

        let jsonObject = {};
        let fileRoute = "";

        if (type === this.types.students) {
            const registeredStudent = {
                    "studentNumber": person.Student,
                    "cardNumber": "",
                    "firstName": person.Voornaam,
                    "lastName": person.Familienaam,
                    "email": person["E-mailadres"],
                    "course": person.Opleiding,
                    "role": "Student"
            }

            jsonObject = this.studentsFile;
            jsonObject.students.push(registeredStudent);

            fileRoute = "./storage/registeredStudents.json";
        } else if (type === this.types.profs) {
            const registeredProf = {
                "profNumber": person.Prof,
                "cardNumber": "",
                "firstName": person.Voornaam,
                "lastName": person.Familienaam,
                "email": person["E-mailadres"],
                "course": "Not Applicable",
                "role": "Prof"
            }

            jsonObject = this.profsFile;
            jsonObject.profs.push(registeredProf);
    
            fileRoute = "./storage/registeredProfs.json";
        } else if (type === this.types.exceptions) {
            const registeredException = {
                "studentNumber": person.Student,
                "cardNumber": "",
                "firstName": person.Voornaam,
                "lastName": person.Familienaam,
                "email": person["E-mailadres"],
                "course": person.Opleiding,
                "role": "Student"
        }

            jsonObject = this.exceptionsFile;
            jsonObject.exceptions.push(registeredException);

            fileRoute = "./storage/registeredExceptions.json";
        }

        fs.writeFile(fileRoute, JSON.stringify(jsonObject), (err) => {
            if (err) {
                succes = false;
            }
        });

        return succes;
    }
}
