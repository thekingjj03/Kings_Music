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
function artistLine(s){let c=s.category?` • ${s.category}`:''; return `${displayArtist(s)} • ${s.type||'Single'} • ${releaseLabel(s)}${c}`;}
function datev(s){
  const sort = s.releaseSort || s.releaseDate || '';
  const parts = String(sort).match(/(\d{4})-(\d{2})/);
  if(parts) return Number(parts[1])*100 + Number(parts[2]);
  const n = Date.parse(s.releaseDate || ''); if(!isNaN(n)) return n;
  const y = String(s.releaseDate||'').match(/\d{4}/); return y?Number(y[0])*100:0;
}
function activeMedia(){return videoMode ? songVideo : audio;}
function activePaused(){const m=activeMedia(); return !m.src || m.paused;}

function row(s){
  const i=songs.findIndex(x=>x.id===s.id);
  return `<article class="song-row"><img src="${s.cover}" loading="lazy" alt=""><div><div class="song-title">${esc(s.title)}</div><div class="song-sub">${esc(artistLine(s))}</div></div><div class="row-actions"><button data-play="${i}">Play</button><button data-queue="${i}" class="queue-text">Queue</button><button data-list="${i}" class="hide-mobile">+ List</button>${s.lyricsText?`<button data-lyr="${i}" class="hide-mobile">Lyrics</button>`:''}${s.video?`<button data-vid="${i}" class="hide-mobile">Video</button>`:''}</div></article>`;
}
function bind(root=document){
  root.querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>playSong(+b.dataset.play));
  root.querySelectorAll('[data-queue]').forEach(b=>b.onclick=()=>addQ(+b.dataset.queue));
  root.querySelectorAll('[data-list]').forEach(b=>b.onclick=()=>addPl(+b.dataset.list));
  root.querySelectorAll('[data-lyr]').forEach(b=>b.onclick=()=>{setCur(+b.dataset.lyr); openNP(); lyricsPanel.hidden=false;});
  root.querySelectorAll('[data-vid]').forEach(b=>b.onclick=()=>{playSong(+b.dataset.vid); openNP(); switchToVideo(true);});
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
  $('#playlistList').innerHTML=l.length?l.map((s,i)=>`<article class="song-row"><img src="${s.cover}" alt=""><div><div class="song-title">${esc(s.title)}</div><div class="song-sub">${esc(artistLine(s))}</div></div><div class="row-actions"><button data-plplay="${i}">Play</button><button data-plrem="${i}">Remove</button></div></article>`).join(''):'<p class="muted">No songs in this playlist yet. Add songs from the song list.</p>';
  $$('[data-plplay]').forEach(b=>b.onclick=()=>playSong(songs.findIndex(s=>s.id===l[+b.dataset.plplay].id)));
  $$('[data-plrem]').forEach(b=>b.onclick=()=>{playlist.splice(+b.dataset.plrem,1); savePl(); renderPl();});
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
  currentIndex=i; videoMode=false; videoBox.hidden=true; songVideo.pause();
  barCover.src=npCover.src=s.cover; barTitle.textContent=npTitle.textContent=s.title; barArtist.textContent=displayArtist(s); npArtist.textContent=artistLine(s);
  lyricsText.textContent=s.lyricsText||'No lyrics added yet.'; toggleVideo.hidden=!s.video; toggleVideo.textContent='Video';
  if(s.video){songVideo.src=wideVideo.src=s.video;} else {songVideo.removeAttribute('src'); wideVideo.removeAttribute('src');}
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
  const s=songs[currentIndex]; if(!s?.video)return;
  const wasPlaying=!audio.paused;
  const t=audio.currentTime||0;
  audio.pause();
  videoBox.hidden=false; videoMode=true; toggleVideo.textContent='Audio';
  if(!songVideo.src)songVideo.src=s.video;
  pendingVideoResume=wasPlaying || force;
  const go=()=>{try{songVideo.currentTime=Math.min(t, songVideo.duration||t);}catch{} if(pendingVideoResume)songVideo.play().catch(()=>{}); pendingVideoResume=false; updateIcons(); syncSeekUI();};
  if(songVideo.readyState>=1) go(); else songVideo.onloadedmetadata=go;
}
function switchToAudio(){
  if(currentIndex<0)return;
  const wasPlaying=!songVideo.paused;
  const t=songVideo.currentTime||audio.currentTime||0;
  songVideo.pause(); videoMode=false; videoBox.hidden=true; toggleVideo.textContent='Video';
  if(!audio.src)audio.src=songs[currentIndex].audio;
  try{audio.currentTime=t;}catch{}
  if(wasPlaying)audio.play().catch(()=>{}); updateIcons(); syncSeekUI();
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
  $('#searchInput').oninput=allSongs; $('#sortSelect').onchange=allSongs; $('#shuffleBtn').onclick=()=>playSong(Math.floor(Math.random()*songs.length));
  playBtn.onclick=npPlay.onclick=togglePlay; prevBtn.onclick=npPrev.onclick=prev; nextBtn.onclick=npNext.onclick=next;
  $('#openNowPlaying').onclick=openNP; $('#closeNowPlaying').onclick=()=>nowPlaying.close();
  $('#toggleLyrics').onclick=()=>lyricsPanel.hidden=!lyricsPanel.hidden; $('#toggleQueue').onclick=()=>queuePanel.hidden=!queuePanel.hidden; toggleVideo.onclick=showVideo;
  $('#videoWideBtn').onclick=()=>{if(songs[currentIndex]?.video){wideVideo.src=songs[currentIndex].video; wideVideo.currentTime=songVideo.currentTime||0; wideVideoDialog.showModal(); wideVideo.play().catch(()=>{});}};
  $('#closeWideVideo').onclick=()=>{songVideo.currentTime=wideVideo.currentTime||songVideo.currentTime; wideVideo.pause(); wideVideoDialog.close();};
  $('#addCurrentToPlaylist').onclick=()=>{if(currentIndex>=0)addPl(currentIndex);};
  $$('.artist-mode').forEach(b=>b.onclick=()=>{$$('.artist-mode').forEach(x=>x.classList.remove('active')); b.classList.add('active'); artistMode=b.dataset.mode; artistSongs();});
  $('#closeArtist').onclick=()=>$('#artistDetail').hidden=true;
  $('#copyPlaylistLink').onclick=async()=>{const u=new URL(location.href); u.searchParams.set('pl', encodePlaylist()); try{await navigator.clipboard.writeText(u.toString()); toastMsg('Playlist link copied');}catch{$('#playlistCodeBox').value=u.toString(); toastMsg('Copy link from box');}};
  $('#makePlaylistCode').onclick=()=>{$('#playlistCodeBox').value=encodePlaylist(); toastMsg('Playlist code ready');};
  $('#importPlaylistCode').onclick=()=>importCode($('#playlistCodeBox').value);
  $('#clearPlaylist').onclick=()=>{playlist=[]; savePl(); renderPl();};
  $('#sharePlaylistTop').onclick=()=>{switchTab('playlists'); $('#makePlaylistCode').click();};
  [audio,songVideo].forEach(m=>{m.onplay=updateIcons; m.onpause=updateIcons; m.onended=next; m.onloadedmetadata=syncSeekUI; m.ontimeupdate=syncSeekUI;});
  seekBar.oninput=()=>isSeeking=true;
  seekBar.onchange=()=>{const m=activeMedia(); if(m.duration)m.currentTime=+seekBar.value/100*m.duration; isSeeking=false; syncSeekUI();};
}
async function init(){
  songs=await(await fetch('songs.json')).json(); loadPl(); home(); allSongs(); artists(); renderPl(); renderQ(); events();
  const p=new URLSearchParams(location.search); if(p.get('pl'))importCode(p.get('pl'));
  if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(()=>{});
}
init().catch(e=>{console.error(e); document.body.innerHTML='<main style="color:white;padding:20px">Could not load Kings Music.</main>';});




/* v5.2 no-video build
   Video support is intentionally disabled and all video files are removed. */
window.showVideo = function(){ return; };
