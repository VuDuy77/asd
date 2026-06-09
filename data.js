const GUNS={
  // rcP=recoil pitch, rcA=recoil ang, rcRec=recovery speed, kick=viewmodel kick
  // vmCol=grip color, spdMul=speed multiplier while holding (1=normal)
  pistol: {n:'Pistol', e:'🔫',dmg:50, cap:12,res:120,rl:1.5, rof:0.38,sp:0.12,c:'#88aaff',
           ammoType:'pistol',
           rcP:0.045,rcA:0.012,rcRec:6,   kick:14, vmCol:'#556',vmLen:1.0,vmW:1.0,mflC:'#ffdd88',spdMul:1.0},
  shotgun:{n:'Shotgun',e:'💥',dmg:28, cap:6, res:60, rl:2.2, rof:0.9, sp:0.25,pellets:5,c:'#ffaa44',
           ammoType:'shotgun',
           rcP:0.13, rcA:0.008,rcRec:4,   kick:28, vmCol:'#443',vmLen:1.4,vmW:1.3,mflC:'#ffbb44',spdMul:1.0},
  uzi:    {n:'Uzi',   e:'⚡',dmg:22, cap:30,res:180,rl:1.0, rof:0.1, sp:0.16,c:'#ff88ff',
           ammoType:'smg',
           rcP:0.025,rcA:0.018,rcRec:9,   kick:8,  vmCol:'#545',vmLen:0.8,vmW:0.85,mflC:'#ff99ff',spdMul:1.0},
  sniper: {n:'Sniper',e:'🎯',dmg:160,cap:5, res:30, rl:2.5, rof:1.2, sp:0.02,c:'#44ffcc',
           ammoType:'sniper',
           rcP:0.18, rcA:0.005,rcRec:3,   kick:40, vmCol:'#354',vmLen:1.8,vmW:0.9,mflC:'#aaffee',spdMul:1.0,hasScope:true},
  rocket: {n:'Rocket',e:'🚀',dmg:200,cap:3, res:12, rl:3.0, rof:1.5, sp:0.04,splash:2.5,c:'#ff4422',
           ammoType:'rocket',
           rcP:0.22, rcA:0.01, rcRec:2.5,  kick:50, vmCol:'#433',vmLen:1.6,vmW:1.5,mflC:'#ff6622',spdMul:1.0},
  // ── NEW GUNS ──
  minigun:{n:'Minigun',e:'🌀',dmg:29, cap:400,res:0,  rl:99, rof:0.075,sp:0.22,c:'#ffcc00',
           ammoType:'heavy',
           rcP:0.018,rcA:0.022,rcRec:12,  kick:6,  vmCol:'#554',vmLen:1.2,vmW:1.6,mflC:'#ffee44',
           spdMul:0.7, noReload:true},           // -30% speed, cannot reload
  flame:  {n:'Flamethrower',e:'🔥',dmg:30, cap:120,res:240,rl:1.8, rof:0.07, sp:0.35,c:'#ff6600',
           ammoType:'fuel',
           rcP:0.01, rcA:0.008,rcRec:10,  kick:4,  vmCol:'#532',vmLen:1.3,vmW:1.4,mflC:'#ff4400',
           spdMul:0.8, isFire:true},             // -20% speed, fire DoT
  crossbow:{n:'Crossbow',e:'🏹',dmg:100,cap:1, res:50, rl:0.2, rof:0.8, sp:0.01,c:'#88ddff',
           ammoType:'bolt',
           rcP:0.06, rcA:0.003,rcRec:5,   kick:20, vmCol:'#432',vmLen:1.5,vmW:1.1,mflC:'#aaeeff',
           spdMul:1.15, hasScope:true},          // +15% speed, scope like sniper
};
const SHOP=[
  // ── VẬT PHẨM ──
  {id:'bed',n:'Giường Ngủ',e:'🛏️',d:'Đặt giường trong nhà · Nhấn E để ngủ · +50 HP · Cooldown 3 phút',p:100,t:'bed',cat:'item'},
  {id:'flashlight',n:'Đèn Pin',e:'🔦',d:'Chiếu sáng xung quanh · Tăng tầm nhìn ban đêm',p:10,t:'flashlight',cat:'item'},
  // ── VŨKHÍ ──
  {id:'sg',n:'Shotgun',    e:'💥',d:'6 viên · 5 đạn/phát · Dmg 28×5',  p:18, t:'gun',gid:'shotgun', cat:'gun'},
  {id:'uz',n:'Uzi',        e:'⚡',d:'30 viên · Bắn liên tục · Dmg 22',  p:25, t:'gun',gid:'uzi',     cat:'gun'},
  {id:'sn',n:'Sniper',     e:'🎯',d:'Dmg 160 · Scope · Bắn xa',         p:40, t:'gun',gid:'sniper',  cat:'gun'},
  {id:'rk',n:'Rocket',     e:'🚀',d:'Dmg 200 · Splash 2.5m · 3 viên',   p:70, t:'gun',gid:'rocket',  cat:'gun'},
  {id:'mg',n:'Minigun',    e:'🌀',d:'400 viên · Dmg 29 · -30% tốc độ · Không nạp được', p:448,t:'gun',gid:'minigun',cat:'gun'},
  {id:'fl',n:'Flamethrower',e:'🔥',d:'Lửa liên tục · Dmg 30 · -20% tốc độ · DoT',       p:298,t:'gun',gid:'flame',  cat:'gun'},
  {id:'cb',n:'Crossbow',   e:'🏹',d:'Dmg 100 · 1 viên · Nạp 0.2s · Scope · +15% tốc',  p:90, t:'gun',gid:'crossbow',cat:'gun'},
  // ── ĐẠN theo loại ──
  // Pistol (rẻ, nhiều)
  {id:'am_pistol', n:'Đạn Pistol',   e:'🔫',d:'🔫 Pistol · +80 đạn dự trữ',           p:8,  t:'ammo_type',at:'pistol', v:80,  cat:'ammo'},
  // SMG (rẻ, nhiều)
  {id:'am_smg',    n:'Đạn SMG',      e:'⚡',d:'⚡ Uzi/SMG · +150 đạn dự trữ',         p:12, t:'ammo_type',at:'smg',    v:150, cat:'ammo'},
  // Shotgun (vừa)
  {id:'am_shotgun',n:'Đạn Shotgun',  e:'💥',d:'💥 Shotgun · +40 đạn dự trữ',          p:16, t:'ammo_type',at:'shotgun',v:40,  cat:'ammo'},
  // Heavy (minigun, vừa-đắt, ít)
  {id:'am_heavy',  n:'Đạn Heavy',    e:'🌀',d:'🌀 Minigun · +200 đạn dự trữ',         p:30, t:'ammo_type',at:'heavy',  v:200, cat:'ammo'},
  // Fuel (flamethrower)
  {id:'am_fuel',   n:'Nhiên liệu',   e:'🔥',d:'🔥 Flamethrower · +120 nhiên liệu',    p:22, t:'ammo_type',at:'fuel',   v:120, cat:'ammo'},
  // Sniper (đắt, ít)
  {id:'am_sniper', n:'Đạn Sniper',   e:'🎯',d:'🎯 Sniper · +20 đạn dự trữ',           p:28, t:'ammo_type',at:'sniper', v:20,  cat:'ammo'},
  // Crossbow bolt (đắt, rất ít)
  {id:'am_bolt',   n:'Tên Crossbow', e:'🏹',d:'🏹 Crossbow · +15 tên',                p:32, t:'ammo_type',at:'bolt',   v:15,  cat:'ammo'},
  // Rocket (rất đắt, rất ít)
  {id:'am_rocket', n:'Đạn Rocket',   e:'🚀',d:'🚀 Rocket · +6 đạn rocket',            p:50, t:'ammo_type',at:'rocket', v:6,   cat:'ammo'},
  // Đổ đầy băng hiện tại (tiện lợi)
  {id:'am',n:'Đạn đầy (băng)',e:'🧲',d:'Đổ đầy đạn băng súng đang cầm',              p:20, t:'ammo',                         cat:'ammo'},
  // ── HỒI PHỤC ──
  {id:'md',n:'Med Kit',    e:'💊',d:'Hồi +70 HP',                         p:25, t:'heal',v:70,          cat:'heal'},
  {id:'fh',n:'Full Heal',  e:'❤️',d:'Hồi toàn bộ HP',                    p:55, t:'heal',v:100,         cat:'heal'},
  {id:'ph',n:'Pain Killer',e:'🩹',d:'Hồi +35 HP tức thì',                 p:14, t:'heal',v:35,          cat:'heal'},
  // ── GIÁP ──
  {id:'a1',n:'Light Armor',e:'🛡',d:'Giáp +30',                           p:18, t:'armor',v:30,         cat:'armor'},
  {id:'a2',n:'Heavy Armor',e:'⛑️',d:'Giáp +80',                          p:40, t:'armor',v:80,         cat:'armor'},
  {id:'a3',n:'Full Plate', e:'🦺',d:'Giáp +150 (tối đa 200)',             p:80, t:'armor',v:150,        cat:'armor'},
  // ── BUFF ──
  {id:'sp',n:'Adrenaline', e:'💨',d:'Tăng tốc +65% · 30s',               p:20, t:'buff',bk:'spd',dur:30,cat:'buff'},
  {id:'rf',n:'Rapid Fire', e:'🔥',d:'Bắn nhanh ×2 · 20s',                p:25, t:'buff',bk:'rpd',dur:20,cat:'buff'},
  {id:'rg',n:'Berserker',  e:'😤',d:'Tăng tốc + Bắn nhanh · 15s',        p:40, t:'buff2',dur:15,       cat:'buff'},
  {id:'sh',n:'Shield Regen',e:'♻️',d:'Hồi 2 giáp/s trong 20s',           p:22, t:'buff',bk:'srg',dur:20,cat:'buff'},
  // ── NÂNG CẤP ──
  {id:'u1',n:'Damage Up',  e:'⚔️',d:'Tăng DMG +25% vĩnh viễn (max 3)',   p:60, t:'upg',uk:'dmgUp',    cat:'upg'},
  {id:'u2',n:'Max Armor',  e:'🔩',d:'Tăng giới hạn giáp lên 200',        p:50, t:'upg',uk:'armorCap',  cat:'upg'},
  {id:'u3',n:'Speed Boots',e:'👟',d:'Tăng tốc cơ bản +15% vĩnh viễn',    p:55, t:'upg',uk:'spdUp',     cat:'upg'},
  // ── BẪY ──
  {id:'tb',n:'Bẫy Bom',      e:'💣',d:'Nổ khi zombie/người chơi dẫm · Dmg 120 · Splash 2m',    p:30, t:'trap',tk:'bomb',    cat:'trap'},
  {id:'ts',n:'Bẫy Gai',      e:'🪤',d:'Gai sắc · Dmg 15/s · Nhiều lần · Người chơi cũng bị',  p:20, t:'trap',tk:'spike',   cat:'trap'},
  {id:'tp',n:'Bẫy Chất Độc', e:'☠️',d:'Mây độc · Dmg 8/s · 8s · AoE 1.5m',                   p:25, t:'trap',tk:'poison',  cat:'trap'},
  {id:'tf',n:'Bẫy Lửa',      e:'🔥',d:'Hỏa hoạn · Dmg 20/s · 5s · Lan rộng',                  p:35, t:'trap',tk:'fire',    cat:'trap'},
  {id:'ti',n:'Bẫy Điện',     e:'⚡',d:'Sét điện · Dmg 60 · Tê liệt 2s · AoE 1m',              p:45, t:'trap',tk:'electric',cat:'trap'},
];

