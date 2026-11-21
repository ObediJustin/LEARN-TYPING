import { Game } from './game.js';
import { TEXT, t } from './data.js';
import { StorageService, AudioService } from './services.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const storage = new StorageService();
let settings = storage.data.settings;
const audio = new AudioService(settings);

const ui = {
  app: $('#app'), menu: $('#menu'), hud: $('#hud'), pause: $('#pauseScreen'), over: $('#gameOverScreen'), modal: $('#modal'),
  score: $('#scoreValue'), wave: $('#waveValue'), combo: $('#comboValue'), wpm: $('#wpmValue'), accuracy: $('#accuracyValue'),
  timerStat: $('#timerStat'), timer: $('#timerValue'), power: $('#powerupBadge'), powerText: $('#powerupText'), powerIcon: $('#powerupIcon'),
  language: $('#languageSelect'), difficulty: $('#difficultySelect'), waveBanner: $('#waveBanner'), waveBannerValue: $('#waveBannerValue'),
  finalScore: $('#finalScoreValue'), results: $('#resultsGrid'), newRecord: $('#newRecord'), modalTitle: $('#modalTitle'), modalBody: $('#modalBody'),
  sound: $('#soundBtn'), toast: $('#toastLayer')
};

const powerIcons = {freeze:'❄',shield:'◇',double:'×2',emp:'ϟ'};

const game = new Game($('#gameCanvas'), {audio,storage,settings}, {
  onHUD:updateHUD,
  onWave:showWave,
  onPause:paused=>showPause(paused),
  onOver:showGameOver,
  onError:()=>{ui.app.classList.remove('error-flash');void ui.app.offsetWidth;ui.app.classList.add('error-flash');setTimeout(()=>ui.app.classList.remove('error-flash'),260);},
  onToast:(title,body)=>toast(title,body),
  onAchievement:id=>toast(t(settings.language,'achievement'),t(settings.language,id))
});

function applySettings() {
  settings=storage.data.settings;game.configure(settings);audio.update(settings);
  ui.language.value=settings.language;ui.difficulty.value=settings.difficulty;
  const mode=$(`input[name="mode"][value="${settings.mode}"]`);if(mode)mode.checked=true;
  document.documentElement.lang=settings.language;document.body.classList.toggle('reduced-motion',settings.reducedMotion);
  ui.sound.textContent=settings.sound?'◉':'○';ui.sound.setAttribute('aria-label',settings.sound?t(settings.language,'audio'):'Muted');
  $$('[data-i18n]').forEach(el=>{const value=t(settings.language,el.dataset.i18n);if(value)el.textContent=value;});
  document.title=`LEARN_TYPING — ${settings.language==='fr'?'Défense néon':'Neon Defense'}`;
}

function saveMenuChoices() {
  const mode=$('input[name="mode"]:checked')?.value||'classic';
  storage.setSettings({language:ui.language.value,difficulty:ui.difficulty.value,mode});applySettings();
}

async function launch() {
  saveMenuChoices();await audio.init();ui.menu.classList.add('is-hidden');ui.pause.classList.add('is-hidden');ui.over.classList.add('is-hidden');ui.modal.classList.add('is-hidden');ui.hud.classList.remove('is-hidden');
  ui.timerStat.classList.toggle('is-hidden',settings.mode!=='time');game.start();
}

function returnMenu() {
  game.returnToMenu();ui.hud.classList.add('is-hidden');ui.pause.classList.add('is-hidden');ui.over.classList.add('is-hidden');ui.modal.classList.add('is-hidden');ui.menu.classList.remove('is-hidden');
}

