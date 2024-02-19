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
    console.log(req.body);
    res.header("Access-Control-Allow-Origin", "*");

    if (!scraper.checkValidUrl(url)) {

        res.status(400)
        res.send("Invalid URL");
        return;
    } 
 
    const cardNumber = url.split("/").pop();
    const personFound = database.searchWholeDatabase(cardNumber);

    if (personFound) {

        res.status(297); // voor verwijzing naar registratiepagina
        res.send(personFound);
        return;
    }

    const page = await scraper.getPage(url);
    const cardNumberFound = await scraper.findElement(page, scraper.noCardNumberXPath);
    
    if ((cardNumberFound == scraper.cardNotFoundMessage) || (cardNumberFound == scraper.falseCardMessage)) {
        res.status(404); //voor error bericht
        res.send("Card not found or invalid card number.");
        await scraper.browser.close();
        return;
    } else {
        const studentFound = await scraper.findElement(page, scraper.studentXPath);
        const profFound = await scraper.findElement(page, scraper.profXPath);

        if (studentFound == "Student") {
            const placeFound = await scraper.findElement(page, scraper.locationXPath);
            await scraper.browser.close();

            if (placeFound == "Kortrijk") { //Needs to be changed to Brugge
                res.status(299); //Voor verwijzing naar registratiepagina
                res.send(cardNumber);
            } else {
                res.status(401); //voor error bericht
                res.send("Not a Valid Student or Prof"); //Needs to be changed to Brugge
            }
        } else if (profFound == "Personeelslid") {
            await scraper.browser.close();
            res.status(298);
            res.send("Prof found"); //Voor verwijzing naar registratiepagina
        } else {
            await scraper.browser.close();
            res.status(401)
            res.send("Not a Valid Student or Prof");
        }
    }
})

app.get('/registrations', (req, res) => {
    const file = "./storage/StudentList.xlsx";
    parser = new excelParser(file);
    const registrations = parser.giveAllRegistrationsInJSON();
    const bruggeRegistrations = parser.removeAllRegistrationNotFromBrugge(registrations);
    const names = parser.giveTheNamesFromAllRegistrations(bruggeRegistrations);

    res.header("Access-Control-Allow-Origin", "*");
    res.send(names);
})

app.post('/registrations', (req, res) => {
    const file = "./storage/StudentList.xlsx";
    const parser = new excelParser(file);
    const database = new db();

    const registrations = parser.giveAllRegistrationsInJSON();
    const registeredPerson = req.body;
    console.log(registeredPerson)
    const personFound = parser.findPersonInRegistrations(registeredPerson, registrations);
    
    if (personFound) {
        const succes = database.addPerson(personFound, database.types.students);

        if (succes) {
            res.status(202);
        } else {
            res.status(500);
        }
    } else {
        res.status(404);
        res.send("Person not found");
    }

})

app.get("/started", (req, res) => {
    res.status(200);
    res.send("Server is running");
})

app.post("/email", async (req, res) => {
    try {
        const database = new db();
        let token = crypto.randomBytes(32).toString('hex');
        let user = database.searchWholeDatabase(req.body.cardNumber);
        if (!user) return res.status(404).send('User Could not be found');

        let tokenAdded = database.addToken(user, token);
        if (!tokenAdded) return res.status(500).send('Token could not be added');

        const message = `${process.env.BASE_URL}/user/verify/${user.cardNumber}/${token}`;
        await sendEmail(user.email, "Verify Email", message);

    res.send("An Email sent to your account please verify");
    } catch (error) {
        console.log(error);
        res.status(500).send('Something went wrong');
    }
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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports.app = app