// ── TRAP TYPES ──
const TRAP_DEFS={
  bomb:    {e:'💣',col:'#ff4400',radius:0.3,trigR:0.5,splashR:2.0,dmg:120,oneshot:true,  playerDmg:100,label:'BOM'},
  spike:   {e:'🪤',col:'#aaaaaa',radius:0.3,trigR:0.4,dmgPerSec:15, duration:Infinity,  playerDmg:10, label:'GAI'},
  poison:  {e:'☠️',col:'#44ff44',radius:0.4,trigR:1.5,dmgPerSec:8,  duration:8,         playerDmg:6,  label:'ĐỘC'},
  fire:    {e:'🔥',col:'#ff6600',radius:0.35,trigR:0.5,dmgPerSec:20, duration:5,         playerDmg:15, label:'LỬA'},
  electric:{e:'⚡',col:'#88ddff',radius:0.3,trigR:0.6,dmg:60,stunDur:2,oneshot:true,     playerDmg:45, label:'ĐIỆN'},
};
// Active placed traps: {x,y,type,active,timer,triggered}
const traps=[];

// ── AMMO STORE HELPERS ──
function getRes(){
  const at=gw().ammoType;
  if(!S.ammoStore)S.ammoStore={pistol:120,smg:180,shotgun:60,heavy:0,fuel:240,sniper:30,bolt:50,rocket:12};
  return S.ammoStore[at]||0;
}
function addRes(at,v){
  if(!S.ammoStore)S.ammoStore={pistol:120,smg:180,shotgun:60,heavy:0,fuel:240,sniper:30,bolt:50,rocket:12};
  S.ammoStore[at]=(S.ammoStore[at]||0)+v;
}
const SK='zsf2';
function mkS(){return{px:12,py:24,ang:0,pitch:0,hp:100,armor:0,coins:0,score:0,wave:1,kills:0,gun:'pistol',ammo:12,res:120,spd:0,rpd:0,srg:0,dmgUp:0,armorCap:0,spdUp:0,hasBed:0,hasFlashlight:0,traps:{bomb:0,spike:0,poison:0,fire:0,electric:0},
  ammoStore:{pistol:120,smg:180,shotgun:60,heavy:0,fuel:240,sniper:30,bolt:50,rocket:12}};}
