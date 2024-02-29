const express = require('express')
var bodyParser = require('body-parser')
const urlScraper = require('./scraper.js');
const excelParser = require('./excelParser.js');
const app = express();
const cors = require('cors');
const sendEmail = require('./utils/email');
const dotenv = require("dotenv");
const MongoDatabase = require('./mongoDatabase');
const Encryptor = require('./utils/encryptor');

dotenv.config({
    path: "./keys.env"
});

const corsOptions = {
    origin: ["http://localhost:5173"],
    optionsSuccessStatus: 200
  }

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const port = 3000

app.post('/test', async (req,res) => {
    res.status(200).send("Test succeeded");
})

app.post('/login', async (req, res) => {
    //create a new instance of the required classes
    const mongo = new MongoDatabase();
    scraper = new urlScraper();
    const encryptor = new Encryptor();

    //decrypt the data
    const encryptedurl = req.body.encryptedLink;
    const url = encryptor.decrypt(encryptedurl);
    
    //change the header to allow all origins, NEEDS TO BE CHANGED TO ALLOW ONLY THE FRONTEND URL
    res.header("Access-Control-Allow-Origin", "*");

    //check if the url is valid, otherwise send an error
    if (!scraper.checkValidUrl(url)) return res.status(400).send("Invalid URL");
 
    //get cardnumber from url
    const cardNumber = url.split("/").pop();

    //get user by cardnumber
    const personFound = await mongo.getOnedocumentByFilter({cardNumber: cardNumber}, mongo.dbStructure.UserData.dbName, mongo.dbStructure.UserData.users);

    //check if user exists and is verified, otherwise check if the cardnumber is valid
    if (personFound && personFound.verified) {
        const dbName = mongo.dbStructure.UserData.dbName;
        const rolesCollection = mongo.dbStructure.UserData.roles;
        const typesCollection = mongo.dbStructure.UserData.types;

        //get type and role by id
        const typeObject = await mongo.getOnedocumentByFilter({_id: personFound.type}, dbName, typesCollection);
        const roleObject = await mongo.getOnedocumentByFilter({_id: personFound.role}, dbName, rolesCollection);
        const type = typeObject.type;
        const role = roleObject.role;

        //send data to frontend
        const dataToBeSend = {
            firstName: personFound.firstName, 
            lastName: personFound.lastName, 
            id: personFound.studentNumber,
            type: type,
            role: role
        }

        //encrypt the data and send it to the frontend
        const encryptedObject = encryptor.encryptObject(dataToBeSend);

        return res.status(297).send(encryptedObject); // voor verwijzing naar persoonlijke pagina
    }

    if (personFound && !personFound.verified) {
        return res.status(296).send("User not verified");
    }

    //Find the cardnumber on the website
    const page = await scraper.getPage(url);
    const cardNumberFound = await scraper.findElement(page, scraper.noCardNumberXPath);
    
    //check if cardnumber is found, otherwise send an error
    if ((cardNumberFound == scraper.cardNotFoundMessage) || (cardNumberFound == scraper.falseCardMessage)) {
        await scraper.browser.close();
        return res.status(404).send("Card not found or invalid card number.");
    } else {

        //check if the cardnumber is a student or a prof
        const studentFound = await scraper.findElement(page, scraper.studentXPath);
        const profFound = await scraper.findElement(page, scraper.profXPath);

        console.log("Student Found" + studentFound);

        //if the cardnumber is a student, check if the student is from Brugge
        if (studentFound == "Student") {
            const placeFound = await scraper.findElement(page, scraper.locationXPath);
            await scraper.browser.close();

            console.log("Place Found" + placeFound);

            //check if the student is from Brugge, otherwise send an error
            if (placeFound == "Kortrijk") { //Needs to be changed to Brugge
                return res.status(299).send(""); //Voor verwijzing naar registratiepagina
            } else {
                return res.status(401).send("Not a Valid Student or Prof"); //Needs to be changed to Brugge and for Error message
            }

        //if the cardnumber is a prof, send a response
        } else if (profFound == "Personeelslid") {
            await scraper.browser.close();
            return res.status(298).send("Prof found") //Voor verwijzing naar registratiepagina

        //if the cardnumber is not a student or a prof, send an error
        } else {
            await scraper.browser.close();
            return  res.status(401).send("Not a Valid Student or Prof");
        }
    }
})

