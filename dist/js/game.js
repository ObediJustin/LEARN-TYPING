import { ENEMY_CONFIG, DIFFICULTY, ACHIEVEMENTS, t } from './data.js';

const TAU = Math.PI * 2;
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
const pick = a => a[Math.floor(Math.random()*a.length)];
const normalize = (value, tolerant, locale) => tolerant ? value.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLocaleLowerCase(locale) : value.normalize('NFC').toLocaleLowerCase(locale);

export class Game {
  constructor(canvas, services, callbacks={}) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha:false });
    this.audio = services.audio; this.storage = services.storage; this.words = services.words; this.callbacks = callbacks;
    this.settings = services.settings; this.state = 'menu'; this.last = performance.now(); this.loopStarted = false;
    this.enemies=[]; this.particles=[]; this.lasers=[]; this.rings=[]; this.stars=[]; this.nebulas=[]; this.target=null;
    this.shake=0; this.flash=0; this.playerHit=0; this.playerAngle=0; this.transition=0; this.spawnClock=0; this.hudClock=0; this.freezeUntil=0; this.doubleUntil=0; this.shield=0;
    this.resize = this.resize.bind(this); this.frame = this.frame.bind(this);
    window.addEventListener('resize', this.resize, {passive:true}); this.resize();
    this.seedBackground(); this.beginLoop();
  }

  configure(settings) { this.settings = settings; }
  beginLoop() { if (this.loopStarted) return; this.loopStarted=true; requestAnimationFrame(this.frame); }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75), rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(320,rect.width); this.height = Math.max(480,rect.height); this.dpr=dpr;
    this.canvas.width = Math.floor(this.width*dpr); this.canvas.height = Math.floor(this.height*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0); this.player={x:this.width/2,y:this.height-78};
    if (this.stars.length) this.seedBackground();
  }
  seedBackground() {
    const count = this.settings?.reducedMotion ? 55 : Math.min(150,Math.floor(this.width*this.height/8500));
    this.stars = Array.from({length:count},()=>({x:Math.random()*this.width,y:Math.random()*this.height,z:.25+Math.random()*.9,size:.4+Math.random()*1.5,twinkle:Math.random()*TAU}));
    this.nebulas = [{x:this.width*.18,y:this.height*.22,r:this.width*.28,c:'0,245,255'},{x:this.width*.82,y:this.height*.38,r:this.width*.24,c:'255,43,214'}];
  }

  start() {
    this.configure(this.storage.data.settings); this.state='transition'; this.enemies.length=0; this.particles.length=0; this.lasers.length=0; this.rings.length=0; this.target=null;this.playerAngle=0;
    this.words.startSession(this.seed ?? Date.now());
    this.stats={score:0,wave:1,combo:0,maxCombo:0,correct:0,incorrect:0,words:0,destroyed:0,bosses:0,elapsed:0,activeTime:0,wpm:0,accuracy:100,ended:false};
    this.spawnClock=0; this.spawned=0; this.killedInWave=0; this.bossSpawned=false; this.transition=2.15; this.freezeUntil=0; this.doubleUntil=0; this.shield=0; this.powerup=null;
    this.callbacks.onWave?.(1); this.audio.play('wave'); this.emitHUD(true);
  }
  returnToMenu() { this.state='menu'; this.enemies.length=0; this.particles.length=0; this.lasers.length=0; this.rings.length=0; this.target=null;this.pendingGameOver=null; this.audio.stopAmbience(); }
  restart() { this.start(); }
  pause() { if (this.state!=='running' && this.state!=='transition') return; this.previousState=this.state; this.state='paused'; this.callbacks.onPause?.(true); }
  resume() { if (this.state!=='paused') return; this.state=this.previousState==='transition'?'transition':'running'; this.last=performance.now(); this.callbacks.onPause?.(false); }
  togglePause() { this.state==='paused' ? this.resume() : this.pause(); }

  frame(now) {
    const dt = Math.min(.05,Math.max(0,(now-this.last)/1000)); this.last=now;
    this.updateBackground(dt);
    if (this.state==='running' || this.state==='transition') this.update(dt);
    else if(this.state==='ending'){this.updateEffects(dt);this.endTimer-=dt;if(this.endTimer<=0)this.finalizeGameOver();}
    this.render(now/1000); requestAnimationFrame(this.frame);
  }
  updateBackground(dt) {
    const motion = this.settings?.reducedMotion ? .12 : 1;
    for (const s of this.stars) { s.y += (8+23*s.z)*dt*motion; s.twinkle += dt*(.8+s.z); if (s.y>this.height+2) {s.y=-2;s.x=Math.random()*this.width;} }
  }
  update(dt) {
    this.updatePlayerAim(dt);
    if (this.state==='transition') {
      this.transition-=dt; if (this.transition<=0) { this.state='running'; this.spawnClock=.5; }
      this.updateEffects(dt); return;
    }
    const now = performance.now()/1000; this.stats.elapsed+=dt; this.stats.activeTime+=dt;
    if (this.settings.mode==='time' && this.stats.elapsed>=60) { this.endGame(); return; }
    if (this.settings.mode==='survival') this.stats.wave=1+Math.floor(this.stats.elapsed/35);
    if (this.settings.mode==='time') this.stats.wave=1+Math.floor(this.stats.elapsed/20);
    this.updatePowerups(now);
    const diff=DIFFICULTY[this.settings.difficulty], freeze=now<this.freezeUntil?.38:1;
    for (let i=this.enemies.length-1;i>=0;i--) {
      const e=this.enemies[i]; e.age+=dt;e.hit=Math.max(0,e.hit-dt*5);e.wobble+=dt*(e.type==='phantom'?4:e.movement==='zigzag'?2.4:1.35);
      const accel=e.movement==='accelerate'?0.72+0.42*(0.5+0.5*Math.sin(e.age*1.35)):1,intro=e.intro>0?0.35:1;e.intro=Math.max(0,e.intro-dt);
      e.y += e.speed*diff.speed*freeze*dt*(1+Math.min(.75,this.stats.wave*.035))*accel*intro;
      if(e.knockback>0){e.y-=e.knockback*dt;e.knockback*=Math.exp(-dt*11);}
      const lateral=this.settings.reducedMotion?0.25:1;
      if(e.movement==='zigzag')e.x+=Math.sin(e.wobble)*e.drift*dt*lateral;
      else if(e.movement==='drift')e.x+=e.driftDirection*e.drift*.5*dt*lateral;
      else if(e.movement==='accelerate')e.x+=Math.sin(e.wobble*.55)*e.drift*.28*dt*lateral;
      const edge=e.radius+12;if(e.x<=edge||e.x>=this.width-edge)e.driftDirection*=-1;e.x=clamp(e.x,edge,this.width-edge);
      if (e.y+e.radius>=this.player.y-24) this.enemyReached(i,e);
    }
    this.spawnClock-=dt;
    if (this.spawnClock<=0) this.spawnLogic(diff);
    this.updateEffects(dt); this.checkWave();
    this.stats.accuracy=this.getAccuracy(); this.stats.wpm=this.getWpm(); this.hudClock-=dt;
    if (this.hudClock<=0) {this.hudClock=.12;this.emitHUD();this.checkAchievements(false);}
  }
  updatePowerups(now) {
    if (this.powerup?.type==='freeze' && now>=this.freezeUntil) this.powerup=null;
    if (this.powerup?.type==='double' && now>=this.doubleUntil) this.powerup=null;
  }
  updateEffects(dt) {
    for (let i=this.lasers.length-1;i>=0;i--) {const l=this.lasers[i];l.life-=dt;if(l.life<=0)this.lasers.splice(i,1);}
    for (let i=this.particles.length-1;i>=0;i--) {const p=this.particles[i];p.life-=dt;if(p.life<=0){this.particles.splice(i,1);continue;}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.985;p.vy*=.985;}
    for (let i=this.rings.length-1;i>=0;i--){const ring=this.rings[i];ring.life-=dt;ring.radius+=ring.speed*dt;if(ring.life<=0)this.rings.splice(i,1);}
    this.shake=Math.max(0,this.shake-dt*18); this.flash=Math.max(0,this.flash-dt*4); this.playerHit=Math.max(0,this.playerHit-dt*2.5);
  }
  updatePlayerAim(dt){const desired=this.target?Math.atan2(this.target.y-this.player.y,this.target.x-this.player.x)+Math.PI/2:0,delta=Math.atan2(Math.sin(desired-this.playerAngle),Math.cos(desired-this.playerAngle));this.playerAngle+=delta*Math.min(1,dt*9);}
  spawnLogic(diff) {
    const max=diff.max+(this.settings.mode==='survival'?2:0);
    if (this.enemies.length>=max) {this.spawnClock=.4;return;}
    if (this.settings.mode==='classic' && this.stats.wave%5===0) {
      if (!this.bossSpawned) {this.spawnEnemy('boss');this.bossSpawned=true;this.audio.play('boss');this.callbacks.onToast?.(t(this.settings.uiLanguage,'bossIncoming'),'');}
      this.spawnClock=99; return;
    }
    const quota=6+this.stats.wave*2;
    if (this.settings.mode==='classic' && this.spawned>=quota) {this.spawnClock=.5;return;}
    this.spawnEnemy(); this.spawned++;
    const curve=this.settings.mode==='survival'?Math.max(.55,1-this.stats.elapsed/220):Math.max(.58,1-this.stats.wave*.035);
    this.spawnClock=(1.8+Math.random()*.85)*diff.spawn*curve;
  }
  chooseType() {
    const w=this.stats.wave,r=Math.random();
    if(w>=4&&r<.1)return'phantom'; if(w>=3&&r<.28)return'tank'; if(w>=2&&r<.65)return'fighter'; return'scout';
  }
  getWord(type) {
    return this.words.next({wave:this.stats.wave,difficulty:this.settings.difficulty,type,activeWords:this.enemies.map(enemy=>enemy.word)});
  }
  spawnEnemy(forcedType) {
    const type=forcedType||this.chooseType(),cfg=ENEMY_CONFIG[type],boss=type==='boss';
    const phases=boss?Array.from({length:Math.min(5,3+Math.floor(this.stats.wave/10))},()=>this.getWord(type)):[this.getWord(type)];
    const radius=cfg.radius,x=boss?this.width/2:radius+25+Math.random()*(this.width-radius*2-50);
    const movement=boss?'drift':pick(['straight','straight','zigzag','drift','accelerate']);
    this.enemies.push({id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,type,x,y:boss?-80:-40-Math.random()*45,radius,speed:cfg.speed*(boss?45:52),score:cfg.score,color:cfg.color,phases,phase:0,word:phases[0].word,difficultyGroup:phases[0].group,letters:Array.from(phases[0].word),typed:0,age:0,wobble:Math.random()*TAU,drift:boss?4:8+Math.random()*10,driftDirection:Math.random()<.5?-1:1,movement,knockback:0,hit:0,intro:boss?1.35:0,dead:false});
    if(boss)this.rings.push({x,y:105,radius:18,speed:100,life:1.25,max:1.25,color:cfg.color});
  }
  enemyReached(index,e) {
    if(this.settings.mode==='practice') { if(this.target===e)this.target=null;this.burst(e.x,e.y,e.color,12);this.enemies.splice(index,1);return; }
    if(this.shield>0) {this.shield=0;if(this.target===e)this.target=null;this.burst(e.x,e.y,'#00f5ff',22);this.enemies.splice(index,1);this.shake=5;this.callbacks.onToast?.(t(this.settings.uiLanguage,'shieldSaved'),'');this.emitHUD(true);return;}
    this.playerHit=1; this.shake=12; this.burst(this.player.x,this.player.y,'#ff4560',44); this.endGame();
  }
  checkWave() {
    if(this.settings.mode!=='classic'||this.state!=='running')return;
    const quota=6+this.stats.wave*2, bossWave=this.stats.wave%5===0;
    if((bossWave&&this.bossSpawned&&this.enemies.length===0)||(!bossWave&&this.spawned>=quota&&this.enemies.length===0)) {
      this.stats.score+=500*this.stats.wave; this.stats.wave++;this.spawned=0;this.killedInWave=0;this.bossSpawned=false;this.transition=2.15;this.state='transition';this.callbacks.onWave?.(this.stats.wave);this.callbacks.onToast?.(t(this.settings.uiLanguage,'waveClear'),`+${500*(this.stats.wave-1)}`);this.audio.play('wave');
    }
  }
  handleKey(event) {
    if(this.state==='paused') {if(event.key==='Escape'||event.key.toLowerCase()==='p'){event.preventDefault();this.resume();}return;}
    if(this.state!=='running')return; if(event.ctrlKey||event.altKey||event.metaKey||event.repeat)return;
    if(event.key==='Escape'||event.key==='Backspace') {
      event.preventDefault(); if(this.target){this.target=null;this.callbacks.onToast?.(t(this.settings.uiLanguage,'targetReleased'),'');}else if(event.key==='Escape')this.pause(); return;
    }
    if(event.key.toLowerCase()==='p'){event.preventDefault();this.pause();return;}
    if(Array.from(event.key).length!==1)return;
    event.preventDefault(); this.typeCharacter(event.key);
  }
  typeCharacter(char) {
    const tolerant=this.settings.accentTolerance,locale=this.words.dictionary.locale,typed=normalize(char,tolerant,locale);
    if(!this.target) {
      const eligible=this.enemies.filter(e=>normalize(e.letters[e.typed]||'',tolerant,locale)===typed).sort((a,b)=>b.y-a.y);
      if(eligible.length)this.target=eligible[0];
    }
    if(!this.target){this.miss();return;}
    const expected=normalize(this.target.letters[this.target.typed]||'',tolerant,locale);
    if(typed!==expected){this.miss();return;}
    const e=this.target;e.typed++;e.knockback=Math.min(115,e.knockback+82);e.hit=.34;this.stats.correct++;this.stats.combo++;this.stats.maxCombo=Math.max(this.stats.maxCombo,this.stats.combo);
    const multiplier=Math.min(8,1+Math.floor(this.stats.combo/8)),double=performance.now()/1000<this.doubleUntil?2:1;
    this.stats.score+=Math.round(10*multiplier*double*DIFFICULTY[this.settings.difficulty].score);
    this.lasers.push({x1:this.player.x,y1:this.player.y-25,x2:e.x,y2:e.y,life:.14,max:.14,color:e.color});this.audio.play('type');
    for(let i=0;i<3;i++)this.particles.push({x:e.x+(Math.random()-.5)*10,y:e.y+(Math.random()-.5)*10,vx:(Math.random()-.5)*80,vy:(Math.random()-.5)*80,life:.2+Math.random()*.2,max:.4,color:e.color,size:1+Math.random()*2});
    if(this.stats.combo%8===0){this.audio.play('power');this.callbacks.onCombo?.(multiplier,this.stats.combo);}
    if(e.typed>=e.letters.length)this.completeWord(e);this.emitHUD(true);
  }
  miss() {this.stats.incorrect++;this.stats.combo=0;if(this.target)this.storage.recordWordMistake(this.settings.typingLanguage,this.target.word,this.target.difficultyGroup);this.flash=.4;this.shake=2;this.audio.play('error');this.callbacks.onError?.();this.emitHUD(true);}
  completeWord(e) {
    this.stats.words++; const double=performance.now()/1000<this.doubleUntil?2:1;
    this.storage.recordWordSuccess(this.settings.typingLanguage,e.word,e.difficultyGroup);this.rings.push({x:e.x,y:e.y,radius:e.radius,speed:95,life:.55,max:.55,color:e.color});
    this.stats.score+=Math.round((e.word.length*18+e.score)*double*DIFFICULTY[this.settings.difficulty].score);
    if(e.type==='boss'&&e.phase<e.phases.length-1) {e.phase++;const next=e.phases[e.phase];e.word=next.word;e.difficultyGroup=next.group;e.letters=Array.from(e.word);e.typed=0;e.y=Math.max(85,e.y-28);this.target=e;this.burst(e.x,e.y,e.color,24);return;}
    this.destroyEnemy(e,true);
  }
  destroyEnemy(e,earned) {
    const idx=this.enemies.indexOf(e);if(idx<0)return;this.enemies.splice(idx,1);if(this.target===e)this.target=null;
    this.stats.destroyed++;if(e.type==='boss'){this.stats.bosses++;this.stats.score+=1500;this.callbacks.onToast?.(t(this.settings.uiLanguage,'defeated'),'+1500');}
    this.burst(e.x,e.y,e.color,e.type==='boss'?70:25);this.audio.play('explode');this.shake=e.type==='boss'?9:3;
    if(earned&&this.stats.words%7===0)this.grantPowerup();this.checkAchievements(false);
  }
  grantPowerup() {
    const types=['freeze','shield','double','emp'],type=pick(types),now=performance.now()/1000;this.powerup={type};
    if(type==='freeze')this.freezeUntil=now+8;
    if(type==='double')this.doubleUntil=now+10;
    if(type==='shield')this.shield=1;
    let affected=0;if(type==='emp') {const victims=[...this.enemies].filter(e=>e.type!=='boss').sort((a,b)=>b.y-a.y).slice(0,3);affected=victims.length;victims.forEach(e=>this.destroyEnemy(e,false));this.powerup=null;}
    this.audio.play('power');this.callbacks.onToast?.(t(this.settings.uiLanguage,type),type==='emp'?`-${affected}`:'');this.emitHUD(true);
  }
  burst(x,y,color,count) {for(let i=0;i<count;i++){const a=Math.random()*TAU,s=30+Math.random()*180;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.65,max:1,color,size:1+Math.random()*3.5});}if(this.particles.length>450)this.particles.splice(0,this.particles.length-450);}
  getAccuracy(){const total=this.stats.correct+this.stats.incorrect;return total?this.stats.correct/total*100:100;}
  getWpm(){if(this.stats.activeTime<1)return 0;return this.stats.correct/5/(this.stats.activeTime/60);}
  emitHUD(force=false){this.callbacks.onHUD?.({...this.stats,multiplier:Math.min(8,1+Math.floor(this.stats.combo/8)),timeLeft:this.settings.mode==='time'?Math.max(0,60-this.stats.elapsed):null,powerup:this.powerup,shield:this.shield,powerTime:this.getPowerTime()});}
  getPowerTime(){const now=performance.now()/1000;if(this.powerup?.type==='freeze')return Math.max(0,this.freezeUntil-now);if(this.powerup?.type==='double')return Math.max(0,this.doubleUntil-now);return null;}
  checkAchievements(ended) {
    const snapshot={...this.stats,accuracy:this.getAccuracy(),wpm:this.getWpm(),ended};
    for(const a of ACHIEVEMENTS)if(a.test(snapshot)&&this.storage.unlock(a.id))this.callbacks.onAchievement?.(a.id);
  }
  endGame() {
    if(this.state==='over'||this.state==='ending')return;this.state='ending';this.endTimer=this.playerHit>0?0.7:0.35;this.stats.ended=true;this.stats.accuracy=this.getAccuracy();this.stats.wpm=this.getWpm();this.checkAchievements(true);this.audio.play('over');
    const result={...this.stats,wpm:Math.round(this.stats.wpm),accuracy:Math.round(this.stats.accuracy)};
    const record=this.settings.mode!=='practice'&&this.storage.addScore(this.settings.typingLanguage,this.settings.mode,this.settings.difficulty,result);this.storage.addLifetime(result);this.pendingGameOver={result,record};
  }
  finalizeGameOver(){if(this.state!=='ending'||!this.pendingGameOver)return;this.state='over';const {result,record}=this.pendingGameOver;this.pendingGameOver=null;this.callbacks.onOver?.(result,record);}

  render(time) {
    const c=this.ctx;c.save();const sx=this.shake?(Math.random()-.5)*this.shake:0,sy=this.shake?(Math.random()-.5)*this.shake:0;c.translate(sx,sy);
    this.drawBackground(c,time);
    if(this.state!=='menu'){this.drawTargeting(c,time);for(const e of this.enemies)this.drawEnemy(c,e,time);this.drawLasers(c);this.drawRings(c);this.drawParticles(c);this.drawPlayer(c,time);}
    c.restore();if(this.flash>0){c.fillStyle=`rgba(255,69,96,${this.flash*.12})`;c.fillRect(0,0,this.width,this.height);}
  }
  drawBackground(c,time) {
    c.fillStyle='#050816';c.fillRect(0,0,this.width,this.height);
    for(const n of this.nebulas){const g=c.createRadialGradient(n.x,n.y,0,n.x,n.y,n.r);g.addColorStop(0,`rgba(${n.c},.055)`);g.addColorStop(1,`rgba(${n.c},0)`);c.fillStyle=g;c.fillRect(n.x-n.r,n.y-n.r,n.r*2,n.r*2);}
    for(const s of this.stars){const alpha=.25+.45*(.5+.5*Math.sin(s.twinkle));c.strokeStyle=`rgba(208,231,255,${alpha})`;c.lineWidth=Math.max(.5,s.size*s.z);c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x,s.y-(1+s.z*4));c.stroke();}
    c.strokeStyle='rgba(54,123,255,.045)';c.lineWidth=1;const gap=70,offset=(time*5)%gap;for(let x=-gap;x<this.width+gap;x+=gap){c.beginPath();c.moveTo(this.width/2+(x-this.width/2)*.2,80);c.lineTo(x,this.height);c.stroke();}for(let y=120;y<this.height;y+=gap){c.beginPath();c.moveTo(0,y+offset);c.lineTo(this.width,y+offset);c.stroke();}
  }
  drawPlayer(c,time) {
    const {x,y}=this.player,hit=this.playerHit>0;c.save();c.translate(x,y);c.rotate(this.playerAngle*.22);
    c.shadowBlur=25;c.shadowColor=hit?'#ff4560':'#00f5ff';c.fillStyle=hit?'#ff4560':'#a9faff';
    c.beginPath();c.moveTo(0,-34);c.lineTo(25,24);c.lineTo(9,17);c.lineTo(0,27);c.lineTo(-9,17);c.lineTo(-25,24);c.closePath();c.fill();
    c.fillStyle='#0b2143';c.beginPath();c.moveTo(0,-22);c.lineTo(8,13);c.lineTo(0,18);c.lineTo(-8,13);c.closePath();c.fill();
    const flame=12+Math.sin(time*18)*4;c.fillStyle='#367bff';c.shadowColor='#367bff';c.beginPath();c.moveTo(-7,23);c.lineTo(0,23+flame);c.lineTo(7,23);c.fill();c.restore();
  }
  drawTargeting(c,time) {
    if(!this.target)return;const e=this.target,r=e.radius+13+Math.sin(time*6)*2;c.save();c.setLineDash([5,10]);c.lineDashOffset=-time*30;c.strokeStyle='rgba(0,245,255,.42)';c.lineWidth=1;c.beginPath();c.moveTo(this.player.x,this.player.y-30);c.lineTo(e.x,e.y);c.stroke();c.setLineDash([]);c.strokeStyle=e.color;c.lineWidth=1.5;c.beginPath();c.arc(e.x,e.y,r,0,TAU);c.stroke();
    for(let i=0;i<4;i++){const a=i*Math.PI/2+time*.6,x=Math.cos(a)*r,y=Math.sin(a)*r;c.beginPath();c.moveTo(e.x+x*.78,e.y+y*.78);c.lineTo(e.x+x,e.y+y);c.stroke();}c.restore();
  }
  drawEnemy(c,e,time) {
    const phase=e.type==='phantom'?(.55+.3*Math.sin(time*7+e.age)):1;c.save();c.translate(e.x,e.y);c.globalAlpha=phase;c.shadowBlur=e.type==='boss'?30:16;c.shadowColor=e.color;c.strokeStyle=e.color;c.fillStyle=e.hit>0?`rgba(255,255,255,${.45+e.hit})`:'rgba(7,13,31,.96)';c.lineWidth=e.type==='boss'?2.5:1.5;
    if(e.type==='scout'){c.beginPath();c.moveTo(0,e.radius);c.lineTo(e.radius,-e.radius*.65);c.lineTo(0,-e.radius*.2);c.lineTo(-e.radius,-e.radius*.65);c.closePath();}
    else if(e.type==='fighter'||e.type==='phantom'){c.beginPath();c.moveTo(0,e.radius);c.lineTo(e.radius*1.15,-e.radius*.7);c.lineTo(e.radius*.35,-e.radius*.45);c.lineTo(0,-e.radius);c.lineTo(-e.radius*.35,-e.radius*.45);c.lineTo(-e.radius*1.15,-e.radius*.7);c.closePath();}
    else if(e.type==='tank'){c.beginPath();for(let i=0;i<6;i++){const a=i/6*TAU+Math.PI/6,rad=i%2?e.radius*.9:e.radius;c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}c.closePath();}
    else {c.beginPath();for(let i=0;i<8;i++){const a=i/8*TAU,rad=i%2?e.radius*.72:e.radius;c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad);}c.closePath();}
    c.fill();c.stroke();c.fillStyle=e.color;c.globalAlpha=.85;c.beginPath();c.arc(0,0,e.type==='boss'?12:5,0,TAU);c.fill();c.globalAlpha=phase;c.restore();
    const y=e.y-e.radius-18,cx=e.x;c.save();c.font=`600 ${e.type==='boss'?18:15}px 'Chakra Petch', monospace`;c.textAlign='center';c.textBaseline='middle';const done=e.letters.slice(0,e.typed).join(''),left=e.letters.slice(e.typed).join('');const full=done+left,w=c.measureText(full).width,start=cx-w/2;
    c.fillStyle='rgba(3,7,19,.86)';c.fillRect(start-9,y-13,w+18,27);c.textAlign='left';c.shadowBlur=10;c.shadowColor=e.color;c.fillStyle=e.color;c.fillText(done,start,y);c.shadowBlur=0;c.fillStyle='#f5f8ff';c.fillText(left,start+c.measureText(done).width,y);
    if(e.type==='boss'){const barW=130,progress=(e.phase+e.typed/e.letters.length)/e.phases.length;c.fillStyle='rgba(255,255,255,.13)';c.fillRect(cx-barW/2,y-25,barW,3);c.fillStyle=e.color;c.fillRect(cx-barW/2,y-25,barW*progress,3);}c.restore();
  }
  drawLasers(c){for(const l of this.lasers){const a=l.life/l.max;c.save();c.globalAlpha=a*.3;c.strokeStyle=l.color;c.shadowBlur=22;c.shadowColor=l.color;c.lineWidth=8;c.beginPath();c.moveTo(l.x1,l.y1);c.lineTo(l.x2,l.y2);c.stroke();c.globalAlpha=a;c.strokeStyle='#f5ffff';c.lineWidth=1.5;c.beginPath();c.moveTo(l.x1,l.y1);c.lineTo(l.x2,l.y2);c.stroke();c.fillStyle='#fff';c.shadowBlur=18;c.beginPath();c.arc(l.x2,l.y2,3.5,0,TAU);c.fill();c.restore();}}
  drawRings(c){for(const ring of this.rings){c.save();c.globalAlpha=Math.max(0,ring.life/ring.max);c.strokeStyle=ring.color;c.shadowBlur=18;c.shadowColor=ring.color;c.lineWidth=2;c.beginPath();c.arc(ring.x,ring.y,ring.radius,0,TAU);c.stroke();c.restore();}}
  drawParticles(c){for(const p of this.particles){c.save();c.globalAlpha=Math.max(0,p.life/p.max);c.fillStyle=p.color;c.shadowBlur=8;c.shadowColor=p.color;c.fillRect(p.x,p.y,p.size,p.size);c.restore();}}
}
