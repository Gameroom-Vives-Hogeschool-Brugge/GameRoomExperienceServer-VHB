let excelParser = undefined;
let file = undefined;
let parser = undefined;

beforeAll(() => {
    excelParser = require('./excelParser');
    file = "./examples/testFile.xlsx";
    parser = new excelParser(file);
});

test("check if the excelParser class gets created", () => {
    expect(parser).toBeInstanceOf(excelParser);
});

test("check if the giveAllRegistrationsInJSON works", () =>  {
    const registrations = parser.giveAllRegistrationsInJSON();

    const firstStudent = registrations[0];
    const student = firstStudent.Student;
    const firstName = firstStudent.Voornaam;
    const lastName = firstStudent.Familienaam;
    const email = firstStudent['E-mailadres']
    const opleiding = firstStudent.Opleiding;

    expect(student).toBe("0957797");
    expect(firstName).toBe("Olivier");
    expect(lastName).toBe("Van Ransbeeck");
    expect(email).toBe("olivier.vanransbeeck@student.vives.be");
    expect(opleiding).toBe("PBA Elektronica-ICT (Kortrijk) (AO)");
});

test("check if the removeAllRegistrationNotFromBrugge works", () => {
    const registrations = parser.giveAllRegistrationsInJSON();
    const bruggeRegistrations = parser.removeAllRegistrationNotFromBrugge(registrations);

    const firstStudent = bruggeRegistrations[0];
    const student = firstStudent.Student;
    const firstName = firstStudent.Voornaam;
    const lastName = firstStudent.Familienaam;
    const email = firstStudent['E-mailadres']
    const opleiding = firstStudent.Opleiding;

    expect(student).toBe("0954449");
    expect(firstName).toBe("Dimitri");
    expect(lastName).toBe("Starkov");
    expect(email).toBe("dimitri.starkov@student.vives.be");
    expect(opleiding).toBe("PBA Elektronica-ICT (Brugge)");
});

test("check if the giveTheNamesFromAllRegistrations works", () => {
    const registrations = parser.giveAllRegistrationsInJSON();
    const bruggeRegistrations = parser.removeAllRegistrationNotFromBrugge(registrations);
    const names = parser.giveTheNamesFromAllRegistrations(bruggeRegistrations);

    const firstStudent = names[0];
    const firstName = firstStudent.firstName;
    const lastName = firstStudent.lastName;

    expect(firstName).toBe("Dimitri");
    expect(lastName).toBe("Starkov");
});

test("check if findPersonInRegistrations returns the correct person", () => {
    const registrations = parser.giveAllRegistrationsInJSON();

    const person = {
        firstName: "Olivier",
        lastName: "Van Ransbeeck"
      }

    const result = parser.findPersonInRegistrations(person, registrations);

    expect(result.Student).toEqual('0957797');
});

test("check if findPersonInRegistrations returns undefined if person is not found", () => {
    const registrations = parser.giveAllRegistrationsInJSON();

    const person = {
        firstName: "xxxx",
        lastName: "yyyy"
      }

    const result = parser.findPersonInRegistrations(person, registrations);

    expect(result).toBeUndefined();
});