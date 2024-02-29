const Encryptor = require('../utils/encryptor');
let cryptor = undefined;

beforeEach(() => {
    cryptor = new Encryptor();
});

test("check if encryption and decription works", () => {
    expect.assertions(1);
    const encryptedData = cryptor.encrypt("test");
    expect(cryptor.decrypt(encryptedData)).toBe("test");
});

test("check if token is created", () => {
    expect.assertions(1);
    expect(cryptor.createToken()).toBeDefined();
});


