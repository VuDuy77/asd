// ── INPUT ──
const K={};
let mode='touch';
let dX=0,dY=0;
let pointerLocked=false;
let mouseHeld=false; // for Uzi full-auto

// ── POINTER LOCK (FPS style like CS2) ──
const MOUSE_SENS=0.0025; // sensitivity, giống CS2

function requestPointerLock(){
  cv.requestPointerLock=cv.requestPointerLock||cv.mozRequestPointerLock||cv.webkitRequestPointerLock;
  if(cv.requestPointerLock)cv.requestPointerLock();
}

document.addEventListener('pointerlockchange',()=>{
  pointerLocked=document.pointerLockElement===cv||document.mozPointerLockElement===cv||document.webkitPointerLockElement===cv;
  if(pointerLocked){
    msg('🎯 FPS Mode — WASD di chuyển · Chuột nhìn · Click bắn · ESC thoát');
  } else {
    if(screen==='play'&&alive)msg('Click vào màn hình để khóa chuột (FPS mode)');
  }
});

document.addEventListener('mousemove',e=>{
  if(!pointerLocked||screen!=='play'||!alive||shopOpen)return;
  const mx=e.movementX||e.mozMovementX||e.webkitMovementX||0;
  const my=e.movementY||e.mozMovementY||e.webkitMovementY||0;
  dX+=mx*MOUSE_SENS;
  dY+=my*MOUSE_SENS;
});

cv.addEventListener('click',e=>{
  if(screen==='menu'){startGame('pc');return;}
  if(screen==='play'&&alive&&!shopOpen){
    if(!pointerLocked){
      requestPointerLock();
    } else {
      if(!reloading&&rofT<=0)shoot();
    }
  }
});

document.addEventListener('keydown',e=>{
  K[e.code]=true;
  if(screen==='menu'){
    if(e.code!=='F5'&&e.code!=='F12'){startGame('pc');}
    return;
  }
  if(e.code==='KeyR')reload();
  if(e.code==='KeyF'){
    if(invOpen) closeInv();
    else if(!shopOpen&&!meleeShopOpen&&screen==='play'&&alive){ openInv(); return; }
  }
  if(e.code==='KeyH'){
    if(typeof craftInvOpen!=='undefined'&&craftInvOpen) closeCraft();
    else if(!shopOpen&&!meleeShopOpen&&screen==='play'&&alive){ openCraft(); return; }
  }
  if(e.code==='KeyG'){if(shopOpen)closeShop();else if(!meleeShopOpen)tryInteractMelee();}
  if(e.code==='KeyE')tryInteract();
  if(e.code==='KeyT'){
    if(!alive||shopOpen||meleeShopOpen)return;
    if(pointerLocked)document.exitPointerLock();
    openShop();
  }
  if(e.code==='KeyK')trySleep();
  if(e.code==='KeyP')placeTrap();
  if(e.code==='KeyX')cycleTrap(); // X = đổi bẫy (F đã dùng cho inventory)
  if(e.code==='Digit1')switchSlot(1);
  if(e.code==='Digit2')switchSlot(2);
  if(e.code==='Digit4'&&!shopOpen&&!meleeShopOpen)doKatanaSkill();
  if(e.code==='KeyV'&&!shopOpen&&!meleeShopOpen)doMeleeAttack();
  if(e.code==='KeyB'){if(shopOpen)closeShop();}
  if((e.code==='ControlLeft'||e.code==='ControlRight')&&!sliding&&alive&&!shopOpen){
    // Slide in current movement direction (or forward if no key held)
    const hasMove=K['KeyW']||K['KeyS']||K['KeyA']||K['KeyD'];
    let sAng=S.ang;
    if(K['KeyS'])sAng=S.ang+Math.PI;
    else if(K['KeyA'])sAng=S.ang-Math.PI/2;
    else if(K['KeyD'])sAng=S.ang+Math.PI/2;
    sliding=true;slideT=SLIDE_DUR;
    slideVX=Math.cos(sAng)*SLIDE_SPD;slideVY=Math.sin(sAng)*SLIDE_SPD;
    playSlide();
  }
  if(e.code==='Escape'){
    if(typeof craftInvOpen!=='undefined'&&craftInvOpen){closeCraft();if(mode==='pc')requestPointerLock();}
    else if(meleeShopOpen){closeMeleeShop();if(mode==='pc')requestPointerLock();}
    else if(shopOpen){closeShop();requestPointerLock();}
    // ESC also auto-releases pointer lock (browser default)
  }
  e.preventDefault&&(e.code.startsWith('Key')||e.code==='Space'||e.code==='ControlLeft'||e.code==='ControlRight')&&e.preventDefault();
});
document.addEventListener('keyup',e=>{K[e.code]=false;});

// Space / mouse button 1 shoot — hold for full-auto (Uzi)
document.addEventListener('mousedown',e=>{
  if(e.button===0&&pointerLocked&&screen==='play'&&alive&&!shopOpen){
    mouseHeld=true;
    if(weaponSlot===2)doMeleeAttack();
    else shoot(); // immediate first shot (also triggers auto-reload if empty)
  }
  if(e.button===2&&pointerLocked&&screen==='play'&&alive&&!shopOpen){
    if(gw().hasScope)scopeActive=!scopeActive;
  }
});
document.addEventListener('mouseup',e=>{if(e.button===0)mouseHeld=false;});

cv.addEventListener('contextmenu',e=>e.preventDefault());

