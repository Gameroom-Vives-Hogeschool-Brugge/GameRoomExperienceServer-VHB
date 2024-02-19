const e = require('express');
const db = require('./database');
const exampleFile = require('./examples/examples.json');
let database = undefined;

const studentExample = exampleFile.examples.studentExample
const studentExample2 = exampleFile.examples.studentExample2
const profExample = exampleFile.examples.profExample
const exceptionExample = exampleFile.examples.exceptionExample
const exceptionExample2 = exampleFile.examples.exceptionExample2

beforeAll(() => {
    database = new db();
    database.studentsFile = require("./examples/registeredStudents.json");
    database.exceptionsFile = require("./examples/registeredExceptions.json");
    database.profsFile = require("./examples/registeredProfs.json");
    database.routes = {
        students: "./examples/registeredStudents.json",
        profs: "./examples/registeredProfs.json",
        exceptions: "./examples/registeredExceptions.json"
    }
});

test ("check if the files exists", () => {
    expect.assertions(3);

    expect(database.studentsFile).toBeDefined();
    expect(database.profsFile).toBeDefined();
    expect(database.exceptionsFile).toBeDefined();
});

test ("check if we can get all the registered profs", () => {
    expect.assertions(1);

    const profs = database.giveAllRegisterdPersonsOfACategory({
        fileName: database.profsFile,
        personType: "profs"
    });
    expect(profs).toBeDefined();
});

test ("check if we can get all the registered students", () => {
    expect.assertions(1);

    const students = database.giveAllRegisterdPersonsOfACategory({
        fileName: database.studentsFile,
        personType: "students"
    });
    expect(students).toBeDefined();
});

test ("check if we can get all the registered exceptions", () => {
    expect.assertions(1);

    const exceptions = database.giveAllRegisterdPersonsOfACategory({
        fileName: database.exceptionsFile,
        personType: "exceptions"
    });
    expect(exceptions).toBeDefined();
});

test ("check if we can find a exception by number", () => {
    expect.assertions(1);

    const exception = database.findPerson(exceptionExample2.exceptionNumber, "exceptionNumber", 
        {
            fileName: database.exceptionsFile,
            personType: database.types.exceptions
        });

    expect(exception.firstName).toBe(exceptionExample2.firstName)
});

test ("check if we can find a student by number", () => {
    expect.assertions(1);

    const student = database.findPerson(studentExample.studentNumber, "studentNumber", 
        {
            fileName: database.studentsFile,
            personType: database.types.students
        });

    expect(student.firstName).toBe(studentExample.firstName)
});

test ("check if we can find a prof by number", () => {
    expect.assertions(1);

    const prof = database.findPerson(profExample.profNumber, "profNumber", 
        {
            fileName: database.profsFile,
            personType: database.types.profs
        });

    expect(prof.firstName).toBe(profExample.firstName)
});

test ("check if we get undefined when we search for a non existing student", () => {
    expect.assertions(1);

    const student = database.findPerson("0", "studentNumber", 
        {
            fileName: database.studentsFile,
            personType: database.types.students
        });

    expect(student).toBeUndefined();
});

test ("check if we get undefined when we search for a non existing prof", () => {
    expect.assertions(1);

    const prof = database.findPerson("0", "profNumber", 
        {
            fileName: database.profsFile,
            personType: database.types.profs
        });

    expect(prof).toBeUndefined();
});

test ("check if we get undefined when we search for a non existing exception", () => {
    expect.assertions(1);

    const exception = database.findPerson("0", "exceptionNumber", 
        {
            fileName: database.exceptionsFile,
            personType: database.types.exceptions
        });

    expect(exception).toBeUndefined();
});

test ("check if we get a student when we search for a student", () => {
    expect.assertions(1);

    const student = database.searchWholeDatabase(studentExample.cardNumber);
    expect(student.firstName).toBe(studentExample.firstName)
});

test ("check if we get a prof when we search for a prof", () => {
    expect.assertions(1);

    const prof = database.searchWholeDatabase(profExample.cardNumber);
    expect(prof.firstName).toBe(profExample.firstName)
});

test ("check if we get a exception when we search for a exception", () => {
    expect.assertions(1);

    const exception = database.searchWholeDatabase(exceptionExample2.cardNumber);
    expect(exception.firstName).toBe(exceptionExample2.firstName)
});

test ("check if we get undefined when we search for a non existing person", () => {
    expect.assertions(1);

    const person = database.searchWholeDatabase("0");
    expect(person).toBeUndefined();
});

test("add token for a student", () => {
    expect.assertions(2);
    
    const token = "abc123";
    const result = database.addToken(studentExample, token);

    expect(result).toBe(true);

    const student = database.searchWholeDatabase(studentExample.cardNumber);
    expect(student.token).toBe(token);
});

test("add token for a prof", () => {
    expect.assertions(2);

    const token = "xyz789";
    const result = database.addToken(profExample, token);

    expect(result).toBe(true);

    const prof = database.searchWholeDatabase(profExample.cardNumber);
    expect(prof.token).toBe(token);
});

test("add token for an exception", () => {
    expect.assertions(2);

    const token = "123xyz";
    const result = database.addToken(exceptionExample, token);

    expect(result).toBe(true);

    const exception = database.searchWholeDatabase(exceptionExample.cardNumber);
    expect(exception.token).toBe(token);
});

test("check if we can find a token by card number", () => {
    expect.assertions(1);

    const student = studentExample;
    const expectedToken = "abc123";
    database.addToken(student, expectedToken);

    const token = database.findToken(student.cardNumber);

    expect(token).toBe(expectedToken);
});

test ("check if we get false when the wrong card number tries to validate", () => {
    expect.assertions(1);

    const student = studentExample;
    const expectedToken = "abc123";
    database.addToken(student, expectedToken);

    const wrongCardNumber = "0";
    const token = database.findToken(wrongCardNumber);
    expect(token).toBe(undefined);
});

test ("check if we get an error when we try to verify a non existing person", () => {
    expect.assertions(1);

    const result = database.verifyUser("0");
    expect(result).toBe(false);
});

test ("check if we can verify a student", () => {
    expect.assertions(1);

    const expectedToken = "abc123";
    database.addToken(studentExample, expectedToken);

    const result = database.verifyUser(studentExample.cardNumber);
    expect(result).toBe(true);
});

test("add a student to the database", () => {
    expect.assertions(2);

    const person =  {
        Student: "00002332",
        Voornaam: "Bert",
        Familienaam: "Leemdonck",
        "E-mailadres": "bert.leemdonck@student.vives.be",
        Opleiding: "PBA Elektronica-ICT (Brugge)",
    }
    const result = database.addPerson(person, database.types.students);

    expect(result).toBe(true);

    const foundPerson = database.searchWholeDatabase("XXXXXX")
    expect(foundPerson.studentNumber).toBe("00002332")
});