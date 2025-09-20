import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

// Manga list
const mangaList = [
  { id: "1", title: "Demon Magic Emperor", image: "https://placekitten.com/400/600", description: "Powerful emperor rises", view: "1M" }
];

// Generate 200 chapters with placeholder images + official URLs
const generateChapters = () => {
  return Array.from({ length: 200 }, (_, i) => ({
    chapter: `Chapter ${i+1}`,
    image: `https://placekitten.com/800/400?image=${i+1}`,
    url: `https://manhuaplus.com/manga/demon-magic-emperor01/chapter-${i+1}`
  }));
};

// API endpoints
app.get("/api/mangaList", (req, res) => {
  res.json({ mangaList });
});

app.get("/api/manga/:id/chapters", (req, res) => {
  res.json({ chapters: generateChapters() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
