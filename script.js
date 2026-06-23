const libraryEl = document.querySelector("#library");
const searchInput = document.querySelector("#searchInput");
const filterButtons = document.querySelectorAll(".pill");
const audio = document.querySelector("#audio");
const playerCover = document.querySelector("#playerCover");
const playerTitle = document.querySelector("#playerTitle");
const playerArtist = document.querySelector("#playerArtist");
const playBtn = document.querySelector("#playBtn");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const videoToggleBtn = document.querySelector("#videoToggleBtn");
const queueToggleBtn = document.querySelector("#queueToggleBtn");
const seekBar = document.querySelector("#seekBar");
const currentTimeEl = document.querySelector("#currentTime");
const durationEl = document.querySelector("#duration");
const playFeaturedBtn = document.querySelector("#playFeatured");
const queueOpenTop = document.querySelector("#queueOpenTop");
const installHelp = document.querySelector("#installHelp");
const installPanel = document.querySelector("#installPanel");
const closeInstall = document.querySelector("#closeInstall");
const featuredCover = document.querySelector("#featuredCover");
const videoOverlay = document.querySelector("#videoOverlay");
const videoPlayer = document.querySelector("#videoPlayer");
const videoTitle = document.querySelector("#videoTitle");
const videoFullBtn = document.querySelector("#videoFullBtn");
const videoCloseBtn = document.querySelector("#videoCloseBtn");
const lyricsModal = document.querySelector("#lyricsModal");
const lyricsTitle = document.querySelector("#lyricsTitle");
const lyricsBody = document.querySelector("#lyricsBody");
const lyricsCloseBtn = document.querySelector("#lyricsCloseBtn");
const queueModal = document.querySelector("#queueModal");
const queueBody = document.querySelector("#queueBody");
const queueCloseBtn = document.querySelector("#queueCloseBtn");
const clearQueueBtn = document.querySelector("#clearQueueBtn");

let songs = [];
let visibleSongs = [];
let currentIndex = -1;
let currentFilter = "all";
let isSeeking = false;
let queue = [];
let videoWasPlaying = false;

const icons = {
  play: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>`,
  prev: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h2v12H6zm3 6 9 6V6z"/></svg>`,
  next: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 6h2v12h-2zM6 18l9-6-9-6z"/></svg>`,
  video: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v1.2l3.3-2.1A1.1 1.1 0 0 1 22 6.5v11a1.1 1.1 0 0 1-1.7.9L17 16.3v1.2a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 17.5z"/></svg>`,
  queue: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h13v2H4zm0 5h13v2H4zm0 5h9v2H4zm14-1.5V11l4 3-4 3z"/></svg>`
};

