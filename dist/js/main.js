import { Game } from './game.js';
import { LANGUAGES, t } from './data.js';
import { StorageService, AudioService } from './services.js';
import { WordManager } from './word-manager.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const storage = new StorageService();
let settings = storage.data.settings;
const audio = new AudioService(settings);
const words = new WordManager();

const ui = {
  app: $('#app'), menu: $('#menu'), hud: $('#hud'), pause: $('#pauseScreen'), over: $('#gameOverScreen'), modal: $('#modal'),
  score: $('#scoreValue'), wave: $('#waveValue'), combo: $('#comboValue'), wpm: $('#wpmValue'), accuracy: $('#accuracyValue'),
  timerStat: $('#timerStat'), timer: $('#timerValue'), power: $('#powerupBadge'), powerText: $('#powerupText'), powerIcon: $('#powerupIcon'),
  interfaceLanguage: $('#interfaceLanguageSelect'), typingLanguage: $('#typingLanguageSelect'), difficulty: $('#difficultySelect'), waveBanner: $('#waveBanner'), waveBannerValue: $('#waveBannerValue'), activeLanguage: $('#activeLanguageValue'),
  finalScore: $('#finalScoreValue'), results: $('#resultsGrid'), newRecord: $('#newRecord'), modalTitle: $('#modalTitle'), modalBody: $('#modalBody'),
  sound: $('#soundBtn'), toast: $('#toastLayer'), comboBurst: $('#comboBurst'), comboBurstValue: $('#comboBurstValue')
};

const powerIcons = {freeze:'❄',shield:'◇',double:'×2',emp:'ϟ'};

const game = new Game($('#gameCanvas'), {audio,storage,words,settings}, {
  onHUD:updateHUD,
  onWave:showWave,
  onPause:paused=>showPause(paused),
  onOver:showGameOver,
  onError:()=>{ui.app.classList.remove('error-flash');void ui.app.offsetWidth;ui.app.classList.add('error-flash');setTimeout(()=>ui.app.classList.remove('error-flash'),260);},
  onToast:(title,body)=>toast(title,body),
  onCombo:(multiplier)=>showCombo(multiplier),
  onAchievement:id=>toast(t(settings.uiLanguage,'achievement'),t(settings.uiLanguage,id))
});

function applySettings() {
  settings=storage.data.settings;game.configure(settings);audio.update(settings);
  ui.interfaceLanguage.value=settings.uiLanguage;ui.typingLanguage.value=settings.typingLanguage;ui.difficulty.value=settings.difficulty;
  const mode=$(`input[name="mode"][value="${settings.mode}"]`);if(mode)mode.checked=true;
  document.documentElement.lang=settings.uiLanguage;document.body.classList.toggle('reduced-motion',settings.reducedMotion);
  ui.sound.textContent=settings.sound?'◉':'○';ui.sound.setAttribute('aria-label',settings.sound?t(settings.uiLanguage,'audio'):'Muted');
  $$('[data-i18n]').forEach(el=>{const value=t(settings.uiLanguage,el.dataset.i18n);if(value)el.textContent=value;});
  ui.activeLanguage.textContent=settings.typingLanguage.toUpperCase();
  document.title=`LEARN_TYPING — ${settings.uiLanguage==='fr'?'Défense néon':'Neon Defense'}`;
}

function saveMenuChoices() {
  const mode=$('input[name="mode"]:checked')?.value||'classic';
  storage.setSettings({uiLanguage:ui.interfaceLanguage.value,typingLanguage:ui.typingLanguage.value,difficulty:ui.difficulty.value,mode});applySettings();
}

async function launch() {
  saveMenuChoices();const button=$('#playBtn'),label=button.querySelector('[data-i18n="launch"]');button.disabled=true;label.textContent=t(settings.uiLanguage,'loadingWords');
  try {await words.load(settings.typingLanguage);await audio.init();ui.menu.classList.add('is-hidden');ui.pause.classList.add('is-hidden');ui.over.classList.add('is-hidden');ui.modal.classList.add('is-hidden');ui.hud.classList.remove('is-hidden');ui.timerStat.classList.toggle('is-hidden',settings.mode!=='time');game.start();}
  catch(error){console.error(error);toast(t(settings.uiLanguage,'dictionaryError'),LANGUAGES[settings.typingLanguage]?.nativeName||settings.typingLanguage);}
  finally{button.disabled=false;label.textContent=t(settings.uiLanguage,'launch');}
}

