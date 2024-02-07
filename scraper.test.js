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
    expect(scraper).toBeInstanceOf(urlScraper);
});

test("check if scrapeWebsite works", async () => {
    expect.assertions(1);
    const studentFound = await scraper.scrapeWebsite(studenKortrijkUrl);
    expect(studentFound).toBe(true);
});

test("check if the findPage works", async () => {
    expect.assertions(1);
    const pageFound = await scraper.getPage(studenKortrijkUrl);
    
    expect(pageFound).not.toBe(undefined);
});

test("check if the findStudent works", async () => {
    expect.assertions(1);
    const pageFound = await scraper.getPage(studenKortrijkUrl);
    expect.assertions(1);
    const studentFound = await scraper.findElement(pageFound, scraper.studentXPath);
    expect(studentFound).toBe("Student");
});


