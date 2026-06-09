// ── AUDIO ──
const AC=new (window.AudioContext||window.webkitAudioContext)();
function resumeAC(){if(AC.state==='suspended')AC.resume();}
document.addEventListener('click',resumeAC,{once:false});
document.addEventListener('keydown',resumeAC,{once:false});
document.addEventListener('touchstart',resumeAC,{once:false});

function playShot(gun){
  resumeAC();
  const t=AC.currentTime;
  const buf=AC.createBuffer(1,AC.sampleRate*.18,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.5);
  const src=AC.createBufferSource();src.buffer=buf;
  const gain=AC.createGain();
  const filter=AC.createBiquadFilter();
  filter.type='bandpass';
  // Gun-specific tuning
  if(gun==='pistol'){filter.frequency.value=420;filter.Q.value=0.8;gain.gain.setValueAtTime(0.38,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.18);}
  else if(gun==='shotgun'){filter.frequency.value=180;filter.Q.value=0.5;gain.gain.setValueAtTime(0.7,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.25);}
  else if(gun==='uzi'){filter.frequency.value=520;filter.Q.value=1.0;gain.gain.setValueAtTime(0.22,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.1);}
  else if(gun==='sniper'){filter.frequency.value=260;filter.Q.value=0.6;gain.gain.setValueAtTime(0.85,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.38);}
  else if(gun==='rocket'){filter.frequency.value=120;filter.Q.value=0.4;gain.gain.setValueAtTime(1.0,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.45);}
  else if(gun==='minigun'){filter.frequency.value=580;filter.Q.value=1.2;gain.gain.setValueAtTime(0.18,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.08);}
  else if(gun==='flame'){filter.frequency.value=200;filter.Q.value=0.4;gain.gain.setValueAtTime(0.12,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.09);}
  else if(gun==='crossbow'){filter.frequency.value=340;filter.Q.value=0.7;gain.gain.setValueAtTime(0.5,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.22);}
  src.connect(filter);filter.connect(gain);gain.connect(AC.destination);src.start(t);
}

