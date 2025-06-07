import cheerio from "cheerio";
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const START_DID = 127118;
const MIN_DID = 110000; // set a reasonable lower bound for efficiency
const OUTPUT_FILE = "racelist.json";

// Helper to sleep between requests
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to extract lat/lng from the Google Maps href
function extractLatLngFromHref(href) {
  try {
    const url = new URL(href);
    const q = url.searchParams.get('q');
    if (q) {
      const [lat, lng] = q.split(',').map(s => parseFloat(s.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
  } catch (e) {}
  return { lat: null, lng: null };
}

async function fetchRaceByDid(did) {
  const url = `https://ultrasignup.com/register.aspx?did=${did}`;
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();
  try {
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 20000});
    const html = await page.content();
    const $ = cheerio.load(html);

    // If there's no date, it's not a valid event page
    const dateStr = $('#lblDate').text().trim();
    if (!dateStr) {
      await browser.close();
      return null;
    }

    // Name (h1.event-title)
    const name = $('h1.event-title').text().trim();

    // Location (the text content of .address_link)
    let location = '';
    let lat = null;
    let lng = null;
    const locationLink = $('a.address_link');
    if (locationLink.length > 0) {
      location = locationLink.text().trim();
      const href = locationLink.attr('href');
      if (href) {
        const coords = extractLatLngFromHref(href);
        lat = coords.lat;
        lng = coords.lng;
      }
    }

    // Event banner
    const banner = $('#ContentPlaceHolder1_EventInfoThin1_imgEventBanner').attr('src') || null;

    // Event start times
    const startTimes = [];
    $('.widget-wrap ul.link-list li').each((i, el) => {
      const name = $(el).find('.times_name, .tsimes_name').text().trim();
      const time = $(el).find('.times_time').text().trim();
      if (name && time) startTimes.push({ name, time });
    });

    // Website link
    const website = $('#ContentPlaceHolder1_EventInfoThin1_hlWebsite').attr('href') || null;

    // Carousel images (array of image links from data-src)
    const images = [];
    $('ul#lightSlider li').each((i, el) => {
      const src = $(el).attr('data-src');
      if (src) images.push(src);
    });

    // Link to ultrasignup (the page url)
    const ultrasignup_url = url;

    // Events (distances/costs)
    // Not always present, but let's keep the logic
    const events = [];
    $(".SmallButton").each((index, element) => {
      const buttonPriceContent = $(element).text();
      const stripWhiteSpace = buttonPriceContent.replace(/\s{2,}/g, " ");
      const distance = stripWhiteSpace.split('-')[0].trim();
      events.push({ distance, cost: stripWhiteSpace.replace(/ Registration /gi, '').trim() });
    });

    // Compose result
    const result = {
      did,
      name,
      location,
      lat,
      lng,
      date: dateStr,
      banner,
      website,
      startTimes,
      events,
      images,
      ultrasignup_url
    };

    await browser.close();
    return result;
  } catch (error) {
    await browser.close();
    // If the page 404s or is otherwise unavailable, that's fine.
    return null;
  }
}

async function appendRaceToFile(race) {
  // Read existing file or start with empty array
  let races = [];
  try {
    const data = await fs.readFile(OUTPUT_FILE, 'utf-8');
    races = JSON.parse(data);
    if (!Array.isArray(races)) races = [];
  } catch (e) {
    // file does not exist, will create new
    races = [];
  }
  races.push(race);
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(races, null, 2));
}

async function scrapeAllFutureRaces() {
  let did = START_DID;
  let misses = 0;

  while (did >= MIN_DID && misses < 50) { // Stop after 50 consecutive misses (for efficiency)
    console.log(`Checking DID ${did}`);
    const race = await fetchRaceByDid(did);
    if (race) {
      await appendRaceToFile(race);
      console.log(`Added: ${race.name} (${race.date})`);
      misses = 0;
    } else {
      misses += 1;
    }
    did -= 1;
    await sleep(700); // polite delay
  }

  console.log(`Done. Scraped up to DID ${did + 1}`);
}

scrapeAllFutureRaces();