function returnMenu() {
  game.returnToMenu();ui.hud.classList.add('is-hidden');ui.pause.classList.add('is-hidden');ui.over.classList.add('is-hidden');ui.modal.classList.add('is-hidden');ui.menu.classList.remove('is-hidden');
}

let previousScore=0;
function updateHUD(s) {
  if(s.score===0)previousScore=0;
  if(s.score>previousScore){ui.score.classList.remove('score-pop');void ui.score.offsetWidth;ui.score.classList.add('score-pop');}previousScore=s.score;
  ui.score.textContent=String(Math.floor(s.score)).padStart(6,'0');ui.wave.textContent=String(s.wave).padStart(2,'0');ui.combo.textContent=`×${s.multiplier}`;ui.wpm.textContent=String(Math.round(s.wpm));ui.accuracy.textContent=`${Math.round(s.accuracy)}%`;
  if(s.timeLeft!==null)ui.timer.textContent=String(Math.ceil(s.timeLeft));
  const active=s.powerup||s.shield?{type:s.powerup?.type||'shield'}:null;ui.power.classList.toggle('is-hidden',!active);
  if(active){ui.powerIcon.textContent=powerIcons[active.type]||'✦';const duration=s.powerTime?` ${Math.ceil(s.powerTime)}s`:'';ui.powerText.textContent=`${t(settings.uiLanguage,active.type)}${duration}`;}
}

let comboTimer;
function showCombo(multiplier){clearTimeout(comboTimer);ui.comboBurstValue.textContent=`×${multiplier}`;ui.comboBurst.classList.add('is-hidden');void ui.comboBurst.offsetWidth;ui.comboBurst.classList.remove('is-hidden');comboTimer=setTimeout(()=>ui.comboBurst.classList.add('is-hidden'),900);}

let waveTimer;
function showWave(wave) {
  clearTimeout(waveTimer);ui.waveBannerValue.textContent=wave;ui.waveBanner.classList.remove('is-hidden');
  waveTimer=setTimeout(()=>ui.waveBanner.classList.add('is-hidden'),2050);
}

function showPause(paused) {ui.pause.classList.toggle('is-hidden',!paused);}

