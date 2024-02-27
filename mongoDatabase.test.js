const dotenv = require("dotenv");
const MongoDatabase = require('./mongoDatabase');
let mongo = undefined;

dotenv.config({
    path: "./keys.env"
});

beforeEach(() => {
    mongo = new MongoDatabase();
});

afterEach(() => {
    
});

test("check if all users are retrieved successfully", async () => {
    expect.assertions(1);

    const result = await mongo.getAllUsers();

    expect(result).toBeDefined();
});

test("check if database is connected", async () => {
    expect.assertions(0);

    await mongo.run();
});

test("check if a document gets inserted", async () => {
    expect.assertions(1);
    const document = {firstName: "TestFirstName", lastName: "TestLastName"};
    const dbName = mongo.dbStructure.UserData.dbName;
    const collection = mongo.dbStructure.UserData.users;

    const result = await mongo.insertDocument(document, dbName, collection);

    expect(result.acknowledged).toBe(true);

});

test("check if document are retrieved by filter", async () => {
    expect.assertions(1);
    const query = {firstName: "TestFirstName"};
    const dbName = mongo.dbStructure.UserData.dbName;
    const collection = mongo.dbStructure.UserData.users;

    const result = await mongo.getDocumentsByFilter(query, dbName, collection);

    expect(result[0].lastName).toBe("TestLastName");
});

test("check if a document gets updated", async () => {
    expect.assertions(1);
    const query = {firstName: "TestFirstName"};
    const update1 = {$set:{firstName: "TestFirstName", lastName: "NewTestLastName"}};
    const dbName = mongo.dbStructure.UserData.dbName;
    const collection = mongo.dbStructure.UserData.users;

    await mongo.updateDocument(query, update1, dbName, collection);
    let result  = await mongo.getUsersByFilter({firstName: "TestFirstName"});

    expect(result[0].lastName).toBe("NewTestLastName");
});

test("check if a document gets deleted", async () => {
    expect.assertions(1);
    const query = {firstName: "TestFirstName"};
    const dbName = mongo.dbStructure.UserData.dbName;
    const collection = mongo.dbStructure.UserData.users;

    await mongo.deleteDocument(query, dbName, collection);
    let result  = await mongo.getUsersByFilter({firstName: "TestFirstName"});

    expect(result.length).toBe(0);
});