function playReload(){
  resumeAC();
  const t=AC.currentTime;
  // Click sound
  const buf=AC.createBuffer(1,AC.sampleRate*.06,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
  const src=AC.createBufferSource();src.buffer=buf;
  const gain=AC.createGain();gain.gain.setValueAtTime(0.18,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.06);
  src.connect(gain);gain.connect(AC.destination);src.start(t);
  // Clack sound (slightly delayed)
  const buf2=AC.createBuffer(1,AC.sampleRate*.05,AC.sampleRate);
  const d2=buf2.getChannelData(0);
  for(let i=0;i<d2.length;i++)d2[i]=(Math.random()*2-1)*Math.pow(1-i/d2.length,4);
  const src2=AC.createBufferSource();src2.buffer=buf2;
  const gain2=AC.createGain();gain2.gain.setValueAtTime(0.22,t+0.08);gain2.gain.exponentialRampToValueAtTime(0.001,t+0.13);
  src2.connect(gain2);gain2.connect(AC.destination);src2.start(t+0.08);
}

function playHit(headshot){
  resumeAC();
  const t=AC.currentTime;
  const buf=AC.createBuffer(1,AC.sampleRate*.07,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.2);
  const src=AC.createBufferSource();src.buffer=buf;
  const f=AC.createBiquadFilter();f.type='highpass';f.frequency.value=headshot?1800:900;
  const gain=AC.createGain();gain.gain.setValueAtTime(headshot?0.45:0.28,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.07);
  src.connect(f);f.connect(gain);gain.connect(AC.destination);src.start(t);
}

function playDeath(){
  resumeAC();
  const t=AC.currentTime;
  const buf=AC.createBuffer(1,AC.sampleRate*.22,AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.2);
  const src=AC.createBufferSource();src.buffer=buf;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=280;
  const gain=AC.createGain();gain.gain.setValueAtTime(0.55,t);gain.gain.exponentialRampToValueAtTime(0.001,t+0.22);
  src.connect(f);f.connect(gain);gain.connect(AC.destination);src.start(t);
}

function playFootstep(indoor,spMul){
  resumeAC();
  const t=AC.currentTime;
  // Footstep = 2 lớp: "thud" thấp + "tap" cao, pitch ngẫu nhiên nhẹ
  const vol=0.13+(Math.random()*0.04);
  const pitchVar=0.88+Math.random()*0.24; // pitch biến thiên mỗi bước

  // ── THUD (thấp — đế giày chạm đất) ──
  const dur1=indoor?0.055:0.07;
  const buf1=AC.createBuffer(1,~~(AC.sampleRate*dur1),AC.sampleRate);
  const d1=buf1.getChannelData(0);
  for(let i=0;i<d1.length;i++){
    const env=Math.pow(1-i/d1.length,1.8);
    d1[i]=(Math.random()*2-1)*env;
  }
  const src1=AC.createBufferSource();src1.buffer=buf1;src1.playbackRate.value=pitchVar*(indoor?1.15:1.0);
  const f1=AC.createBiquadFilter();f1.type='lowpass';f1.frequency.value=indoor?320:200;f1.Q.value=0.6;
  const g1=AC.createGain();g1.gain.setValueAtTime(vol*(indoor?1.1:1.0),t);g1.gain.exponentialRampToValueAtTime(0.001,t+dur1);
  src1.connect(f1);f1.connect(g1);g1.connect(AC.destination);src1.start(t);

  // ── TAP (cao — tiếng gõ cứng của đế) ──
  const dur2=0.03;
  const buf2=AC.createBuffer(1,~~(AC.sampleRate*dur2),AC.sampleRate);
  const d2=buf2.getChannelData(0);
  for(let i=0;i<d2.length;i++){
    d2[i]=(Math.random()*2-1)*Math.pow(1-i/d2.length,3.5);
  }
  const src2=AC.createBufferSource();src2.buffer=buf2;src2.playbackRate.value=pitchVar*(indoor?1.4:1.1);
  const f2=AC.createBiquadFilter();f2.type='bandpass';f2.frequency.value=indoor?900:520;f2.Q.value=1.2;
  const g2=AC.createGain();g2.gain.setValueAtTime(vol*0.55,t+0.008);g2.gain.exponentialRampToValueAtTime(0.001,t+0.008+dur2);
  src2.connect(f2);f2.connect(g2);g2.connect(AC.destination);src2.start(t+0.008);
}

function playSlide(){
  resumeAC();
  const t=AC.currentTime;
  // ── SWOOSH (tiếng lướt nhanh) ──
  const dur=0.32;
  const buf=AC.createBuffer(1,~~(AC.sampleRate*dur),AC.sampleRate);
  const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++){
    const env=Math.pow(1-i/d.length,1.1)*Math.pow(i/d.length+0.02,0.18);
    d[i]=(Math.random()*2-1)*env;
  }
  const src=AC.createBufferSource();src.buffer=buf;
  const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=420;f.Q.value=0.5;
  const g=AC.createGain();g.gain.setValueAtTime(0.0,t);g.gain.linearRampToValueAtTime(0.28,t+0.04);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(f);f.connect(g);g.connect(AC.destination);src.start(t);
  // ── THUD (tiếng chân chạm đất lúc bắt đầu trượt) ──
  const buf2=AC.createBuffer(1,~~(AC.sampleRate*0.07),AC.sampleRate);
  const d2=buf2.getChannelData(0);
  for(let i=0;i<d2.length;i++)d2[i]=(Math.random()*2-1)*Math.pow(1-i/d2.length,2.2);
  const src2=AC.createBufferSource();src2.buffer=buf2;
  const f2=AC.createBiquadFilter();f2.type='lowpass';f2.frequency.value=280;f2.Q.value=0.8;
  const g2=AC.createGain();g2.gain.setValueAtTime(0.32,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.07);
  src2.connect(f2);f2.connect(g2);g2.connect(AC.destination);src2.start(t);
}
