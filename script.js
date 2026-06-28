const ICONS = {
  play: `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>`,
  next: `<svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm10-12h2v12h-2z"/></svg>`,
  prev: `<svg viewBox="0 0 24 24"><path d="M18 6l-8.5 6L18 18V6zM6 6h2v12H6z"/></svg>`
};

let songs = [];
let currentIndex = -1;
let queue = [];
let playlist = [];
let artistMode = 'lead';
let selectedArtist = '';
let isSeeking = false;
let videoMode = false;
let pendingVideoResume = false;

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* v5.4b safety helpers */
function kmOn(selectorOrEl, handler){
  const el = typeof selectorOrEl === "string" ? document.querySelector(selectorOrEl) : selectorOrEl;
  if (el) el.onclick = handler;
  return el;
}
function kmListen(selectorOrEl, eventName, handler){
  const el = typeof selectorOrEl === "string" ? document.querySelector(selectorOrEl) : selectorOrEl;
  if (el) el.addEventListener(eventName, handler);
  return el;
}
function kmShowModal(selectorOrEl){
  const el = typeof selectorOrEl === "string" ? document.querySelector(selectorOrEl) : selectorOrEl;
  if (el && typeof el.showModal === "function") el.showModal();
}
function kmClose(selectorOrEl){
  const el = typeof selectorOrEl === "string" ? document.querySelector(selectorOrEl) : selectorOrEl;
  if (el && typeof el.close === "function") el.close();
}

const audio = $('#audio');
const barCover = $('#barCover');
const barTitle = $('#barTitle');
const barArtist = $('#barArtist');
const playBtn = $('#playBtn');
const prevBtn = $('#prevBtn');
const nextBtn = $('#nextBtn');
const nowPlaying = $('#nowPlaying');
const npCover = $('#npCover');
const npTitle = $('#npTitle');
const npArtist = $('#npArtist');
const npPlay = $('#npPlay');
const npPrev = $('#npPrev');
const npNext = $('#npNext');
const seekBar = $('#seekBar');
const currentTimeEl = $('#currentTime');
const durationEl = $('#duration');
const lyricsPanel = $('#lyricsPanel');
const lyricsText = $('#lyricsText');
const queuePanel = $('#queuePanel');
const queueList = $('#queueList');
const videoBox = $('#videoBox');
const songVideo = $('#songVideo');
const wideVideoDialog = $('#wideVideoDialog');
const wideVideo = $('#wideVideo');
const toggleVideo = $('#toggleVideo');
const toast = $('#toast');

function setIcons(){
  playBtn.innerHTML = ICONS.play; npPlay.innerHTML = ICONS.play;
  prevBtn.innerHTML = ICONS.prev; nextBtn.innerHTML = ICONS.next;
  npPrev.innerHTML = ICONS.prev; npNext.innerHTML = ICONS.next;
}
setIcons();

