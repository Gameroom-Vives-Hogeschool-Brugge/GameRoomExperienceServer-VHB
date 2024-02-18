module.exports = class Database {
    constructor() {
        this.studentsFile = require("./storage/registeredStudents.json");
        this.exceptionsFile = require("./storage/registeredExceptions.json");
        this.profsFile = require("./storage/registeredProfs.json");
        this.routes = {
            students: "./storage/registeredStudents.json",
            profs: "./storage/registeredProfs.json",
            exceptions: "./storage/registeredExceptions.json"
        }
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

            fileRoute = this.routes.students;
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
    
            fileRoute = this.routes.profs;
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

            fileRoute = this.routes.exceptions;
        }

        fs.writeFile(fileRoute, JSON.stringify(jsonObject), (err) => {
            if (err) {
                succes = false;
            }
        });

        return succes;
    }

    addToken = (user, token) => {
        const fs = require("fs");
        let succes = true;

        const person = this.searchWholeDatabase(user.cardNumber);

        console.log(person);

        let jsonObject = {};
        let fileRoute = "";

        try {
            switch (person.type) {
                case "Student":
                    jsonObject = this.studentsFile;
                    jsonObject.students.find(student => student.cardNumber === user.cardNumber).verified = false;
                    jsonObject.students.find(student => student.cardNumber === user.cardNumber).token = token;
                    fileRoute = this.routes.students;
                    break;
                case "Prof":
                    jsonObject = this.profsFile;
                    jsonObject.profs.find(prof => prof.cardNumber === user.cardNumber).verified = false;
                    jsonObject.profs.find(prof => prof.cardNumber === user.cardNumber).token = token;
                    fileRoute = this.routes.profs;
                    break;
                case "Exception":
                    jsonObject = this.exceptionsFile;
                    jsonObject.exceptions.find(exception => exception.cardNumber === user.cardNumber).verified = false;
                    jsonObject.exceptions.find(exception => exception.cardNumber === user.cardNumber).token = token;
                    fileRoute = this.routes.exceptions;
                    break;
            }
        } catch (error) {
            console.log(error);
            return false;
        }

        fs.writeFile(fileRoute, JSON.stringify(jsonObject), (err) => {
            if (err) {
                console.log(err);
                succes = false;
            }
        });

        return succes;
    }

    findToken = (cardNumber) => {
        const person = this.searchWholeDatabase(cardNumber);
        return person ? person.token : undefined;
    }

    verifyUser = (cardNumber) => {
        const fs = require("fs");
        let succes = true;

        const person = this.searchWholeDatabase(cardNumber);

        let jsonObject = {};
        let fileRoute = "";

        try {
            switch (person.type) {
                case "Student":
                    jsonObject = this.studentsFile;
                    jsonObject.students.find(student => student.cardNumber === cardNumber).verified = true;
                    fileRoute = this.routes.students;
                    break;
                case "Prof":
                    jsonObject = this.profsFile;
                    jsonObject.profs.find(prof => prof.cardNumber === cardNumber).verified = true;
                    fileRoute = this.routes.profs;
                    break;
                case "Exception":
                    jsonObject = this.exceptionsFile;
                    jsonObject.exceptions.find(exception => exception.cardNumber === cardNumber).verified = true;
                    fileRoute = this.routes.exceptions;
                    break;
            }
        } catch (error) {
            return false;
        }

        fs.writeFile(fileRoute, JSON.stringify(jsonObject), (err) => {
            if (err) {
                console.log(err);
                succes = false;
            }
        });

        return succes;
    }
}