function setIconButtons() {
  prevBtn.innerHTML = icons.prev;
  playBtn.innerHTML = icons.play;
  nextBtn.innerHTML = icons.next;
  videoToggleBtn.innerHTML = icons.video;
  queueToggleBtn.innerHTML = icons.queue;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

async function loadSongs() {
  const response = await fetch("songs.json", { cache: "no-cache" });
  songs = await response.json();
  const featured = songs.find(song => song.featured && song.audio) || songs.find(song => song.audio);
  if (featured) featuredCover.src = featured.cover;
  renderLibrary();
}

function renderLibrary() {
  const term = searchInput.value.trim().toLowerCase();
  visibleSongs = songs.filter(song => {
    const matchesFilter = currentFilter === "all" || song.artist === currentFilter || song.type === currentFilter;
    const matchesSearch = [song.title, song.artist, song.type, song.releaseDate].join(" ").toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  if (!visibleSongs.length) {
    libraryEl.innerHTML = `<div class="empty-state">No songs found. Try a different search.</div>`;
    return;
  }

  libraryEl.innerHTML = visibleSongs.map((song, index) => {
    const locked = !song.audio;
    return `
      <article class="song-card ${locked ? "locked" : ""}">
        <div class="cover-wrap">
          <img src="${song.cover}" alt="${song.title} cover" class="song-cover" loading="lazy" />
          <span class="tag">${song.type}</span>
        </div>
        <div class="song-info">
          <h3>${song.title}</h3>
          <p>${song.artist} • ${song.releaseDate}</p>
        </div>
        <div class="card-actions">
          ${song.audio ? `<button class="play-card" data-play="${index}">Play</button>` : `<button disabled>Coming Soon</button>`}
          ${song.audio ? `<button data-queue="${index}">Queue</button>` : ""}
          ${song.lyrics ? `<button data-lyrics="${index}">Lyrics</button>` : ""}
          ${song.video ? `<button data-video="${index}">Video</button>` : ""}
        </div>
      </article>`;
  }).join("");

  document.querySelectorAll("[data-play]").forEach(button => button.addEventListener("click", () => playVisible(Number(button.dataset.play))));
  document.querySelectorAll("[data-queue]").forEach(button => button.addEventListener("click", () => addVisibleToQueue(Number(button.dataset.queue))));
  document.querySelectorAll("[data-lyrics]").forEach(button => button.addEventListener("click", () => openLyricsForVisible(Number(button.dataset.lyrics))));
  document.querySelectorAll("[data-video]").forEach(button => button.addEventListener("click", () => openVideoForVisible(Number(button.dataset.video))));
}

function playVisible(visibleIndex) {
  const song = visibleSongs[visibleIndex];
  const realIndex = songs.findIndex(item => item.id === song.id);
  playSong(realIndex);
}

function addVisibleToQueue(visibleIndex) {
  const song = visibleSongs[visibleIndex];
  const realIndex = songs.findIndex(item => item.id === song.id);
  if (realIndex < 0 || !songs[realIndex].audio) return;
  queue.push(realIndex);
  renderQueue();
  openQueue(false);
}

function playSong(index, keepTime = 0) {
  const song = songs[index];
  if (!song || !song.audio) return;
  currentIndex = index;
  closeVideo(false);
  audio.src = song.audio;
  audio.currentTime = keepTime || 0;
  audio.play().catch(() => {});
  playerCover.src = song.cover;
  playerTitle.textContent = song.title;
  playerArtist.textContent = song.artist;
  playBtn.innerHTML = icons.pause;
  document.title = `${song.title} • Kings Music`;
  videoToggleBtn.hidden = !song.video;
}

function togglePlay() {
  if (!audio.src) {
    const featuredIndex = songs.findIndex(song => song.featured && song.audio);
    playSong(featuredIndex >= 0 ? featuredIndex : songs.findIndex(song => song.audio));
    return;
  }
  if (audio.paused) {
    audio.play().catch(() => {});
    playBtn.innerHTML = icons.pause;
  } else {
    audio.pause();
    playBtn.innerHTML = icons.play;
  }
}

function playNext(direction = 1) {
  if (direction === 1 && queue.length) {
    const nextQueuedIndex = queue.shift();
    renderQueue();
    playSong(nextQueuedIndex);
    return;
  }
  const playable = songs.map((song, index) => ({ song, index })).filter(item => item.song.audio);
  if (!playable.length) return;
  const currentPlayableIndex = playable.findIndex(item => item.index === currentIndex);
  const nextPlayableIndex = currentPlayableIndex === -1 ? 0 : (currentPlayableIndex + direction + playable.length) % playable.length;
  playSong(playable[nextPlayableIndex].index);
}

async function openLyrics(index) {
  const song = songs[index];
  if (!song || !song.lyrics) return;
  lyricsTitle.textContent = `${song.title} Lyrics`;
  lyricsBody.textContent = "Loading lyrics...";
  lyricsModal.hidden = false;
  try {
    const response = await fetch(song.lyrics, { cache: "no-cache" });
    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");
    const lyrics = doc.querySelector(".lyrics-text")?.textContent?.trim() || "Lyrics could not be loaded.";
    lyricsBody.innerHTML = `<pre>${escapeHtml(lyrics)}</pre>`;
  } catch {
    lyricsBody.textContent = "Lyrics could not be loaded.";
  }
}

function openLyricsForVisible(visibleIndex) {
  const song = visibleSongs[visibleIndex];
  const realIndex = songs.findIndex(item => item.id === song.id);
  openLyrics(realIndex);
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function closeLyrics() {
  lyricsModal.hidden = true;
}

function openVideoForVisible(visibleIndex) {
  const song = visibleSongs[visibleIndex];
  const realIndex = songs.findIndex(item => item.id === song.id);
  if (currentIndex !== realIndex) playSong(realIndex);
  openVideo();
}

function openVideo() {
  const song = songs[currentIndex];
  if (!song?.video) return;
  videoTitle.textContent = `${song.title} — Video`;
  videoPlayer.src = song.video;
  videoPlayer.currentTime = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  videoWasPlaying = !audio.paused;
  audio.pause();
  playBtn.innerHTML = icons.play;
  videoOverlay.hidden = false;
  if (videoWasPlaying) videoPlayer.play().catch(() => {});
}

function closeVideo(syncBack = true) {
  if (videoOverlay.hidden) return;
  const shouldResume = !videoPlayer.paused || videoWasPlaying;
  const time = videoPlayer.currentTime || 0;
  videoPlayer.pause();
  videoOverlay.hidden = true;
  videoOverlay.classList.remove("expanded");
  videoFullBtn.textContent = "Fullscreen";
  if (syncBack && audio.src) {
    audio.currentTime = time;
    if (shouldResume) {
      audio.play().catch(() => {});
      playBtn.innerHTML = icons.pause;
    }
  }
}

function toggleVideoFullscreen() {
  videoOverlay.classList.toggle("expanded");
  videoFullBtn.textContent = videoOverlay.classList.contains("expanded") ? "Exit Fullscreen" : "Fullscreen";
}

function renderQueue() {
  if (!queue.length) {
    queueBody.innerHTML = `<div class="empty-state">Queue is empty. Add songs from the library.</div>`;
    return;
  }
  queueBody.innerHTML = queue.map((songIndex, queueIndex) => {
    const song = songs[songIndex];
    return `
      <div class="queue-item">
        <div class="queue-item-left">
          <img src="${song.cover}" alt="" />
          <div><p>${song.title}</p><small>${song.artist}</small></div>
        </div>
        <button class="secondary-btn" data-remove-queue="${queueIndex}">Remove</button>
      </div>`;
  }).join("");
  document.querySelectorAll("[data-remove-queue]").forEach(button => {
    button.addEventListener("click", () => {
      queue.splice(Number(button.dataset.removeQueue), 1);
      renderQueue();
    });
  });
}

function openQueue(scroll = true) {
  renderQueue();
  queueModal.hidden = false;
  if (scroll) queueModal.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeQueue() { queueModal.hidden = true; }

filterButtons.forEach(button => button.addEventListener("click", () => {
  filterButtons.forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
  currentFilter = button.dataset.filter;
  renderLibrary();
}));

searchInput.addEventListener("input", renderLibrary);
playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", () => playNext(-1));
nextBtn.addEventListener("click", () => playNext(1));
videoToggleBtn.addEventListener("click", openVideo);
videoCloseBtn.addEventListener("click", () => closeVideo(true));
videoFullBtn.addEventListener("click", toggleVideoFullscreen);
lyricsCloseBtn.addEventListener("click", closeLyrics);
queueToggleBtn.addEventListener("click", () => openQueue());
queueOpenTop.addEventListener("click", () => openQueue());
queueCloseBtn.addEventListener("click", closeQueue);
clearQueueBtn.addEventListener("click", () => { queue = []; renderQueue(); });

lyricsModal.addEventListener("click", event => { if (event.target === lyricsModal) closeLyrics(); });
queueModal.addEventListener("click", event => { if (event.target === queueModal) closeQueue(); });
videoOverlay.addEventListener("click", event => { if (event.target === videoOverlay) closeVideo(true); });

playFeaturedBtn.addEventListener("click", () => {
  const featuredIndex = songs.findIndex(song => song.featured && song.audio);
  playSong(featuredIndex >= 0 ? featuredIndex : songs.findIndex(song => song.audio));
});
installHelp.addEventListener("click", () => { installPanel.hidden = false; installPanel.scrollIntoView({ behavior: "smooth", block: "center" }); });
closeInstall.addEventListener("click", () => { installPanel.hidden = true; });

audio.addEventListener("loadedmetadata", () => { durationEl.textContent = formatTime(audio.duration); });
audio.addEventListener("timeupdate", () => {
  if (isSeeking || !audio.duration) return;
  seekBar.value = (audio.currentTime / audio.duration) * 100;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});
audio.addEventListener("play", () => { playBtn.innerHTML = icons.pause; });
audio.addEventListener("pause", () => { if (videoOverlay.hidden) playBtn.innerHTML = icons.play; });
audio.addEventListener("ended", () => playNext(1));
seekBar.addEventListener("input", () => { isSeeking = true; });
seekBar.addEventListener("change", () => {
  if (audio.duration) audio.currentTime = (Number(seekBar.value) / 100) * audio.duration;
  isSeeking = false;
});

window.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeLyrics();
    closeQueue();
    closeVideo(true);
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => console.log("Service worker registration skipped."));
  });
}

setIconButtons();
loadSongs().catch(error => {
  console.error(error);
  libraryEl.innerHTML = `<div class="empty-state">Could not load songs.json. Check your file paths.</div>`;
});
