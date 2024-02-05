const express = require('express')
var bodyParser = require('body-parser')
const urlScraper = require('./scraper.js');
const app = express()


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const port = 3000

app.post('/login', async (req, res) => {
        const url = req.body.link;
        scraper = new urlScraper();
        await scraper.scrapeWebsite(url);
        res.send('Got a POST request')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})