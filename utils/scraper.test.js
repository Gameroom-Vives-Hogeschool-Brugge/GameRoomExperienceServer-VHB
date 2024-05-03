let urlScraper = undefined;
let scraper = undefined;
const dotenv = require("dotenv");

dotenv.config({
    path: "./keys.env"
});

let studenKortrijkUrl = process.env.STUDENT_KORTRIJK_URL;

beforeAll(() => {
    urlScraper = require('./scraper');
    scraper = new urlScraper();
});

test("check if the scraper class gets created", () => {
    expect.assertions(1);
    expect(scraper).toBeInstanceOf(urlScraper);
});

test("check if the findPage works", async () => {
    expect.assertions(1);
    const pageFound = await scraper.getPage(studenKortrijkUrl);
    
    expect(pageFound).not.toBe(undefined);

    scraper.browser.close();

});

test("check the findElement function with allXpath's", async () => {
    expect.assertions(2);
    const pageFound = await scraper.getPage(studenKortrijkUrl);

    const locationFound = await scraper.findElement(pageFound, scraper.locationXPath);
    expect(locationFound).toBe("Kortrijk");

    const studentFound = await scraper.findElement(pageFound, scraper.studentXPath);
    expect(studentFound).toBe("Student");

    scraper.browser.close();
});

test("check the findElement function with noCardNumberXPath and false card number", async () => {
    expect.assertions(1);
    const pageFound = await scraper.getPage("https://kaart.associatie.kuleuven.be/0");

    const cardNumberFound = await scraper.findElement(pageFound, scraper.noCardNumberXPath);
    expect(cardNumberFound).toBe("Kaart niet gevonden. ");
    
    scraper.browser.close();
});

test("check the findElement function with noCardNumberXPath and wrong card number", async () => {
    expect.assertions(1);
    const pageFound = await scraper.getPage("https://kaart.associatie.kuleuven.be/6100014427322090");

    const cardNumberFound = await scraper.findElement(pageFound, scraper.noCardNumberXPath);
    expect(cardNumberFound).toBe("Het kaartnummer is niet juist. ");   

    scraper.browser.close();
});

test("test the checkValidUrl function", () => {
    expect.assertions(2);
    expect(scraper.checkValidUrl(studenKortrijkUrl)).toBe(true);
    expect(scraper.checkValidUrl("https://www.howest.be")).toBe(false);
});




