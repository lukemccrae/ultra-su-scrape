import cheerio from "cheerio";
import puppeteer from 'puppeteer';

const miniSet = {
  "29": "Crown King Scramble",
  "99": "Calico Trail Run",
  "104": "Bigfoot Snowshoe Festival",
  "111": "Pemberton Trail",
  "119": "Moab Red Hot Ultra",
};

// Array of eid values
const eidValues = [29, 99];

async function fetchPageData(eid) {
  try {
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();

    const url = `https://ultrasignup.com/register.aspx?eid=${eid}`
    console.log(url)

    await page.goto(url);

    // this was waiting for 30 seconds causting timeout
    // await page.waitForNavigation();

    // click on register button opening modal
    await page.click('#ContentPlaceHolder1_EventInfoThin1_btnRegister');

    const html = await page.content();

    const $ = cheerio.load(html);

    // Perform functions on the retrieved HTML
    const title = $("title").text();

    const events = []

    // for every event in the modal push info to events array
    $(".SmallButton").each((index, element) => {
      const buttonPriceContent = $(element).text();
      const stripWhiteSpace = buttonPriceContent.replace(/\s{2,}/g, " ")
      const distance = stripWhiteSpace.split('-')[0]
      events.push({ distance: distance, cost: stripWhiteSpace.replace(/ Registration /gi, '') })

    });

    return { eid, title, events };
  } catch (error) {
    console.error(`Error fetching data for eid ${eid}:`, error.message);
    return { eid, error: error.message };
  }
}

// Process all eid values
async function scrapePages() {
  const results = [];
  for (const eid of eidValues) {
    const data = await fetchPageData(eid);
    results.push(data);
  }
  // Process or log the collected results here
  console.log("Results:", JSON.stringify(results, null, 2));
}

// Initiate the scraping process
scrapePages();
