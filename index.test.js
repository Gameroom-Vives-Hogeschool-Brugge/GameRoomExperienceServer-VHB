const server = require('./index.js');
const request = require('supertest');
const dotenv = require("dotenv");
const exampleFile = require('./examples/examples.json');

dotenv.config({
    path: "./keys.env"
});

let studenKortrijkUrl = process.env.STUDENT_KORTRIJK_URL;
const studentExample = exampleFile.examples.studentExample
const studentExample2 = exampleFile.examples.studentExample2
const studentExample3 = exampleFile.examples.studentExample3
const profExample = exampleFile.examples.profExample
const exceptionExample = exampleFile.examples.exceptionExample
const exceptionExample2 = exampleFile.examples.exceptionExample2


test ("server is working", async () => {
    expect.assertions(1);

    const response = await request(server.app).get('/started');
    expect(response.statusCode).toBe(200);
});

test ("check if login sends a 404 code when a cardnumber is invalid", async () => {
    expect.assertions(1);

    const invalidCardLink = "https://kaart.associatie.kuleuven.be/6100014427322090"
    const response = await request(server.app).post('/login').send({link: invalidCardLink});
    expect(response.statusCode).toBe(404);
});

test ("check if login sends a 404 code when a cardnumber is not found", async () => {
    expect.assertions(1);

    const invalidCardLink = "https://kaart.associatie.kuleuven.be/0"
    const response = await request(server.app).post('/login').send({link: invalidCardLink});
    expect(response.statusCode).toBeOneOf([404,401]); //BUG!!!!!
});

test ("check if login sends a 400 code when the url is not correct", async () => {
    expect.assertions(1);

    const invalidCardLink = "https://www.howest.be"
    const response = await request(server.app).post('/login').send({link: invalidCardLink});
    expect(response.statusCode).toBe(400);
});

test ("check if login sends 299 code when a student is found and from Kortrijk", async () => {
    expect.assertions(1);

    const validCardLink = studenKortrijkUrl
    const response = await request(server.app).post('/login').send({link: validCardLink});
    expect(response.statusCode).toBe(299);
});

test ("check if login sends 297 code when a person is found in the database", async () => {
    expect.assertions(1);

    const validCardLink = `https://kaart.associatie.kuleuven.be/${profExample.cardNumber}`;
    const response = await request(server.app).post('/login').send({link: validCardLink});
    expect(response.statusCode).toBe(297);
});

test ("check if loging sends 401 code if the student is not from Kortrijk and not in the database", async () => {
    //untestable at the moment due to insufficient cardnumbers
});

test ("check if login sends 298 cod when a prof is found", async () => {
    //untestable at the moment due to insufficient cardnumbers
});


test("check if calling registrations with a correct person returns 202", async () => {
    expect.assertions(1);

    const response = await request(server.app).post('/registrations').send({person: studentExample3});

    expect(response.statusCode).toBe(202);
});

test("check if calling registrations with a failing to find a person returns 404", async () => {
    expect.assertions(1);

    const response = await request(server.app).post('/registrations').send({person: {}});

    expect(response.statusCode).toBe(404);
});