import puppeteer from "puppeteer";
import cheerio from "cheerio";
import fs from "fs/promises";

const BLOG_URL = "https://verde33.blogspot.com/";
const OUTPUT_FILE = "verde33_post_urls.json";

async function expandAllArrows(page) {
  let lastCount = 0;
  let loops = 0;
  while (true) {
    // Click all collapsed arrows
    const collapsedCount = await page.$$eval(
      '.archivedate .zippy:not(.toggle-open)',
      nodes => nodes.length
    );
    if (collapsedCount === 0) break;

    // Click all collapsed arrows
    await page.$$eval('.archivedate .zippy:not(.toggle-open)', nodes => {
      nodes.forEach(node => node.click());
    });

    // Wait longer for DOM update as archive grows
    await page.waitForTimeout(500 + loops * 100); 
    loops++;

    // Optional: stop if no new posts appear after several loops (in case of stuck DOM)
    const postCount = await page.$$eval('ul.posts li a', nodes => nodes.length);
    if (postCount === lastCount && loops > 10) break;
    lastCount = postCount;
  }
}

async function getAllPostUrls() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(BLOG_URL, { waitUntil: "domcontentloaded" });

  // Expand all archive nodes
  await expandAllArrows(page);

  // Wait for all post links to be visible
  await page.waitForSelector('ul.posts li a');
  await page.waitForTimeout(1000); // extra wait to ensure DOM finished

  // Get page content and parse with Cheerio
  const html = await page.content();
  const $ = cheerio.load(html);

  // Get only actual post links
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