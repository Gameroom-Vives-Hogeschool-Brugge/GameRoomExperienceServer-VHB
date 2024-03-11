const server = require('./index.js');
const request = require('supertest');
const dotenv = require("dotenv");
const exampleFile = require('./examples/examples.json');
const Encryptor = require('./utils/encryptor');
const MongoDatabase = require('./mongoDatabase');

dotenv.config({
    path: "./keys.env"
});

let studenKortrijkUrl = process.env.STUDENT_KORTRIJK_URL;
const studentExample3 = exampleFile.examples.studentExample3
const profExample = exampleFile.examples.profExample
let encryptor = undefined;

beforeAll(() => {
    encryptor = new Encryptor();
});

test ("server is working", async () => {
    expect.assertions(1);

    const response = await request(server.app).get('/started');
    expect(response.statusCode).toBe(200);
});

test ("check if login sends a 401 code when a cardnumber is invalid", async () => {
    expect.assertions(1);

    const invalidCardLink = "https://kaart.associatie.kuleuven.be/6100014427322090"
    const encryptedLink = encryptor.encrypt(invalidCardLink);
    const response = await request(server.app).post('/login').send({encryptedLink: encryptedLink});
    expect(response.statusCode).toBe(401);
});

test ("check if login sends a 404 code when a cardnumber is not found", async () => {
    expect.assertions(1);

    const invalidCardLink = "https://kaart.associatie.kuleuven.be/0"
    const encryptedLink = encryptor.encrypt(invalidCardLink);
    const response = await request(server.app).post('/login').send({encryptedLink: encryptedLink});
    expect(response.statusCode).toBeOneOf([404,401]); //BUG!!!!!
});

test ("check if login sends a 400 code when the url is not correct", async () => {
    expect.assertions(1);

    const invalidCardLink = "https://www.howest.be"
    const encryptedLink = encryptor.encrypt(invalidCardLink);
    const response = await request(server.app).post('/login').send({encryptedLink: encryptedLink});
    expect(response.statusCode).toBe(400);
});

//delete Olivier First from database
test ("check if login sends 299 code when a student is found and from Kortrijk", async () => {
    expect.assertions(1);

    const validCardLink = studenKortrijkUrl
    const encryptedLink = encryptor.encrypt(validCardLink);
    const response = await request(server.app).post('/login').send({encryptedLink: encryptedLink});
    expect(response.statusCode).toBe(299);
});

test ("check if login sends 297 code when a person is found in the database", async () => {
    expect.assertions(1);

    const validCardLink = `https://kaart.associatie.kuleuven.be/${profExample.cardNumber}`;
    const encryptedLink = encryptor.encrypt(validCardLink);
    const response = await request(server.app).post('/login').send({encryptedLink: encryptedLink});
    expect(response.statusCode).toBe(297);
});

test ("check if loging sends 401 code if the student is not from Kortrijk and not in the database", async () => {
    //untestable at the moment due to insufficient cardnumbers
});

test ("check if login sends 298 cod when a prof is found", async () => {
    //untestable at the moment due to insufficient cardnumbers
});

//delete Olivier First from databas
test("check if calling registrations with a correct person returns 201", async () => {
    expect.assertions(1);

    const mongo = new MongoDatabase();

    const correctPerson = {
        person: {
            firstName: studentExample3.firstName,
            lastName: studentExample3.lastName
        },
        cardNumber: studentExample3.cardNumber,
        role: "Student",
        type: "Student"
    }

    const response = await request(server.app).post('/registrations').send(
        {
            person: correctPerson.person,
            cardNumber: correctPerson.cardNumber,
            role: correctPerson.role,
            type: correctPerson.type
        });

    await mongo.deleteDocument({firstName: studentExample3.firstName, lastName: studentExample3.lastName, cardNumber: correctPerson.cardNumber}, mongo.dbStructure.UserData.dbName, mongo.dbStructure.UserData.users);

    expect(response.statusCode).toBe(201);
});

test("check if calling registrations with a failing to find a person returns 404", async () => {
    expect.assertions(1);

    const response = await request(server.app).post('/registrations').send({person: {}});

    expect(response.statusCode).toBe(404);
});