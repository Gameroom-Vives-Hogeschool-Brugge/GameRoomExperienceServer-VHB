const express = require('express')
var bodyParser = require('body-parser')
const puppeteer = require('puppeteer');
const app = express()


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const port = 3000

app.post('/login', (req, res) => {
        const url = req.body.link;
        scrapeWebsite(url);
        res.send('Got a POST request')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

const scrapeWebsite = (url) => {
    (async () => {
        let studentFound = false;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);

        const cardNumberFound = await checkValidCardNumber(page);
        if (cardNumberFound) {
            studentFound = await findStudent(page);
        }

        if (studentFound) {
            console.log("Student gevonden");
        } else {
            console.log("Student niet gevonden");
        }
        await browser.close();
    })();
}

const checkValidCardNumber = async (page) => {
    const geenKaartnummer = "/html/body/div[1]/div[2]/div/div[1]"
    const elements = await page.$x(geenKaartnummer)
        
    if (elements.length > 0) {
        const element = elements[0];
        const textContentProp = await element.getProperty('textContent');
        const textContent = await textContentProp.jsonValue();
        if (textContent.includes("Het kaartnummer is niet juist.")) {
            console.log("Het kaartnummer is niet juist.");
            return false;
        } else {
            console.log("Kaartnummer gevonden")
            return true;
        }
    }
}

const findStudent = async (page) => {
    const studentSelector = '/html/body/div[1]/div[2]/div/div/div/div/div[1]/div[6]/div[2]/div/div/div/div/span';
    const elements = await page.$x(studentSelector)
            
    if (elements.length > 0) {
        const element = elements[0];
        const textContentProp = await element.getProperty('textContent');
        const textContent = await textContentProp.jsonValue();
        console.log(textContent);
        return true;
    }
    return false;
}