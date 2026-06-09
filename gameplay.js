// ── SHOOT ──
function shoot(){
  // Auto-reload when empty (Uzi/minigun quality-of-life — trigger even during rofT)
  if(S.ammo<=0&&!reloading&&alive&&!shopOpen){reload();return;}
  if(rofT>0||S.ammo<=0||!alive||reloading||shopOpen)return;
  const w=gw();
  S.ammo--;hud();mfl=0.18;
  rofT=w.rof*(S.rpd>0?0.5:1);
  // ── SOUND ──
  playShot(S.gun);
  // ── RECOIL ──
  recoilVelP -= w.rcP*(S.rpd>0?0.6:1);
  recoilVelA += (Math.random()-0.5)*w.rcA*2;
  // ── CAMERA SHAKE ──
  camShakeT = Math.min(0.12, camShakeT + w.rcP*1.2);
  // ── VIEWMODEL KICK ──
  vmKickY = w.kick;
  vmKickZ = w.kick*0.4;
  // ── MUZZLE FLASH ──
  mflR = 18 + Math.random()*12;
  mflAng = Math.random()*Math.PI*2;
  // ── MUZZLE SPARKS & SHELL ──
  if(S.gun!=='flame'){
    const sc=S.gun==='shotgun'?9:S.gun==='minigun'?3:S.gun==='uzi'?4:6;
    addMuzzleSparks(sc,muzzleSX,muzzleSY);
    if(S.gun!=='rocket')addShellCasing(muzzleSX,muzzleSY);
  }
  const pl=w.pellets||1;
  let hit=false;
  let lastHitIsHead=false;
  for(let p=0;p<pl;p++){
    const spr=(Math.random()-.5)*w.sp;
    const ang=S.ang+spr;
    let best=null,bestD=999;
    for(const z of zombies){
      if(!z.alive)continue;
      const dx=z.x-S.px,dy=z.y-S.py,d=Math.sqrt(dx*dx+dy*dy);
      if(d>18)continue;
      let df=Math.atan2(dy,dx)-ang;
      while(df>Math.PI)df-=Math.PI*2;while(df<-Math.PI)df+=Math.PI*2;
      // Hitbox: half-angle = atan(0.35/d) — zombie is ~0.7 wide, scales correctly with distance
      const hitAngle = Math.max(0.035, Math.atan(0.38/Math.max(0.5,d)));
      if(Math.abs(df)>hitAngle)continue;
      if(wallBetween(S.px,S.py,z.x,z.y))continue;
      if(d<bestD){best=z;bestD=d;}
    }
    if(best){
      // ── HEADSHOT / BODYSHOT detection based on pitch aim ──
      // Pitch up (negative) = aiming high = more likely headshot
      // Headshot zone: pitch > 0.18 rad above horizon or random 20% chance
      const isHead = (S.pitch+recoilPitch) < -0.12 || Math.random()<0.2;
      const dmgMult = isHead ? 2.0 : 1.0;
      const dmgUpMul = 1 + (S.dmgUp||0)*0.25;
      const dmgDealt = w.dmg * dmgMult * dmgUpMul;
      hit=true;best.hp-=dmgDealt;best.fl=0.2;
      hmT=0.18;hmHead=isHead; // kích hoạt hitmarker
      // Fire DoT for flamethrower
      if(w.isFire){best.fireDot=(best.fireDot||0)+0.4;} // add 0.4s burn
      lastHitIsHead=isHead;
      // Store hit effect in world coords
      hitEffects.push({x:best.x,y:best.y,headshot:isHead,t:0.8,dmg:~~dmgDealt});
      playHit(isHead);
      if(w.splash){
        for(const z of zombies){
          if(!z.alive||z===best)continue;
          const dx=z.x-best.x,dy=z.y-best.y,d=Math.sqrt(dx*dx+dy*dy);
          if(d<w.splash&&!wallBetween(best.x,best.y,z.x,z.y)){z.hp-=w.dmg*(1-d/w.splash);z.fl=0.15;}
        }
      }
    }
  }
  let anyKill=false;
  for(const z of zombies){
    if(z.alive&&z.hp<=0){
      z.alive=false;S.kills++;anyKill=true;
      const r=Math.ceil(1+S.wave*.5);S.coins+=r;S.score+=100*S.wave;hud();
      playDeath();
      // ── DROP ITEM ──
      if(typeof rollZombieDrop==='function') rollZombieDrop(z.x, z.y);
      // Toxic cloud on death
      if(z.type==='toxic'){
        traps.push({x:z.x,y:z.y,type:'poison',active:true,timer:6,triggered:true});
        msg(`☠️ Zombie Độc thả mây độc!`);
      }
      // Exploder — explode near player
      if(z.type==='exploder'){
        const ex=z.x-S.px,ey=z.y-S.py,ed=Math.sqrt(ex*ex+ey*ey);
        if(ed<2.5){const dr=S.armor>0?0.5:1;S.hp-=80*dr;if(S.armor>0)S.armor=Math.max(0,S.armor-30);hud();}
        // also damage nearby zombies
        for(const oz of zombies){if(!oz.alive||oz===z)continue;const dx=oz.x-z.x,dy=oz.y-z.y,d2=Math.sqrt(dx*dx+dy*dy);if(d2<2.0)oz.hp-=60*(1-d2/2);}
        msg(`💥 Zombie Nổ phát nổ!`);
      }
      save();
    }
  }
  if(anyKill)msg(`+${Math.ceil(1+S.wave*.5)} xu Clau ☠ ${S.kills} kills`);
  else if(!hit&&pl===1)msg('Trượt...');
  if(S.ammo===0)msg('Hết đạn! [R] hoặc nút ↺');
}

