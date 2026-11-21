import { mkdir, writeFile } from 'node:fs/promises';

const OUTPUT = new URL('../dist/data/dictionaries/', import.meta.url);
const TARGET = 2000;
const QUOTAS = { beginner: 500, intermediate: 800, advanced: 550, expert: 150 };
const RETRIEVED = '2026-11-21';

const languages = {
  fr: { name:'Français', locale:'fr-FR', alphabet:/^[a-zàâçéèêëîïôûùüÿœæ]+$/u },
  en: { name:'English', locale:'en-GB', alphabet:/^[a-z]+$/u },
  sw: { name:'Kiswahili', locale:'sw-TZ', alphabet:/^[a-z]+$/u, source:'wordtide' },
  es: { name:'Español', locale:'es-ES', alphabet:/^[a-záéíóúüñ]+$/u },
  pt: { name:'Português (Portugal)', locale:'pt-PT', alphabet:/^[a-záàâãçéêíóôõúü]+$/u },
  it: { name:'Italiano', locale:'it-IT', alphabet:/^[a-zàèéìíîòóùú]+$/u },
  de: { name:'Deutsch', locale:'de-DE', alphabet:/^[a-zäöüß]+$/u },
  tr: { name:'Türkçe', locale:'tr-TR', alphabet:/^[abcçdefgğhıijklmnoöprsştuüvyz]+$/u },
  id: { name:'Bahasa Indonesia', locale:'id-ID', alphabet:/^[a-z]+$/u },
  nl: { name:'Nederlands', locale:'nl-NL', alphabet:/^[a-záéèëïöü]+$/u },
  pl: { name:'Polski', locale:'pl-PL', alphabet:/^[a-ząćęłńóśźż]+$/u },
  ro: { name:'Română', locale:'ro-RO', alphabet:/^[a-zăâîșț]+$/u }
};

const exclusions = {
  fr:['merde','putain','connard','salope','bite','nique','enculé','enculer','pute'],
  en:['fuck','shit','bitch','cunt','dick','cock','pussy','asshole','bastard','whore'],
  sw:[],
  es:['mierda','puta','puto','coño','joder','polla','cabrón','maricón'],
  pt:['merda','puta','puto','caralho','foder','buceta','viado'],
  it:['merda','puttana','cazzo','vaffanculo','stronzo','troia'],
  de:['scheiße','scheisse','hurensohn','ficken','fotze','arschloch','schlampe'],
  tr:['siktir','orospu','amcık','piç','yarrak'],
  id:['kontol','memek','ngentot','bangsat','bajingan','jancok','lonte'],
  nl:['kanker','hoer','neuken','tering','klootzak'],
  pl:['kurwa','chuj','pierdolić','cipa','skurwysyn'],
  ro:['pula','muie','curva','futut','căcat','pizda']
};

const sourceFrequency = {
  name: 'FrequencyWords — OpenSubtitles 2018 frequency lists',
  author: 'Hermit Dave / OpenSubtitles contributors',
  url: 'https://github.com/hermitdave/FrequencyWords',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/'
};
const sourceSwahili = {
  name: 'Wordtide Kiswahili word list',
  author: 'Wiktionary contributors; extraction by Tatu Ylonen (kaikki.org / wiktextract); Wordtide filtering',
  url: 'https://wordtide.app/dict/sw.txt',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/'
};

function hash(text) { let value=2166136261; for (const char of text) {value^=char.codePointAt(0);value=Math.imul(value,16777619);} return value>>>0; }
function seededShuffle(values, seed) {
  let state=hash(seed)||1; const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};
  const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;
}
function groupFor(word) {const length=Array.from(word).length;return length<=5?'beginner':length<=8?'intermediate':length<=12?'advanced':'expert';}
function normalizeWord(raw, config) {
  let word=raw.trim().normalize('NFC').toLocaleLowerCase(config.locale);
  if(config.locale==='ro-RO')word=word.replaceAll('ş','ș').replaceAll('ţ','ț');
  return word;
}
function parseFrequency(text) {return text.split(/\r?\n/).map(line=>line.trim().split(/\s+/)[0]).filter(Boolean);}
function parseWordtide(text) {return text.split(/\r?\n/).map(line=>line.split('\t')[0]).filter(Boolean);}

function selectWords(rawWords, code, config) {
  const blocked=new Set(exclusions[code].map(word=>normalizeWord(word,config))),seen=new Set();
  let candidates=[];
  for(const raw of rawWords){const word=normalizeWord(raw,config),length=Array.from(word).length;if(length<3||length>24||!config.alphabet.test(word)||blocked.has(word)||seen.has(word))continue;seen.add(word);candidates.push(word);}
  if(config.source==='wordtide')candidates=seededShuffle(candidates,`learn-typing-${code}-2026`);
  const available={beginner:[],intermediate:[],advanced:[],expert:[]};for(const word of candidates)available[groupFor(word)].push(word);
  const groups={beginner:[],intermediate:[],advanced:[],expert:[]};const used=new Set();
  for(const group of Object.keys(groups)){for(const word of available[group]){if(groups[group].length>=QUOTAS[group])break;groups[group].push(word);used.add(word);}}
  if(used.size<TARGET){for(const word of candidates){if(used.size>=TARGET)break;if(used.has(word))continue;groups[groupFor(word)].push(word);used.add(word);}}
  if(used.size<TARGET)throw new Error(`${code}: only ${used.size} valid unique words available`);
  return {groups, rejected:rawWords.length-seen.size, candidates:seen.size};
}

await mkdir(OUTPUT,{recursive:true});
for(const [code,config] of Object.entries(languages)){
  const url=config.source==='wordtide'?sourceSwahili.url:`https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/${code}/${code}_50k.txt`;
  const response=await fetch(url);if(!response.ok)throw new Error(`${code}: ${response.status} ${response.statusText}`);
  const text=await response.text(),raw=config.source==='wordtide'?parseWordtide(text):parseFrequency(text);
  const selected=selectWords(raw,code,config),counts=Object.fromEntries(Object.entries(selected.groups).map(([group,words])=>[group,words.length]));
  const dictionary={schemaVersion:1,language:code,nativeName:config.name,locale:config.locale,variant:code==='pt'?'European Portuguese (pt-PT)':null,normalization:'NFC',counts:{...counts,total:Object.values(counts).reduce((a,b)=>a+b,0)},validation:{minimumLength:3,maximumLength:24,unique:true,lettersOnly:true,excludedTerms:exclusions[code].length,candidateCount:selected.candidates,rejectedCount:selected.rejected},source:{...(config.source==='wordtide'?sourceSwahili:sourceFrequency),retrieved:RETRIEVED},groups:selected.groups};
  await writeFile(new URL(`${code}.json`,OUTPUT),`${JSON.stringify(dictionary)}\n`,'utf8');
  console.log(`${code}: ${dictionary.counts.total} words (${Object.entries(counts).map(([k,v])=>`${k}=${v}`).join(', ')})`);
}