// ── TOUCH (mobile) — dual zone ──
// Nửa phải canvas → vuốt để xoay góc nhìn
// Nửa trái canvas  → tap để bắn
let lookId=null,lookX=0,lookY=0,lookMoved=false;
let tapId=null,tapSX=0,tapSY=0,tapMoved=false;

cv.addEventListener('touchstart',e=>{
  e.preventDefault();
  if(screen==='menu'){startGame('touch');return;}
  const rect=cv.getBoundingClientRect();
  for(const t of e.changedTouches){
    const lx=t.clientX-rect.left;
    if(lx>=rect.width/2){
      if(lookId===null){lookId=t.identifier;lookX=t.clientX;lookY=t.clientY;lookMoved=false;}
    } else {
      if(tapId===null){tapId=t.identifier;tapSX=t.clientX;tapSY=t.clientY;tapMoved=false;}
    }
  }
},{passive:false});

cv.addEventListener('touchmove',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier===lookId){
      const dx=t.clientX-lookX,dy=t.clientY-lookY;
      dX+=dx*0.006;dY+=dy*0.006;
      lookX=t.clientX;lookY=t.clientY;
      if(Math.abs(dx)>3||Math.abs(dy)>3)lookMoved=true;
    }
    if(t.identifier===tapId){
      if(Math.abs(t.clientX-tapSX)>8||Math.abs(t.clientY-tapSY)>8)tapMoved=true;
    }
  }
},{passive:false});

cv.addEventListener('touchend',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){
    if(t.identifier===lookId)lookId=null;
    if(t.identifier===tapId){
      if(!tapMoved&&screen==='play'&&alive&&!reloading&&!shopOpen){
        if(weaponSlot===2)doMeleeAttack();else shoot();
      }
      tapId=null;
    }
  }
},{passive:false});

cv.addEventListener('touchcancel',e=>{
  for(const t of e.changedTouches){
    if(t.identifier===lookId)lookId=null;
    if(t.identifier===tapId)tapId=null;
  }
},{passive:false});

function holdBtn(id,code){
  const el=document.getElementById(id);
  el.addEventListener('mousedown',e=>{if(screen==='menu')startGame('touch');K[code]=true;e.preventDefault();});
  el.addEventListener('touchstart',e=>{if(screen==='menu')startGame('touch');K[code]=true;e.preventDefault();},{passive:false});
  ['mouseup','touchend','mouseleave','touchcancel'].forEach(ev=>el.addEventListener(ev,()=>{K[code]=false;}));
}
holdBtn('bW','KeyW');holdBtn('bA','KeyA');holdBtn('bS','KeyS');holdBtn('bD','KeyD');
holdBtn('bQL','ArrowLeft');holdBtn('bQR','ArrowRight');
document.getElementById('bShoot').onclick=()=>{if(screen==='menu'){startGame('touch');return;}if(screen==='play'&&alive&&!shopOpen){if(weaponSlot===2)doMeleeAttack();else shoot();}};
document.getElementById('bReload').onclick=reload;
document.getElementById('bShop').onclick=()=>{
  if(screen==='menu'){startGame('touch');return;}
  if(shopOpen){closeShop();if(mode==='pc')requestPointerLock();}
  else if(screen==='play'&&alive){
    if(pointerLocked)document.exitPointerLock();
    openShop();
  }
};
document.getElementById('bClose').onclick=()=>{closeShop();if(mode==='pc')requestPointerLock();};
document.getElementById('bMeleeClose').onclick=()=>{closeMeleeShop();if(mode==='pc')requestPointerLock();};
document.getElementById('bSleep').onclick=()=>{
  if(screen==='play'&&alive&&!shopOpen&&!meleeShopOpen)trySleep();
};

// ── CODE REDEMPTION ──
const CODES={'havehag817':{reward:2000,label:'+2000 xu Clau 💰'}};
const usedCodes=JSON.parse(localStorage.getItem('zUsedCodes')||'[]');
function redeemCode(){
  const input=document.getElementById('codeInput');
  const cmsg=document.getElementById('codeMsg');
  const code=input.value.trim().toLowerCase();
  if(!code){cmsg.style.color='#e24b4a';cmsg.textContent='❌ Vui lòng nhập mã code!';return;}
  if(!CODES[code]){cmsg.style.color='#e24b4a';cmsg.textContent='❌ Mã code không hợp lệ!';return;}
  if(usedCodes.includes(code)){cmsg.style.color='#ff8844';cmsg.textContent='⚠️ Mã này đã được dùng rồi!';return;}
  const c=CODES[code];
  S.coins+=c.reward;
  usedCodes.push(code);
  localStorage.setItem('zUsedCodes',JSON.stringify(usedCodes));
  hud();save();
  cmsg.style.color='#4caf50';
  cmsg.textContent=`✅ Đổi thành công! ${c.label}`;
  input.value='';
  buildShop();
}
document.getElementById('codeBtn').onclick=redeemCode;
document.getElementById('codeInput').addEventListener('keydown',e=>{if(e.key==='Enter')redeemCode();e.stopPropagation();});
document.getElementById('codeInput').addEventListener('keyup',e=>e.stopPropagation());

// ── START GAME ──
function startGame(m){
  if(screen==='play')return;
  screen='play';mode=m;
  if(m==='pc'){
    document.body.classList.add('pc');
    setTimeout(requestPointerLock,100);
  } else {
    document.body.classList.remove('pc');
  }
  if(hadSave){
    msg(`💾 Tiếp tục Wave ${S.wave} · ${S.kills} kills`);
  } else {
    if(m==='pc')msg('Click vào màn hình để khóa chuột — FPS Mode');
  }
  hud();
}

