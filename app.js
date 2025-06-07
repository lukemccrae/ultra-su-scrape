// const fs = require('fs');
// const data = fs.readFileSync('racelist-deduped.json', 'utf8');
// const arr = JSON.parse(data);
// console.log(arr.length);

// de-duplicate the racelist copy file
import fs from 'fs/promises';

async function dedupe() {
  const races = JSON.parse(await fs.readFile('racelistcopy.json', 'utf8'));
  const seen = new Map();

  for (const race of races) {
    // Only keep those with a website
    if (!race.website) continue;

    // Create a composite key
    const key = `${race.name}|${race.date}|${race.location}`.toLowerCase();

    // Optionally: keep the one with the most images (or just the first)
    if (!seen.has(key)) {
      seen.set(key, race);
    } else {
      const existing = seen.get(key);
      if ((race.images?.length || 0) > (existing.images?.length || 0)) {
        seen.set(key, race);
      }
    }
  }

  // Convert to array and remove images property
  const deduped = [...seen.values()].map(({ images, ...rest }) => rest);

  await fs.writeFile('racelist-deduped.json', JSON.stringify(deduped, null, 2));
  console.log(`Wrote ${deduped.length} deduplicated events (images removed).`);
}

dedupe();