let S=mkS();
function save(){try{localStorage.setItem(SK,JSON.stringify(S));}catch(e){}}
function load(){try{const r=localStorage.getItem(SK);if(r){S=Object.assign(mkS(),JSON.parse(r));return true;}}catch(e){}return false;}
function clearSave(){try{localStorage.removeItem(SK);}catch(e){}S=mkS();}
const hadSave=load();

// ── STATE ──
const cv=document.getElementById('gc'),ctx=cv.getContext('2d'),W=680,H=420;
// roundRect polyfill for older browsers
if(!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){
    const ri=typeof r==='number'?[r,r,r,r]:r.length===1?[r[0],r[0],r[0],r[0]]:r.length===2?[r[0],r[1],r[0],r[1]]:r.length===4?r:[0,0,0,0];
    this.beginPath();this.moveTo(x+ri[0],y);this.lineTo(x+w-ri[1],y);this.arcTo(x+w,y,x+w,y+ri[1],ri[1]);
    this.lineTo(x+w,y+h-ri[2]);this.arcTo(x+w,y+h,x+w-ri[2],y+h,ri[2]);
    this.lineTo(x+ri[3],y+h);this.arcTo(x,y+h,x,y+h-ri[3],ri[3]);
    this.lineTo(x,y+ri[0]);this.arcTo(x,y,x+ri[0],y,ri[0]);this.closePath();return this;
  };
}
let alive=true,reloading=false,reloadT=0,rofT=0,mfl=0,shopOpen=false;
let weaponSlot=1; // 1=gun, 2=melee
// Damage float texts: {x,y,txt,t,hs,wx,wy} world coords
const dmgFloats=[];
let sleeping=false,sleepTimer=0,sleepCooldown=0; // sleep system
let selectedTrap='bomb'; // currently selected trap type to place
// Bed position (inside house, main open room area col 30-44, row 3-19)
const BED_X=35.5, BED_Y=11.5, BED_RADIUS=1.8;
// NPC Shopkeeper position (inside house)
const NPC_X=35.5, NPC_Y=9.5, NPC_RADIUS=2.2;
// NPC Melee Weapon Seller - phòng bên phải (col 38-44, row 14-18)
const NPC2_X=41.0, NPC2_Y=16.0, NPC2_RADIUS=3.5;

