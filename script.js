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
const seekBar = document.querySelector("#seekBar");
const currentTimeEl = document.querySelector("#currentTime");
const durationEl = document.querySelector("#duration");
const playFeaturedBtn = document.querySelector("#playFeatured");
const installHelp = document.querySelector("#installHelp");
const installPanel = document.querySelector("#installPanel");
const closeInstall = document.querySelector("#closeInstall");
const featuredCover = document.querySelector("#featuredCover");

const videoPanel = document.querySelector("#videoPanel");
const videoTitle = document.querySelector("#videoTitle");
const videoFrameWrap = document.querySelector("#videoFrameWrap");
const videoFullBtn = document.querySelector("#videoFullBtn");
const videoCloseBtn = document.querySelector("#videoCloseBtn");

let songs = [];
let visibleSongs = [];
let currentIndex = -1;
let currentFilter = "all";
let isSeeking = false;
let currentVideoSource = "";

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function youtubeEmbed(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    let id = "";
    if (parsed.hostname.includes("youtu.be")) {
      id = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes("youtube.com")) {
      id = parsed.searchParams.get("v") || parsed.pathname.split("/").pop();
    }
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return url;
  }
}

function isVideoFile(src) {
  return /\.(mp4|webm|mov|m4v)$/i.test(src || "");
}

function setVideo(song) {
  currentVideoSource = song?.video || "";
  videoToggleBtn.hidden = !currentVideoSource;
  if (!currentVideoSource) {
    closeVideo();
    return;
  }

  videoTitle.textContent = `${song.title} — Video`;
  videoFrameWrap.innerHTML = "";

  if (isVideoFile(currentVideoSource)) {
    const video = document.createElement("video");
    video.src = currentVideoSource;
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    videoFrameWrap.appendChild(video);
  } else {
    const iframe = document.createElement("iframe");
    iframe.src = youtubeEmbed(currentVideoSource);
    iframe.title = `${song.title} music video`;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    videoFrameWrap.appendChild(iframe);
  }
}

async function loadSongs() {
  const response = await fetch("songs.json");
  songs = await response.json();

  const featured = songs.find(song => song.featured && song.audio) || songs.find(song => song.audio);
  if (featured) {
    featuredCover.src = featured.cover;
  }

  renderLibrary();
}

function renderLibrary() {
  const term = searchInput.value.trim().toLowerCase();

  visibleSongs = songs.filter(song => {
    const matchesFilter =
      currentFilter === "all" ||
      song.artist === currentFilter ||
      song.type === currentFilter;

    const matchesSearch =
      song.title.toLowerCase().includes(term) ||
      song.artist.toLowerCase().includes(term) ||
      song.type.toLowerCase().includes(term) ||
      song.releaseDate.toLowerCase().includes(term);

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
          ${song.lyrics ? `<a href="${song.lyrics}">Lyrics</a>` : ""}
          ${song.video ? `<button data-video="${index}">Video</button>` : ""}
        </div>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-play]").forEach(button => {
    button.addEventListener("click", () => {
      const visibleIndex = Number(button.dataset.play);
      const song = visibleSongs[visibleIndex];
      const realIndex = songs.findIndex(item => item.id === song.id);
      playSong(realIndex);
    });
  });

  document.querySelectorAll("[data-video]").forEach(button => {
    button.addEventListener("click", () => {
      const visibleIndex = Number(button.dataset.video);
      const song = visibleSongs[visibleIndex];
      const realIndex = songs.findIndex(item => item.id === song.id);
      if (currentIndex !== realIndex) {
        playSong(realIndex);
      }
      openVideo();
    });
  });
}

function playSong(index) {
  const song = songs[index];
  if (!song || !song.audio) return;

  currentIndex = index;
  audio.src = song.audio;
  audio.play();

  playerCover.src = song.cover;
  playerTitle.textContent = song.title;
  playerArtist.textContent = song.artist;
  playBtn.textContent = "⏸";
  document.title = `${song.title} • Kings Music`;
  setVideo(song);
}

function togglePlay() {
  if (!audio.src) {
    const featuredIndex = songs.findIndex(song => song.featured && song.audio);
    playSong(featuredIndex >= 0 ? featuredIndex : songs.findIndex(song => song.audio));
    return;
  }

  if (audio.paused) {
    audio.play();
    playBtn.textContent = "⏸";
  } else {
    audio.pause();
    playBtn.textContent = "▶";
  }
}

function playNext(direction = 1) {
  if (!songs.length) return;

  const playable = songs
    .map((song, index) => ({ song, index }))
    .filter(item => item.song.audio);

  if (!playable.length) return;

  const currentPlayableIndex = playable.findIndex(item => item.index === currentIndex);
  const nextPlayableIndex =
    currentPlayableIndex === -1
      ? 0
      : (currentPlayableIndex + direction + playable.length) % playable.length;

  playSong(playable[nextPlayableIndex].index);
}

function openVideo() {
  if (!currentVideoSource) return;
  videoPanel.hidden = false;
  videoPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeVideo() {
  videoPanel.hidden = true;
  videoPanel.classList.remove("expanded");
  videoFullBtn.textContent = "Fullscreen";
}

function toggleVideoFullscreen() {
  videoPanel.classList.toggle("expanded");
  videoFullBtn.textContent = videoPanel.classList.contains("expanded") ? "Exit Fullscreen" : "Fullscreen";
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderLibrary();
  });
});

searchInput.addEventListener("input", renderLibrary);
playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", () => playNext(-1));
nextBtn.addEventListener("click", () => playNext(1));
videoToggleBtn.addEventListener("click", openVideo);
videoCloseBtn.addEventListener("click", closeVideo);
videoFullBtn.addEventListener("click", toggleVideoFullscreen);

playFeaturedBtn.addEventListener("click", () => {
  const featuredIndex = songs.findIndex(song => song.featured && song.audio);
  playSong(featuredIndex >= 0 ? featuredIndex : songs.findIndex(song => song.audio));
});

installHelp.addEventListener("click", () => {
  installPanel.hidden = false;
  installPanel.scrollIntoView({ behavior: "smooth", block: "center" });
});

closeInstall.addEventListener("click", () => {
  installPanel.hidden = true;
});

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  if (isSeeking || !audio.duration) return;
  seekBar.value = (audio.currentTime / audio.duration) * 100;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

seekBar.addEventListener("input", () => {
  isSeeking = true;
});

seekBar.addEventListener("change", () => {
  if (audio.duration) {
    audio.currentTime = (Number(seekBar.value) / 100) * audio.duration;
  }
  isSeeking = false;
});

audio.addEventListener("ended", () => playNext(1));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      console.log("Service worker registration skipped.");
    });
  });
}

loadSongs().catch(error => {
  console.error(error);
  libraryEl.innerHTML = `<div class="empty-state">Could not load songs.json. Check your file paths.</div>`;
});
