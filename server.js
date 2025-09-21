import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const manhwaList = [
  {
    id: "1",
    title: "Demon Magic Emperor",
    url: "https://manhuaplus.com/manga/demon-magic-emperor01",
    image: "https://manhuaplus.com/path-to-cover.jpg"
  },
  {
    id: "2",
    title: "I Am The Fated Villain",
    url: "https://manhuaplus.com/manga/i-am-the-fated-villain",
    image: "https://manhuaplus.com/path-to-cover2.jpg"
  }
];

// Get manga list
app.get("/api/mangaList", (req, res) => {
  res.json({ mangaList });
});

// Get chapters
app.get("/api/manga/:id/chapters", async (req, res) => {
  const manga = manhwaList.find(m => m.id === req.params.id);
  if (!manga) return res.status(404).json({ error: "Manga not found" });

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(manga.url, { waitUntil: "networkidle2" });

    await page.waitForSelector(".page-content-listing.single-page", { timeout: 15000 });

    const chapters = await page.evaluate(() => {
      const list = [];
      document.querySelectorAll(".page-content-listing.single-page li a").forEach(a => {
        if(a.textContent && a.href) {
          list.push({ chapter: a.textContent.trim(), url: a.href });
        }
      });
      return list.reverse(); // newest first
    });

    await browser.close();

    if(chapters.length === 0) return res.status(404).json({ error: "No chapters found." });

    res.json({ chapters });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chapters." });
  }
});

// Get chapter images
app.get("/api/chapterImages", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Chapter URL required" });

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    await page.waitForSelector(".reading-content img", { timeout: 15000 });

    // Scroll slowly to load lazy images
    await page.evaluate(async () => {
      const distance = 400;
      const delay = 250;
      let scrolled = 0;
      const totalHeight = document.body.scrollHeight;
      while(scrolled < totalHeight){
        window.scrollBy(0, distance);
        scrolled += distance;
        await new Promise(r => setTimeout(r, delay));
      }
    });

    const images = await page.evaluate(() => {
      const imgs = [];
      document.querySelectorAll(".reading-content img").forEach(img => {
        const src = img.getAttribute("data-src") || img.src;
        if(src && !src.includes("thumbnail") && !src.includes("ads") && !src.includes("blank")) imgs.push(src);
      });
      return imgs;
    });

    await browser.close();

    if(images.length === 0) return res.status(404).json({ error: "No images found." });

    res.json({ images });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch images." });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
