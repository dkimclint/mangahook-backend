import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Cache
let chapterCache = { data: [], timestamp: 0 };
const CACHE_DURATION = 5 * 60 * 1000; // 5 min

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Puppeteer function to fetch chapters
async function fetchChapters() {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://weebrook.com/toon/the-player-hides-his-past-manhwa/', { waitUntil: 'networkidle2' });

    await page.waitForSelector('li.wp-manga-chapter a', { timeout: 15000 });

    const chapters = await page.evaluate(() =>
      Array.from(document.querySelectorAll('li.wp-manga-chapter a'))
        .map(el => ({ title: el.textContent.trim(), link: el.href }))
        .filter(ch => ch.title && ch.link)
    );

    chapters.reverse(); // latest first
    chapterCache.data = chapters;
    chapterCache.timestamp = Date.now();
    console.log(`✅ Chapters cache updated (${chapters.length} chapters)`);

  } catch (err) {
    console.error('⚠️ Failed to fetch chapters:', err.message);
  } finally {
    if (browser) await browser.close();
  }
}

// Puppeteer function to fetch images of a chapter (lazy-load fix)
async function fetchChapterImages(url) {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for images container
    await page.waitForSelector('.reading-content img', { timeout: 15000 });

    // Get all images, including lazy-loaded
    const images = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.reading-content img'))
        .map(img => img.getAttribute('data-src') || img.src)
        .filter(src => src)
    );

    return images;
  } catch (err) {
    console.error('⚠️ Failed to fetch chapter images:', err.message);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

// Initialize cache and refresh periodically
(async () => {
  await fetchChapters();
  setInterval(fetchChapters, CACHE_DURATION);
})();

// Routes
app.get('/', (req, res) => res.send('🟢 Mangahook Backend is running'));
app.get('/chapters', (req, res) => res.json({ chapters: chapterCache.data }));

app.get('/chapter-images', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Chapter URL required' });

  const images = await fetchChapterImages(url);
  if (images.length === 0) return res.status(500).json({ error: 'No images found' });

  res.json({ images });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
