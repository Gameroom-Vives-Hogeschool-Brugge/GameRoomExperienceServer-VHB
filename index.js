const express = require('express')
var bodyParser = require('body-parser')
const urlScraper = require('./scraper.js');
const excelParser = require('./excelParser.js');
const db = require('./database.js');
const app = express();
const cors = require('cors');

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

    //console.log(bruggeRegistrations);

    //check if names are already in the database and remove them from the list
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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports.app = app