function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(t){if(!Number.isFinite(t))return '0:00'; return `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;}
function toastMsg(m){toast.textContent=m; toast.hidden=false; clearTimeout(toastMsg.t); toastMsg.t=setTimeout(()=>toast.hidden=true,2100);}
function primaryArtists(s){return Array.isArray(s.primaryArtists)&&s.primaryArtists.length?s.primaryArtists:[s.artist||'KingJJ'];}
function displayArtist(s){return s.displayArtist || `${primaryArtists(s).join(', ')}${s.featuredArtists?.length ? ' feat. '+s.featuredArtists.join(', ') : ''}`;}
function releaseLabel(s){return s.releaseDate || '2026';}
function artistLine(s){
  if(s.displayArtist) return s.displayArtist;
  const feats=s.featuredArtists||[];
  return s.artist+(feats.length?' feat. '+feats.join(', '):'');
}
function activeMedia(){return videoMode ? songVideo : audio;}
function activePaused(){const m=activeMedia(); return !m.src || m.paused;}


/* v5.7 share helpers */
function songShareUrl(i){
  const s = songs[i];
  const u = new URL(location.href);
  if (s?.id) u.searchParams.set('song', s.id);
  return u.toString();
}
async function shareSong(i){
  const s = songs[i];
  if(!s) return;
  const url = songShareUrl(i);
  const text = `${s.title} — ${artistLine(s)} on Kings Music`;
  try {
    if(navigator.share){
      await navigator.share({title: s.title, text, url});
      return;
    }
  } catch {}
  try {
    await navigator.clipboard.writeText(url);
    toastMsg('Song link copied');
  } catch {
    toastMsg('Song link ready');
  }
}

function row(s){
  const i=songs.findIndex(x=>x.id===s.id);
  return `<article class="song-row"><img src="${s.cover}" loading="lazy" alt=""><div><div class="song-title">${esc(s.title)}</div><div class="song-sub">${esc(artistLine(s))}</div></div><div class="row-actions"><button data-play="${i}">Play</button><button data-queue="${i}" class="queue-text">Queue</button><button data-list="${i}" class="hide-mobile">+ List</button><button data-share="${i}" class="share-btn" title="Share" aria-label="Share ${esc(s.title)}"><img src="assets/icons/share.png?v=5.7" alt=""></button></div></article>`;
}
function bind(root=document){
  root.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>playSong(+b.dataset.play));
  root.querySelectorAll('[data-queue]').forEach(b=>b.onclick=()=>addQ(+b.dataset.queue));
  root.querySelectorAll('[data-list]').forEach(b=>b.onclick=()=>addPl(+b.dataset.list));
  root.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>shareSong(+b.dataset.share));
}
function home(){
  const recent=[...songs].sort((a,b)=>datev(b)-datev(a)).slice(0,5);
  $('#recentList').innerHTML=recent.map(row).join('');
  const d=songs.filter(s=>s.category==='Disses');
  $('#dissesList').innerHTML=d.length?d.map(row).join(''):'<p class="muted">No diss tracks listed yet.</p>';
  const f=songs.find(s=>s.id==='overthinking')||songs[0]; if(f)$('#heroCover').src=f.cover;
  bind($('#homeTab'));
}
function allSongs(){
  const term=$('#searchInput').value.toLowerCase(); const sort=$('#sortSelect').value;
  let list=songs.filter(s=>`${s.title} ${displayArtist(s)} ${primaryArtists(s).join(' ')} ${(s.featuredArtists||[]).join(' ')} ${s.category||''} ${s.releaseDate||''}`.toLowerCase().includes(term));
  list.sort((a,b)=> sort==='title-desc'?b.title.localeCompare(a.title):sort==='date-desc'?datev(b)-datev(a):sort==='date-asc'?datev(a)-datev(b):a.title.localeCompare(b.title));
  $('#allSongsList').innerHTML=list.map(row).join('')||'<p class="muted">No songs found.</p>'; bind($('#songsTab'));
}
function artists(){
  const m=new Map();
  songs.forEach(s=>{
    primaryArtists(s).forEach(a=>{if(!m.has(a))m.set(a,{name:a,lead:0,any:0}); m.get(a).lead++; m.get(a).any++;});
    (s.featuredArtists||[]).forEach(f=>{if(!m.has(f))m.set(f,{name:f,lead:0,any:0}); m.get(f).any++;});
  });
  $('#artistList').innerHTML=[...m.values()].sort((a,b)=>a.name.localeCompare(b.name)).map(a=>`<button class="artist-card" data-artist="${esc(a.name)}"><strong>${esc(a.name)}</strong><small>${a.lead} lead • ${a.any} total</small></button>`).join('');
  $$('#artistList [data-artist]').forEach(b=>b.onclick=()=>openArtist(b.dataset.artist));
}
function openArtist(n){selectedArtist=n; $('#artistDetailName').textContent=n; $('#artistDetail').hidden=false; artistSongs(); $('#artistDetail').scrollIntoView({behavior:'smooth'});}
function artistSongs(){
  const l=songs.filter(s=>artistMode==='lead'?primaryArtists(s).includes(selectedArtist):primaryArtists(s).includes(selectedArtist)||(s.featuredArtists||[]).includes(selectedArtist));
  $('#artistSongsList').innerHTML=l.map(row).join('')||'<p class="muted">No songs here yet.</p>'; bind($('#artistDetail'));
}
function savePl(){localStorage.setItem('kingsMusicPlaylistV2', JSON.stringify({v:2, tracks:playlist}));}
function loadPl(){
  try{
    const raw=localStorage.getItem('kingsMusicPlaylistV2')||localStorage.getItem('kingsMusicPlaylist')||'[]';
    const parsed=JSON.parse(raw); playlist=Array.isArray(parsed)?parsed:(parsed.tracks||[]);
  }catch{playlist=[];}
  playlist=playlist.filter(id=>songs.some(s=>s.id===id));
}
function renderPl(){
  const l=playlist.map(id=>songs.find(s=>s.id===id)).filter(Boolean);
  $('#playlistList').innerHTML=l.length?l.map((s,i)=>`<article class="song-row"><img src="${s.cover}" alt=""><div><div class="song-title">${esc(s.title)}</div><div class="song-sub">${esc(artistLine(s))}</div></div><div class="row-actions"><button data-plplay="${i}">Play</button><button data-plrem="${i}">Remove</button><button data-plshare="${i}" class="share-btn" title="Share"><img src="assets/icons/share.png?v=5.7" alt=""></button></div></article>`).join(''):'<p class="muted">No songs in this playlist yet. Add songs from the song list.</p>';
  $$('[data-plplay]').forEach(b=>b.onclick=()=>playSong(songs.findIndex(s=>s.id===l[+b.dataset.plplay].id)));
  $$('[data-plrem]').forEach(b=>b.onclick=()=>{playlist.splice(+b.dataset.plrem,1); savePl(); renderPl();});
  $$('[data-plshare]').forEach(b=>b.onclick=()=>shareSong(songs.findIndex(s=>s.id===l[+b.dataset.plshare].id)));
}
function encodePlaylist(){
  const payload=JSON.stringify({v:2, app:'KingsMusic', tracks:playlist});
  return btoa(unescape(encodeURIComponent(payload))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}
function decodePlaylist(c){
  c=String(c||'').trim(); if(!c)return [];
  try{const u=new URL(c); c=u.searchParams.get('pl')||c;}catch{}
  let p=c.replaceAll('-','+').replaceAll('_','/'); while(p.length%4)p+='=';
  const decoded=decodeURIComponent(escape(atob(p)));
  try{const obj=JSON.parse(decoded); return obj.tracks||[];}catch{return decoded.split(',').filter(Boolean);}
}
function importCode(c){
  try{playlist=decodePlaylist(c).filter(id=>songs.some(s=>s.id===id)); savePl(); renderPl(); switchTab('playlists'); toastMsg('Playlist imported');}
  catch{toastMsg('That playlist code did not work');}
}
function addPl(i){const s=songs[i]; if(!s)return; if(!playlist.includes(s.id))playlist.push(s.id); savePl(); renderPl(); toastMsg(`Added ${s.title}`);}
function addQ(i){const s=songs[i]; if(!s)return; queue.push(s.id); renderQ(); toastMsg(`Queued ${s.title}`);}
function renderQ(){
  const l=queue.map(id=>songs.find(s=>s.id===id)).filter(Boolean);
  queueList.innerHTML=l.length?l.map((s,i)=>`<div class="mini-item"><span>${esc(s.title)}</span><button class="ghost small" data-qr="${i}">Remove</button></div>`).join(''):'<p class="muted">Queue is empty.</p>';
  $$('[data-qr]').forEach(b=>b.onclick=()=>{queue.splice(+b.dataset.qr,1); renderQ();});
}
function setCur(i){
  const s=songs[i]; if(!s)return;
  const switchingSong = currentIndex !== i;
  currentIndex=i; videoMode=false; if(videoBox)videoBox.hidden=true; if(songVideo)songVideo.pause();
  barCover.src=npCover.src=s.cover; barTitle.textContent=npTitle.textContent=s.title; barArtist.textContent=displayArtist(s); npArtist.textContent=artistLine(s);
  lyricsText.textContent=s.lyricsText||'No lyrics added yet.'; if(toggleVideo){toggleVideo.hidden=true; toggleVideo.style.display='none'; toggleVideo.textContent='Video';}
  if(s.video){if(songVideo)songVideo.src=s.video; if(wideVideo)wideVideo.src=s.video;} else {if(songVideo)songVideo.removeAttribute('src'); if(wideVideo)wideVideo.removeAttribute('src');}
  document.title=s.title+' • Kings Music';
}
function playSong(i){const s=songs[i]; if(!s)return; setCur(i); audio.src=s.audio; audio.currentTime=0; audio.play().catch(()=>{}); updateIcons();}
function updateIcons(){const ic=activePaused()?ICONS.play:ICONS.pause; playBtn.innerHTML=ic; npPlay.innerHTML=ic;}
function togglePlay(){
  if(currentIndex<0)return playSong(0);
  const m=activeMedia(); if(!m.src && !videoMode) audio.src=songs[currentIndex].audio;
  if(m.paused)m.play().catch(()=>{}); else m.pause(); updateIcons();
}
function syncSeekUI(){const m=activeMedia(); if(isSeeking || !m.duration)return; seekBar.value=m.currentTime/m.duration*100; currentTimeEl.textContent=fmt(m.currentTime); durationEl.textContent=fmt(m.duration);}
function switchToVideo(force=false){
  const s=songs[currentIndex];
  if(!s?.video || !songVideo || !videoBox) return;
  const wasPlaying = audio ? !audio.paused : false;
  const t = audio ? (audio.currentTime || 0) : 0;

  if(audio) audio.pause();

  videoBox.hidden = false;
  videoMode = true;
  if(toggleVideo) toggleVideo.textContent = 'Audio';

  if(songVideo.getAttribute('src') !== s.video) {
    songVideo.src = s.video;
  }

  const go = () => {
    try {
      if (Number.isFinite(t)) songVideo.currentTime = Math.min(t, songVideo.duration || t);
    } catch {}
    if (wasPlaying || force) songVideo.play().catch(()=>{});
    updateIcons();
    syncSeekUI();
  };

  if(songVideo.readyState >= 1) go();
  else songVideo.onloadedmetadata = go;
}
function switchToAudio(){
  if(currentIndex<0 || !audio || !songVideo) return;
  const wasPlaying = !songVideo.paused;
  const t = songVideo.currentTime || audio.currentTime || 0;

  songVideo.pause();
  videoMode = false;
  if(videoBox) videoBox.hidden = true;
  if(toggleVideo) toggleVideo.textContent = 'Video';

  if(!audio.src) audio.src = songs[currentIndex].audio;
  try { audio.currentTime = t; } catch {}
  if(wasPlaying) audio.play().catch(()=>{});
  updateIcons();
  syncSeekUI();
}
function showVideo(){ if(videoMode) switchToAudio(); else switchToVideo(); }
function next(){
  if(queue.length){const id=queue.shift(); const i=songs.findIndex(s=>s.id===id); renderQ(); if(i>=0)return playSong(i);}
  playSong(currentIndex<0?0:(currentIndex+1)%songs.length);
}
function prev(){playSong(currentIndex<=0?songs.length-1:currentIndex-1);}
function openNP(){if(!nowPlaying.open)nowPlaying.showModal();}
function switchTab(t){$$('.tab-panel').forEach(p=>p.classList.remove('active')); $$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===t)); $('#'+t+'Tab')?.classList.add('active'); scrollTo({top:0,behavior:'smooth'});}
function events(){
  $$('.tab,.tab-jump,.brand').forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  kmListen('#searchInput','input',allSongs);
  kmListen('#sortSelect','change',allSongs);
  kmOn('#shuffleBtn',()=>playSong(Math.floor(Math.random()*songs.length)));

  if (playBtn) playBtn.onclick = togglePlay;
  if (npPlay) npPlay.onclick = togglePlay;
  if (prevBtn) prevBtn.onclick = prev;
  if (npPrev) npPrev.onclick = prev;
  if (nextBtn) nextBtn.onclick = next;
  if (npNext) npNext.onclick = next;

  kmOn('#openNowPlaying', openNP);
  kmOn('#closeNowPlaying', ()=>kmClose(nowPlaying));
  kmOn('#toggleLyrics', ()=>{ if (lyricsPanel) lyricsPanel.hidden = !lyricsPanel.hidden; });
  kmOn('#toggleQueue', ()=>{ if (queuePanel) queuePanel.hidden = !queuePanel.hidden; });
  if (toggleVideo) toggleVideo.onclick = showVideo;

  kmOn('#videoWideBtn', ()=>{
    if(songs[currentIndex]?.video && wideVideo && songVideo && wideVideoDialog){
      wideVideo.src = songs[currentIndex].video;
      try { wideVideo.currentTime = songVideo.currentTime || 0; } catch {}
      kmShowModal(wideVideoDialog);
      wideVideo.play().catch(()=>{});
    }
  });

  kmOn('#closeWideVideo', ()=>{
    if(songVideo && wideVideo){
      try { songVideo.currentTime = wideVideo.currentTime || songVideo.currentTime; } catch {}
      wideVideo.pause();
    }
    kmClose(wideVideoDialog);
  });

  kmOn('#addCurrentToPlaylist', ()=>{ if(currentIndex>=0)addPl(currentIndex); });
  $$('.artist-mode').forEach(b=>b.onclick=()=>{$$('.artist-mode').forEach(x=>x.classList.remove('active')); b.classList.add('active'); artistMode=b.dataset.mode; artistSongs();});
  kmOn('#closeArtist', ()=>{ const d=$('#artistDetail'); if(d)d.hidden=true; });

  kmOn('#copyPlaylistLink', async()=>{
    const u=new URL(location.href); u.searchParams.set('pl', encodePlaylist());
    try{await navigator.clipboard.writeText(u.toString()); toastMsg('Playlist link copied');}
    catch{const box=$('#playlistCodeBox'); if(box)box.value=u.toString(); toastMsg('Copy link from box');}
  });
  kmOn('#makePlaylistCode', ()=>{const box=$('#playlistCodeBox'); if(box)box.value=encodePlaylist(); toastMsg('Playlist code ready');});
  kmOn('#importPlaylistCode', ()=>{const box=$('#playlistCodeBox'); importCode(box?box.value:'');});
  kmOn('#clearPlaylist', ()=>{playlist=[]; savePl(); renderPl();});
  kmOn('#sharePlaylistTop', ()=>{switchTab('playlists'); const b=$('#makePlaylistCode'); if(b)b.click();});

  [audio,songVideo].filter(Boolean).forEach(m=>{
    m.onplay=updateIcons;
    m.onpause=updateIcons;
    m.onended=next;
    m.onloadedmetadata=syncSeekUI;
    m.ontimeupdate=syncSeekUI;
  });

  if (seekBar) {
    seekBar.oninput=()=>isSeeking=true;
    seekBar.onchange=()=>{const m=activeMedia(); if(m && m.duration)m.currentTime=+seekBar.value/100*m.duration; isSeeking=false; syncSeekUI();};
  }
}
async function init(){
  songs=await(await fetch('songs.json?v=5.7')).json(); loadPl(); home(); allSongs(); artists(); renderPl(); renderQ(); events();
  const p=new URLSearchParams(location.search); if(p.get('pl'))importCode(p.get('pl'));
  if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js?v=5.7').catch(()=>{});
}
init().catch(e=>{console.error(e); document.body.innerHTML='<main style="color:white;padding:20px">Could not load Kings Music.</main>';});


/* v5.4b final safety marker: OG v5 design, patched click/music/video behavior */


/* v5.5 no-video safe override
   Video has been removed, but hidden DOM placeholders are kept to avoid null errors. */
function switchToVideo(force=false){
  return;
}
function switchToAudio(){
  videoMode = false;
  if (typeof videoBox !== "undefined" && videoBox) videoBox.hidden = true;
  if (typeof toggleVideo !== "undefined" && toggleVideo) {
    toggleVideo.hidden = true;
    toggleVideo.style.display = "none";
  }
  updateIcons();
  syncSeekUI();
}
function showVideo(){
  return;
}


/* v5.6 no-video final cleanup */
function switchToVideo(force=false){ return; }
function showVideo(){ return; }
(function(){
  const b = document.querySelector('#toggleVideo');
  if (b) {
    b.hidden = true;
    b.style.display = 'none';
  }
})();


/* v5.7 deep-link song support */
(function(){
  const params = new URLSearchParams(location.search);
  const id = params.get('song');
  if(!id) return;
  const tryOpen = () => {
    if(!Array.isArray(songs) || !songs.length) return false;
    const i = songs.findIndex(s => s.id === id);
    if(i >= 0) {
      setCur(i);
      toastMsg('Loaded shared song');
      return true;
    }
    return false;
  };
  setTimeout(tryOpen, 500);
})();