function showGameOver(result,record) {
  ui.hud.classList.add('is-hidden');ui.over.classList.remove('is-hidden');ui.newRecord.classList.toggle('is-hidden',!record);ui.finalScore.textContent=Math.floor(result.score).toLocaleString(settings.uiLanguage);
  const items=[
    [t(settings.uiLanguage,'waveReached'),result.wave],
    [t(settings.uiLanguage,'avgWpm'),Math.round(result.wpm)],
    [t(settings.uiLanguage,'accuracy'),`${Math.round(result.accuracy)}%`],
    [t(settings.uiLanguage,'maxCombo'),result.maxCombo],
    [t(settings.uiLanguage,'words'),result.words],
    [t(settings.uiLanguage,'survivalTime'),formatTime(result.elapsed)]
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
  if(type==='how'){ui.modalTitle.textContent=t(settings.uiLanguage,'howTitle');ui.modalBody.innerHTML=t(settings.uiLanguage,'howHtml');}
  if(type==='scores')renderScores();
  if(type==='vocabulary')renderVocabulary();
  if(type==='settings')renderSettings();
}
function closeModal(){ui.modal.classList.add('is-hidden');}

function renderScores() {
  ui.modalTitle.textContent=t(settings.uiLanguage,'scoresTitle');
  const modes=['classic','survival','time'],labels={classic:t(settings.uiLanguage,'classic'),survival:t(settings.uiLanguage,'survival'),time:t(settings.uiLanguage,'timeAttack')};
  let html=`<h3>${LANGUAGES[settings.typingLanguage].nativeName}</h3>`;for(const mode of modes){const key=`${settings.typingLanguage}:${mode}:${settings.difficulty}`,list=storage.data.scores[key]||[];html+=`<h3>${labels[mode]} · ${t(settings.uiLanguage,settings.difficulty)}</h3>`;
    if(!list.length){html+=`<div class="empty-state">${t(settings.uiLanguage,'noScores')}</div>`;continue;}
    html+=`<table class="score-table"><thead><tr><th>${t(settings.uiLanguage,'rank')}</th><th>${t(settings.uiLanguage,'missionScore')}</th><th>WPM</th><th>${t(settings.uiLanguage,'accuracy')}</th></tr></thead><tbody>${list.map((x,i)=>`<tr><td>#${i+1}</td><td>${Math.floor(x.score).toLocaleString(settings.uiLanguage)}</td><td>${Math.round(x.wpm)}</td><td>${Math.round(x.accuracy)}%</td></tr>`).join('')}</tbody></table>`;}
  ui.modalBody.innerHTML=html;
}

function renderVocabulary() {
  const summary=storage.getVocabularySummary();ui.modalTitle.textContent=t(settings.uiLanguage,'vocabularyTitle');
  if(!summary.encountered){ui.modalBody.innerHTML=`<div class="empty-state">${t(settings.uiLanguage,'emptyVocabulary')}</div>`;return;}
  let html=`<div class="progress-summary"><div><strong>${summary.encountered}</strong><span>${t(settings.uiLanguage,'encountered')}</span></div><div><strong>${summary.mastered}</strong><span>${t(settings.uiLanguage,'mastered')}</span></div></div>`;
  for(const [language,data] of Object.entries(summary.languages)){const mistakes=data.mistakes.map(entry=>`<span class="mistake-chip">${escapeHtml(entry.word)} · ${entry.incorrect}</span>`).join('');html+=`<section class="vocab-language"><h3>${LANGUAGES[language]?.nativeName||language}</h3><div class="vocab-metrics"><span>${data.encountered} ${t(settings.uiLanguage,'encountered').toLocaleLowerCase()}</span><strong>${Math.round(data.accuracy)}% ${t(settings.uiLanguage,'accuracy').toLocaleLowerCase()}</strong></div>${mistakes?`<p>${t(settings.uiLanguage,'frequentMistakes')}</p><div class="mistake-list">${mistakes}</div>`:''}</section>`;}
  ui.modalBody.innerHTML=html;
}

function renderSettings() {
  ui.modalTitle.textContent=t(settings.uiLanguage,'settingsTitle');
  ui.modalBody.innerHTML=`
    <div class="setting-line"><div><strong>${t(settings.uiLanguage,'audio')}</strong></div><input id="settingSound" class="toggle" type="checkbox" ${settings.sound?'checked':''}></div>
    <div class="setting-line"><div><strong>${t(settings.uiLanguage,'ambience')}</strong></div><input id="settingAmbience" class="toggle" type="checkbox" ${settings.ambience?'checked':''}></div>
    <div class="setting-line"><div><strong>${t(settings.uiLanguage,'volume')}</strong></div><input id="settingVolume" type="range" min="0" max="1" step="0.05" value="${settings.volume}"></div>
    <div class="setting-line"><div><strong>${t(settings.uiLanguage,'reducedMotion')}</strong></div><input id="settingMotion" class="toggle" type="checkbox" ${settings.reducedMotion?'checked':''}></div>
    <div class="setting-line"><div><strong>${t(settings.uiLanguage,'accentPolicy')}</strong><p>${t(settings.uiLanguage,'accentHelp')}</p></div><input id="settingAccents" class="toggle" type="checkbox" ${settings.accentTolerance?'checked':''}></div>
    <div class="setting-line"><button id="resetScores" class="secondary-btn" type="button">${t(settings.uiLanguage,'resetData')}</button></div>`;
  $('#settingSound').addEventListener('change',e=>updateSetting({sound:e.target.checked}));
  $('#settingAmbience').addEventListener('change',e=>updateSetting({ambience:e.target.checked}));
  $('#settingVolume').addEventListener('input',e=>updateSetting({volume:Number(e.target.value)}));
  $('#settingMotion').addEventListener('change',e=>updateSetting({reducedMotion:e.target.checked}));
  $('#settingAccents').addEventListener('change',e=>updateSetting({accentTolerance:e.target.checked}));
  $('#resetScores').addEventListener('click',()=>{if(confirm(t(settings.uiLanguage,'confirmReset'))){const keep={...storage.data.settings};storage.reset();storage.setSettings(keep);applySettings();renderSettings();toast(t(settings.uiLanguage,'resetData'),'OK');}});
}
function updateSetting(patch){storage.setSettings(patch);applySettings();audio.init();}

$('#playBtn').addEventListener('click',launch);
ui.interfaceLanguage.addEventListener('change',()=>{storage.setSettings({uiLanguage:ui.interfaceLanguage.value});applySettings();});
ui.typingLanguage.addEventListener('change',()=>{storage.setSettings({typingLanguage:ui.typingLanguage.value});applySettings();});
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
