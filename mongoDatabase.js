//import environment variables
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

dotenv.config({
    path: "./keys.env"
});


module.exports = class MongoDatabase {
    constructor() {
        this.mongoClient = new MongoClient(process.env.MONGODB_URI, {
            serverApi: {
              version: ServerApiVersion.v1,
              strict: true,
              deprecationErrors: true,
            }});
        this.dbStructure = {
            RoomsData: {
                dbName: "RoomsData",
                rooms: "Rooms",
                reservations: "Reservations",
                oldReservations: "OldReservations",
            },
            UserData: {
                dbName: "UserData",
                users: "users",
                roles: "roles",
                courses: "courses",
                types: "types",
            }
        }
    }

    run = async () => {
        try {
            await this.mongoClient.connect();
            await this.mongoClient.db(this.dbStructure.UserData.dbName).command({ ping: 1 });
          } catch(err){
            throw err;
          } finally {
            await this.mongoClient.close();
          }
    }

    getAllDocuments = async (dbName, collection) => {
        let result = undefined;

        try {
            await this.mongoClient.connect();
            result = await this.mongoClient.db(dbName).collection(collection).find({}).toArray();
        } catch (err) {
            throw err;
        }finally {
            await this.mongoClient.close();
        }
        return result;
    }

    //query must be an object like this: {firstName: "John"}
    getUsersByFilter = async (query) => {
        let result = undefined;

        try {
            await this.mongoClient.connect();
            result = await this.mongoClient.db(this.dbStructure.UserData.dbName).collection("users").find(query).toArray();
        } catch (err) {
            throw err;
        }finally {
            await this.mongoClient.close();
        }
        return result;
    }

    //query must be an object like this: {firstName: "John"}
    //dbName must be a string like this: this.dbStructure.UserData.dbName
    //collection must be a string like this: this.dbStructure.UserData.users
    getDocumentsByFilter = async (query, dbName, collection) => {
        let result = undefined;

        try {
            await this.mongoClient.connect();
            result = await this.mongoClient.db(dbName).collection(collection).find(query).toArray();
        } catch (err) {
            throw err;
        }finally {
            await this.mongoClient.close();
        }
        return result;
    }

    //query must be an object like this: {firstName: "John"}
    //dbName must be a string like this: this.dbStructure.UserData.dbName
    //collection must be a string like this: this.dbStructure.UserData.users
    getOnedocumentByFilter = async (query, dbName, collection) => {
        let result = undefined;

        try {
            await this.mongoClient.connect();
            result = await this.mongoClient.db(dbName).collection(collection).findOne(query);
        } catch (err) {
            throw err;
        }finally {
            await this.mongoClient.close();
        }
        return result;
    }

    //query must be an object like this: {firstName: "John"}
    //update must be an object like this: {$set: {firstName: "Olivier"}}
    //dbName must be a string like this: this.dbStructure.UserData.dbName
    //collection must be a string like this: this.dbStructure.UserData.users
    updateDocument = async (query, update, dbName, collection) => {
        let result = undefined;

        try {
            await this.mongoClient.connect();
            result = await this.mongoClient.db(dbName).collection(collection).updateOne(query, update);
        } catch (err) {
            throw err;
        }finally {
            await this.mongoClient.close();
        }
        return result;
    }

    //document must be an object like this: {firstName: "John", lastName: "Doe",...}
    //dbName must be a string like this: this.dbStructure.UserData.dbName
    //collection must be a string like this: this.dbStructure.UserData.users
    insertDocument = async (document, dbName, collection) => {
        let result = undefined;

        try {
            await this.mongoClient.connect();
            result = await this.mongoClient.db(dbName).collection(collection).insertOne(document);
        } catch (err) {
            throw err;
        }finally {
            await this.mongoClient.close();
        }
        return result;
    }

    //query must be an object like this: {firstName: "John"}
    //dbName must be a string like this: this.dbStructure.UserData.dbName
    //oldCollection must be a string like this: this.dbStructure.UserData.users
    //newCollection must be a string like this: this.dbStructure.UserData.users
    moveDocument = async (query, dbName, oldCollection, newCollection) => {
        let result = undefined;

        try {
            await this.mongoClient.connect();
            result = await this.mongoClient.db(dbName).collection(oldCollection).findOneAndDelete(query);
            await this.mongoClient.db(dbName).collection(newCollection).insertOne(result);
        } catch (err) {
            throw err;
        }finally {
            await this.mongoClient.close();
        }
        return result;
    }

    //query must be an object like this: {firstName: "John"}
    //dbName must be a string like this: this.dbStructure.UserData.dbName
    //collection must be a string like this: this.dbStructure.UserData.users
    deleteDocument = async (query, dbName, collection) => {
        let result = undefined;

        try {
            await this.mongoClient.connect();
            result = await this.mongoClient.db(dbName).collection(collection).deleteOne(query);
        } catch (err) {
            throw err;
        }finally {
            await this.mongoClient.close();
        }
        return result;
    }

    //user must be an object like this: {Voornaam: "John", Familienaam: "Doe",...}
    //role must be a string like this: "Student"
    //type must be a string like this: "Student"
    //cardNumber must be a string like this: "XXXXXX"
    createUserDocument = async (userFound, role, type, cardNumber) => {
        //find correct role, type and course documents
        const roleObject= await this.getOnedocumentByFilter({role: role}, this.dbStructure.UserData.dbName, this.dbStructure.UserData.roles);
        const typeObject = await this.getOnedocumentByFilter({type: type}, this.dbStructure.UserData.dbName, this.dbStructure.UserData.types);
        const courseObject = await this.getOnedocumentByFilter({course: userFound.Opleiding}, this.dbStructure.UserData.dbName, this.dbStructure.UserData.courses);

        //get id's
        const roleObjectId = roleObject._id;
        const typeObjectId = typeObject._id;
        const courseObjectId = courseObject._id;
 
        //create user object
        const user = {
            idNumber: userFound.Student,
            cardNumber: cardNumber,
            firstName: userFound.Voornaam,
            lastName: userFound.Familienaam,
            email: userFound["E-mailadres"],
            course: courseObjectId,
            role: roleObjectId,
            type: typeObjectId,
            verified: false,
            token: ""
        }

        return user;
    }

    //userId must be a string like: '65ddc48fe28da42a3388ebd8'
    //roomId must be a string like: '65e5c77581846d9b55a37167'
    //date must be a string: "2024-03-15T08:00:00.000Z"
    //duration must be a number: 3
    createReservationDocument = async (userId, roomId, date, duration) => {
        //create reservation object
        const reservation = {
            room: new ObjectId(roomId),
            duration: duration,
            user: new ObjectId(userId),
            date: new Date(date),
        }

           return reservation;
    }
}
