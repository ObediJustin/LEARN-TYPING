const GROUPS = ['beginner','intermediate','advanced','expert'];

function hashSeed(value) {
  let hash=2166136261;
  for(const char of String(value)){hash^=char.codePointAt(0);hash=Math.imul(hash,16777619);}
  return hash>>>0||1;
}

export function progressionWeights(wave, difficulty='normal') {
  const offset=difficulty==='rookie'?-3:difficulty==='expert'?3:0;
  const effective=Math.max(1,wave+offset);
  if(effective<=3)return {beginner:.86,intermediate:.14,advanced:0,expert:0};
  if(effective<=7)return {beginner:.44,intermediate:.51,advanced:.05,expert:0};
  if(effective<=12)return {beginner:.1,intermediate:.64,advanced:.26,expert:0};
  if(effective<=20)return {beginner:0,intermediate:.34,advanced:.56,expert:.1};
  return {beginner:0,intermediate:.14,advanced:.56,expert:.3};
}

export class WordManager {
  constructor({fetcher=globalThis.fetch,baseUrl=new URL('../data/dictionaries/',import.meta.url)}={}) {
    this.fetcher=fetcher;this.baseUrl=baseUrl;this.dictionary=null;this.language=null;this.bags={};this.recent=[];this.seen=new Set();this.state=1;
  }
  async load(language) {
    if(this.language===language&&this.dictionary)return this.dictionary;
    const response=await this.fetcher(new URL(`${language}.json`,this.baseUrl));
    if(!response.ok)throw new Error(`Dictionary ${language}: ${response.status}`);
    const dictionary=await response.json();this.setDictionary(dictionary);return dictionary;
  }
  setDictionary(dictionary) {
    if(!dictionary||dictionary.schemaVersion!==1||!dictionary.groups)throw new Error('Invalid dictionary schema');
    for(const group of GROUPS)if(!Array.isArray(dictionary.groups[group])||!dictionary.groups[group].length)throw new Error(`Dictionary group missing: ${group}`);
    this.dictionary=dictionary;this.language=dictionary.language;return dictionary;
  }
  startSession(seed=Date.now()) {
    if(!this.dictionary)throw new Error('Load a dictionary before starting a session');
    this.state=hashSeed(`${this.language}:${seed}`);this.bags={};this.recent=[];this.seen.clear();
    for(const group of GROUPS)this.bags[group]=this.shuffle(this.dictionary.groups[group]);
  }
  random() {this.state^=this.state<<13;this.state^=this.state>>>17;this.state^=this.state<<5;return (this.state>>>0)/4294967296;}
  shuffle(values) {const copy=[...values];for(let i=copy.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
  weightedGroup(weights) {let cursor=this.random(),fallback='beginner';for(const group of GROUPS){if(weights[group]>0)fallback=group;cursor-=weights[group]||0;if(cursor<=0)return group;}return fallback;}
  next({wave=1,difficulty='normal',type='fighter',activeWords=[]}={}) {
    const adjustedWave=wave+(type==='boss'?5:type==='tank'?2:type==='scout'?-1:type==='phantom'?3:0);
    const weights=progressionWeights(Math.max(1,adjustedWave),difficulty),active=new Set(activeWords);
    for(let attempt=0;attempt<12;attempt++){
      const group=this.weightedGroup(weights),result=this.take(group,active);if(result)return {word:result,group};
    }
    for(const group of GROUPS){const result=this.take(group,active);if(result)return {word:result,group};}
    throw new Error(`No usable words in ${this.language}`);
  }
  take(group,active) {
    let bag=this.bags[group];
    if(!bag?.length){const recent=new Set(this.recent.slice(-80));const fresh=this.dictionary.groups[group].filter(word=>!recent.has(word));bag=this.shuffle(fresh.length?fresh:this.dictionary.groups[group]);this.bags[group]=bag;}
    for(let i=bag.length-1;i>=0;i--){const word=bag[i];if(active.has(word))continue;bag.splice(i,1);this.seen.add(word);this.recent.push(word);if(this.recent.length>120)this.recent.shift();return word;}
    return null;
  }
}
