// ── SHOP ──
function openShop(){shopOpen=true;buildShop();document.getElementById('shopOv').classList.add('on');}
function closeShop(){shopOpen=false;document.getElementById('shopOv').classList.remove('on');msg('Trở lại!');}

// ── MELEE SHOP ──
function openMeleeShop(){
  meleeShopOpen=true;
  document.getElementById('meleeShopOv').style.display='flex';
  buildMeleeShop();
}
function closeMeleeShop(){
  meleeShopOpen=false;
  document.getElementById('meleeShopOv').style.display='none';
  msg('Cất vũ khí cận chiến!');
}
function buildMeleeShop(){
  document.getElementById('msCo').textContent=S.coins;
  const cur=S_melee?MELEE_WEAPONS[S_melee]:null;
  document.getElementById('msCurWeapon').textContent=cur?(cur.e+' '+cur.n):'Không có';
  const g=document.getElementById('msGr');g.innerHTML='';
  for(const key of Object.keys(MELEE_WEAPONS)){
    const it=MELEE_WEAPONS[key];
    const owned=S_melee===it.id;
    const can=S.coins>=it.p&&!owned;
    const d=document.createElement('div');d.className='si';
    d.innerHTML=`<div class="ico">${it.e}</div><div class="nm">${it.n}</div><div class="ds">${it.d}</div><div class="pr">🌀${it.p}xu</div>
    <button class="buy"${!can&&!owned?' disabled':''}>${owned?'Đang dùng':can?'Mua':'Không đủ'}</button>`;
    if(!owned)d.querySelector('.buy').onclick=()=>buyMelee(it);
    g.appendChild(d);
  }
  // Unequip button
  if(S_melee){
    const ub=document.createElement('div');
    ub.style.cssText='grid-column:1/-1;text-align:center;margin-top:6px;';
    ub.innerHTML=`<button class="buy" style="background:#1a0808;border:1px solid #883030;color:#e24b4a;width:auto;padding:4px 16px;">✕ Bỏ vũ khí cận chiến</button>`;
    ub.querySelector('button').onclick=()=>{S_melee=null;shieldBlock=0;buildMeleeShop();msg('Đã bỏ vũ khí cận chiến.');};
    g.appendChild(ub);
  }
}
function buyMelee(it){
  if(S.coins<it.p){msg('❌ Không đủ xu!');return;}
  S.coins-=it.p;
  S_melee=it.id;
  if(it.isShield)shieldBlock=it.shieldHp;
  hud();buildMeleeShop();save();
  msg(`${it.e} Đã mua ${it.n}! Nhấn [F] để tấn công cận chiến.`);
}

// ── MELEE ATTACK ──
function doMeleeAttack(){
  if(!alive||!S_melee||meleeT>0)return;
  const mw=MELEE_WEAPONS[S_melee];
  meleeT=mw.delay;
  vmKickY+=18;
  camShakeT=Math.min(0.15,camShakeT+0.08);
  let hitAny=false;
  for(const z of zombies){
    if(!z.alive)continue;
    const dx=z.x-S.px,dy=z.y-S.py;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist>1.9)continue;
    let diff=Math.atan2(dy,dx)-S.ang;
    while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;
    if(Math.abs(diff)>1.2)continue;
    const isHS=S.pitch<-0.12;
    const baseDmg=isHS?mw.hsDmg:mw.dmg;
    const dmgMul=1+(S.dmgUp||0)*0.25;
    const dmg=~~(baseDmg*dmgMul);
    z.hp-=dmg;z.fl=0.15;
    playHit(isHS);
    showDmgFloat(z.x,z.y,isHS?'💥'+dmg:dmg,isHS);
    hmT=0.18;hmHead=isHS; // hitmarker
    hitAny=true;
    if(z.hp<=0){z.alive=false;S.kills++;S.score+=z.isBoss?50:10;S.coins+=z.isBoss?8:2;hud();save();playDeath();}
  }
  if(!hitAny)showDmgFloat(S.px+Math.cos(S.ang)*1.2,S.py+Math.sin(S.ang)*1.2,'miss',false);
}

// ── KATANA SKILL: Chém Liên Hoàn ──
function doKatanaSkill(){
  if(!alive||S_melee!=='katana')return;
  if(meleeSkillT>0){msg(`⚔️ Skill hồi chiêu: ${meleeSkillT.toFixed(1)}s`);return;}
  meleeSkillActive=true;
  meleeSkillHitsLeft=MELEE_WEAPONS.katana.skillHits;
  meleeSkillHitT=0;
  meleeT=0;
  msg('⚔️ CHÉM LIÊN HOÀN! 25 nhát × 30dmg!');
  // screen flash
  camShakeT=0.5;
}

