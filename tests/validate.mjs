import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { LANGUAGES, TEXT } from '../dist/js/data.js';
import { WordManager, progressionWeights } from '../dist/js/word-manager.js';
import { Game } from '../dist/js/game.js';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('dist/index.html', root), 'utf8');
const hosting = JSON.parse(await readFile(new URL('.openai/hosting.json', root), 'utf8'));

assert.match(html, /<title>LEARN_TYPING/);
assert.match(html, /id="gameCanvas"/);
assert.equal(hosting.static.directory, 'dist');
assert.ok(hosting.project_id.startsWith('appgprj_'));

for (const asset of ['dist/styles.css','dist/favicon.svg','dist/js/main.js','dist/js/game.js','dist/js/data.js','dist/js/services.js','dist/js/word-manager.js','THIRD_PARTY_NOTICES.md']) {
  await access(new URL(asset, root));
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML ids must be unique');

const translationKeys = new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map(match => match[1]));
for (const language of ['fr','en']) {
  for (const key of translationKeys) assert.ok(TEXT[language][key], `${language}.${key} is missing`);
}

assert.deepEqual(Object.keys(TEXT.fr).sort(), Object.keys(TEXT.en).sort(), 'Translation catalogs must stay aligned');
assert.equal(Object.keys(LANGUAGES).length, 12);

const ranges={beginner:[3,5],intermediate:[6,8],advanced:[9,12],expert:[13,24]};
const dictionaries={};let totalWords=0;
for(const [language,metadata] of Object.entries(LANGUAGES)){
  const dictionary=JSON.parse(await readFile(new URL(`dist/data/dictionaries/${language}.json`,root),'utf8'));dictionaries[language]=dictionary;
  assert.equal(dictionary.language,language);assert.equal(dictionary.locale,metadata.locale);assert.equal(dictionary.counts.total,2000);
  assert.equal(dictionary.normalization,'NFC');assert.equal(dictionary.source.license,'CC BY-SA 4.0');assert.ok(dictionary.source.url.startsWith('https://'));
  const all=[];
  for(const [group,[minimum,maximum]] of Object.entries(ranges)){
    assert.equal(dictionary.groups[group].length,dictionary.counts[group]);
    for(const word of dictionary.groups[group]){const length=Array.from(word).length;assert.equal(word,word.normalize('NFC'));assert.ok(length>=minimum&&length<=maximum,`${language}:${word} is misgrouped`);assert.match(word,/^\p{L}+$/u);all.push(word);}
  }
  assert.equal(new Set(all).size,all.length,`${language} contains duplicate words`);totalWords+=all.length;
}

assert.equal(totalWords,24000);
assert.ok(dictionaries.fr.groups.beginner.some(word=>/[^\x00-\x7F]/.test(word)),'French words should exercise accented input');
assert.equal(dictionaries.pt.variant,'European Portuguese (pt-PT)');

const first=new WordManager();first.setDictionary(dictionaries.fr);first.startSession('mission-07');
const second=new WordManager();second.setDictionary(dictionaries.fr);second.startSession('mission-07');
const sequenceA=Array.from({length:150},()=>first.next({wave:8,difficulty:'normal'}).word);
const sequenceB=Array.from({length:150},()=>second.next({wave:8,difficulty:'normal'}).word);
assert.deepEqual(sequenceA,sequenceB,'Seeded sessions must be deterministic');assert.equal(new Set(sequenceA).size,sequenceA.length,'Words should not repeat within a normal session');
const blocked=second.next({wave:1,activeWords:[sequenceB[0],sequenceB[1]]});assert.ok(![sequenceB[0],sequenceB[1]].includes(blocked.word));
assert.ok(progressionWeights(1).beginner>progressionWeights(1).advanced);assert.ok(progressionWeights(25).expert>progressionWeights(1).expert);

const memory=new Map();globalThis.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
memory.set('learn_typing_save_v1',JSON.stringify({version:1,settings:{language:'en',difficulty:'normal',mode:'classic'},scores:{'classic:normal':[{score:10}]},lifetime:{},achievements:[]}));
const {StorageService}=await import('../dist/js/services.js');const storage=new StorageService();
assert.equal(storage.data.version,2);assert.equal(storage.data.settings.uiLanguage,'en');assert.equal(storage.data.settings.typingLanguage,'en');assert.ok(storage.data.scores['en:classic:normal']);
storage.recordWordMistake('en','keyboard','intermediate');storage.recordWordSuccess('en','keyboard','intermediate');assert.equal(storage.data.vocabulary.en.keyboard.incorrect,1);assert.equal(storage.data.vocabulary.en.keyboard.correct,1);

for(const mode of ['classic','survival','time','practice']){
  const game=Object.create(Game.prototype);game.state='running';game.settings={mode,uiLanguage:'fr'};game.callbacks={};game.target=null;let typed='';game.typeCharacter=character=>{typed=character;};
  const space={key:' ',code:'Space',ctrlKey:false,altKey:false,metaKey:false,repeat:false,prevented:false,preventDefault(){this.prevented=true;}};
  game.handleKey(space);assert.equal(game.state,'paused',`${mode}: Space should pause`);assert.equal(space.prevented,true,`${mode}: Space should prevent scrolling`);
  const resume={...space,prevented:false,preventDefault:space.preventDefault};game.handleKey(resume);assert.equal(game.state,'running',`${mode}: Space should resume`);
  const letterP={key:'p',code:'KeyP',ctrlKey:false,altKey:false,metaKey:false,repeat:false,prevented:false,preventDefault:space.preventDefault};game.handleKey(letterP);assert.equal(typed,'p',`${mode}: P should remain a typing key`);
}

console.log(`Validated ${ids.length} UI ids, ${translationKeys.size} translated labels, 12 dictionaries and ${totalWords} sourced words.`);