// ── MELEE WEAPONS ──
const MELEE_WEAPONS={
  knife:{id:'knife',n:'Knife',e:'🔪',dmg:50,hsDmg:150,delay:1.0,p:15,
    d:'Dmg 50 · Headshot 150 · Delay 1s · Nhanh tay!',
    col:'#aaccff',bladeCol:'#ddeeff',vmLen:0.7},
  battle_axe:{id:'battle_axe',n:'Battle Axe',e:'🪓',dmg:67,hsDmg:367,delay:5.0,p:50,
    d:'Dmg 67 · Headshot 367 · Delay 5s · Sát thương cao!',
    col:'#cc8844',bladeCol:'#ffcc66',vmLen:1.1},
  katana:{id:'katana',n:'Katana',e:'⚔️',dmg:30,hsDmg:120,delay:0.8,p:100,
    d:'Dmg 30 · Headshot 120 · Delay 0.8s · [4] Skill: Chém Liên Hoàn 25 nhát × 30dmg · Cooldown 15s',
    col:'#cc2244',bladeCol:'#ff88aa',vmLen:1.3,hasSkill:true,
    skillName:'Chém Liên Hoàn',skillHits:25,skillDmg:30,skillCooldown:15},
  riot_shield:{id:'riot_shield',n:'Riot Shield',e:'🛡️',dmg:25,hsDmg:75,delay:1.5,p:150,
    d:'Chặn 767 dmg zombie · Dmg 25 · Headshot 75 · Delay 1.5s',
    col:'#3366cc',bladeCol:'#aaccff',vmLen:0.8,isShield:true,shieldHp:767},
};
// Melee state
let meleeShopOpen=false;
let S_melee=null; // current melee weapon id or null
let meleeT=0;     // cooldown timer
let meleeSkillT=0; // katana skill cooldown
let meleeSkillActive=false; // skill in progress
let meleeSkillHitsLeft=0;
let meleeSkillHitT=0;
let shieldBlock=0; // remaining shield durability
let recoilPitch=0,recoilAng=0,recoilVelP=0,recoilVelA=0;
let vmBob=0,vmBobT=0,vmKickY=0,vmKickZ=0,vmReloadT=0;
let camShakeT=0,camShakeX=0,camShakeY=0;
// View bobbing (camera nhấp nhô theo bước chân như HL2/CS2)
let viewBobT=0;         // thời gian tích lũy nhịp bước
let viewBobAmp=0;       // biên độ hiện tại (smoothed)
let viewBobPitch=0;     // pitch nhấp nhô áp vào S.pitch render
let viewBobSway=0;      // sway ngang của viewmodel
// View roll (nghiêng camera khi đi A/D)
let viewRoll=0;         // góc roll hiện tại (rad)
let viewRollTarget=0;   // mục tiêu roll
let mflX=0,mflY=0,mflR=0,mflAng=0;
let hmT=0,hmHead=false; // hitmarker timer + headshot flag
let muzzleSX=W*0.58,muzzleSY=H*0.38; // screen-space muzzle tip, updated each frame
let horLine=H/2; // horizon line Y, updated each frame in renderGame
let waveActive=false,autoSvT=0;
let scopeActive=false; // sniper scope ADS
const zombies=[];

