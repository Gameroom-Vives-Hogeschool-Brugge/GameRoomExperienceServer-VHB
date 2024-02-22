const express = require('express')
var bodyParser = require('body-parser')
const urlScraper = require('./scraper.js');
const excelParser = require('./excelParser.js');
const db = require('./database.js');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
const sendEmail = require('./utils/email');
const dotenv = require("dotenv");

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

app.post('/login', async (req, res) => {
    const database = new db();
    scraper = new urlScraper();
    const url = req.body.link;
    res.header("Access-Control-Allow-Origin", "*");

    if (!scraper.checkValidUrl(url)) return res.status(400).send("Invalid URL");
 
    const cardNumber = url.split("/").pop();
    const personFound = database.searchWholeDatabase(cardNumber);

    if (personFound && personFound.verified == true) return res.status(297).send(
        {
            firstName: personFound.firstName, 
            lastName: personFound.lastName, 
            id: personFound.studentNumber,
            type: personFound.type,
            role: personFound.role
        }); // voor verwijzing naar persoonlijke pagina

    const page = await scraper.getPage(url);
    const cardNumberFound = await scraper.findElement(page, scraper.noCardNumberXPath);
    
    if ((cardNumberFound == scraper.cardNotFoundMessage) || (cardNumberFound == scraper.falseCardMessage)) {
        await scraper.browser.close();
        return res.status(404).send("Card not found or invalid card number.");
    } else {
        const studentFound = await scraper.findElement(page, scraper.studentXPath);
        const profFound = await scraper.findElement(page, scraper.profXPath);

        if (studentFound == "Student") {
            const placeFound = await scraper.findElement(page, scraper.locationXPath);
            await scraper.browser.close();

            if (placeFound == "Kortrijk") { //Needs to be changed to Brugge
                return res.status(299).send(cardNumber); //Voor verwijzing naar registratiepagina
            } else {
                return res.status(401).send("Not a Valid Student or Prof"); //Needs to be changed to Brugge and for Error message
            }
        } else if (profFound == "Personeelslid") {
            await scraper.browser.close();
            return res.status(298).send("Prof found") //Voor verwijzing naar registratiepagina
        } else {
            await scraper.browser.close();
            return  res.status(401).send("Not a Valid Student or Prof");
        }
    }
})

app.get('/registrations', (req, res) => {
    const file = "./storage/StudentList.xlsx";
    parser = new excelParser(file);
    const registrations = parser.giveAllRegistrationsInJSON();
    const bruggeRegistrations = parser.removeAllRegistrationNotFromBrugge(registrations);
    const names = parser.giveTheNamesFromAllRegistrations(bruggeRegistrations);

    return res.header("Access-Control-Allow-Origin", "*").send(names);
})

app.post('/registrations', async (req, res) => {
    const file = "./storage/StudentList.xlsx";
    const parser = new excelParser(file);
    const database = new db();

    const registrations = parser.giveAllRegistrationsInJSON();
    const registeredPerson = req.body.person;
    const personFound = parser.findPersonInRegistrations(registeredPerson, registrations);
    
    if (personFound) {
        const succes = database.addPerson(personFound, database.types.students);

        if (succes) {
            try {
                let token = crypto.randomBytes(32).toString('hex');
                let user = database.findPerson(personFound.Student, "studentNumber", {
                    fileName: database.studentsFile,
                    personType: database.types.students
                });
                if (!user) return res.status(404).send('User Could not be found');
        
                let tokenAdded = database.addToken(user, token);
                if (!tokenAdded) return res.status(500).send('Token could not be added');
        
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
        const database = new db();
        let token = database.findToken(req.params.cardNumber);
        if (!token) return res.status(404).send('Token Could not be found');

        if (token !== req.params.token) return res.status(401).send('Invalid Token');

        let verified = database.verifyUser(req.params.cardNumber);
        if (!verified) return res.status(500).send('User could not be verified');

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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports.app = app