function updateMeleeSkill(dt){
  if(!meleeSkillActive)return;
  meleeSkillHitT-=dt;
  if(meleeSkillHitT<=0&&meleeSkillHitsLeft>0){
    meleeSkillHitT=0.06; // ~60ms per slash
    meleeSkillHitsLeft--;
    vmKickY+=6;
    // hit nearby zombies
    for(const z of zombies){
      if(!z.alive)continue;
      const dx=z.x-S.px,dy=z.y-S.py;
      if(Math.sqrt(dx*dx+dy*dy)>2.2)continue;
      const dmgMul=1+(S.dmgUp||0)*0.25;
      const dmg=~~(30*dmgMul);
      z.hp-=dmg;
      playHit(false);
      showDmgFloat(z.x,z.y,dmg,false);
      if(z.hp<=0){z.alive=false;S.kills++;S.score+=z.isBoss?50:10;S.coins+=z.isBoss?8:2;hud();save();playDeath();}
    }
  }
  if(meleeSkillHitsLeft<=0){
    meleeSkillActive=false;
    meleeSkillT=MELEE_WEAPONS.katana.skillCooldown;
    msg('⚔️ Chém liên hoàn kết thúc! Hồi chiêu 15s.');
    hud();
  }
}
function buildShop(){
  document.getElementById('sCo').textContent=S.coins;
  const g=document.getElementById('sGr');g.innerHTML='';
  const cats=[
    {k:'item', label:'🏠 VẬT PHẨM'},
    {k:'gun',  label:'⚔️ VŨ KHÍ'},
    {k:'ammo', label:'🧲 ĐẠN DƯỢC'},
    {k:'heal', label:'💊 HỒI PHỤC'},
    {k:'armor',label:'🛡 GIÁP'},
    {k:'buff', label:'⚡ BUFF'},
    {k:'upg',  label:'🔬 NÂNG CẤP'},
    {k:'trap', label:'🪤 BẪY'},
  ];
  for(const cat of cats){
    const items=SHOP.filter(it=>it.cat===cat.k);
    if(!items.length)continue;
    // Category header
    const hdr=document.createElement('div');
    hdr.style.cssText='grid-column:1/-1;color:#ef9f27;font-size:11px;font-weight:bold;letter-spacing:2px;padding:6px 2px 2px;border-top:1px solid #1a1a1a;margin-top:4px;';
    hdr.textContent=cat.label;
    g.appendChild(hdr);
    for(const it of items){
      const have=it.t==='gun'&&S.gun===it.gid;
      const bedOwned=it.t==='bed'&&S.hasBed;
      const flashOwned=it.t==='flashlight'&&S.hasFlashlight;
      const trapCount=it.t==='trap'?(S.traps[it.tk]||0):0;
      // Upgrade cap check
      let maxed=false;
      if(it.t==='upg'){
        if(it.uk==='dmgUp'&&(S.dmgUp||0)>=3)maxed=true;
        if(it.uk==='armorCap'&&(S.armorCap||0)>=1)maxed=true;
        if(it.uk==='spdUp'&&(S.spdUp||0)>=3)maxed=true;
      }
      const can=S.coins>=it.p&&!maxed&&!bedOwned&&!flashOwned;
      const d=document.createElement('div');d.className='si';
      let lvlStr='';
      if(it.uk==='dmgUp')lvlStr=` [${S.dmgUp||0}/3]`;
      if(it.uk==='spdUp')lvlStr=` [${S.spdUp||0}/3]`;
      if(it.uk==='armorCap')lvlStr=S.armorCap?' ✓':'';
      if(it.t==='trap')lvlStr=` ×${trapCount}`;
      if(it.t==='flashlight')lvlStr=S.hasFlashlight?' ✓':'';
      d.innerHTML=`<div class="ico">${it.e}</div><div class="nm">${it.n}${lvlStr}</div><div class="ds">${it.d}</div><div class="pr">🌀${it.p}xu</div>
      <button class="buy"${!can||have?' disabled':''}>${have?'Đang dùng':bedOwned?'Đã có':flashOwned?'Đã có':maxed?'MAX':can?'Mua':'Không đủ'}</button>`;
      d.querySelector('.buy').onclick=()=>buy(it);
      g.appendChild(d);
    }
  }
}
function buy(it){
  if(S.coins<it.p)return;
  // Check upgrade cap
  if(it.t==='upg'){
    if(it.uk==='dmgUp'&&(S.dmgUp||0)>=3){msg('Đã đạt cấp tối đa!');return;}
    if(it.uk==='armorCap'&&(S.armorCap||0)>=1){msg('Đã nâng cấp rồi!');return;}
    if(it.uk==='spdUp'&&(S.spdUp||0)>=3){msg('Đã đạt cấp tối đa!');return;}
  }
  S.coins-=it.p;
  if(it.t==='bed'){S.hasBed=1;msg('🛏️ Đã mua giường ngủ! Vào nhà nhấn E gần giường để ngủ.');hud();buildShop();save();return;}
  else if(it.t==='flashlight'){S.hasFlashlight=1;msg('🔦 Đã mua đèn pin! Tự động chiếu sáng khi ngoài trời.');hud();buildShop();save();return;}
  else if(it.t==='trap'){
    if(!S.traps)S.traps={bomb:0,spike:0,poison:0,fire:0,electric:0};
    S.traps[it.tk]=(S.traps[it.tk]||0)+1;
    msg(`${TRAP_DEFS[it.tk].e} Đã mua ${it.n}! Nhấn P để đặt bẫy (×${S.traps[it.tk]})`);
    hud();buildShop();save();return;
  }
  else if(it.t==='gun'){
    S.gun=it.gid;
    const gdat=GUNS[it.gid];
    S.ammo=gdat.cap;
    S.res=getRes(); // sync legacy S.res
    scopeActive=false;msg('Đã mua '+gdat.n+'!');
  }
  else if(it.t==='heal'){S.hp=Math.min(100,S.hp+it.v);msg(`+${it.v} HP ❤️`);}
  else if(it.t==='armor'){const cap=S.armorCap?200:100;S.armor=Math.min(cap,S.armor+it.v);msg(`Giáp +${it.v} 🛡`);}
  else if(it.t==='ammo'){
    // Fill current magazine from reserve
    S.ammo=gw().cap;
    S.res=getRes();
    msg('Đạn đầy! 🧲');
  }
  else if(it.t==='ammo_type'){
    addRes(it.at, it.v);
    S.res=getRes(); // sync if current gun matches
    msg(`+${it.v} đạn ${it.e} (${it.at})`);
  }
  else if(it.t==='res'){S.res+=it.v;if(S.ammoStore)S.ammoStore[gw().ammoType||'pistol']=(S.ammoStore[gw().ammoType||'pistol']||0)+it.v;msg(`+${it.v} đạn 📦`);}
  else if(it.t==='buff'){S[it.bk]=it.dur;msg(`${it.n} kích hoạt!`);}
  else if(it.t==='buff2'){S.spd=it.dur;S.rpd=it.dur;msg(`💢 Berserker! +speed +rapidfire ${it.dur}s`);}
  else if(it.t==='upg'){
    if(it.uk==='dmgUp'){S.dmgUp=(S.dmgUp||0)+1;msg(`⚔️ Dmg +25%! (cấp ${S.dmgUp}/3)`);}
    else if(it.uk==='armorCap'){S.armorCap=1;msg('🔩 Giới hạn giáp tăng lên 200!');}
    else if(it.uk==='spdUp'){S.spdUp=(S.spdUp||0)+1;msg(`👟 Speed +15%! (cấp ${S.spdUp}/3)`);}
  }
  hud();buildShop();save();
}

