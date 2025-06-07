import puppeteer from "puppeteer";
import cheerio from "cheerio";
import fs from "fs/promises";

const BLOG_URL = "https://verde33.blogspot.com/";
const OUTPUT_FILE = "verde33_post_urls.json";

// Recursively expand all collapsed arrows until none remain
async function expandAllArrows(page) {
  while (true) {
    // Find all visible collapsed arrows
    const collapsedArrows = await page.$$eval(
      '.archivedate .zippy:not(.toggle-open)',
      nodes => nodes.map(n => n.parentElement) // get <a class="toggle"> for click stability
    );
    if (collapsedArrows.length === 0) break;

    // Click them all
    await page.$$eval('.archivedate .zippy:not(.toggle-open)', (nodes) => {
      nodes.forEach(node => node.click());
    });

    // Wait for the DOM to update
    await page.waitForTimeout(300);
  }
}

async function getAllPostUrls() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(BLOG_URL, { waitUntil: "domcontentloaded" });

  // Expand all archive nodes (all years, all months, all nested arrows)
  await expandAllArrows(page);

  // Wait for all post links to be visible
  await page.waitForSelector('ul.posts li a');

  // Get page content and parse with Cheerio
  const html = await page.content();
  const $ = cheerio.load(html);

  // Get only actual post links, not year/month archive links
  const postUrls = [];
  $("ul.posts li a").each((i, el) => {
    const href = $(el).attr("href");
    if (href) postUrls.push(href);
  });

  await browser.close();
  return postUrls;
}

async function main() {
  const urls = await getAllPostUrls();
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(urls, null, 2));
  console.log(`Found ${urls.length} post URLs. Saved to ${OUTPUT_FILE}`);
}

main();