function updateHUD(s) {
  ui.score.textContent=String(Math.floor(s.score)).padStart(6,'0');ui.wave.textContent=String(s.wave).padStart(2,'0');ui.combo.textContent=`×${s.multiplier}`;ui.wpm.textContent=String(Math.round(s.wpm));ui.accuracy.textContent=`${Math.round(s.accuracy)}%`;
  if(s.timeLeft!==null)ui.timer.textContent=String(Math.ceil(s.timeLeft));
  const active=s.powerup||s.shield?{type:s.powerup?.type||'shield'}:null;ui.power.classList.toggle('is-hidden',!active);
  if(active){ui.powerIcon.textContent=powerIcons[active.type]||'✦';const duration=s.powerTime?` ${Math.ceil(s.powerTime)}s`:'';ui.powerText.textContent=`${t(settings.language,active.type)}${duration}`;}
}

let waveTimer;
function showWave(wave) {
  clearTimeout(waveTimer);ui.waveBannerValue.textContent=wave;ui.waveBanner.classList.remove('is-hidden');
  waveTimer=setTimeout(()=>ui.waveBanner.classList.add('is-hidden'),2050);
}

function showPause(paused) {ui.pause.classList.toggle('is-hidden',!paused);}

function showGameOver(result,record) {
  ui.hud.classList.add('is-hidden');ui.over.classList.remove('is-hidden');ui.newRecord.classList.toggle('is-hidden',!record);ui.finalScore.textContent=Math.floor(result.score).toLocaleString(settings.language);
  const items=[
    [t(settings.language,'waveReached'),result.wave],
    [t(settings.language,'avgWpm'),Math.round(result.wpm)],
    [t(settings.language,'accuracy'),`${Math.round(result.accuracy)}%`],
    [t(settings.language,'maxCombo'),result.maxCombo],
    [t(settings.language,'words'),result.words],
    [t(settings.language,'survivalTime'),formatTime(result.elapsed)]
  ];
  ui.results.innerHTML=items.map(([label,value])=>`<div class="result-item"><span>${label}</span><strong>${value}</strong></div>`).join('');
}

function formatTime(seconds) {const m=Math.floor(seconds/60),s=Math.floor(seconds%60);return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}

