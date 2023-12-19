// var anchorTags = document.querySelectorAll('td[title="register"] a');

// // Array to store href values
// var hrefValues = {};

// // Iterate through anchor tags and extract href values
// anchorTags.forEach(function (anchor) {
//   hrefValues.push(anchor.getAttribute("href"));
// });

// console.log(hrefValues);

const json = {
  "29": "Crown King Scramble",
  "99": "Calico Trail Run",
  "104": "Bigfoot Snowshoe Festival",
  "111": "Pemberton Trail",
  "119": "Moab Red Hot Ultra",
  "133": "Old Pueblo Endurance Runs",
  "168": "Leona Divide",
  "177": "Collegiate Peaks Trail Run",
  "195": "Red Mountain",
  "1414": "Across the Years",
  "1428": "Coyote Two Moon",
  "1443": "Zane Grey Highline Trail Runs",
  "1930": "Mesquite Canyon",
  "2178": "Oriflamme",
  "2349": "Crystal Cove Trail Run",
  "2490": "Desert Solstice",
  "2538": "Coldwater Rumble",
  "2539": "San Tan Scramble",
  "2697": "Amasa",
  "2712": "Bootlegger - Previously Blood, Sweat, & Beers",
  "2720": "Salt Flats Endurance Runs",
  "3070": "Sierra Vista Trail Runs",
  "3286": "Elephant Mountain",
  "3438": "Beyond Limits Ultra",
  "3496": "Paramount Ranch Trail Runs",
  "3717": "Sinister Night Runs",
  "4009": "Jackpot Ultras",
  "4023": "Black Canyon Ultras",
  "4040": "Sean O'Brien 100K/50M/50K/26.2/30K",
  "4105": "Old West Trail Runs",
  "4153": "Behind the Rocks Ultra",
  "4174": "Ultramaraton Baja Trail 50 & Carrera 30k",
  "4603": "DRT Spring Series Pass",
  "4705": "Ahmanson Trails 6k & 12k",
  "4730": "Sycamore Canyon",
  "5044": "Dirty December Trail Run",
  "5134": "AZT Vail Scramble",
  "5166": "Singletrack Stampede",
  "5193": "San Diego Pirate's Cove 6/12/24 hour Run/Hike",
  "5199": "Santa Monica Trail Runners Club",
  "5213": "La Cuesta Ranch Trail Run",
  "5217": "Trail Trashed Ultra",
  "5311": "Whiskey Basin Trail Runs",
  "5347": "Deja Vu",
  "5478": "Dam Good Run",
  "5840": "Snakebite",
  "5841": "Stoneman Trail Run",
  "5903": "Badwater Salton Sea",
  "5993": "AZT Oracle Rumble",
  "6319": 'Mt. Wilson "Make it a Double"',
  "6513": "Insomniac Night Trail Run Series",
  "7810": "Arches Ultra",
  "7983": "Canyonlands Half Marathon and 5 Mile",
  "7984": "Thelma and Louise Marathon and Half",
  "8550": "Run4Kids 48 Hour Running Party",
  "8625": "Resolution Run",
  "8626": "Revolution Run",
  "9519": "4 Hours and 20 Minutes of Joshua Tree",
  "9758": "Antelope Canyon X Half Marathon",
  "9773": "South Mountain Half Marathon",
  "10882": "The Ranch 50k",
  "10931": "Flat Top Mesa Endurance Run",
  "11089": "Run with the Burros",
  "12391": "Copper Corridor",
  "12666": "Streakers Marathon",
  "12786": "Cocodona",
  "13294": "Adventure Fest at 18 Road",
  "13647": "Desert Highlights Trail Running Camp",
  "14121": "Sky Pilots club membership",
  "14689": "Red Rocks of Sedona Trail Races",
  "14751": "The Boney Half Marathon & 7k Trail",
  "14793": "Bonneville Backyard Ultra",
  "15073": "Placerita Canyon Trail Runs",
  "15127": "Vegas Polar Plunge 5k",
  "15282": "Happy Trails Marathon",
  "15377": "Whiting Ranch Trail Races",
  "15592": "Joshua Tree Traverse 60K",
  "15647": "La Jornada de las Quebradas",
  "15752": "J Treequinox",
  "15860": "O'Neill Park Trail Races",
  "15892": "Shenanigains",
  "15917": "Machete Trail Madness 100k",
  "16093": "Saguaro Showdown",
  "16486": "NATRO@SOBOBA",
  "16491": "Capitan Mountain 34 Hour",
  "16555": "The Bootleg Boogie",
  "17023": "McDowell Mountain Marathon Trail Run",
  "17052": "Cappy's Backyard Ultra",
  "17110": "McCoy Flats Trail Events",
  "17128": "Rudolph's Runderland Experience",
};
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
const eidValues = [29, 99]; // Add more eid values as needed

async function fetchPageData(eid) {
  try {
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();

    const url = `https://ultrasignup.com/register.aspx?eid=${eid}`
    console.log(url)

    await page.goto(url);

    // this was waiting for 30 seconds causting timeout
    // await page.waitForNavigation();

    await page.click('#ContentPlaceHolder1_EventInfoThin1_btnRegister');

    const html = await page.content();

    // const response = await axios.get(
    //   `https://ultrasignup.com/register.aspx?eid=${eid}`
    // );
    // const html = response.data;
    const $ = cheerio.load(html);

    // Perform functions on the retrieved HTML
    const title = $("title").text();

    const events = []

    // Perform other operations or extract specific data
    // For example, find elements by class and get their text content
    $(".SmallButton").each((index, element) => {
      const buttonPriceContent = $(element).text();
      const stripWhiteSpace = buttonPriceContent.replace(/\s{2,}/g, " ")
      const distance = stripWhiteSpace.split('-')[0]
      events.push({ distance: distance, cost: stripWhiteSpace.replace(/ Registration /gi, '') })

      // Perform actions with the textContent here
    });

    // Return or perform any actions based on the retrieved data
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