// ── HUD ──
function hud(){
  document.getElementById('hHp').textContent=Math.max(0,~~S.hp);
  document.getElementById('hAm').textContent=S.ammo+'/'+getRes();
  document.getElementById('hSc').textContent=S.score;
  document.getElementById('hCo').textContent=S.coins;
  document.getElementById('sCo').textContent=S.coins;
  document.getElementById('hKl').textContent='☠'+S.kills;
  const w=gw();
  if(weaponSlot===2&&S_melee){
    const mw=MELEE_WEAPONS[S_melee];
    document.getElementById('hWp').textContent='[2]'+mw.e+' '+mw.n;
    document.getElementById('hWp').style.color='#ff8844';
  } else {
    document.getElementById('hWp').textContent='[1]'+w.e+' '+w.n;
    document.getElementById('hWp').style.color=w.c;
  }
  const ar=document.getElementById('hAr');
  ar.style.display=S.armor>0?'inline':'none';
  if(S.armor>0)document.getElementById('hArV').textContent=~~S.armor;
}
function msg(t){document.getElementById('msg').textContent=t;}

function showDmgFloat(wx,wy,txt,isHS){
  // Reuse the existing hitEffects projection system
  hitEffects.push({x:wx,y:wy,headshot:isHS,t:0.9,dmg:txt,isMelee:true});
}

// ── WEAPON SLOT SWITCH ──
function switchSlot(n){
  weaponSlot=n;
  if(n===1){
    msg('🔫 Slot 1 — '+gw().n);
  } else if(n===2){
    if(!S_melee){msg('⚔️ Slot 2 — Chưa có vũ khí cận chiến! Mua tại NPC [G].');}
    else msg('⚔️ Slot 2 — '+MELEE_WEAPONS[S_melee].n+' · Bấm chuột/Space để đánh');
  }
  hud();
}
