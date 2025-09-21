const BACKEND_URL = "http://localhost:3000";

const mangaGrid = document.getElementById("manga-grid");
const readerPanel = document.getElementById("reader-panel");
const chapterTitle = document.getElementById("chapter-title");
const chaptersContainer = document.getElementById("chapters-container");
const chapterImages = document.getElementById("chapter-images");
const prevChapterBtn = document.getElementById("prev-chapter");
const nextChapterBtn = document.getElementById("next-chapter");
const closeReaderBtn = document.getElementById("close-reader");
const zoomInBtn = document.getElementById("zoom-in");
const zoomOutBtn = document.getElementById("zoom-out");

let currentManga = null;
let chaptersList = [];
let currentChapterIndex = 0;
let currentZoom = 1;

// Load manga list
async function loadManga() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/mangaList`);
    const data = await res.json();

    mangaGrid.innerHTML = "";
    data.mangaList.forEach(manga => {
      const card = document.createElement("div");
      card.classList.add("card");
      card.innerHTML = `
        <img src="${manga.image}" alt="${manga.title}">
        <h3>${manga.title}</h3>
      `;
      card.addEventListener("click", () => showChapters(manga));
      mangaGrid.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    mangaGrid.innerHTML = "<p>Failed to load manga.</p>";
  }
}

// Show chapters
async function showChapters(manga) {
  readerPanel.style.display = "flex";
  chapterTitle.textContent = manga.title;
  chaptersContainer.innerHTML = "<p>Loading chapters...</p>";
  chapterImages.innerHTML = "";
  currentManga = manga;

  try {
    const res = await fetch(`${BACKEND_URL}/api/manga/${manga.id}/chapters`);
    const data = await res.json();

    chaptersList = data.chapters;
    currentChapterIndex = 0;

    chaptersContainer.innerHTML = "";
    chaptersList.forEach((ch, index) => {
      const btn = document.createElement("button");
      btn.textContent = ch.chapter;
      btn.addEventListener("click", () => {
        currentChapterIndex = index;
        loadImages(ch.url);
        highlightActiveChapter();
      });
      chaptersContainer.appendChild(btn);
    });

    // Load first chapter automatically
    if (chaptersList.length > 0) {
      loadImages(chaptersList[0].url);
      highlightActiveChapter();
    }

  } catch (err) {
    console.error(err);
    chaptersContainer.innerHTML = "<p>Failed to load chapters.</p>";
  }
}

// Load images
async function loadImages(chapterUrl) {
  chapterImages.innerHTML = "<p>Loading images...</p>";
  currentZoom = 1;
  try {
    const res = await fetch(`${BACKEND_URL}/api/chapterImages?url=${encodeURIComponent(chapterUrl)}`);
    const data = await res.json();

    chapterImages.innerHTML = "";
    data.images.forEach(src => {
      const img = document.createElement("img");
      img.src = src;
      img.loading = "lazy";
      img.style.transform = `scale(${currentZoom})`;
      chapterImages.appendChild(img);
    });

  } catch (err) {
    console.error(err);
    chapterImages.innerHTML = "<p>Failed to load images.</p>";
  }
}

// Highlight active chapter
function highlightActiveChapter() {
  const buttons = chaptersContainer.querySelectorAll("button");
  buttons.forEach((btn, index) => {
    btn.classList.toggle("active", index === currentChapterIndex);
  });
}

// NEXT / PREV chapter buttons
nextChapterBtn.addEventListener("click", () => {
  if (currentChapterIndex < chaptersList.length - 1) {
    currentChapterIndex++;
    loadImages(chaptersList[currentChapterIndex].url);
    highlightActiveChapter();
  }
});

prevChapterBtn.addEventListener("click", () => {
  if (currentChapterIndex > 0) {
    currentChapterIndex--;
    loadImages(chaptersList[currentChapterIndex].url);
    highlightActiveChapter();
  }
});

// Close reader
closeReaderBtn.addEventListener("click", () => {
  readerPanel.style.display = "none";
  chaptersContainer.innerHTML = "";
  chapterImages.innerHTML = "";
  chaptersList = [];
  currentChapterIndex = 0;
});

// Zoom functionality
zoomInBtn.addEventListener("click", () => {
  currentZoom += 0.1;
  chapterImages.querySelectorAll("img").forEach(img => img.style.transform = `scale(${currentZoom})`);
});

zoomOutBtn.addEventListener("click", () => {
  currentZoom = Math.max(0.5, currentZoom - 0.1);
  chapterImages.querySelectorAll("img").forEach(img => img.style.transform = `scale(${currentZoom})`);
});

// Initialize
loadManga();
