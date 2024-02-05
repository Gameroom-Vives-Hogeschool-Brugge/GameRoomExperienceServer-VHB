module.exports = class Scraper {
  puppeteer = require('puppeteer');

  constructor() {
    this.geenKaartnummerXPath = "/html/body/div[1]/div[2]/div/div[1]",
    this.studentXPath ='/html/body/div[1]/div[2]/div/div/div/div/div[1]/div[6]/div[2]/div/div/div/div/span'
    this.page = null;
  }

  scrapeWebsite = async (url) => {
        let studentFound = false;

        const browser = await this.puppeteer.launch();
        this.page = await browser.newPage();
        await this.page.goto(url);

        const cardNumberFound = await this.checkValidCardNumber();
        if (cardNumberFound) {
            studentFound = await this.findStudent();
        }

        if (studentFound) {
            console.log("Student gevonden");
        } else {
            console.log("Student niet gevonden");
        }
        await browser.close();
    }

    checkValidCardNumber = async () => {
        const elements = await this.page.$x(this.geenKaartnummerXPath)
            
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

    findStudent = async () => {
        const elements = await this.page.$x(this.studentXPath)
                
        if (elements.length > 0) {
            const element = elements[0];
            const textContentProp = await element.getProperty('textContent');
            const textContent = await textContentProp.jsonValue();
            console.log(textContent);
            return true;
        }
        return false;
    }
}