
const dotenv = require('dotenv');

dotenv.config({
    path: "./keys.env"
});

module.exports = class Encryptor {
    constructor() {
        this.crypto = require('crypto-js');
        this.encryptorKey = process.env.ENCRYPTOR_KEY;
    }

    encrypt = (text) => {
        const encryptedData = this.crypto.AES.encrypt(text, this.encryptorKey).toString();

        return encryptedData
    }

    decrypt = (encryptedData) => {
        const decryptedData = this.crypto.AES.decrypt(encryptedData, this.encryptorKey).toString(this.crypto.enc.Utf8);

        return decryptedData
    }

    encryptObject = (object) => {
        const encryptedObject = this.crypto.AES.encrypt(JSON.stringify(object), this.encryptorKey).toString();

        return encryptedObject
    }

    decryptObject = (encryptedObject) => {
        const decryptedData = this.crypto.AES.decrypt(encryptedObject, this.encryptorKey).toString(this.crypto.enc.Utf8);
        const decryptedObject = JSON.parse(decryptedData);

        return decryptedObject
    }

    createToken = () => {
        const token = this.crypto.lib.WordArray.random(128 / 8).toString(this.crypto.enc.Hex);

        return token;
    }
}