// ── SCREEN STATE: 'menu'|'play' ──
let screen='menu';

function gw(){return GUNS[S.gun];}

// ── SPAWN ──
// Pre-build list of all safe open floor tiles far from player start
function safeSpawnPos(){
  const candidates=[];
  for(let r=1;r<MH-1;r++)for(let c=1;c<MW-1;c++){
    if(MAP[r][c]!==0)continue;
    // ensure all 4 corners are open (zombie radius 0.4)
    if(wall(c+0.4,r+0.4)||wall(c-0.4,r+0.4)||wall(c+0.4,r-0.4)||wall(c-0.4,r-0.4))continue;
    const dx=c-12,dy=r-24,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<6)continue; // not too close to player start
    candidates.push([c+0.5,r+0.5]);
  }
  return candidates;
}
const SPAWN_POOL=safeSpawnPos();

// ── ZOMBIE TYPES ──
// normal: zombie bình thường (wave 1+)
// elite:  zombie elite - máu nhiều, mạnh hơn (wave 4+)
// runner: zombie vận động viên - chạy rất nhanh nhưng máu ít (wave 3+)
// tank:   zombie to lớn - máu rất nhiều, chậm, đánh mạnh (wave 5+)
// toxic:  zombie độc - để lại vệt độc khi chết (wave 7+)
// exploder: zombie nổ - phát nổ khi chết gần người chơi (wave 9+)
function pickZombieType(wave){
  const r=Math.random();
  if(wave>=9&&r<0.08)return'exploder';
  if(wave>=7&&r<0.15)return'toxic';
  if(wave>=5&&r<0.22)return'tank';
  if(wave>=3&&r<0.30)return'runner';
  if(wave>=4&&r<0.25)return'elite';
  return'normal';
}
function makeZombie(sx,sy,wave){
  const type=pickZombieType(wave);
  let hp,spd,dmg,scale;
  if(type==='runner'){
    hp=Math.max(30,40+wave*8);
    spd=Math.min(2.8+wave*0.12,5.5);
    dmg=6+wave*0.8;
    scale=0.75;
  } else if(type==='tank'){
    hp=300+wave*60;
    spd=Math.min(0.45+wave*0.04,1.2);
    dmg=30+wave*3;
    scale=1.6;
  } else if(type==='toxic'){
    hp=60+wave*18;
    spd=Math.min(0.9+wave*0.09,2.2);
    dmg=8+wave*1.2;
    scale=1.0;
  } else if(type==='exploder'){
    hp=50+wave*15;
    spd=Math.min(1.4+wave*0.11,3.0);
    dmg=5+wave*0.8;
    scale=1.1;
  } else if(type==='elite'){
    hp=150+wave*40;
    spd=Math.min(1.3+wave*0.15,3.5);
    dmg=20+wave*2;
    scale=1.15;
  } else {
    hp=80+wave*25;
    spd=Math.min(0.8+wave*0.1+Math.random()*.2,3.5);
    dmg=10+wave*1.5;
    scale=1.0;
  }
  return{x:sx,y:sy,hp,mhp:hp,spd,dmg,type,elite:type==='elite',scale,
    alive:true,anim:Math.random()*6.28,fl:0,
    steerAng:Math.random()*Math.PI*2,stuckT:0,lastX:sx,lastY:sy};
}