app.get('/registrations', (req, res) => {
    //create a new instance of the required classes
    const file = "./storage/StudentList.xlsx";
    const parser = new excelParser(file);
    const encryptor = new Encryptor();

    //change the header to allow all origins, NEEDS TO BE CHANGED TO ALLOW ONLY THE FRONTEND URL
    res.header("Access-Control-Allow-Origin", "*");

    //get all registrations from the excel file, remove the students not from Brugge, give me only the names and send them to the frontend
    const registrations = parser.giveAllRegistrationsInJSON();
    const bruggeRegistrations = parser.removeAllRegistrationNotFromBrugge(registrations);
    const names = parser.giveTheNamesFromAllRegistrations(bruggeRegistrations);

    //encrypt the data and send it to the frontend
    const encryptedObject = encryptor.encryptObject(names);

    return res.send(encryptedObject);
})

app.post('/registrations', async (req, res) => {
    const file = "./storage/StudentList.xlsx";
    const parser = new excelParser(file);
    const mongo = new MongoDatabase();

    //get data from the request
    const cardNumber = req.body.cardNumber;
    const role= req.body.role;
    const type = req.body.type;

    //Get all registrations from the excel file
    const registrations = parser.giveAllRegistrationsInJSON();
    const registeredPerson = req.body.person;
    const personFoundInExcel = parser.findPersonInRegistrations(registeredPerson, registrations);
    
    // if person is found in the excel file, add the person to the database
    if (personFoundInExcel) {
        const userObject = await mongo.createUserDocument(personFoundInExcel, role, type, cardNumber);
        const insertResponse = await mongo.insertDocument(userObject, mongo.dbStructure.UserData.dbName, mongo.dbStructure.UserData.users);

        // if the person is added to the database, create a token and send an email to the person
        if (insertResponse.acknowledged) {
            try {
                //get user by id
                const user = await mongo.getOnedocumentByFilter({_id: insertResponse.insertedId}, mongo.dbStructure.UserData.dbName, mongo.dbStructure.UserData.users);

                //check if user exists, otherwise send an error
                if (!user) return res.status(404).send('User Could not be found');
                
                //create token and add it to the user
                const token = cryptor.createToken();
                let tokenAdded = await mongo.updateDocument({_id: user._id}, {$set: {token: token}}, mongo.dbStructure.UserData.dbName, mongo.dbStructure.UserData.users);

                //check if token has been added, otherwise send an error
                if (!tokenAdded.acknowledged) return res.status(500).send('Token could not be added');
        
                //send email to user
                const message = `${process.env.BASE_URL}/user/verify/${user.cardNumber}/${token}`;
                await sendEmail(user.email, "Verify Email", message);
        
                return res.status(201).send("An Email sent to your account please verify");
            } catch (error) {
                console.log(error);
                return res.status(500).send('Something went wrong');
            } 
            
        } else {
            return res.status(500).send("Person could not be added to the database");
        }
    } else {
        return res.status(404).send("Person not found");
    }
})

app.get("/started", (req, res) => {
    res.status(200);
    res.send("Server is running");
})

app.get("/user/verify/:cardNumber/:token", async (req, res) => {
    try {
        const mongo = new MongoDatabase();
        const dbName = mongo.dbStructure.UserData.dbName;
        const usersCollection = mongo.dbStructure.UserData.users;
        const cardnumber = req.params.cardNumber;

        //get user and token by cardnumber
        const user = await mongo.getOnedocumentByFilter({cardNumber: cardnumber}, dbName, usersCollection);
        const token = user.token;

        //check if user and token exist, otherwise send an error
        if (!token) return res.status(404).send('Token Could not be found');

        //check if token is the same as the token in the url, otherwise send an error
        if (token !== req.params.token) return res.status(401).send('Invalid Token');

        //update userstatus to verified
        let verified = await mongo.updateDocument({_id: user._id}, {$set: {verified: true}}, dbName, usersCollection); 

        //check if userstatus has been updated, otherwise send an error
        if (!verified.acknowledged) return res.status(500).send('User could not be verified');

        res.status(200).send('User has been verified');
    } catch (error) {
        console.log(error);
        res.status(500).send('Something went wrong');
    }
})

app.post('/opendoor', async (req,res)=> {   
    //wait for 2 seconds then send a response
    setTimeout(() => {
        return res.status(200).send("Door opened");
    }, 2000); 
})

app.get('/rooms', async (req, res) => {
    const mongo = new MongoDatabase();
    const dbName = mongo.dbStructure.RoomsData.dbName;
    const roomsCollection = mongo.dbStructure.RoomsData.rooms;
    const rooms = await mongo.getAllDocuments(dbName, roomsCollection);
    res.status(200).send(rooms);
})

app.get('/reservations', async (req, res) => {
    const mongo = new MongoDatabase();
    const dbName = mongo.dbStructure.RoomsData.dbName;
    const reservationsCollection = mongo.dbStructure.RoomsData.reservations;
    const reservations = await mongo.getAllDocuments(dbName, reservationsCollection);
    res.status(200).send(reservations);
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports.app = app



