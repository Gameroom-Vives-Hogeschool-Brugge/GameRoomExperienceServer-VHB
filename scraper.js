module.exports = class Scraper {
  puppeteer = require('puppeteer');

  constructor() {
    this.geenKaartnummerXPath = "/html/body/div[1]/div[2]/div/div[1]",
    this.studentXPath ='/html/body/div[1]/div[2]/div/div/div/div/div[1]/div[6]/div[2]/div/div/div/div/span'
    this.locationXPath = '/html/body/div[1]/div[2]/div/div/div/div/div[2]/div[1]/div[2]/span'
    this.browser = undefined;
  }

  getPage = async (url) => {
    this.browser = await this.puppeteer.launch();
    const page = await this.browser.newPage();

    await page.goto(url);

    return page;
  }

  scrapeWebsite = async (url) => {
        let studentFound = false;

        const page = await this.getPage(url);

        const cardNumberFound = await this.checkValidCardNumber(page);
        if (cardNumberFound) {
            studentFound = await this.findElement(page, this.studentXPath);
        } else {
            await this.browser.close();
        }

        if (studentFound) {
            await this.browser.close();
            return true;
        } else {
            await this.browser.close();
            return false;
        }
    }

    checkValidCardNumber = async (page) => {
        const elements = await page.$x(this.geenKaartnummerXPath)
            
        if (elements.length > 0) {
            const element = elements[0];
            const textContentProp = await element.getProperty('textContent');
            const textContent = await textContentProp.jsonValue();

            if (textContent.includes("Het kaartnummer is niet juist.")) {
                return false;
            } else {
                return true;
            }
        }
    }

    findElement= async (page, xpath) => {
        const elements = await page.$x(xpath)
        
        if (elements.length > 0) {
            const element = elements[0];
            const textContentProp = await element.getProperty('textContent');
            const textContent = await textContentProp.jsonValue();
            return textContent;
        }
    }
}