function toast(title,body='') {
  const el=document.createElement('div');el.className='toast';el.innerHTML=`<strong>${escapeHtml(title)}</strong>${body?`<span>${escapeHtml(body)}</span>`:''}`;ui.toast.append(el);setTimeout(()=>el.remove(),3200);
}
function escapeHtml(value) {return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

function openModal(type) {
  ui.modal.classList.remove('is-hidden');
  if(type==='how'){ui.modalTitle.textContent=t(settings.language,'howTitle');ui.modalBody.innerHTML=t(settings.language,'howHtml');}
  if(type==='scores')renderScores();
  if(type==='settings')renderSettings();
}
function closeModal(){ui.modal.classList.add('is-hidden');}

function renderScores() {
  ui.modalTitle.textContent=t(settings.language,'scoresTitle');
  const modes=['classic','survival','time'],labels={classic:t(settings.language,'classic'),survival:t(settings.language,'survival'),time:t(settings.language,'timeAttack')};
  let html='';for(const mode of modes){const key=`${mode}:${settings.difficulty}`,list=storage.data.scores[key]||[];html+=`<h3>${labels[mode]} · ${t(settings.language,settings.difficulty)}</h3>`;
    if(!list.length){html+=`<div class="empty-state">${t(settings.language,'noScores')}</div>`;continue;}
    html+=`<table class="score-table"><thead><tr><th>${t(settings.language,'rank')}</th><th>${t(settings.language,'missionScore')}</th><th>WPM</th><th>${t(settings.language,'accuracy')}</th></tr></thead><tbody>${list.map((x,i)=>`<tr><td>#${i+1}</td><td>${Math.floor(x.score).toLocaleString(settings.language)}</td><td>${Math.round(x.wpm)}</td><td>${Math.round(x.accuracy)}%</td></tr>`).join('')}</tbody></table>`;}
  ui.modalBody.innerHTML=html;
}

function renderSettings() {
  ui.modalTitle.textContent=t(settings.language,'settingsTitle');
  ui.modalBody.innerHTML=`
    <div class="setting-line"><div><strong>${t(settings.language,'audio')}</strong></div><input id="settingSound" class="toggle" type="checkbox" ${settings.sound?'checked':''}></div>
    <div class="setting-line"><div><strong>${t(settings.language,'ambience')}</strong></div><input id="settingAmbience" class="toggle" type="checkbox" ${settings.ambience?'checked':''}></div>
    <div class="setting-line"><div><strong>${t(settings.language,'volume')}</strong></div><input id="settingVolume" type="range" min="0" max="1" step="0.05" value="${settings.volume}"></div>
    <div class="setting-line"><div><strong>${t(settings.language,'reducedMotion')}</strong></div><input id="settingMotion" class="toggle" type="checkbox" ${settings.reducedMotion?'checked':''}></div>
    <div class="setting-line"><div><strong>${t(settings.language,'accentPolicy')}</strong><p>${t(settings.language,'accentHelp')}</p></div><input id="settingAccents" class="toggle" type="checkbox" ${settings.accentTolerance?'checked':''}></div>
    <div class="setting-line"><button id="resetScores" class="secondary-btn" type="button">${t(settings.language,'resetData')}</button></div>`;
  $('#settingSound').addEventListener('change',e=>updateSetting({sound:e.target.checked}));
  $('#settingAmbience').addEventListener('change',e=>updateSetting({ambience:e.target.checked}));
  $('#settingVolume').addEventListener('input',e=>updateSetting({volume:Number(e.target.value)}));
  $('#settingMotion').addEventListener('change',e=>updateSetting({reducedMotion:e.target.checked}));
  $('#settingAccents').addEventListener('change',e=>updateSetting({accentTolerance:e.target.checked}));
  $('#resetScores').addEventListener('click',()=>{if(confirm(t(settings.language,'confirmReset'))){const keep={...storage.data.settings};storage.reset();storage.setSettings(keep);applySettings();renderSettings();toast(t(settings.language,'resetData'),'OK');}});
}
function updateSetting(patch){storage.setSettings(patch);applySettings();audio.init();}

$('#playBtn').addEventListener('click',launch);
ui.language.addEventListener('change',()=>{storage.setSettings({language:ui.language.value});applySettings();});
ui.difficulty.addEventListener('change',()=>storage.setSettings({difficulty:ui.difficulty.value}));
$$('input[name="mode"]').forEach(x=>x.addEventListener('change',()=>storage.setSettings({mode:x.value})));
$$('[data-modal]').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.modal)));
$('#modalClose').addEventListener('click',closeModal);
ui.modal.addEventListener('click',e=>{if(e.target===ui.modal)closeModal();});
$('#pauseBtn').addEventListener('click',()=>game.pause());
$('#resumeBtn').addEventListener('click',()=>game.resume());
$('#restartBtn').addEventListener('click',()=>{ui.pause.classList.add('is-hidden');game.restart();});
$('#playAgainBtn').addEventListener('click',()=>{ui.over.classList.add('is-hidden');ui.hud.classList.remove('is-hidden');game.restart();});
$$('[data-action="menu"]').forEach(b=>b.addEventListener('click',returnMenu));
ui.sound.addEventListener('click',async()=>{storage.setSettings({sound:!settings.sound});applySettings();await audio.init();});

document.addEventListener('keydown',event=>{
  if(!ui.modal.classList.contains('is-hidden')){if(event.key==='Escape'){event.preventDefault();closeModal();}return;}
  if(!ui.menu.classList.contains('is-hidden')){if(event.key==='Enter'&&!['SELECT','BUTTON'].includes(document.activeElement?.tagName)){event.preventDefault();launch();}return;}
  game.handleKey(event);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&['running','transition'].includes(game.state))game.pause();});
window.addEventListener('blur',()=>{if(['running','transition'].includes(game.state))game.pause();});

applySettings();