function spawnWave(){
  waveActive=true;
  const n=(5+S.wave*3)*2;
  // shuffle pool and pick n
  const pool=[...SPAWN_POOL].sort(()=>Math.random()-0.5);
  const typeCount={normal:0,elite:0,runner:0,tank:0,toxic:0,exploder:0};
  for(let i=0;i<n;i++){
    const p=pool[i%pool.length];
    let sx=p[0]+(Math.random()-.5)*0.4;
    let sy=p[1]+(Math.random()-.5)*0.4;
    if(wall(sx,sy)){sx=p[0];sy=p[1];}
    const z=makeZombie(sx,sy,S.wave);
    typeCount[z.type]=(typeCount[z.type]||0)+1;
    zombies.push(z);
  }
  document.getElementById('hWv').textContent='WAVE '+S.wave;
  // Build type summary for message
  const parts=[];
  if(typeCount.runner>0)parts.push(`🏃${typeCount.runner} Runner`);
  if(typeCount.tank>0)parts.push(`🦣${typeCount.tank} Tank`);
  if(typeCount.elite>0)parts.push(`👾${typeCount.elite} Elite`);
  if(typeCount.toxic>0)parts.push(`☠️${typeCount.toxic} Độc`);
  if(typeCount.exploder>0)parts.push(`💥${typeCount.exploder} Nổ`);
  const suffix=parts.length>0?' · '+parts.join(' '):'';
  msg(S.wave===1?'Wave 1 bắt đầu! Tiêu diệt zombie để kiếm xu Clau':`Wave ${S.wave} — ${n} zombie${suffix}`);
}

// ── HIT EFFECTS ──
const hitEffects=[]; // {x,y,headshot,t}

// ── PARTICLE SYSTEM ──
// Screen-space particles for muzzle flash sparks, shell casings, dust
const particles=[]; // {x,y,vx,vy,life,maxLife,r,col,type}
function addMuzzleSparks(count,mx,my){
  for(let i=0;i<count;i++){
    const ang=(-Math.PI/2)+(Math.random()-0.5)*1.4;
    const spd=60+Math.random()*130;
    particles.push({x:mx,y:my,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,
      life:0.1+Math.random()*0.15,maxLife:0.25,r:1.5+Math.random()*2,
      col:`hsl(${30+Math.random()*30},100%,${60+Math.random()*30}%)`,type:'spark'});
  }
}
function addShellCasing(mx,my){
  // shell ejects right of receiver — offset from muzzle tip
  const cx=mx+55, cy=my+40;
  particles.push({x:cx,y:cy,vx:55+Math.random()*45,vy:-(25+Math.random()*35),
    life:0.6,maxLife:0.6,r:3,col:'#c8a040',type:'shell',rot:Math.random()*Math.PI*2,rotV:(Math.random()-0.5)*14});
}

// Slide state
let sliding=false,slideT=0,slideVX=0,slideVY=0;
const SLIDE_DUR=0.65,SLIDE_SPD=11.0;
let dustStepT=0,dustStepSide=false;
