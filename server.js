import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Load manga list from JSON
const data = fs.readFileSync("./data/manga.json", "utf-8");
const mangaList = JSON.parse(data).mangaList;

// Get manga list
app.get("/api/mangaList", (req, res) => {
  res.json({ mangaList });
});

// Get chapters for a manga
app.get("/api/manga/:id/chapters", async (req, res) => {
  const manga = mangaList.find(m => m.id === req.params.id);
  if (!manga) return res.status(404).json({ error: "Manga not found" });

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(manga.url, { waitUntil: "networkidle2" });

    // Wait for chapters list
    await page.waitForSelector(".c-page-content .page-content-listing ul li a", { timeout: 15000 });

    const chapters = await page.evaluate(() => {
      const list = [];
      document.querySelectorAll(".c-page-content .page-content-listing ul li a").forEach(a => {
        list.push({
          chapter: a.textContent.trim(),
          url: a.href
        });
      });
      return list.reverse(); // Optional: show first chapter first
    });

    await browser.close();
    res.json({ chapters });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chapters" });
  }
});

// Get images for a chapter
app.get("/api/chapterImages", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Chapter URL required" });

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Scroll to load all lazy images
    await page.evaluate(async () => {
      const distance = 500;
      const delay = 250;
      let scrolled = 0;
      const totalHeight = document.body.scrollHeight;
      while (scrolled < totalHeight) {
        window.scrollBy(0, distance);
        scrolled += distance;
        await new Promise(r => setTimeout(r, delay));
      }
    });

    const images = await page.evaluate(() => {
      const imgs = [];
      document.querySelectorAll(".reading-content img").forEach(img => {
        const src = img.getAttribute("data-src") || img.src;
        if(src && !src.includes("thumbnail") && !src.includes("ads") && !src.includes("blank")) {
          imgs.push(src);
        }
      });
      return imgs;
    });

    await browser.close();
    res.json({ images });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chapter images" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
