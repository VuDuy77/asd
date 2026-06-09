// ── LOOP ──
const MSPD=3.2,RSPD=2.2,MPITCH=1.1;
let prev=performance.now();

function loop(now){
  requestAnimationFrame(loop);
  const dt=Math.min((now-prev)/1000,.05);prev=now;

  if(screen==='menu'){
    renderMenu();return;
  }

  if(alive&&!shopOpen){
    S.ang+=dX;dX=0;
    S.pitch=Math.max(-MPITCH,Math.min(MPITCH,S.pitch+dY));dY=0;

    if(K['ArrowLeft']||K['KeyQ'])S.ang-=RSPD*dt;
    if(K['ArrowRight']||K['KeyE'])S.ang+=RSPD*dt;
    if(scopeActive&&!gw().hasScope)scopeActive=false;

    const gunSpd=(gw().spdMul||1);
    const wSpd=typeof weightSpeedMul==='function'?weightSpeedMul():1;
    const sp=MSPD*(S.spd>0?1.65:1)*(1+(S.spdUp||0)*0.15)*gunSpd*wSpd,R=0.28;
    let nx=S.px,ny=S.py;

    // ── SLIDE (Ctrl) ──
    if(!sleeping){
    if(sliding){
      slideT-=dt;
      if(slideT<=0){sliding=false;}
      else{
        const sf=slideT/SLIDE_DUR; // 1→0
        nx+=slideVX*sf*dt;ny+=slideVY*sf*dt;
      }
    } else {
      if(K['KeyW']){nx+=Math.cos(S.ang)*sp*dt;ny+=Math.sin(S.ang)*sp*dt;}
      if(K['KeyS']){nx-=Math.cos(S.ang)*sp*dt;ny-=Math.sin(S.ang)*sp*dt;}
      if(K['KeyA']){nx+=Math.cos(S.ang-Math.PI/2)*sp*dt;ny+=Math.sin(S.ang-Math.PI/2)*sp*dt;}
      if(K['KeyD']){nx+=Math.cos(S.ang+Math.PI/2)*sp*dt;ny+=Math.sin(S.ang+Math.PI/2)*sp*dt;}
    }
    }

    // Wall-slide collision: try full move, then X-only, then Y-only
    const canMoveX=!wall(nx+R,S.py)&&!wall(nx-R,S.py)&&!wall(nx+R,S.py+R)&&!wall(nx-R,S.py-R)&&!wall(nx+R,S.py-R)&&!wall(nx-R,S.py+R);
    const canMoveY=!wall(S.px,ny+R)&&!wall(S.px,ny-R)&&!wall(S.px+R,ny)&&!wall(S.px-R,ny)&&!wall(S.px+R,ny+R)&&!wall(S.px-R,ny-R)&&!wall(S.px+R,ny-R)&&!wall(S.px-R,ny+R);
    if(canMoveX)S.px=nx;
    if(canMoveY)S.py=ny;

    // ── FOOTSTEP SOUND ──
    const isMoving=!sliding&&(K['KeyW']||K['KeyS']||K['KeyA']||K['KeyD']);
    if(isMoving){
      dustStepT-=dt;
      if(dustStepT<=0){
        dustStepT=0.22/(sp/MSPD);
        playFootstep(isIndoor(S.px,S.py), sp/MSPD);
        dustStepSide=!dustStepSide;
      }
    } else {dustStepT=Math.max(0,dustStepT-dt*2);}

    // Full-auto: Uzi/Minigun/Flamethrower fire while mouse held or Space held
    const isAutoGun=S.gun==='uzi'||S.gun==='minigun'||S.gun==='flame';
    if(weaponSlot===2){
      if(K['Space']&&meleeT<=0)doMeleeAttack();
    } else {
      const fireTrigger=(isAutoGun&&(K['Space']||mouseHeld))||K['Space'];
      if(fireTrigger){
        if(S.ammo<=0&&!reloading)reload();
        else if(!reloading&&rofT<=0)shoot();
      }
    }

    rofT=Math.max(0,rofT-dt);mfl=Math.max(0,mfl-dt*8);
    mflR=Math.max(0,mflR-dt*120);
    hmT=Math.max(0,hmT-dt); // hitmarker fade
    // ── OVERWEIGHT shake (>80% weight → camera trembles while moving) ──
    if(typeof weightPct==='function'){
      const wp=weightPct();
      if(wp>=1.0&&(K['KeyW']||K['KeyS']||K['KeyA']||K['KeyD'])){ /* locked, no shake needed */ }
      else if(wp>0.8&&(K['KeyW']||K['KeyS']||K['KeyA']||K['KeyD'])){
        camShakeT=Math.min(camShakeT+dt*0.4, 0.05);
      }
    }
    // Update hit effects timers
    for(let i=hitEffects.length-1;i>=0;i--){hitEffects[i].t-=dt;if(hitEffects[i].t<=0)hitEffects.splice(i,1);}
    S.spd=Math.max(0,S.spd-dt);S.rpd=Math.max(0,S.rpd-dt);
    // Sleep system timer
    if(sleeping){
      sleepTimer-=dt;
      if(sleepTimer<=0){
        sleeping=false;sleepCooldown=180; // 3 minutes
        for(const z of zombies)z.frozen=false;
        msg('☀️ Thức dậy! Zombie đang di chuyển trở lại. Hồi phục +50 HP đã áp dụng.');
      }
    }
    if(sleepCooldown>0)sleepCooldown=Math.max(0,sleepCooldown-dt);
    // Shield regen buff
    if(S.srg>0){const cap=S.armorCap?200:100;S.armor=Math.min(cap,S.armor+2*dt);S.srg=Math.max(0,S.srg-dt);hud();}

    // ── TRAP PROCESSING ──
    for(let ti=traps.length-1;ti>=0;ti--){
      const tr=traps[ti];
      if(!tr.active){traps.splice(ti,1);continue;}
      const def=TRAP_DEFS[tr.type];
      // Check player distance
      const pdx=S.px-tr.x,pdy=S.py-tr.y,pd=Math.sqrt(pdx*pdx+pdy*pdy);
      const playerHit=pd<def.trigR;
      // Check zombie distances
      const hitZombies=zombies.filter(z=>z.alive&&Math.sqrt((z.x-tr.x)**2+(z.y-tr.y)**2)<def.trigR);
      const triggered=playerHit||hitZombies.length>0;
      if(triggered){
        if(tr.type==='bomb'){
          // Instant explosion
          const sr=def.splashR;
          for(const z of zombies)if(z.alive){const d=Math.sqrt((z.x-tr.x)**2+(z.y-tr.y)**2);if(d<sr){z.hp-=def.dmg*(1-d/sr*0.5);z.fl=0.3;}}
          if(pd<sr){const dr=S.armor>0?0.5:1;S.hp-=def.playerDmg*(1-pd/sr*0.5)*dr;if(S.armor>0)S.armor=Math.max(0,S.armor-def.playerDmg*0.3);hud();msg('💥 Bom nổ! Bạn bị thương!');}
          tr.active=false;
        } else if(tr.type==='electric'){
          // Instant stun+damage
          for(const z of hitZombies){z.hp-=def.dmg;z.fl=0.4;z.frozen=true;z.stunRemain=(def.stunDur||2);}
          if(playerHit){const dr=S.armor>0?0.5:1;S.hp-=def.playerDmg*dr;if(S.armor>0)S.armor=Math.max(0,S.armor-20);hud();msg('⚡ Điện giật! Bạn bị tê liệt!');}
          tr.active=false;
        } else {
          // Ongoing damage (spike/poison/fire)
          tr.triggered=true;
          if(tr.timer!==Infinity)tr.timer=Math.max(0,tr.timer-dt);
          for(const z of hitZombies){z.hp-=def.dmgPerSec*dt;z.fl=0.1;}
          if(playerHit){const dr=S.armor>0?0.5:1;S.hp-=def.playerDmg*dt*dr;if(S.armor>0)S.armor=Math.max(0,S.armor-def.playerDmg*dt*0.3);hud();}
          if(tr.timer!==Infinity&&tr.timer<=0)tr.active=false;
        }
      }
      // ── Kiểm tra zombie chết vì bẫy ──
      let trapKill=false;
      for(const z of zombies){
        if(z.alive&&z.hp<=0){
          z.alive=false;S.kills++;trapKill=true;
          const r=Math.ceil(1+S.wave*.5);S.coins+=r;S.score+=100*S.wave;
          playDeath();
          if(z.type==='toxic')traps.push({x:z.x,y:z.y,type:'poison',active:true,timer:6,triggered:true});
          if(z.type==='exploder'){
            const ex=z.x-S.px,ey=z.y-S.py,ed=Math.sqrt(ex*ex+ey*ey);
            if(ed<2.5){const dr=S.armor>0?0.5:1;S.hp-=80*dr;if(S.armor>0)S.armor=Math.max(0,S.armor-30);hud();}
            for(const oz of zombies){if(!oz.alive||oz===z)continue;const dx=oz.x-z.x,dy=oz.y-z.y,d2=Math.sqrt(dx*dx+dy*dy);if(d2<2.0)oz.hp-=60*(1-d2/2);}
          }
        }
      }
      if(trapKill){hud();msg(`🪤 Bẫy hạ zombie! ☠ ${S.kills} kills`);save();}
      // ── Kiểm tra player chết vì bẫy ──
      if(S.hp<=0&&alive){alive=false;clearSave();}
      // Unfreeze zombies stunned by electric trap
      for(const z of zombies){
        if(z.stunRemain>0){z.stunRemain-=dt;if(z.stunRemain<=0){z.frozen=false;z.stunRemain=0;}}
      }
    }

    // ── RECOIL PHYSICS ──
    const w=gw();
    const rcRec=w.rcRec*(S.rpd>0?1.4:1);
    recoilVelP += -recoilPitch*rcRec*dt*8;  // spring back
    recoilVelA += -recoilAng*rcRec*dt*8;
    recoilVelP *= Math.pow(0.05,dt);          // damping
    recoilVelA *= Math.pow(0.05,dt);
    recoilPitch = Math.max(-0.35,Math.min(0,recoilPitch+recoilVelP*dt));
    recoilAng   = Math.max(-0.04,Math.min(0.04,recoilAng+recoilVelA*dt));
    // Slide: tilt camera pitch slightly forward (lean effect)
    if(sliding){
      const sf=slideT/SLIDE_DUR;
      recoilPitch = Math.min(recoilPitch, -0.09*sf);
    }

    // ── VIEW BOBBING (HL2/CS2 style — camera pitch nhấp nhô) ──
    const moving=K['KeyW']||K['KeyS']||K['KeyA']||K['KeyD']||sliding;
    const spMul=(S.spd>0?1.65:1)*(1+(S.spdUp||0)*0.15)*(gw().spdMul||1);
    // Target amplitude: tỷ lệ với tốc độ, giảm dần khi đứng yên
    const bobAmpTarget = moving ? 1.0 * spMul : 0;
    viewBobAmp += (bobAmpTarget - viewBobAmp) * Math.min(1, dt*9);
    // Tích lũy phase nhịp bước (2 bước/chu kỳ)
    viewBobT += dt * 6.8 * (sliding ? 1.8 : 1) * Math.max(0.01, viewBobAmp);
    // Bob pitch: lên/xuống — sin với tần số bước chân
    viewBobPitch = Math.sin(viewBobT) * 0.014 * viewBobAmp;
    // Bob sway: lắc ngang nhẹ — half freq, lệch pha π/2 (như HL2)
    viewBobSway  = Math.sin(viewBobT*0.5 + Math.PI*0.5) * 0.009 * viewBobAmp;

    // ── VIEW ROLL — nghiêng camera khi đi ngang (A/D) như Valve ──
    // Roll target: A = nghiêng phải (+), D = nghiêng trái (-)
    const strafeL = K['KeyA'] ? 1 : 0;
    const strafeR = K['KeyD'] ? 1 : 0;
    viewRollTarget = (strafeR - strafeL) * 0.028 * (sliding ? 1.6 : 1);
    // Smooth về target (spring-like, giống CS2)
    viewRoll += (viewRollTarget - viewRoll) * Math.min(1, dt*10);
    // Khi đứng yên, trả về 0 nhanh hơn
    if(!moving) viewRoll *= Math.pow(0.12, dt);

    // Viewmodel bob (giữ cho viewmodel riêng)
    vmBob  = Math.sin(viewBobT)*4*viewBobAmp;
    vmKickY = Math.max(0,vmKickY-dt*260);
    vmKickZ = Math.max(0,vmKickZ-dt*140);
    if(vmReloadT>0)vmReloadT=Math.max(0,vmReloadT-dt);

    // ── CAMERA SHAKE ──
    if(camShakeT>0){
      camShakeT=Math.max(0,camShakeT-dt);
      const si=camShakeT/0.12;
      camShakeX=(Math.random()-0.5)*10*si;
      camShakeY=(Math.random()-0.5)*8*si;
    } else {camShakeX*=0.8;camShakeY*=0.8;}

    // ── UPDATE PARTICLES ──
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.life-=dt;
      if(p.life<=0){particles.splice(i,1);continue;}
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.type==='spark'){p.vy+=280*dt;p.vx*=0.92;}
      else if(p.type==='shell'){p.vy+=320*dt;p.vx*=0.88;if(p.rot!==undefined)p.rot+=p.rotV*dt;}
    }

    if(reloading){
      reloadT-=dt;
      if(reloadT<=0){
        const at=gw().ammoType;
        const res=getRes();
        const take=Math.min(gw().cap-S.ammo,res);
        S.ammo+=take;
        S.ammoStore[at]=Math.max(0,(S.ammoStore[at]||0)-take);
        S.res=S.ammoStore[at];
        reloading=false;hud();msg('Nạp xong! '+gw().e);
      }
    }

    // ── MELEE TIMERS ──
    if(meleeT>0)meleeT=Math.max(0,meleeT-dt);
    if(meleeSkillT>0)meleeSkillT=Math.max(0,meleeSkillT-dt);
    updateMeleeSkill(dt);

    // ── ZOMBIE AI — Steering with wall-avoidance probes ──
    const ZR=.32;
    // House interior: col 29–45, row 3–20 — matches the 1-tiles bounding the building
    // Zombie entrance allowed only through the gap at row 7, col 26–27 (tile 4 fence opening)
    function insideHouse(x,y){return x>29&&x<45&&y>3&&y<20;}
    function zOk(tx,ty){
      for(const ox of[-ZR,ZR])for(const oy of[-ZR,ZR])if(wallForZombie(tx+ox,ty+oy))return false;
      return true;
    }
    function zOkNoHouse(tx,ty,wasOutside){
      // The house wall (col 28) has an open doorway only at row 7 (tile 0).
      // Outdoor zombies may only enter through that gap — wall tiles already
      // physically block all other entry, so we just need to ensure tile 4
      // fence tiles (col 26-27) are honoured (wallForZombie handles that).
      // No extra soft-block needed: zOk (which calls wallForZombie) is sufficient.
      return zOk(tx,ty);
    }
    for(const z of zombies){
      if(!z.alive)continue;
      z.anim+=dt*3.5;z.fl=Math.max(0,z.fl-dt*4);
      // Fire DoT
      if(z.fireDot>0){z.hp-=12*dt;z.fl=0.12;z.fireDot=Math.max(0,(z.fireDot||0)-dt);}
      if(z.frozen)continue; // frozen during sleep — don't move or attack
      const dx=S.px-z.x,dy=S.py-z.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<.01)continue;

      // ── Steering: pick best direction among 16 probes ──
      const baseAng=Math.atan2(dy,dx);
      // init wander if stuck
      if(!z.steerAng)z.steerAng=baseAng;
      if(!z.stuckT)z.stuckT=0;
      if(!z.lastX)z.lastX=z.x;
      if(!z.lastY)z.lastY=z.y;

      // Init steering state if missing
      if(z.steerAng===undefined){z.steerAng=Math.atan2(dy,dx);z.stuckT=0;z.lastX=z.x;z.lastY=z.y;}
      // Detect stuck (hasn't moved much in 0.5s)
      z.stuckT+=dt;
      if(z.stuckT>0.4){
        const moved=Math.hypot(z.x-z.lastX,z.y-z.lastY);
        if(moved<0.06){
          // stuck — try 16 evenly-spaced escape directions, pick most open
          let bestOpen=-1,bestEscAng=z.steerAng;
          for(let ei=0;ei<16;ei++){
            const ea=(ei/16)*Math.PI*2;
            const ex=z.x+Math.cos(ea)*0.7,ey=z.y+Math.sin(ea)*0.7;
            if(!wallForZombie(ex,ey)){
              // score = openness in that direction
              let openScore=0;
              for(let dist=0.3;dist<=1.2;dist+=0.3){
                const px2=z.x+Math.cos(ea)*dist,py2=z.y+Math.sin(ea)*dist;
                if(!wallForZombie(px2,py2))openScore++;
              }
              if(openScore>bestOpen){bestOpen=openScore;bestEscAng=ea;}
            }
          }
          z.steerAng=bestEscAng;
          // nudge directly to un-embed from wall
          const nudge=0.15;
          const nx2=z.x+Math.cos(bestEscAng)*nudge;
          const ny2=z.y+Math.sin(bestEscAng)*nudge;
          if(!wallForZombie(nx2,ny2))z.x=nx2;
          if(!wallForZombie(z.x,ny2))z.y=ny2;
        }
        z.lastX=z.x;z.lastY=z.y;z.stuckT=0;
      }

      const wasOutside=!insideHouse(z.x,z.y);

      // Probe 24 directions at 2 distances, pick best passable direction toward player
      let bestScore=-Infinity,bestAng=z.steerAng;
      const PROBES=24;
      for(let pi=0;pi<PROBES;pi++){
        const testAng=baseAng + (pi/PROBES)*Math.PI*2 - Math.PI;
        // Check both near and far probe
        const near=z.spd*dt*2.5, far=z.spd*dt*5;
        const tnx=z.x+Math.cos(testAng)*near, tny=z.y+Math.sin(testAng)*near;
        const tfx=z.x+Math.cos(testAng)*far,  tfy=z.y+Math.sin(testAng)*far;
        if(!zOkNoHouse(tnx,tny,wasOutside))continue; // blocked near = skip
        let angDiff=testAng-baseAng;
        while(angDiff>Math.PI)angDiff-=Math.PI*2;
        while(angDiff<-Math.PI)angDiff+=Math.PI*2;
        // Score: cosine alignment + bonus if far is also clear
        let score=Math.cos(angDiff);
        if(zOkNoHouse(tfx,tfy,wasOutside))score+=0.3;
        if(score>bestScore){bestScore=score;bestAng=testAng;}
      }
      // Smoothly steer toward best angle (faster turn rate)
      let steerDiff=bestAng-z.steerAng;
      while(steerDiff>Math.PI)steerDiff-=Math.PI*2;
      while(steerDiff<-Math.PI)steerDiff+=Math.PI*2;
      z.steerAng+=steerDiff*Math.min(1,dt*8);

      // Move along steer angle
      const step=z.spd*dt;
      const mx=z.x+Math.cos(z.steerAng)*step;
      const my=z.y+Math.sin(z.steerAng)*step;
      if(zOkNoHouse(mx,my,wasOutside)){z.x=mx;z.y=my;}
      else if(zOkNoHouse(mx,z.y,wasOutside)){z.x=mx;}
      else if(zOkNoHouse(z.x,my,wasOutside)){z.y=my;}

      // Separation: push away from other zombies
      for(const o of zombies){
        if(o===z||!o.alive)continue;
        const odx=z.x-o.x,ody=z.y-o.y,od=Math.sqrt(odx*odx+ody*ody);
        if(od<.55&&od>.01){
          const push=.18*(.55-od);
          const tx=z.x+odx/od*push,ty=z.y+ody/od*push;
          if(zOkNoHouse(tx,ty,wasOutside)){z.x=tx;z.y=ty;}
        }
      }
      if(d<.8){
        // Riot Shield intercepts zombie damage
        if(S_melee==='riot_shield'&&shieldBlock>0){
          const blocked=Math.min(shieldBlock,z.dmg*dt);
          shieldBlock-=blocked;
          if(shieldBlock<=0){shieldBlock=0;msg('🛡️ Riot Shield đã bị phá vỡ!');}
        } else {
          const dr=S.armor>0?.4:1;S.hp-=z.dmg*dt*dr;if(S.armor>0)S.armor=Math.max(0,S.armor-4*dt);hud();if(S.hp<=0){alive=false;clearSave();}
        }
      }
    }

    if(waveActive&&zombies.filter(z=>z.alive).length===0){
      waveActive=false;
      const heal=Math.max(5,25-S.wave*2),bonus=S.wave*2;
      S.hp=Math.min(S.hp+heal,100);S.coins+=bonus;S.wave++;
      addRes(gw().ammoType, 15);S.res=getRes();
      hud();
      // First-appear warning for new zombie types
      let hint='';
      if(S.wave===3)hint=' ⚠️ RUNNER xuất hiện — nhanh nhưng máu ít!';
      else if(S.wave===5)hint=' ⚠️ TANK xuất hiện — chậm nhưng máu rất nhiều!';
      else if(S.wave===7)hint=' ⚠️ ZOMBIE ĐỘC xuất hiện — chết để lại mây độc!';
      else if(S.wave===9)hint=' ⚠️ ZOMBIE NỔ xuất hiện — phát nổ khi chết!';
      msg(`🎉 Wave hoàn thành! +${heal}HP +${bonus}xu · Wave ${S.wave} sắp đến...${hint}`);
      setTimeout(()=>{if(alive){spawnWave();save();}},2200);
    }
    autoSvT+=dt;if(autoSvT>=15){autoSvT=0;save();}
  } else {dX=0;dY=0;}

  renderGame();
}

// ── INIT ──
zombies.length=0;spawnWave();hud();
requestAnimationFrame(loop);
