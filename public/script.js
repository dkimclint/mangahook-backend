const chapterListEl = document.getElementById('chapter-list');
const imagesContainer = document.getElementById('images-container');
const chapterTitle = document.getElementById('chapter-title');

// Fetch chapters from backend
async function loadChapters() {
  const res = await fetch('/chapters');
  const data = await res.json();
  chapterListEl.innerHTML = '';

  data.chapters.forEach(ch => {
    const li = document.createElement('li');
    li.textContent = ch.title;
    li.addEventListener('click', () => loadChapterImages(ch));
    chapterListEl.appendChild(li);
  });
}

// Fetch images of a chapter
async function loadChapterImages(chapter) {
  chapterTitle.textContent = chapter.title;
  imagesContainer.innerHTML = '<p>Loading images...</p>';

  try {
    const res = await fetch(`/chapter-images?url=${encodeURIComponent(chapter.link)}`);
    const data = await res.json();

    if (data.images && data.images.length) {
      imagesContainer.innerHTML = '';
      data.images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        imagesContainer.appendChild(img);
      });
    } else {
      imagesContainer.innerHTML = '<p>No images found.</p>';
    }
  } catch (err) {
    imagesContainer.innerHTML = '<p>Failed to load images.</p>';
    console.error(err);
  }
}

// Initialize
loadChapters();
