import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ✅ Para gumana ang __dirname sa ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static frontend
app.use(express.static(path.join(__dirname, "public")));

// --- Example API ---
app.get("/api/mangaList", (req, res) => {
  res.json({
    mangaList: [
      {
        id: "1",
        title: "The Beginning After The End",
        chapter: "Chapter 2",
        image: "https://ww6.mangakakalot.tv/mangaimage/tbate.jpg",
        view: "1.2M",
        description: "King Grey is reincarnated in a new world...",
      },
    ],
  });
});

app.get("/api/manga/:id/chapters", (req, res) => {
  const { id } = req.params;
  res.json({
    id,
    chapters: [
      { id: "c1", title: "Chapter 1", content: "Content of Chapter 1" },
      { id: "c2", title: "Chapter 2", content: "Content of Chapter 2" },
    ],
  });
});

// ✅ Para lahat ng ibang route ay mag-load ng index.html (SPA style)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
