
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const click=(s,fn)=>{const e=$(s); if(e) e.onclick=fn; return e;};
const listen=(s,t,fn)=>{const e=$(s); if(e) e.addEventListener(t,fn); return e;};
const text=(s,v)=>{const e=$(s); if(e) e.textContent=v??"";};
const src=(s,v)=>{const e=$(s); if(e) e.src=v||"assets/logo.png?v=6.1";};
const esc=s=>(s??"").toString().replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

let songs=[],currentIndex=-1,playlist=[];
let deferredInstallPrompt=null;
const audio=$("#audio");

try{playlist=JSON.parse(localStorage.getItem("km_playlist_v6")||"[]")}catch{playlist=[]}

function savePlaylist(){localStorage.setItem("km_playlist_v6",JSON.stringify(playlist))}
function cover(s){return s?.cover||"assets/logo.png?v=6.1"}
function artistLine(s){
  const p=s?.primaryArtist||s?.artist||"KingJJ";
  const f=Array.isArray(s?.featuredArtists)?s.featuredArtists.filter(Boolean):[];
  return f.length?`${p} feat. ${f.join(", ")}`:p;
}
function dateLabel(s){return s?.monthYear||s?.release||s?.releaseDate||s?.year||""}
function audioSrc(s){return s?.audio||s?.src||""}
function newest(a,b){return (Date.parse(b.release||b.releaseDate||b.monthYear||"")||0)-(Date.parse(a.release||a.releaseDate||a.monthYear||"")||0)}