function reload(){
  const res=getRes();
  if(reloading||res<=0||S.ammo>=gw().cap)return;
  if(gw().noReload){msg('Minigun không thể nạp đạn!');return;}
  reloading=true;reloadT=gw().rl;vmReloadT=gw().rl;
  playReload();
  msg('Đang nạp đạn...');
}

function trySleep(){
  if(!alive||shopOpen||sleeping)return;
  if(!S.hasBed){msg('❌ Bạn chưa có giường! Mua giường tại cửa hàng NPC trong nhà.');return;}
  if(sleepCooldown>0){msg(`⏰ Giường đang hồi phục: còn ${~~sleepCooldown}s nữa!`);return;}
  // Check if near bed
  const dx=S.px-BED_X,dy=S.py-BED_Y,dist=Math.sqrt(dx*dx+dy*dy);
  if(dist>BED_RADIUS){msg(`🛏️ Đến gần giường để ngủ! (khoảng cách: ${dist.toFixed(1)}m)`);return;}
  // Start sleeping
  sleeping=true;sleepTimer=10;
  S.hp=Math.min(100,S.hp+50);hud();
  msg('😴 Đang ngủ... Zombie bị đóng băng! (10 giây)');
  // Teleport zombies back to spawn
  for(const z of zombies){
    if(!z.alive)continue;
    const pool=SPAWN_POOL;
    const p=pool[~~(Math.random()*pool.length)];
    z.x=p[0]+(Math.random()-.5)*0.3;
    z.y=p[1]+(Math.random()-.5)*0.3;
    z.frozen=true; // freeze them
  }
}

function tryInteract(){
  if(!alive||shopOpen||meleeShopOpen)return;
  // Giường ngủ — check proximity
  if(S.hasBed){
    const bdx=S.px-BED_X,bdy=S.py-BED_Y,bdist=Math.sqrt(bdx*bdx+bdy*bdy);
    if(bdist<BED_RADIUS){trySleep();return;}
  }
  // NPC1 — chỉ mở shop khi đứng đủ gần
  const ndx=S.px-NPC_X,ndy=S.py-NPC_Y;
  if(Math.sqrt(ndx*ndx+ndy*ndy)<NPC_RADIUS){
    if(pointerLocked)document.exitPointerLock();
    openShop();return;
  }
  msg('🏪 Lại gần người bán để mua hàng!');
}
function tryInteractMelee(){
  if(!alive||shopOpen||meleeShopOpen)return;
  // G = chỉ mở shop NPC2 người bán vũ khí cận chiến
  const dx=S.px-NPC2_X,dy=S.py-NPC2_Y;
  if(Math.sqrt(dx*dx+dy*dy)<NPC2_RADIUS){
    if(pointerLocked)document.exitPointerLock();
    openMeleeShop();
  } else {
    msg('⚔️ Lại gần Người bán Vũ Khí Cận Chiến để tương tác!');
  }
}

function cycleTrap(){
  const types=['bomb','spike','poison','fire','electric'];
  const cur=types.indexOf(selectedTrap);
  selectedTrap=types[(cur+1)%types.length];
  const def=TRAP_DEFS[selectedTrap];
  const count=(S.traps&&S.traps[selectedTrap])||0;
  msg(`${def.e} Đã chọn: Bẫy ${def.label} (×${count})`);
}

function placeTrap(){
  if(!alive||shopOpen)return;
  if(!S.traps||!(S.traps[selectedTrap]>0)){
    msg(`❌ Không có ${TRAP_DEFS[selectedTrap].e} Bẫy ${TRAP_DEFS[selectedTrap].label}! Mua tại cửa hàng (G).`);
    return;
  }
  // Place 1 tile in front of player
  const px=S.px+Math.cos(S.ang)*1.0;
  const py=S.py+Math.sin(S.ang)*1.0;
  if(wall(px,py)){msg('❌ Không thể đặt bẫy ở đây!');return;}
  S.traps[selectedTrap]--;
  const def=TRAP_DEFS[selectedTrap];
  traps.push({x:px,y:py,type:selectedTrap,active:true,timer:def.duration===Infinity?Infinity:(def.duration||0),triggered:false,stunRemain:0});
  msg(`${def.e} Đã đặt Bẫy ${def.label}! Còn lại: ×${S.traps[selectedTrap]}`);
  save();
}

