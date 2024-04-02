module.exports = class Scraper {
  puppeteer = require("puppeteer");

  constructor() {
    (this.noCardNumberXPath = "/html/body/div[1]/div[2]/div/div[1]"),
      (this.studentXPath =
        "/html/body/div[1]/div[2]/div/div/div/div/div[1]/div[6]/div[2]/div/div/div/div/span");
    this.locationXPath =
      "/html/body/div[1]/div[2]/div/div/div/div/div[2]/div[1]/div[2]/span";
    this.profXPath =
      "/html/body/div[1]/div[2]/div/div/div/div/div/div[6]/div[2]/div/div/div/div/span";
    this.cardNotFoundMessage = "Kaart niet gevonden. ";
    this.falseCardMessage = "Het kaartnummer is niet juist. ";
    this.serverErrorMessage = "Er is iets mis gegaan, probeer later opnieuw. ";
    this.browser = undefined;
  }

  getPage = async (url) => {
    this.browser = await this.puppeteer.launch();
    const page = await this.browser.newPage();

    await page.goto(url);

    return page;
  };

  findElement = async (page, xpath) => {
    const elements = await page.$x(xpath);

    if (elements.length > 0) {
      const element = elements[0];
      const textContentProp = await element.getProperty("textContent");
      const textContent = await textContentProp.jsonValue();
      return textContent;
    } else {
      return false;
    }
  };

  checkValidUrl(url) {
    if (url.includes("https://kaart.associatie.kuleuven.be/")) {
      return true;
    } else {
      return false;
    }
  }
};
