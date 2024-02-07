const express = require('express')
var bodyParser = require('body-parser')
const urlScraper = require('./scraper.js');
const excelParser = require('./excelParser.js');
const app = express()


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const port = 3000

app.post('/login', async (req, res) => {
    const url = req.body.link;
    scraper = new urlScraper();
    const studentFound = await scraper.scrapeWebsite(url);
    res.send(studentFound);
})

app.get('/registrations', (req, res) => {
    const file = "./storage/StudentList.xlsx";
    parser = new excelParser(file);
    const registrations = parser.giveAllRegistrationsInJSON();
    const bruggeRegistrations = parser.removeAllRegistrationNotFromBrugge(registrations);
    const names = parser.giveTheNamesFromAllRegistrations(bruggeRegistrations);

    res.send(names);
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})