function setTab(name){
  $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  $$(".page").forEach(p=>p.classList.toggle("active",p.id===name));
  if(name==="artists") renderArtists();
  if(name==="playlists") renderPlaylist();
}
function songEl(song,compact=false){
  const i=songs.indexOf(song);
  const el=document.createElement("article");
  el.className=compact?"song-row":"song-card";
  el.innerHTML=`<img src="${cover(song)}" alt=""><div><strong>${esc(song.title)}</strong><span class="song-meta">${esc(artistLine(song))}</span><span class="song-meta">${esc(dateLabel(song))}${song.category?" • "+esc(song.category):""}</span></div><div class="song-actions"><button class="icon-btn play">▶</button><button class="icon-btn add">＋</button></div>`;
  const play=$(".play",el), add=$(".add",el);
  if(play) play.onclick=()=>playIndex(i);
  if(add) add.onclick=()=>addToPlaylist(song.id);
  return el;
}
function renderHome(){
  const list=$("#recentList"); if(list){list.innerHTML=""; songs.slice().sort(newest).slice(0,6).forEach(s=>list.appendChild(songEl(s)))}
  const first=songs[0]; if(first){src("#heroCover",cover(first)); text("#heroTitle",first.title); text("#heroMeta",`${artistLine(first)}${dateLabel(first)?" • "+dateLabel(first):""}`)}
}
function renderSongs(){
  const q=($("#searchInput")?.value||"").toLowerCase().trim();
  const sort=$("#sortSelect")?.value||"newest";
  let arr=songs.filter(s=>`${s.title} ${artistLine(s)} ${s.category||""}`.toLowerCase().includes(q));
  if(sort==="title") arr.sort((a,b)=>a.title.localeCompare(b.title));
  else if(sort==="artist") arr.sort((a,b)=>artistLine(a).localeCompare(artistLine(b)));
  else arr.sort(newest);
  const list=$("#songList"); if(!list)return; list.innerHTML=""; arr.forEach(s=>list.appendChild(songEl(s,true)));
}
function addToPlaylist(id){if(id&&!playlist.includes(id)){playlist.push(id);savePlaylist()} renderPlaylist()}
function renderPlaylist(){
  const list=$("#playlistList"); if(!list)return; list.innerHTML="";
  if(!playlist.length){list.innerHTML='<p class="hint">No songs added yet. Use the ＋ button beside songs.</p>';return}
  playlist.map(id=>songs.find(s=>s.id===id)).filter(Boolean).forEach(s=>{
    const row=songEl(s,true);
    const rem=document.createElement("button"); rem.className="icon-btn"; rem.textContent="−";
    rem.onclick=()=>{playlist=playlist.filter(id=>id!==s.id);savePlaylist();renderPlaylist()};
    const actions=$(".song-actions",row); if(actions)actions.appendChild(rem);
    list.appendChild(row);
  });
}
function allArtists(){
  const m=new Map();
  songs.forEach(s=>{
    const p=s.primaryArtist||s.artist||"KingJJ";
    if(!m.has(p))m.set(p,{primary:0,any:0}); m.get(p).primary++; m.get(p).any++;
    (Array.isArray(s.featuredArtists)?s.featuredArtists:[]).forEach(f=>{if(!m.has(f))m.set(f,{primary:0,any:0});m.get(f).any++});
  });
  return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
}
function renderArtists(){
  const mode=$("#artistMode")?.value||"any";
  const list=$("#artistList"); if(!list)return; list.innerHTML="";
  allArtists().forEach(([name,c])=>{
    const count=mode==="primary"?c.primary:c.any; if(!count)return;
    const b=document.createElement("button"); b.className="artist-card"; b.innerHTML=`<strong>${esc(name)}</strong><span class="song-meta">${count} song${count===1?"":"s"}</span>`;
    b.onclick=()=>renderArtistSongs(name); list.appendChild(b);
  });
}
function renderArtistSongs(name){
  const mode=$("#artistMode")?.value||"any", list=$("#artistSongs"); if(!list)return; list.innerHTML="";
  songs.filter(s=>{const p=s.primaryArtist||s.artist||"KingJJ", f=Array.isArray(s.featuredArtists)?s.featuredArtists:[]; return mode==="primary"?p===name:p===name||f.includes(name)}).forEach(s=>list.appendChild(songEl(s,true)));
}
function updatePlayer(){
  const s=songs[currentIndex]; if(!s)return;
  src("#barCover",cover(s)); text("#barTitle",s.title); text("#barArtist",artistLine(s));
  src("#npCover",cover(s)); text("#npTitle",s.title); text("#npMeta",`${artistLine(s)}${dateLabel(s)?" • "+dateLabel(s):""}`);
  text("#lyricsPanel",s.lyrics||"No lyrics added yet.");
  const playing=audio&&!audio.paused; text("#playBtn",playing?"⏸":"▶"); text("#npPlay",playing?"⏸":"▶");
}
function playIndex(i){
  if(i<0||i>=songs.length||!audio)return;
  currentIndex=i; const s=songs[i], a=audioSrc(s);
  if(!a){alert("This song is missing its audio file path.");return}
  audio.src=a; const player=$("#player"); if(player)player.hidden=false; audio.play().catch(()=>{}); updatePlayer();
}
function togglePlay(){if(currentIndex<0){playIndex(0);return} if(audio.paused)audio.play().catch(()=>{}); else audio.pause(); updatePlayer()}
function next(){if(songs.length)playIndex((currentIndex+1)%songs.length)}
function prev(){if(songs.length)playIndex((currentIndex-1+songs.length)%songs.length)}
function exportPlaylist(){const code=btoa(unescape(encodeURIComponent(JSON.stringify(playlist)))); const box=$("#playlistCode"); if(box)box.value=code; navigator.clipboard?.writeText(code).catch(()=>{})}
function importPlaylistCode(){
  const raw=$("#playlistCode")?.value.trim(); if(!raw){alert("Paste a playlist code first.");return}
  try{playlist=JSON.parse(decodeURIComponent(escape(atob(raw)))).filter(id=>songs.some(s=>s.id===id));savePlaylist();renderPlaylist()}catch{alert("That playlist code did not work.")}
}
function bindEvents(){
  $$(".tab,.brand").forEach(b=>b.onclick=()=>setTab(b.dataset.tab||"home"));
  click("#playFirst",()=>playIndex(0)); click("#shuffleBtn",()=>songs.length&&playIndex(Math.floor(Math.random()*songs.length)));
  listen("#searchInput","input",renderSongs); listen("#sortSelect","change",renderSongs); listen("#artistMode","change",renderArtists);
  click("#playBtn",togglePlay); click("#npPlay",togglePlay); click("#nextBtn",next); click("#npNext",next); click("#prevBtn",prev); click("#npPrev",prev);
  click("#openNowPlaying",()=>$("#nowPlaying")?.showModal?.()); click("#closeNowPlaying",()=>$("#nowPlaying")?.close?.());
  click("#toggleLyrics",()=>{const p=$("#lyricsPanel"); if(p)p.hidden=!p.hidden}); click("#toggleQueue",()=>{const p=$("#queuePanel"); if(p)p.hidden=!p.hidden});
  click("#addCurrent",()=>songs[currentIndex]&&addToPlaylist(songs[currentIndex].id));
  click("#sharePlaylist",exportPlaylist); click("#importPlaylist",importPlaylistCode); click("#clearPlaylist",()=>{playlist=[];savePlaylist();renderPlaylist()});
  listen("#seek","input",()=>{const seek=$("#seek"); if(audio?.duration&&seek)audio.currentTime=(seek.value/100)*audio.duration});
  if(audio){audio.onplay=updatePlayer;audio.onpause=updatePlayer;audio.onended=next;audio.ontimeupdate=()=>{const seek=$("#seek"); if(audio.duration&&seek)seek.value=Math.round(audio.currentTime/audio.duration*100)}}
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;const b=$("#installBtn");if(b)b.hidden=false});
  click("#installBtn",()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();deferredInstallPrompt=null;const b=$("#installBtn");if(b)b.hidden=true}});
}
async function init(){
  try{
    const res=await fetch("songs.json?v=6.1",{cache:"no-store"}); if(!res.ok)throw new Error("songs.json failed to load");
    songs=await res.json(); if(!Array.isArray(songs))throw new Error("songs.json is not an array");
    songs=songs.map((s,i)=>({...s, id:s.id||`song-${i+1}`}));
    renderHome(); renderSongs(); renderPlaylist(); bindEvents();
    if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js?v=6.1").catch(()=>{});
  }catch(e){
    console.error(e);
    document.body.innerHTML=`<main style="padding:24px;color:white;background:#050505;min-height:100vh;font-family:system-ui"><h1>Could not load Kings Music</h1><p>${esc(e.message||e)}</p></main>`;
  }
}
init();
