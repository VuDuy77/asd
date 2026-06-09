// ── RENDER MENU ──
function renderMenu(){
  ctx.fillStyle='#0a0604';ctx.fillRect(0,0,W,H);
  // title
  ctx.fillStyle='#e24b4a';ctx.font='bold 36px monospace';ctx.textAlign='center';
  ctx.fillText('☣ ZOMBIE SURVIVAL',W/2,80);
  // subtitle
  ctx.fillStyle='#ef9f27';ctx.font='14px monospace';
  ctx.fillText('CLICK / TAP màn hình để bắt đầu',W/2,120);
  // save info
  if(hadSave){
    ctx.fillStyle='#4caf50';ctx.font='13px monospace';
    ctx.fillText(`💾 Save: Wave ${S.wave} · ${S.score} điểm · ${S.kills} kills`,W/2,155);
  }
  // controls
  ctx.fillStyle='#333';ctx.font='11px monospace';
  const lines=[
    '── PC MODE ──',
    'WASD di chuyển  ·  Kéo chuột nhìn',
    'Click bắn  ·  Space bắn liên tục (Uzi)',
    'R nạp đạn  ·  T tương tác (NPC/giường)  ·  G vũ khí cận chiến',
    'Ctrl = Slide nhanh  ·  Chuột phải = Scope',
    '',
    '── TOUCH / MOBILE ──',
    'Kéo canvas nhìn  ·  Tap bắn',
    'Nút D-pad & 🔫 bên dưới',
  ];
  lines.forEach((l,i)=>{
    ctx.fillStyle=l.startsWith('──')?'#666':'#333';
    ctx.fillText(l,W/2,200+i*20);
  });
  // blink prompt
  if(Math.floor(performance.now()/500)%2===0){
    ctx.fillStyle='#ef9f27';ctx.font='bold 13px monospace';
    ctx.fillText('▶ NHẤN BẤT KỲ PHÍM / CLICK / CHẠM ĐỂ BẮT ĐẦU ◀',W/2,H-30);
  }
}

// ── RAYCASTER ──
function castRay(ang){
  const cs=Math.cos(ang),sn=Math.sin(ang);
  let x=S.px,y=S.py;const st=0.016;
  for(let i=0;i<Math.max(MW,MH)/st;i++){
    x+=cs*st;y+=sn*st;
    const mx=~~x,my=~~y;
    if(mx<0||mx>=MW||my<0||my>=MH)return{d:48,side:0,tile:1};
    const t=MAP[my][mx];
    if(t===1||t===4){
      const d=Math.sqrt((x-S.px)**2+(y-S.py)**2);
      const fx=x-mx,fy=y-my;
      return{d,side:Math.abs(fx-.5)<Math.abs(fy-.5)?1:0,tile:t};
    }
  }
  return{d:48,side:0,tile:1};
}

// ── INDOOR CHECK — nhà nằm cột 29-44, hàng 3-19 ──
function isIndoor(px,py){
  return px>=29&&px<=44&&py>=3&&py<=19;
}

// ── RENDER GAME ──
function renderGame(){
  ctx.save();
  // Camera shake (recoil) — translate only
  if(camShakeX||camShakeY)ctx.translate(camShakeX,camShakeY);
  // View roll — rotate around center of screen (như Valve)
  if(viewRoll){
    ctx.translate(W/2,H/2);
    ctx.rotate(viewRoll);
    ctx.translate(-W/2,-H/2);
  }
  // View bobbing: áp vào pitch để horizon dịch chuyển
  const totalPitch = S.pitch + recoilPitch + viewBobPitch;
  const po=~~(totalPitch*H*.6);
  const hor=H/2-po;
  horLine=hor;
  const indoor=isIndoor(S.px,S.py);

  // floor/ceiling
  const flOn=S.hasFlashlight&&!indoor; // flashlight extends outdoor range
  if(indoor){
    const cg=ctx.createLinearGradient(0,0,0,hor);
    cg.addColorStop(0,'#2a1e08');cg.addColorStop(1,'#5a4018');
    ctx.fillStyle=cg;ctx.fillRect(0,0,W,hor);
    const fgi=ctx.createLinearGradient(0,hor,0,H);
    fgi.addColorStop(0,'#3a2510');fgi.addColorStop(1,'#1a0e05');
    ctx.fillStyle=fgi;ctx.fillRect(0,hor,W,H-hor);
  } else {
    // Outdoor: trời đêm tối nhẹ, có ánh trăng
    const cg=ctx.createLinearGradient(0,0,0,hor);
    cg.addColorStop(0,'#0a0c10');cg.addColorStop(1,'#141820');
    ctx.fillStyle=cg;ctx.fillRect(0,0,W,hor);
    const fg=ctx.createLinearGradient(0,hor,0,H);
    fg.addColorStop(0,'#181410');fg.addColorStop(1,'#080604');
    ctx.fillStyle=fg;ctx.fillRect(0,hor,W,H-hor);
  }

  // walls
  const FOV=Math.PI/3;
  const viewAng=S.ang+recoilAng;
  for(let i=0;i<W;i++){
    const ra=viewAng-FOV/2+(i/W)*FOV;
    const{d,side,tile}=castRay(ra);
    const cd=d*Math.cos(ra-S.ang);
    const wh=Math.min(H*3,H/cd);
    const y0=hor-wh/2;
    const hitX=S.px+Math.cos(ra)*d, hitY=S.py+Math.sin(ra)*d;
    const wallIndoor=isIndoor(hitX,hitY)||indoor;
    // Outdoor: ambient moonlight sáng vừa, flashlight tăng tầm thêm
    const distCap=indoor?28:(flOn?26:18);
    const b=Math.max(0,1-d/distCap);
    let r,g,bl;
    if(tile===4){
      const bF=Math.max(0,1-d/(indoor||flOn?22:14));
      const stripe=Math.floor((S.py+Math.sin(ra)*d)*6)%2===0?1.0:0.75;
      r=side?~~(90*bF*stripe):~~(130*bF*stripe);
      g=side?~~(95*bF*stripe):~~(138*bF*stripe);
      bl=side?~~(100*bF*stripe):~~(148*bF*stripe);
    } else if(wallIndoor){
      const bL=Math.max(0,1-d/26);
      r=side?~~(210*bL):~~(255*bL);
      g=side?~~(155*bL):~~(195*bL);
      bl=side?~~(65*bL):~~(88*bL);
    } else if(flOn){
      // Đèn pin: vàng ấm, tầm xa
      r=side?~~(200*b):~~(255*b);
      g=side?~~(148*b):~~(190*b);
      bl=side?~~(60*b):~~(80*b);
    } else {
      // Outdoor không đèn: ánh trăng xanh lạnh nhẹ, đủ nhìn thấy
      r=side?~~(55*b):~~(80*b);
      g=side?~~(62*b):~~(90*b);
      bl=side?~~(75*b):~~(110*b);
    }
    ctx.fillStyle=`rgb(${r},${g},${bl})`;ctx.fillRect(i,y0,1,wh);
  }

  // Ánh đèn trong nhà — đèn vàng ấm (chỉ indoor, KHÔNG dùng radialGradient khi outdoor)
  if(indoor){
    const pulse=0.88+Math.sin(performance.now()*0.0012)*0.04;
    const lg=ctx.createRadialGradient(W/2,hor,0,W/2,hor,W*0.9);
    lg.addColorStop(0,`rgba(255,220,120,${0.32*pulse})`);
    lg.addColorStop(0.35,`rgba(255,180,60,${0.16*pulse})`);
    lg.addColorStop(0.7,`rgba(240,140,20,${0.07*pulse})`);
    lg.addColorStop(1,'rgba(200,100,0,0)');
    ctx.fillStyle=lg;ctx.fillRect(0,0,W,H);
    const lg2=ctx.createRadialGradient(W*0.18,hor-10,0,W*0.18,hor-10,W*0.45);
    lg2.addColorStop(0,`rgba(255,210,100,${0.18*pulse})`);
    lg2.addColorStop(1,'rgba(200,120,0,0)');
    ctx.fillStyle=lg2;ctx.fillRect(0,0,W,H);
    const lg3=ctx.createRadialGradient(W*0.82,hor-10,0,W*0.82,hor-10,W*0.45);
    lg3.addColorStop(0,`rgba(255,210,100,${0.18*pulse})`);
    lg3.addColorStop(1,'rgba(200,120,0,0)');
    ctx.fillStyle=lg3;ctx.fillRect(0,0,W,H);
  }

  // ── ZBUFFER: store wall distance per column for occlusion ──
  const zBuf=new Float32Array(W);
  for(let i=0;i<W;i++){
    const ra=viewAng-FOV/2+(i/W)*FOV;
    const{d}=castRay(ra);
    zBuf[i]=d*Math.cos(ra-viewAng);
  }

  // zombies — column-clipped against zbuffer
  const vis=[];
  for(const z of zombies){
    if(!z.alive)continue;
    const dx=z.x-S.px,dy=z.y-S.py,d=Math.sqrt(dx*dx+dy*dy);
    let a=Math.atan2(dy,dx)-viewAng;
    while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;
    if(Math.abs(a)>FOV*.75)continue;
    vis.push({z,d,a});
  }
  vis.sort((a,b)=>b.d-a.d);
  for(const{z,d,a}of vis){
    const sx=W/2+a/(FOV/2)*W/2;
    const sc=z.scale||1.0;
    const sh=Math.min(H*1.5*sc,H/d*1.5*sc),sw=sh*.6;
    const x0=sx-sw/2,y0=hor-sh/2;
    // Check if zombie center column is behind a wall
    const ci=~~Math.max(0,Math.min(W-1,sx));
    if(zBuf[ci]<d-0.15)continue; // wall closer than zombie — skip
    // count visible columns to decide if worth drawing (partial occlusion)
    let visCols=0;
    const x0i=Math.max(0,~~x0),x1i=Math.min(W-1,~~(x0+sw));
    for(let ci2=x0i;ci2<=x1i;ci2++){if(zBuf[ci2]>=d-0.15)visCols++;}
    if(visCols<2)continue;
    const br=Math.max(.08,1-d/16);
    const hit=z.fl>0;
    const type=z.type||'normal';
    // Color per type
    let rr,gg,bb,headR,headG,headB,eyeCol,hpCol;
    if(hit){rr=~~(220*br);gg=~~(60*br);bb=~~(60*br);eyeCol='#fff';hpCol='#fff';}
    else if(type==='runner'){rr=~~(30*br);gg=~~(140*br);bb=~~(200*br);eyeCol='#00ffff';hpCol='#00ddff';}
    else if(type==='tank'){rr=~~(160*br);gg=~~(30*br);bb=~~(10*br);eyeCol='#ff6600';hpCol='#ff4400';}
    else if(type==='toxic'){rr=~~(20*br);gg=~~(180*br);bb=~~(30*br);eyeCol='#aaff00';hpCol='#44ff44';}
    else if(type==='exploder'){rr=~~(220*br);gg=~~(140*br);bb=~~(0*br);eyeCol='#ffff00';hpCol='#ffaa00';}
    else if(type==='elite'){rr=~~(130*br);gg=~~(18*br);bb=~~(110*br);eyeCol='#ff88ff';hpCol='#aa44ff';}
    else{rr=~~(40*br);gg=~~(82*br);bb=~~(20*br);eyeCol='#ff2200';hpCol='#e24b4a';}
    headR=hit?rr:~~(rr*1.3);headG=hit?gg:~~(gg*1.2);headB=hit?bb:~~(bb*1.2);
    const C=`rgb(${rr},${gg},${bb})`;
    // Body
    ctx.fillStyle=C;ctx.fillRect(x0+sw*.15,y0+sh*.2,sw*.7,sh*.5);
    // Head
    ctx.fillStyle=`rgb(${Math.min(255,headR)},${Math.min(255,headG)},${Math.min(255,headB)})`;
    ctx.fillRect(x0+sw*.25,y0+sh*.02,sw*.5,sh*.2);
    // Eyes
    ctx.fillStyle=hit?'#fff':eyeCol;
    ctx.fillRect(x0+sw*.3,y0+sh*.07,sw*.08,sh*.05);ctx.fillRect(x0+sw*.58,y0+sh*.07,sw*.08,sh*.05);
    // Arms (animated)
    const av=Math.sin(z.anim*(type==='runner'?2.5:1))*.3;
    ctx.fillStyle=C;
    ctx.fillRect(x0+sw*.05,y0+sh*(.22+av),sw*.12,sh*.35);ctx.fillRect(x0+sw*.83,y0+sh*(.22-av),sw*.12,sh*.35);
    // Legs
    ctx.fillStyle=`rgb(${~~(20*br)},${~~(20*br)},${~~(15*br)})`;
    ctx.fillRect(x0+sw*.2,y0+sh*.7,sw*.25,sh*.3);ctx.fillRect(x0+sw*.55,y0+sh*.7,sw*.25,sh*.3);
    // Type badge near feet (small icon)
    if(d<8){
      ctx.font=`${Math.max(8,~~(12/d*3))}px monospace`;ctx.textAlign='center';
      let badge='';
      if(type==='runner')badge='🏃';
      else if(type==='tank')badge='🦣';
      else if(type==='toxic')badge='☠️';
      else if(type==='exploder')badge='💥';
      else if(type==='elite')badge='👾';
      if(badge)ctx.fillText(badge,sx,y0+sh+12);
    }
    // HP bar
    if(d<10){ctx.fillStyle='#300';ctx.fillRect(x0,y0-8,sw,5);ctx.fillStyle=hpCol;ctx.fillRect(x0,y0-8,sw*(z.hp/z.mhp),5);}
  }

  // ── VIEWMODEL — CS2 style ──
  // Tay ở mép dưới-phải. Nòng chĩa lên-trái. Phần grip/tay bị cắt bởi mép màn hình.
  // Chỉ thấy: nòng súng + thân trên + một phần tay — đúng như CS2/FPS thực.
  const w=gw();
  if(!(scopeActive&&gw().hasScope))
  {
    const reloadSwing = vmReloadT>0 ? Math.sin((1-vmReloadT/w.rl)*Math.PI)*32 : 0;
    const reloadRot   = vmReloadT>0 ? Math.sin((1-vmReloadT/w.rl)*Math.PI)*0.14 : 0;
    // Kick: giật lên khi bắn
    const kickY   = vmKickY * 0.65;
    const kickX   = vmKickY * 0.12;
    // Bob: lắc nhẹ khi đi như CS2
    const bobX    = Math.sin(vmBobT*0.9)*4.5;
    const bobY    = Math.abs(Math.sin(vmBobT*0.9))*3.0;
    const kickRot = vmKickY * 0.0018 + reloadRot;

    // GUN_ROT: góc nghiêng của súng — nhỏ hơn để nòng nhắm gần đường crosshair
    const GUN_ROT = 0.28;

    // Origin: góc dưới-phải, ĐỦ thấp để chỉ thấy nòng+receiver, tay bị cắt
    // H=420 → originY ~H+80 = 500 → phần grip/tay hoàn toàn dưới canvas
    const slideOffY = sliding ? 18*(1-slideT/SLIDE_DUR) : 0;
    const originX = W*0.78 + kickX + bobX + reloadSwing*0.45 + viewBobSway*W*0.7;
    const originY = H + 95 + kickY + bobY + reloadSwing + slideOffY;

    // Barrel lengths per gun (local space, -Y direction)
    const bLen = {pistol:200,shotgun:305,uzi:185,sniper:360,rocket:285,minigun:275,flame:265,crossbow:295}[S.gun]||210;
    // Muzzle tip in screen space after rotation:
    const mfCX = originX + Math.sin(-GUN_ROT)*bLen*0.82;
    const mfCY = originY - Math.cos(GUN_ROT)*bLen*0.82;
    // Store for shoot() particle spawn
    muzzleSX=mfCX; muzzleSY=mfCY;

    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(GUN_ROT + kickRot);

    const skin='#c8956a', slv='#4a5566', gc=w.vmCol;

    // ════════════════════════════════════════════
    // Each gun: drawn in LOCAL space
    //   +Y = down on screen (before rotation)
    //   barrel tip = negative Y (up)
    //   grip/hands at bottom (positive Y)
    //   Gun rotated so barrel aims ~upper-left = forward in CS2 view
    // ════════════════════════════════════════════

    if(S.gun==='pistol'){
      // ── PISTOL (Glock/USP style) ──
      // Slide
      ctx.fillStyle='#4a5a6a';
      ctx.beginPath();ctx.roundRect(-13,-190,26,150,3);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect(-10,-187,6,145); // highlight
      ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(4,-187,7,145);       // shadow side
      // Serrations on slide rear
      ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=1.5;
      for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(-12,-55+i*6);ctx.lineTo(12,-55+i*6);ctx.stroke();}
      // Ejection port
      ctx.fillStyle='rgba(0,0,0,0.55)';ctx.beginPath();ctx.roundRect(2,-150,12,35,2);ctx.fill();
      // Front sight
      ctx.fillStyle='#999';ctx.fillRect(-2,-193,4,7);
      // Rear sight
      ctx.fillStyle='#555';ctx.fillRect(-9,-43,6,5);ctx.fillRect(3,-43,6,5);
      // Frame / receiver
      ctx.fillStyle='#38464f';
      ctx.beginPath();ctx.roundRect(-15,-95,30,58,3);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(-12,-92,6,52);
      // Trigger guard
      ctx.strokeStyle='#2a3540';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(2,-34,17,0,Math.PI);ctx.stroke();
      // Trigger
      ctx.fillStyle='#888';ctx.beginPath();ctx.roundRect(-1,-50,5,18,2);ctx.fill();
      // Grip
      ctx.fillStyle='#243040';
      ctx.beginPath();ctx.roundRect(-14,-38,28,58,[0,0,9,9]);ctx.fill();
      // grip stippling
      ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
      for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(-11,-34+i*7);ctx.lineTo(11,-34+i*7);ctx.stroke();}
      // Barrel tip (muzzle) with bore
      ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(0,-190,9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#060606';ctx.beginPath();ctx.arc(0,-190,5,0,Math.PI*2);ctx.fill();
      // Magazine base
      ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.roundRect(-9,18,18,7,2);ctx.fill();

      // RIGHT HAND (trigger)
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-19,-25,40,36,[6,6,12,12]);ctx.fill();
      ctx.fillStyle='#b07850'; // shadow under hand
      ctx.fillRect(-19,4,40,7);
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.ellipse(19,-10,10,16,0.25,0,Math.PI*2);ctx.fill(); // thumb
      ctx.beginPath();ctx.roundRect(13,-53,9,22,4);ctx.fill(); // index on trigger
      // knuckle detail
      ctx.strokeStyle='rgba(0,0,0,0.2)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(-8,6,5,0,Math.PI);ctx.stroke();
      ctx.beginPath();ctx.arc(2,6,5,0,Math.PI);ctx.stroke();
      // Right sleeve/arm going down-right (screen space = up-right after rotation)
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-21,10);ctx.lineTo(23,10);ctx.lineTo(55,120);ctx.lineTo(-10,120);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(18,12,37,108);

      // LEFT HAND (support, on barrel/frame, forward)
      ctx.save();ctx.translate(-36,-138);ctx.rotate(0.25);
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-15,-10,32,28,[5,5,8,8]);ctx.fill();
      // four fingers over barrel
      for(let fi=0;fi<4;fi++){ctx.beginPath();ctx.roundRect(-13+fi*8,-22,7,15,3);ctx.fill();}
      ctx.beginPath();ctx.ellipse(14,6,8,13,0.4,0,Math.PI*2);ctx.fill(); // thumb
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-17,16);ctx.lineTo(16,16);ctx.lineTo(-30,110);ctx.lineTo(-70,110);ctx.closePath();ctx.fill();
      ctx.restore();

    } else if(S.gun==='shotgun'){
      // ── SHOTGUN (pump-action Remington 870 style) ──
      // Long barrel
      ctx.fillStyle='#252525';
      ctx.beginPath();ctx.roundRect(-11,-290,22,220,3);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(-8,-288,5,215);
      ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(6,-288,4,215);
      // Heat shield / rib on top
      ctx.fillStyle='#1e1e1e';ctx.fillRect(-4,-290,8,220);
      ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(-3,-289,2,218);
      // Front bead sight
      ctx.fillStyle='#ddd';ctx.beginPath();ctx.arc(0,-292,3,0,Math.PI*2);ctx.fill();
      // Pump / forend (wood colored)
      ctx.fillStyle='#7a4e20';
      ctx.beginPath();ctx.roundRect(-18,-195,36,50,5);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.08)';
      for(let i=0;i<6;i++){ctx.fillRect(-16,-192+i*7,32,3);}
      ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(10,-193,6,46);
      // Pump action bar
      ctx.fillStyle='#2a2a2a';ctx.fillRect(-2,-250,4,60);ctx.fillRect(-2,-195,4,50);
      // Receiver
      ctx.fillStyle=gc;
      ctx.beginPath();ctx.roundRect(-20,-143,40,80,4);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(-17,-140,8,74);
      ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(12,-140,7,74);
      // Loading gate (side)
      ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(20,-120,5,22);
      // Trigger guard
      ctx.strokeStyle='#222';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(2,-52,18,0,Math.PI);ctx.stroke();
      ctx.fillStyle='#888';ctx.beginPath();ctx.roundRect(-2,-65,5,18,2);ctx.fill(); // trigger
      // Wood stock
      ctx.fillStyle='#6b3d12';
      ctx.beginPath();ctx.roundRect(-18,-63,36,78,[0,0,10,10]);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fillRect(-15,-60,6,72);
      ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1;
      for(let i=0;i<9;i++){ctx.beginPath();ctx.moveTo(-14,-57+i*8);ctx.lineTo(14,-57+i*8);ctx.stroke();}
      // Recoil pad
      ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-18,12,36,6,[0,0,4,4]);ctx.fill();
      // Muzzle bore
      ctx.fillStyle='#111';ctx.beginPath();ctx.arc(0,-290,13,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#060606';ctx.beginPath();ctx.arc(0,-290,8,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#333';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-282,11,0,Math.PI*2);ctx.stroke();

      // RIGHT HAND (stock grip)
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-22,-43,44,40,[6,6,12,12]);ctx.fill();
      ctx.beginPath();ctx.ellipse(20,-26,11,18,0.22,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.roundRect(15,-72,10,26,4);ctx.fill(); // index
      ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(-7,0,5,0,Math.PI);ctx.stroke();
      ctx.beginPath();ctx.arc(4,0,5,0,Math.PI);ctx.stroke();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-24,-4);ctx.lineTo(26,-4);ctx.lineTo(60,110);ctx.lineTo(14,110);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(0,0,0,0.2)';ctx.fillRect(22,-2,38,112);

      // LEFT HAND (on pump forend)
      ctx.save();ctx.translate(0,-168);
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-20,-14,40,34,[5,5,8,8]);ctx.fill();
      for(let fi=0;fi<4;fi++){ctx.beginPath();ctx.roundRect(-16+fi*9,-26,8,16,3);ctx.fill();}
      ctx.beginPath();ctx.ellipse(18,10,10,15,0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-22,18);ctx.lineTo(22,18);ctx.lineTo(-42,110);ctx.lineTo(-82,110);ctx.closePath();ctx.fill();
      ctx.restore();

    } else if(S.gun==='uzi'){
      // ── UZI SMG ── compact boxy body
      // Short barrel
      ctx.fillStyle='#222';ctx.beginPath();ctx.roundRect(-7,-175,14,75,2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(-5,-173,4,71);
      ctx.fillStyle='#aaa';ctx.fillRect(-2,-178,4,6); // front sight
      // Main body (boxy)
      ctx.fillStyle=gc;
      ctx.beginPath();ctx.roundRect(-21,-138,42,115,4);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(-18,-135,8,110);
      ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(12,-135,8,110);
      // Top dust cover
      ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fillRect(-21,-138,42,9);
      // Rear sight
      ctx.fillStyle='#555';ctx.fillRect(-8,-142,6,5);ctx.fillRect(2,-142,6,5);
      // Cocking handle (right)
      ctx.fillStyle='#2a2a2a';ctx.beginPath();ctx.roundRect(21,-115,10,12,3);ctx.fill();
      // Ejection port
      ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(21,-105,4,26);
      // Trigger guard
      ctx.strokeStyle='#1e1e1e';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(2,-18,19,0,Math.PI);ctx.stroke();
      ctx.fillStyle='#777';ctx.beginPath();ctx.roundRect(-2,-32,5,18,2);ctx.fill();
      // Pistol grip
      ctx.fillStyle='#1e2830';
      ctx.beginPath();ctx.roundRect(-13,-24,26,55,[0,0,8,8]);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1.2;
      for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(-11,-20+i*6);ctx.lineTo(11,-20+i*6);ctx.stroke();}
      // Magazine (straight through grip = classic Uzi)
      ctx.fillStyle='#181818';ctx.beginPath();ctx.roundRect(-8,29,16,38,[2,2,6,6]);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(-6,31,3,34);
      // Muzzle bore
      ctx.fillStyle='#111';ctx.beginPath();ctx.arc(0,-175,9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#060606';ctx.beginPath();ctx.arc(0,-175,5,0,Math.PI*2);ctx.fill();

      // RIGHT HAND
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-18,-14,37,36,[6,6,10,10]);ctx.fill();
      ctx.beginPath();ctx.ellipse(17,-4,10,16,0.2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.roundRect(13,-44,9,22,4);ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(-6,4,5,0,Math.PI);ctx.stroke();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-20,20);ctx.lineTo(21,20);ctx.lineTo(52,110);ctx.lineTo(10,110);ctx.closePath();ctx.fill();

      // LEFT HAND (front of body)
      ctx.save();ctx.translate(-10,-112);
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-17,-12,34,28,[5,5,8,8]);ctx.fill();
      for(let fi=0;fi<4;fi++){ctx.beginPath();ctx.roundRect(-13+fi*9,-24,8,16,3);ctx.fill();}
      ctx.beginPath();ctx.ellipse(15,6,8,13,0.35,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-19,14);ctx.lineTo(17,14);ctx.lineTo(-32,110);ctx.lineTo(-72,110);ctx.closePath();ctx.fill();
      ctx.restore();

    } else if(S.gun==='sniper'){
      // ── SNIPER RIFLE (AWP / bolt-action style like CS2 image) ──
      // Very long barrel
      ctx.fillStyle='#252525';
      ctx.beginPath();ctx.roundRect(-9,-345,18,268,2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(-7,-343,4,264);
      ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(5,-343,4,264);
      // Muzzle brake (3 cuts)
      ctx.fillStyle='#1e1e1e';
      for(let mb=0;mb<4;mb++){ctx.beginPath();ctx.roundRect(-13,-345+mb*11,26,7,2);ctx.fill();}
      // Bore
      ctx.fillStyle='#0a0a0a';ctx.beginPath();ctx.arc(0,-345,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#040404';ctx.beginPath();ctx.arc(0,-345,4,0,Math.PI*2);ctx.fill();
      // Barrel collar
      ctx.fillStyle='#333';ctx.beginPath();ctx.roundRect(-12,-255,24,12,3);ctx.fill();
      // Front sight post
      ctx.fillStyle='#ccc';ctx.fillRect(-1.5,-316,3,8);

      // ── SCOPE (like CS2 AWP image) ──
      ctx.save();ctx.translate(12,-190);
      // scope tube
      ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-9,-60,18,118,9);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(-6,-58,4,114);
      // objective bell (front/top)
      ctx.fillStyle='#0d0d0d';ctx.beginPath();ctx.roundRect(-14,-62,28,16,8);ctx.fill();
      ctx.fillStyle='#080814';ctx.beginPath();ctx.arc(0,-62,11,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(70,110,200,0.35)';ctx.beginPath();ctx.arc(0,-62,7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.15)';ctx.beginPath();ctx.arc(-3,-65,3,0,Math.PI);ctx.fill(); // lens glare
      // eyepiece bell (rear/bottom)
      ctx.fillStyle='#0d0d0d';ctx.beginPath();ctx.roundRect(-12,52,24,14,7);ctx.fill();
      ctx.fillStyle='#060606';ctx.beginPath();ctx.arc(0,58,9,0,Math.PI*2);ctx.fill();
      // scope rings
      ctx.fillStyle='#2a2a2a';ctx.beginPath();ctx.roundRect(-14,-38,28,12,3);ctx.fill();
      ctx.beginPath();ctx.roundRect(-14,24,28,12,3);ctx.fill();
      // elevation turret
      ctx.fillStyle='#222';ctx.beginPath();ctx.roundRect(9,-16,14,22,4);ctx.fill();
      ctx.fillStyle='#555';ctx.beginPath();ctx.roundRect(9,-12,14,5,2);ctx.fill();
      ctx.beginPath();ctx.roundRect(9,-5,14,5,2);ctx.fill();
      ctx.restore();

      // Receiver
      ctx.fillStyle=gc;
      ctx.beginPath();ctx.roundRect(-19,-155,38,85,4);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(-16,-152,7,79);
      ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(11,-152,7,79);
      // Bolt handle (iconic, right side)
      ctx.fillStyle='#3a3a3a';
      ctx.beginPath();ctx.roundRect(19,-138,26,9,4);ctx.fill();
      ctx.fillStyle='#2a2a2a';ctx.beginPath();ctx.arc(47,-134,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a1a1a';ctx.beginPath();ctx.arc(47,-134,5,0,Math.PI*2);ctx.fill();
      // Ejection port
      ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(19,-125,4,32);
      // Trigger guard
      ctx.strokeStyle='#1e1e1e';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(2,-60,17,0,Math.PI);ctx.stroke();
      ctx.fillStyle='#888';ctx.beginPath();ctx.roundRect(-1,-72,5,18,2);ctx.fill();
      // Cheek piece / stock (wood)
      ctx.fillStyle='#4a3015';
      ctx.beginPath();ctx.roundRect(-18,-72,36,84,[0,0,12,12]);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.04)';ctx.fillRect(-15,-69,5,78);
      ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=1;
      for(let i=0;i<10;i++){ctx.beginPath();ctx.moveTo(-14,-67+i*8);ctx.lineTo(14,-67+i*8);ctx.stroke();}
      ctx.fillStyle='#3a2510';ctx.beginPath();ctx.roundRect(8,-72,6,52,3);ctx.fill(); // cheekpiece
      ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-18,10,36,6,[0,0,4,4]);ctx.fill(); // pad

      // RIGHT HAND
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-22,-46,44,42,[6,6,12,12]);ctx.fill();
      ctx.beginPath();ctx.ellipse(20,-28,11,18,0.22,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.roundRect(15,-80,10,28,4);ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(-8,0,5,0,Math.PI);ctx.stroke();
      ctx.beginPath();ctx.arc(3,0,5,0,Math.PI);ctx.stroke();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-24,-4);ctx.lineTo(28,-4);ctx.lineTo(66,110);ctx.lineTo(14,110);ctx.closePath();ctx.fill();

      // LEFT HAND (forward grip on stock/barrel area)
      ctx.save();ctx.translate(-12,-238);
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-16,-12,32,30,[5,5,8,8]);ctx.fill();
      for(let fi=0;fi<4;fi++){ctx.beginPath();ctx.roundRect(-12+fi*8,-24,7,16,3);ctx.fill();}
      ctx.beginPath();ctx.ellipse(14,8,8,13,0.35,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-18,16);ctx.lineTo(16,16);ctx.lineTo(-36,110);ctx.lineTo(-78,110);ctx.closePath();ctx.fill();
      ctx.restore();

    } else if(S.gun==='rocket'){
      // ── ROCKET LAUNCHER (RPG-7 style) ──
      // Main tube
      ctx.fillStyle='#384828';
      ctx.beginPath();ctx.roundRect(-19,-285,38,245,5);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(-16,-283,7,240);
      ctx.fillStyle='rgba(0,0,0,0.25)';ctx.fillRect(10,-283,8,240);
      // Tube bands
      ctx.strokeStyle='#283420';ctx.lineWidth=5;
      for(let b=0;b<6;b++){ctx.beginPath();ctx.arc(0,-270+b*38,19,0,Math.PI*2);ctx.stroke();}
      // Back blast cone (bottom of tube — rear end)
      ctx.fillStyle='#1e1e1e';ctx.beginPath();ctx.roundRect(-22,-42,44,10,3);ctx.fill();
      // Warhead/rocket protruding from front (top)
      ctx.fillStyle='#c03820';
      ctx.beginPath();ctx.arc(0,-288,14,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#e04530';
      ctx.beginPath();ctx.moveTo(0,-315);ctx.lineTo(-11,-288);ctx.lineTo(11,-288);ctx.closePath();ctx.fill();
      ctx.fillStyle='#ff6644';ctx.beginPath();ctx.arc(0,-310,4,0,Math.PI*2);ctx.fill(); // nose tip
      // Muzzle
      ctx.fillStyle='#0a0a0a';ctx.beginPath();ctx.arc(0,-285,18,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#050505';ctx.beginPath();ctx.arc(0,-285,12,0,Math.PI*2);ctx.fill();
      // Trigger / grip assembly
      ctx.fillStyle='#242e1e';ctx.beginPath();ctx.roundRect(-15,-100,30,68,5);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(-12,-97,5,62);
      // Iron sights
      ctx.fillStyle='#555';ctx.fillRect(-2,-118,4,12); // front
      ctx.fillStyle='#444';ctx.fillRect(-8,-142,7,6);ctx.fillRect(1,-142,7,6); // rear
      // Trigger guard
      ctx.strokeStyle='#1a1a1a';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(2,-38,19,0,Math.PI);ctx.stroke();
      ctx.fillStyle='#888';ctx.beginPath();ctx.roundRect(-1,-52,5,18,2);ctx.fill();
      // Grip
      ctx.fillStyle='#1c261a';ctx.beginPath();ctx.roundRect(-13,-34,26,56,[0,0,8,8]);ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=1.2;
      for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(-11,-30+i*7);ctx.lineTo(11,-30+i*7);ctx.stroke();}
      // Shoulder rest (right side)
      ctx.fillStyle='#303c22';ctx.beginPath();ctx.roundRect(19,-185,15,128,4);ctx.fill();

      // RIGHT HAND
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-20,-22,42,40,[6,6,10,10]);ctx.fill();
      ctx.beginPath();ctx.ellipse(20,-10,11,17,0.22,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.roundRect(15,-56,10,26,4);ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(-7,4,5,0,Math.PI);ctx.stroke();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-22,16);ctx.lineTo(26,16);ctx.lineTo(60,110);ctx.lineTo(12,110);ctx.closePath();ctx.fill();

      // LEFT HAND (supporting tube forward)
      ctx.save();ctx.translate(-8,-210);
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-20,-14,40,32,[5,5,8,8]);ctx.fill();
      for(let fi=0;fi<4;fi++){ctx.beginPath();ctx.roundRect(-16+fi*10,-26,9,16,3);ctx.fill();}
      ctx.beginPath();ctx.ellipse(18,8,10,16,0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-22,16);ctx.lineTo(20,16);ctx.lineTo(-36,110);ctx.lineTo(-80,110);ctx.closePath();ctx.fill();
      ctx.restore();

    } else if(S.gun==='minigun'){
      // ── MINIGUN — Heavy rotating barrel cluster ──
      // Main body housing
      ctx.fillStyle='#3a3a28';
      ctx.beginPath();ctx.roundRect(-24,-200,48,175,5);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(-21,-197,9,170);
      ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(14,-197,9,170);
      // Barrel cluster (6 barrels, rotate over time)
      const mAng=performance.now()*0.003*(mflR>1?6:0.5);
      for(let b=0;b<6;b++){
        const ba=mAng+b*(Math.PI*2/6);
        const bx=Math.cos(ba)*10,by=Math.sin(ba)*10;
        ctx.fillStyle=b%2===0?'#222':'#1a1a1a';
        ctx.beginPath();ctx.roundRect(bx-4,-280+by,8,100,3);ctx.fill();
        ctx.fillStyle='rgba(255,255,255,0.05)';ctx.fillRect(bx-3,-278+by,2,96);
        // Barrel tip rings
        ctx.strokeStyle='#333';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(bx,-280+by,4,0,Math.PI*2);ctx.stroke();
      }
      // Center hub
      ctx.fillStyle='#555';ctx.beginPath();ctx.arc(0,-230,12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#333';ctx.beginPath();ctx.arc(0,-230,6,0,Math.PI*2);ctx.fill();
      // Ammo feed belt (right side)
      ctx.fillStyle='#554433';ctx.beginPath();ctx.roundRect(24,-170,14,90,4);ctx.fill();
      for(let i=0;i<9;i++){ctx.fillStyle='#888';ctx.beginPath();ctx.arc(31,-165+i*10,4,0,Math.PI*2);ctx.fill();}
      // Handle / grip
      ctx.fillStyle='#28281c';ctx.beginPath();ctx.roundRect(-16,-25,32,55,[0,0,9,9]);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1.2;
      for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(-14,-21+i*7);ctx.lineTo(14,-21+i*7);ctx.stroke();}
      // Trigger group
      ctx.strokeStyle='#1c1c14';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(2,-12,17,0,Math.PI);ctx.stroke();
      ctx.fillStyle='#999';ctx.beginPath();ctx.roundRect(-2,-26,5,16,2);ctx.fill();
      // RIGHT HAND
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-22,-14,44,40,[6,6,12,12]);ctx.fill();
      ctx.beginPath();ctx.ellipse(20,-4,11,17,0.22,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.roundRect(14,-44,10,24,4);ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(-7,4,5,0,Math.PI);ctx.stroke();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-24,24);ctx.lineTo(26,24);ctx.lineTo(58,110);ctx.lineTo(8,110);ctx.closePath();ctx.fill();
      // LEFT HAND (on barrel housing)
      ctx.save();ctx.translate(-8,-152);
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-22,-14,44,32,[5,5,8,8]);ctx.fill();
      for(let fi=0;fi<4;fi++){ctx.beginPath();ctx.roundRect(-18+fi*11,-26,9,16,3);ctx.fill();}
      ctx.beginPath();ctx.ellipse(20,8,10,15,0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-24,16);ctx.lineTo(22,16);ctx.lineTo(-38,110);ctx.lineTo(-82,110);ctx.closePath();ctx.fill();
      ctx.restore();

    } else if(S.gun==='flame'){
      // ── FLAMETHROWER — fuel tank + nozzle ──
      // Main tube
      ctx.fillStyle='#3a1505';
      ctx.beginPath();ctx.roundRect(-17,-260,34,210,5);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(-14,-257,7,204);
      ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(10,-257,6,204);
      // Nozzle tip (flared)
      ctx.fillStyle='#1a0a02';
      ctx.beginPath();ctx.roundRect(-20,-268,40,14,4);ctx.fill();
      ctx.fillStyle='#251005';ctx.beginPath();ctx.arc(0,-268,14,0,Math.PI*2);ctx.fill();
      // Fuel tank (cylinder on back)
      ctx.fillStyle='#8b0000';
      ctx.beginPath();ctx.roundRect(17,-220,28,120,12);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(20,-217,6,114);
      // Pressure gauge
      ctx.fillStyle='#222';ctx.beginPath();ctx.arc(31,-160,8,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#4caf50';ctx.beginPath();ctx.arc(31,-160,5,0,Math.PI*2);ctx.fill();
      // Fuel hose
      ctx.strokeStyle='#552200';ctx.lineWidth=6;
      ctx.beginPath();ctx.moveTo(17,-190);ctx.bezierCurveTo(8,-190,8,-80,-8,-60);ctx.stroke();
      // Grip
      ctx.fillStyle='#2a0e04';ctx.beginPath();ctx.roundRect(-13,-30,26,58,[0,0,8,8]);ctx.fill();
      ctx.strokeStyle='rgba(255,80,0,0.08)';ctx.lineWidth=1.2;
      for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(-11,-26+i*7);ctx.lineTo(11,-26+i*7);ctx.stroke();}
      // Trigger guard
      ctx.strokeStyle='#1a0802';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(2,-18,17,0,Math.PI);ctx.stroke();
      ctx.fillStyle='#999';ctx.beginPath();ctx.roundRect(-1,-30,5,16,2);ctx.fill();
      // RIGHT HAND
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-20,-16,40,38,[6,6,10,10]);ctx.fill();
      ctx.beginPath();ctx.ellipse(18,-6,10,16,0.22,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.roundRect(13,-42,9,22,4);ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(-7,4,5,0,Math.PI);ctx.stroke();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-22,20);ctx.lineTo(24,20);ctx.lineTo(56,110);ctx.lineTo(10,110);ctx.closePath();ctx.fill();
      // LEFT HAND (holding tank)
      ctx.save();ctx.translate(22,-158);
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-14,-12,30,30,[5,5,8,8]);ctx.fill();
      for(let fi=0;fi<4;fi++){ctx.beginPath();ctx.roundRect(-12+fi*8,-22,7,14,3);ctx.fill();}
      ctx.beginPath();ctx.ellipse(14,8,8,12,0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-16,16);ctx.lineTo(14,16);ctx.lineTo(-24,110);ctx.lineTo(-64,110);ctx.closePath();ctx.fill();
      ctx.restore();
      // Animated flame at nozzle when firing
      if(mflR>2){
        ctx.save();
        for(let fl=0;fl<8;fl++){
          const ft=performance.now()*0.002+fl;
          const fx=Math.sin(ft*1.7+fl)*8,fy=Math.cos(ft*2.1+fl)*6;
          const flen=28+Math.sin(ft)*14+fl*4;
          const fg=ctx.createRadialGradient(fx,-270+fy,0,fx,-270+fy-flen,flen);
          fg.addColorStop(0,'rgba(255,240,60,0.9)');
          fg.addColorStop(0.3,'rgba(255,120,0,0.7)');
          fg.addColorStop(0.7,'rgba(200,30,0,0.3)');
          fg.addColorStop(1,'rgba(100,0,0,0)');
          ctx.fillStyle=fg;
          ctx.beginPath();ctx.arc(fx,-270+fy-flen*0.5,flen*0.7,0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
      }

    } else if(S.gun==='crossbow'){
      // ── CROSSBOW — medieval-futuristic style ──
      // Main stock
      ctx.fillStyle='#3a2010';
      ctx.beginPath();ctx.roundRect(-12,-280,24,240,4);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.06)';ctx.fillRect(-9,-277,5,234);
      ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(6,-277,5,234);
      // Rail on top
      ctx.fillStyle='#1a0e06';ctx.fillRect(-5,-284,10,4);
      // Arrow channel
      ctx.fillStyle='#0e0806';ctx.fillRect(-2,-280,4,200);
      // Crossbow arms (horizontal limbs) — the bow
      ctx.strokeStyle='#5a3510';ctx.lineWidth=8;
      ctx.beginPath();ctx.moveTo(-55,-220);ctx.quadraticCurveTo(-14,-200,-14,-185);ctx.stroke();
      ctx.beginPath();ctx.moveTo(55,-220);ctx.quadraticCurveTo(14,-200,14,-185);ctx.stroke();
      // Bowstring
      ctx.strokeStyle='rgba(200,180,140,0.8)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(-55,-220);ctx.lineTo(0,-188);ctx.lineTo(55,-220);ctx.stroke();
      // Arrow bolt (when loaded)
      if(S.ammo>0){
        ctx.fillStyle='#8b6914';ctx.fillRect(-2,-280,4,80);
        ctx.fillStyle='#ccc';ctx.beginPath();ctx.moveTo(0,-290);ctx.lineTo(-5,-270);ctx.lineTo(5,-270);ctx.closePath();ctx.fill();
        // Arrow fletching
        ctx.fillStyle='#e24b4a';ctx.beginPath();ctx.moveTo(-2,-210);ctx.lineTo(-8,-195);ctx.lineTo(-2,-195);ctx.closePath();ctx.fill();
        ctx.fillStyle='#e24b4a';ctx.beginPath();ctx.moveTo(2,-210);ctx.lineTo(8,-195);ctx.lineTo(2,-195);ctx.closePath();ctx.fill();
      }
      // Scope mount (same as sniper)
      ctx.save();ctx.translate(10,-175);
      ctx.fillStyle='#111';ctx.beginPath();ctx.roundRect(-8,-50,16,100,8);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.07)';ctx.fillRect(-5,-48,4,96);
      ctx.fillStyle='#0d0d0d';ctx.beginPath();ctx.roundRect(-12,-52,24,14,7);ctx.fill();
      ctx.fillStyle='#080814';ctx.beginPath();ctx.arc(0,-52,10,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(80,140,255,0.35)';ctx.beginPath();ctx.arc(0,-52,6,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.15)';ctx.beginPath();ctx.arc(-3,-55,3,0,Math.PI);ctx.fill();
      ctx.fillStyle='#0d0d0d';ctx.beginPath();ctx.roundRect(-10,44,20,12,6);ctx.fill();
      ctx.fillStyle='#222';ctx.beginPath();ctx.roundRect(-12,-28,24,10,3);ctx.fill();ctx.beginPath();ctx.roundRect(-12,18,24,10,3);ctx.fill();
      ctx.restore();
      // Trigger mechanism
      ctx.fillStyle='#2a1808';ctx.beginPath();ctx.roundRect(-14,-100,28,65,4);ctx.fill();
      ctx.strokeStyle='#160c04';ctx.lineWidth=4;
      ctx.beginPath();ctx.arc(2,-30,16,0,Math.PI);ctx.stroke();
      ctx.fillStyle='#888';ctx.beginPath();ctx.roundRect(-1,-44,5,16,2);ctx.fill();
      // Pistol grip
      ctx.fillStyle='#241006';ctx.beginPath();ctx.roundRect(-12,-36,24,52,[0,0,8,8]);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
      for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(-10,-32+i*7);ctx.lineTo(10,-32+i*7);ctx.stroke();}
      // RIGHT HAND
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-20,-20,40,38,[6,6,10,10]);ctx.fill();
      ctx.beginPath();ctx.ellipse(18,-10,10,16,0.22,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.roundRect(13,-52,9,24,4);ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.18)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(-6,4,5,0,Math.PI);ctx.stroke();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-22,16);ctx.lineTo(24,16);ctx.lineTo(56,110);ctx.lineTo(10,110);ctx.closePath();ctx.fill();
      // LEFT HAND (front grip under barrel)
      ctx.save();ctx.translate(-4,-210);
      ctx.fillStyle=skin;
      ctx.beginPath();ctx.roundRect(-16,-12,32,28,[5,5,8,8]);ctx.fill();
      for(let fi=0;fi<4;fi++){ctx.beginPath();ctx.roundRect(-12+fi*8,-22,7,14,3);ctx.fill();}
      ctx.beginPath();ctx.ellipse(14,6,8,12,0.35,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=slv;
      ctx.beginPath();ctx.moveTo(-18,14);ctx.lineTo(14,14);ctx.lineTo(-30,110);ctx.lineTo(-70,110);ctx.closePath();ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // ── MUZZLE FLASH ──
    if(mflR>1){
      ctx.save();
      const grd=ctx.createRadialGradient(mfCX,mfCY,0,mfCX,mfCY,mflR*2.5);
      grd.addColorStop(0,w.mflC+'ff');
      grd.addColorStop(0.3,'rgba(255,200,80,0.75)');
      grd.addColorStop(1,'rgba(255,100,0,0)');
      ctx.fillStyle=grd;ctx.beginPath();ctx.arc(mfCX,mfCY,mflR*2.5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(mfCX,mfCY,mflR*0.28,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=w.mflC+'ee';ctx.lineWidth=2;
      for(let si=0;si<7;si++){
        const sa=mflAng+si*(Math.PI*2/7);
        const sl=mflR*(1.0+Math.random()*0.8);
        ctx.beginPath();ctx.moveTo(mfCX+Math.cos(sa)*mflR*0.3,mfCY+Math.sin(sa)*mflR*0.3);ctx.lineTo(mfCX+Math.cos(sa)*sl,mfCY+Math.sin(sa)*sl);ctx.stroke();
      }
      const scrGrd=ctx.createRadialGradient(mfCX,mfCY,0,mfCX,mfCY,mflR*6);
      scrGrd.addColorStop(0,`rgba(255,210,80,${Math.min(0.22,mflR/80)})`);
      scrGrd.addColorStop(0.4,`rgba(255,150,0,${Math.min(0.12,mflR/120)})`);
      scrGrd.addColorStop(1,'rgba(255,100,0,0)');
      ctx.fillStyle=scrGrd;ctx.fillRect(0,0,W,H);
      // Additional ambient light pulse on walls
      if(mflR>10){
        const ambGrd=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.7);
        ambGrd.addColorStop(0,`rgba(255,200,80,${Math.min(0.08,mflR/200)})`);
        ambGrd.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=ambGrd;ctx.fillRect(0,0,W,H);
      }
      ctx.restore();
    }
  }

  // ── MELEE VIEWMODEL (slot 2) ──
  if(weaponSlot===2&&S_melee){
    const mw=MELEE_WEAPONS[S_melee];
    const swingPct=meleeT>0?(1-meleeT/mw.delay):0; // 0=idle, 1=just attacked
    const swingAng=swingPct>0?Math.sin(swingPct*Math.PI)*-0.7:0;
    const swingY=swingPct>0?Math.sin(swingPct*Math.PI)*(-50):0;
    const kickY=vmKickY*0.5;
    const bobX=Math.sin(vmBobT*0.9)*4.5;
    const bobY=Math.abs(Math.sin(vmBobT*0.9))*3.0;
    const originX=W*0.75+bobX+viewBobSway*W*0.5;
    const originY=H+80+kickY+bobY+swingY;
    ctx.save();
    ctx.translate(originX,originY);
    ctx.rotate(0.22+swingAng+kickY*0.001);
    const skin='#c8956a';
    if(mw.id==='knife'){
      // Grip
      ctx.fillStyle='#3a2a1a';ctx.beginPath();ctx.roundRect(-10,0,20,60,[4,4,10,10]);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(-6,4,6,52);
      // Guard
      ctx.fillStyle='#aaaaaa';ctx.beginPath();ctx.roundRect(-16,-8,32,12,3);ctx.fill();
      // Blade
      ctx.fillStyle='#d0e8ff';
      ctx.beginPath();ctx.moveTo(-5,-8);ctx.lineTo(5,-8);ctx.lineTo(2,-180);ctx.lineTo(-2,-180);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.moveTo(-1,-8);ctx.lineTo(1,-8);ctx.lineTo(0,-175);ctx.closePath();ctx.fill();
      // Hand
      ctx.fillStyle=skin;ctx.beginPath();ctx.roundRect(-12,50,24,40,[0,0,10,10]);ctx.fill();
    } else if(mw.id==='battle_axe'){
      // Handle
      ctx.fillStyle='#5a3a1a';ctx.beginPath();ctx.roundRect(-8,0,16,100,[3,3,8,8]);ctx.fill();
      // Axe head
      ctx.fillStyle='#bbbbcc';
      ctx.beginPath();ctx.moveTo(8,-80);ctx.lineTo(8,-140);ctx.bezierCurveTo(60,-160,65,-60,8,-80);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.4)';ctx.beginPath();ctx.moveTo(10,-85);ctx.lineTo(10,-135);ctx.bezierCurveTo(45,-150,48,-75,10,-85);ctx.fill();
      // Back spike
      ctx.fillStyle='#aaaaaa';ctx.beginPath();ctx.moveTo(-8,-90);ctx.lineTo(-35,-110);ctx.lineTo(-8,-130);ctx.closePath();ctx.fill();
      // Hand
      ctx.fillStyle=skin;ctx.beginPath();ctx.roundRect(-10,85,24,40,[0,0,8,8]);ctx.fill();
    } else if(mw.id==='katana'){
      // Tsuka (grip)
      ctx.fillStyle='#222';ctx.beginPath();ctx.roundRect(-8,0,16,70,[3,3,10,10]);ctx.fill();
      // Tsuka-ito wrapping
      ctx.strokeStyle='#cc2244';ctx.lineWidth=2;
      for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(-8,10+i*8);ctx.lineTo(8,10+i*8);ctx.stroke();}
      // Tsuba (guard)
      ctx.fillStyle='#888866';ctx.beginPath();ctx.ellipse(0,-4,18,7,0,0,Math.PI*2);ctx.fill();
      // Blade — slight curve
      ctx.fillStyle='#e8f0ff';
      ctx.beginPath();ctx.moveTo(-4,-4);ctx.quadraticCurveTo(8,-100,4,-210);ctx.lineTo(0,-210);ctx.quadraticCurveTo(-2,-100,-6,-4);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.6)';ctx.beginPath();ctx.moveTo(-1,-10);ctx.quadraticCurveTo(4,-100,2,-205);ctx.lineTo(0,-205);ctx.quadraticCurveTo(0,-100,-2,-10);ctx.closePath();ctx.fill();
      // Hand
      ctx.fillStyle=skin;ctx.beginPath();ctx.roundRect(-10,55,22,38,[0,0,8,8]);ctx.fill();
    } else if(mw.id==='riot_shield'){
      // Shield face
      ctx.fillStyle='#1a3a6a';
      ctx.beginPath();ctx.roundRect(-55,-160,110,180,[8,8,8,8]);ctx.fill();
      // Transparent window
      ctx.fillStyle='rgba(140,200,255,0.18)';ctx.beginPath();ctx.roundRect(-48,-148,96,100,[4,4,4,4]);ctx.fill();
      ctx.strokeStyle='rgba(180,220,255,0.5)';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-48,-148,96,100,[4,4,4,4]);ctx.stroke();
      // Border
      ctx.strokeStyle='#3366aa';ctx.lineWidth=4;ctx.beginPath();ctx.roundRect(-55,-160,110,180,[8,8,8,8]);ctx.stroke();
      // Shield HP bar
      if(mw.shieldHp>0){
        const shPct=shieldBlock/mw.shieldHp;
        ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(-45,-25,90,8);
        ctx.fillStyle=shPct>0.5?'#44ff88':shPct>0.25?'#ffcc00':'#ff4444';
        ctx.fillRect(-45,-25,~~(90*shPct),8);
      }
      // Handle arm
      ctx.fillStyle='#1a1a2a';ctx.beginPath();ctx.roundRect(-8,18,16,50,[3,3,8,8]);ctx.fill();
      ctx.fillStyle=skin;ctx.beginPath();ctx.roundRect(-10,60,22,35,[0,0,8,8]);ctx.fill();
    }
    ctx.restore();

    // Melee crosshair (larger, colored by weapon)
    if(!shopOpen&&!meleeShopOpen){
      const ready=meleeT<=0;
      ctx.strokeStyle=ready?mw.col+'dd':'rgba(100,80,60,0.6)';ctx.lineWidth=2;
      const cs=8;
      ctx.beginPath();ctx.moveTo(W/2-cs-5,H/2);ctx.lineTo(W/2-3,H/2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(W/2+3,H/2);ctx.lineTo(W/2+cs+5,H/2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(W/2,H/2-cs-5);ctx.lineTo(W/2,H/2-3);ctx.stroke();
      ctx.beginPath();ctx.moveTo(W/2,H/2+3);ctx.lineTo(W/2,H/2+cs+5);ctx.stroke();
      ctx.fillStyle=ready?mw.col+'cc':'rgba(100,80,60,0.5)';
      ctx.beginPath();ctx.arc(W/2,H/2,3,0,Math.PI*2);ctx.fill();
    }
  }

    // crosshair (center screen, fixed — dynamic spread based on recoil; hidden when scoped)
  if(!(scopeActive&&gw().hasScope)){
    const spread = 3 + Math.abs(recoilPitch)*80 + vmKickY*0.08;
    ctx.strokeStyle=w.c+'cc';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(W/2-13-spread,H/2);ctx.lineTo(W/2-3-spread,H/2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W/2+3+spread,H/2);ctx.lineTo(W/2+13+spread,H/2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W/2,H/2-13-spread);ctx.lineTo(W/2,H/2-3-spread);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W/2,H/2+3+spread);ctx.lineTo(W/2,H/2+13+spread);ctx.stroke();
    ctx.fillStyle=w.c+'cc';ctx.beginPath();ctx.arc(W/2,H/2,2,0,Math.PI*2);ctx.fill();
  }

  // ── HITMARKER (CS2 style) ──
  if(hmT>0){
    const alpha=Math.min(1,hmT/0.1);
    const col=hmHead?`rgba(255,60,60,${alpha})`:`rgba(255,255,255,${alpha})`;
    const sz=hmHead?9:7, gap=hmHead?4:3;
    ctx.strokeStyle=col;ctx.lineWidth=hmHead?2.5:2;
    ctx.lineCap='round';
    // 4 đường chéo ×
    ctx.beginPath();ctx.moveTo(W/2-gap,H/2-gap);ctx.lineTo(W/2-gap-sz,H/2-gap-sz);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W/2+gap,H/2-gap);ctx.lineTo(W/2+gap+sz,H/2-gap-sz);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W/2-gap,H/2+gap);ctx.lineTo(W/2-gap-sz,H/2+gap+sz);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W/2+gap,H/2+gap);ctx.lineTo(W/2+gap+sz,H/2+gap+sz);ctx.stroke();
  }

  // floor indicator (bed proximity handled below)
  {
    const pt=MAP[~~S.py][~~S.px];
    if(pt===2||pt===3){} // removed stair tiles
  }

  // Draw bed as a billboard sprite in the world
  if(S.hasBed){
    const bspDx=BED_X-S.px, bspDy=BED_Y-S.py;
    const bspD=Math.sqrt(bspDx*bspDx+bspDy*bspDy);
    const viewAngBed=S.ang+recoilAng;
    let bspA=Math.atan2(bspDy,bspDx)-viewAngBed;
    while(bspA>Math.PI)bspA-=Math.PI*2;while(bspA<-Math.PI)bspA+=Math.PI*2;
    const FOVbed=Math.PI/3;
    if(Math.abs(bspA)<FOVbed*0.65&&bspD<18){
      const bsx=W/2+bspA/(FOVbed/2)*W/2;
      const bsh=Math.min(H*1.2,H/bspD*1.2);
      const bsw=bsh*1.4;
      const bsy0=hor-bsh*0.1;
      const bedBr=Math.max(0.15,1-bspD/14);
      // Check occlusion
      const bci=~~Math.max(0,Math.min(W-1,bsx));
      if(zBuf[bci]>=bspD-0.1){
        // Bed frame
        ctx.fillStyle=`rgba(${~~(100*bedBr)},${~~(60*bedBr)},${~~(20*bedBr)},0.95)`;
        ctx.fillRect(bsx-bsw/2,bsy0-bsh*0.3,bsw,bsh*0.12);
        // Mattress
        ctx.fillStyle=`rgba(${~~(220*bedBr)},${~~(200*bedBr)},${~~(180*bedBr)},0.95)`;
        ctx.fillRect(bsx-bsw*0.42,bsy0-bsh*0.28,bsw*0.84,bsh*0.08);
        // Pillow
        ctx.fillStyle=`rgba(${~~(240*bedBr)},${~~(240*bedBr)},${~~(255*bedBr)},0.95)`;
        ctx.fillRect(bsx-bsw*0.3,bsy0-bsh*0.28,bsw*0.22,bsh*0.06);
        // Blanket
        ctx.fillStyle=`rgba(${~~(60*bedBr)},${~~(80*bedBr)},${~~(180*bedBr)},0.95)`;
        ctx.fillRect(bsx-bsw*0.42,bsy0-bsh*0.22,bsw*0.84,bsh*0.06);
        // Legs
        ctx.fillStyle=`rgba(${~~(80*bedBr)},${~~(50*bedBr)},${~~(15*bedBr)},0.9)`;
        ctx.fillRect(bsx-bsw*0.4,bsy0-bsh*0.2,bsw*0.08,bsh*0.2);
        ctx.fillRect(bsx+bsw*0.32,bsy0-bsh*0.2,bsw*0.08,bsh*0.2);
        // 🛏️ label
        if(bspD<5){
          ctx.font=`bold ${~~(12/bspD*5)}px monospace`;
          ctx.fillStyle=`rgba(180,220,255,${Math.max(0,1-bspD/5)})`;
          ctx.textAlign='center';
          ctx.fillText('🛏️',bsx,bsy0-bsh*0.35);
        }
      }
    }
  }

  // ── RENDER WORKBENCH (Bàn Chế Tạo) as billboard sprite — phòng bên trái ──
  if(typeof WB_X!=='undefined'){
    const wbDx=WB_X-S.px, wbDy=WB_Y-S.py;
    const wbD=Math.sqrt(wbDx*wbDx+wbDy*wbDy);
    const viewAngWb=S.ang+recoilAng;
    let wbA=Math.atan2(wbDy,wbDx)-viewAngWb;
    while(wbA>Math.PI)wbA-=Math.PI*2;while(wbA<-Math.PI)wbA+=Math.PI*2;
    const FOVwb=Math.PI/3;
    if(Math.abs(wbA)<FOVwb*0.65&&wbD<18){
      const wsx=W/2+wbA/(FOVwb/2)*W/2;
      const wsh=Math.min(H*0.9,H/wbD*0.85);
      const wsw=wsh*1.5;
      const wsy0=hor;
      const wbBr=Math.max(0.15,1-wbD/14);
      const wci=~~Math.max(0,Math.min(W-1,wsx));
      if(zBuf[wci]>=wbD-0.1){
        // Table top
        ctx.fillStyle=`rgba(${~~(160*wbBr)},${~~(100*wbBr)},${~~(40*wbBr)},0.97)`;
        ctx.fillRect(wsx-wsw*0.5,wsy0-wsh*0.55,wsw,wsh*0.1);
        // Table body (darker wood)
        ctx.fillStyle=`rgba(${~~(120*wbBr)},${~~(70*wbBr)},${~~(25*wbBr)},0.97)`;
        ctx.fillRect(wsx-wsw*0.45,wsy0-wsh*0.45,wsw*0.9,wsh*0.4);
        // Table legs
        ctx.fillStyle=`rgba(${~~(90*wbBr)},${~~(55*wbBr)},${~~(18*wbBr)},0.97)`;
        ctx.fillRect(wsx-wsw*0.42,wsy0-wsh*0.07,wsw*0.1,wsh*0.07);
        ctx.fillRect(wsx+wsw*0.32,wsy0-wsh*0.07,wsw*0.1,wsh*0.07);
        // Tool icon on table
        if(wbD<8){
          ctx.font=`${~~(wsw*0.3)}px monospace`;ctx.textAlign='center';
          ctx.fillStyle=`rgba(255,255,200,${Math.min(1,(8-wbD)/5)})`;
          ctx.fillText('⚒️',wsx,wsy0-wsh*0.58);
        }
        // Label
        if(wbD<5){
          const fs=Math.max(9,~~(14/wbD*3));
          ctx.font=`bold ${fs}px monospace`;ctx.textAlign='center';
          ctx.fillStyle=`rgba(80,255,180,${Math.min(1,(5-wbD)/3)})`;
          ctx.fillText('⚒ Bàn Chế Tạo',wsx,wsy0-wsh*0.72);
        }
      }
    }
  }

  // ── RENDER NPC SHOPKEEPER as billboard sprite ──
  {
    const npcDx=NPC_X-S.px, npcDy=NPC_Y-S.py;
    const npcD=Math.sqrt(npcDx*npcDx+npcDy*npcDy);
    const viewAngNpc=S.ang+recoilAng;
    let npcA=Math.atan2(npcDy,npcDx)-viewAngNpc;
    while(npcA>Math.PI)npcA-=Math.PI*2;while(npcA<-Math.PI)npcA+=Math.PI*2;
    const FOVnpc=Math.PI/3;
    if(Math.abs(npcA)<FOVnpc*0.65&&npcD<18){
      const nsx=W/2+npcA/(FOVnpc/2)*W/2;
      const nsh=Math.min(H*1.6,H/npcD*1.6);
      const nsw=nsh*0.55;
      const nsy0=hor-nsh*0.05;
      const npcBr=Math.max(0.15,1-npcD/14);
      const nci=~~Math.max(0,Math.min(W-1,nsx));
      if(zBuf[nci]>=npcD-0.1){
        const t=performance.now()*0.001;
        // Body (shopkeeper in brown coat)
        ctx.fillStyle=`rgba(${~~(160*npcBr)},${~~(100*npcBr)},${~~(40*npcBr)},0.97)`;
        ctx.beginPath();ctx.roundRect(nsx-nsw*0.28,nsy0-nsh*0.72,nsw*0.56,nsh*0.38,3);ctx.fill();
        // Head
        ctx.fillStyle=`rgba(${~~(220*npcBr)},${~~(175*npcBr)},${~~(130*npcBr)},0.97)`;
        ctx.beginPath();ctx.arc(nsx,nsy0-nsh*0.82,nsw*0.18,0,Math.PI*2);ctx.fill();
        // Hat
        ctx.fillStyle=`rgba(${~~(80*npcBr)},${~~(50*npcBr)},${~~(20*npcBr)},0.97)`;
        ctx.fillRect(nsx-nsw*0.22,nsy0-nsh*0.96,nsw*0.44,nsh*0.06);
        ctx.fillRect(nsx-nsw*0.15,nsy0-nsh*0.96-nsw*0.16,nsw*0.3,nsw*0.16);
        // Eyes
        ctx.fillStyle=`rgba(0,0,0,${0.8*npcBr})`;
        ctx.beginPath();ctx.arc(nsx-nsw*0.07,nsy0-nsh*0.83,nsw*0.04,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(nsx+nsw*0.07,nsy0-nsh*0.83,nsw*0.04,0,Math.PI*2);ctx.fill();
        // Legs
        ctx.fillStyle=`rgba(${~~(60*npcBr)},${~~(40*npcBr)},${~~(80*npcBr)},0.97)`;
        ctx.fillRect(nsx-nsw*0.22,nsy0-nsh*0.34,nsw*0.2,nsh*0.34);
        ctx.fillRect(nsx+nsw*0.02,nsy0-nsh*0.34,nsw*0.2,nsh*0.34);
        // Arms (animated slight swing)
        const armSwing=Math.sin(t*1.2)*0.06;
        ctx.fillStyle=`rgba(${~~(160*npcBr)},${~~(100*npcBr)},${~~(40*npcBr)},0.95)`;
        ctx.fillRect(nsx-nsw*0.38,nsy0-nsh*(0.68+armSwing),nsw*0.12,nsh*0.3);
        ctx.fillRect(nsx+nsw*0.26,nsy0-nsh*(0.68-armSwing),nsw*0.12,nsh*0.3);
        // 🏪 sign above NPC
        if(npcD<6){
          const fs=Math.max(9,~~(14/npcD*4));
          ctx.font=`bold ${fs}px monospace`;ctx.textAlign='center';
          ctx.fillStyle=`rgba(255,220,80,${Math.min(1,(6-npcD)/4)})`;
          ctx.fillText('🏪 Người bán',nsx,nsy0-nsh*1.05);
        }
      }
    }
  }

  // ── RENDER NPC2 MELEE WEAPON SELLER as billboard sprite ──
  {
    const npcDx=NPC2_X-S.px, npcDy=NPC2_Y-S.py;
    const npcD=Math.sqrt(npcDx*npcDx+npcDy*npcDy);
    const viewAngNpc2=S.ang+recoilAng;
    let npcA=Math.atan2(npcDy,npcDx)-viewAngNpc2;
    while(npcA>Math.PI)npcA-=Math.PI*2;while(npcA<-Math.PI)npcA+=Math.PI*2;
    const FOVnpc=Math.PI/3;
    if(Math.abs(npcA)<FOVnpc*0.65&&npcD<18){
      const nsx=W/2+npcA/(FOVnpc/2)*W/2;
      const nsh=Math.min(H*1.6,H/npcD*1.6);
      const nsw=nsh*0.55;
      const nsy0=hor-nsh*0.05;
      const npcBr=Math.max(0.15,1-npcD/14);
      const nci=~~Math.max(0,Math.min(W-1,nsx));
      if(zBuf[nci]>=npcD-0.1){
        const t2=performance.now()*0.001;
        // Body — red/dark armor jacket
        ctx.fillStyle=`rgba(${~~(140*npcBr)},${~~(30*npcBr)},${~~(30*npcBr)},0.97)`;
        ctx.beginPath();ctx.roundRect(nsx-nsw*0.28,nsy0-nsh*0.72,nsw*0.56,nsh*0.38,3);ctx.fill();
        // Head
        ctx.fillStyle=`rgba(${~~(200*npcBr)},${~~(155*npcBr)},${~~(110*npcBr)},0.97)`;
        ctx.beginPath();ctx.arc(nsx,nsy0-nsh*0.82,nsw*0.18,0,Math.PI*2);ctx.fill();
        // Helmet/bandana
        ctx.fillStyle=`rgba(${~~(180*npcBr)},${~~(20*npcBr)},${~~(20*npcBr)},0.97)`;
        ctx.fillRect(nsx-nsw*0.22,nsy0-nsh*0.96,nsw*0.44,nsh*0.06);
        ctx.fillRect(nsx-nsw*0.15,nsy0-nsh*0.96-nsw*0.16,nsw*0.3,nsw*0.16);
        // Eyes
        ctx.fillStyle=`rgba(0,0,0,${0.8*npcBr})`;
        ctx.beginPath();ctx.arc(nsx-nsw*0.07,nsy0-nsh*0.83,nsw*0.04,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(nsx+nsw*0.07,nsy0-nsh*0.83,nsw*0.04,0,Math.PI*2);ctx.fill();
        // Legs (dark)
        ctx.fillStyle=`rgba(${~~(40*npcBr)},${~~(25*npcBr)},${~~(25*npcBr)},0.97)`;
        ctx.fillRect(nsx-nsw*0.22,nsy0-nsh*0.34,nsw*0.2,nsh*0.34);
        ctx.fillRect(nsx+nsw*0.02,nsy0-nsh*0.34,nsw*0.2,nsh*0.34);
        // Arms (holding weapon)
        const armSwing2=Math.sin(t2*1.4)*0.05;
        ctx.fillStyle=`rgba(${~~(140*npcBr)},${~~(30*npcBr)},${~~(30*npcBr)},0.95)`;
        ctx.fillRect(nsx-nsw*0.38,nsy0-nsh*(0.68+armSwing2),nsw*0.12,nsh*0.3);
        ctx.fillRect(nsx+nsw*0.26,nsy0-nsh*(0.68-armSwing2),nsw*0.12,nsh*0.3);
        // Draw a small sword in right hand
        ctx.strokeStyle=`rgba(${~~(220*npcBr)},${~~(180*npcBr)},${~~(80*npcBr)},0.9)`;
        ctx.lineWidth=Math.max(1,nsw*0.04);
        ctx.beginPath();ctx.moveTo(nsx+nsw*0.32,nsy0-nsh*(0.68-armSwing2));ctx.lineTo(nsx+nsw*0.42,nsy0-nsh*(0.98-armSwing2));ctx.stroke();
        // Name tag above
        if(npcD<6){
          const fs=Math.max(9,~~(14/npcD*4));
          ctx.font=`bold ${fs}px monospace`;ctx.textAlign='center';
          ctx.fillStyle=`rgba(255,100,50,${Math.min(1,(6-npcD)/4)})`;
          ctx.fillText('⚔️ Người bán CK',nsx,nsy0-nsh*1.05);
        }
      }
    }
  }
  {
    const FOVt=Math.PI/3;
    const vAt=S.ang+recoilAng;
    for(const tr of traps){
      if(!tr.active)continue;
      const def=TRAP_DEFS[tr.type];
      const tdx=tr.x-S.px,tdy=tr.y-S.py;
      const tD=Math.sqrt(tdx*tdx+tdy*tdy);
      if(tD>18)continue;
      let tA=Math.atan2(tdy,tdx)-vAt;
      while(tA>Math.PI)tA-=Math.PI*2;while(tA<-Math.PI)tA+=Math.PI*2;
      if(Math.abs(tA)>FOVt*0.65)continue;
      const tsx=W/2+tA/(FOVt/2)*W/2;
      const tci=~~Math.max(0,Math.min(W-1,tsx));
      if(zBuf[tci]<tD-0.1)continue;
      const tsh=Math.min(H*0.5,H/tD*0.5);
      const tsw=tsh*1.0;
      const tsy=hor+tsh*0.15;
      const tBr=Math.max(0.2,1-tD/16);
      // Parse hex color for trap
      const tc=def.col;
      const cr=parseInt(tc.slice(1,3),16),cg=parseInt(tc.slice(3,5),16),cb=parseInt(tc.slice(5,7),16);
      // Animated pulse for active traps
      const pulse=tr.triggered?(0.7+Math.sin(performance.now()*0.015)*0.3):1.0;
      ctx.fillStyle=`rgba(${~~(cr*tBr*pulse)},${~~(cg*tBr*pulse)},${~~(cb*tBr*pulse)},0.9)`;
      ctx.beginPath();ctx.arc(tsx,tsy,tsw*0.5,0,Math.PI*2);ctx.fill();
      // Glow ring
      ctx.strokeStyle=`rgba(${~~(cr*tBr)},${~~(cg*tBr)},${~~(cb*tBr)},0.6)`;
      ctx.lineWidth=2;ctx.beginPath();ctx.arc(tsx,tsy,tsw*0.65,0,Math.PI*2);ctx.stroke();
      // Icon
      if(tD<8){
        const fs=Math.max(8,~~(18/tD*3));
        ctx.font=`${fs}px monospace`;ctx.textAlign='center';
        ctx.fillText(def.e,tsx,tsy+fs*0.35);
      }
    }
  }

  // vignette
  const vig=ctx.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.8);
  vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,.55)');
  ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
  if(S.hp<40){ctx.fillStyle=`rgba(180,0,0,${(40-S.hp)/110})`;ctx.fillRect(0,0,W,H);}

  ctx.restore(); // end camera shake

  // ── RENDER PARTICLES (screen-space, no shake) ──
  for(const p of particles){
    const life01=p.life/p.maxLife;
    const alpha=life01;
    ctx.save();
    if(p.type==='shell'){
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot||0);
      ctx.fillStyle=`rgba(200,160,64,${alpha})`;
      ctx.fillRect(-p.r*1.5,-p.r*0.5,p.r*3,p.r);
    } else {
      ctx.fillStyle=p.col.replace(')',`,${alpha})`).replace('hsl(','hsla(');
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*life01,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }

  // ── SCOPE OVERLAY (sniper/crossbow ADS) ──
  if(gw().hasScope&&scopeActive){
    const sc=W*0.44; // scope circle radius
    // 1) Black bars OUTSIDE the scope circle (scene shows through inside)
    ctx.save();
    ctx.fillStyle='#000';
    ctx.beginPath();
    // Fill entire canvas, then cut out the circle (even-odd rule)
    ctx.rect(0,0,W,H);
    ctx.arc(W/2,H/2,sc,0,Math.PI*2,true); // counter-clockwise = hole
    ctx.fill('evenodd');
    ctx.restore();

    // 2) Clip to circle and draw scope glass effects ON TOP of scene
    ctx.save();
    ctx.beginPath();ctx.arc(W/2,H/2,sc,0,Math.PI*2);ctx.clip();

    // Subtle green tint over the scene
    ctx.fillStyle='rgba(0,30,10,0.12)';ctx.fillRect(0,0,W,H);

    // Lens glare (top-left highlight)
    const glare=ctx.createRadialGradient(W/2-sc*0.3,H/2-sc*0.3,0,W/2-sc*0.3,H/2-sc*0.3,sc*0.45);
    glare.addColorStop(0,'rgba(180,255,200,0.09)');glare.addColorStop(1,'rgba(180,255,200,0)');
    ctx.fillStyle=glare;ctx.fillRect(0,0,W,H);

    // Crosshair reticle
    ctx.strokeStyle='rgba(255,60,60,0.92)';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(W/2-sc,H/2);ctx.lineTo(W/2-sc*0.06,H/2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W/2+sc*0.06,H/2);ctx.lineTo(W/2+sc,H/2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W/2,H/2-sc);ctx.lineTo(W/2,H/2-sc*0.06);ctx.stroke();
    ctx.beginPath();ctx.moveTo(W/2,H/2+sc*0.06);ctx.lineTo(W/2,H/2+sc);ctx.stroke();

    // Mil-dots on horizontal line
    ctx.fillStyle='rgba(255,60,60,0.9)';
    for(let i=-4;i<=4;i++){
      if(i===0)continue;
      const rx=W/2+i*(sc/4.2);
      ctx.beginPath();ctx.arc(rx,H/2,i%2===0?3.5:2,0,Math.PI*2);ctx.fill();
    }
    // Mil-dots on vertical line
    for(let i=-2;i<=2;i++){
      if(i===0)continue;
      const ry=H/2+i*(sc/4.2);
      ctx.beginPath();ctx.arc(W/2,ry,2,0,Math.PI*2);ctx.fill();
    }

    // Center dot
    ctx.fillStyle='rgba(255,60,60,0.98)';
    ctx.beginPath();ctx.arc(W/2,H/2,3.5,0,Math.PI*2);ctx.fill();
    // Inner reference circle
    ctx.strokeStyle='rgba(255,80,80,0.35)';ctx.lineWidth=0.8;
    ctx.beginPath();ctx.arc(W/2,H/2,sc*0.07,0,Math.PI*2);ctx.stroke();

    ctx.restore();

    // 3) Scope ring border
    ctx.strokeStyle='#0a0a0a';ctx.lineWidth=6;
    ctx.beginPath();ctx.arc(W/2,H/2,sc,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#222';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(W/2,H/2,sc,0,Math.PI*2);ctx.stroke();

    // 4) Hide gun viewmodel when scoped (already done since we render scope last,
    //    but also hide the HUD crosshair — done by skipping it below via scopeActive flag)
  }

  // ── HIT EFFECTS: headshot / bodyshot labels projected on screen ──
  {
    const FOVh=Math.PI/3;
    const viewAngH=S.ang+recoilAng;
    for(let i=hitEffects.length-1;i>=0;i--){
      const ef=hitEffects[i];
      if(ef.t<=0){hitEffects.splice(i,1);continue;}
      // Project world pos to screen
      const dx=ef.x-S.px,dy=ef.y-S.py;
      const d=Math.sqrt(dx*dx+dy*dy);
      let a=Math.atan2(dy,dx)-viewAngH;
      while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;
      if(Math.abs(a)>FOVh*0.65)continue;
      const sx=W/2+a/(FOVh/2)*W/2;
      const sh=Math.min(H*1.5,H/d*1.5);
      const sy=H/2-sh*0.55 - (1-ef.t/0.8)*30; // float upward
      const alpha=Math.min(1,ef.t/0.3);
      if(ef.headshot){
        ctx.font='bold 13px monospace';
        ctx.fillStyle=`rgba(255,80,80,${alpha})`;
        ctx.textAlign='center';
        ctx.fillText(ef.isMelee?'⚔️ HEADSHOT!':'💀 HEADSHOT!',sx,sy);
        ctx.fillStyle=ef.isMelee?`rgba(255,120,40,${alpha})`:`rgba(255,200,80,${alpha})`;
        ctx.font='bold 11px monospace';
        ctx.fillText((ef.isMelee?'':'×2  ')+ef.dmg,sx,sy+15);
      } else {
        ctx.font='bold 11px monospace';
        ctx.fillStyle=ef.isMelee
          ?(ef.dmg==='miss'?`rgba(150,150,150,${alpha})`:`rgba(255,140,40,${alpha})`)
          :`rgba(255,200,80,${alpha})`;
        ctx.textAlign='center';
        ctx.fillText(ef.dmg,sx,sy);
      }
    }
  }

  // sleep overlay
  if(sleeping){
    ctx.fillStyle='rgba(0,10,40,0.55)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#aaddff';ctx.font='bold 20px monospace';ctx.textAlign='center';
    ctx.fillText('😴 Đang ngủ...',W/2,H/2-14);
    ctx.fillStyle='#ffffff';ctx.font='12px monospace';
    ctx.fillText(`Còn ${Math.ceil(sleepTimer)}s · Zombie bị đóng băng`,W/2,H/2+10);
    const pct=1-sleepTimer/10;
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(W/2-80,H/2+24,160,10);
    ctx.fillStyle='#4488ff';ctx.fillRect(W/2-80,H/2+24,160*pct,10);
  }
  // NPC proximity prompt
  {
    const ndx=S.px-NPC_X,ndy=S.py-NPC_Y,ndist=Math.sqrt(ndx*ndx+ndy*ndy);
    if(ndist<NPC_RADIUS*1.5&&!sleeping){
      ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(W/2-130,H/2+8,260,22);
      ctx.fillStyle='#ffd700';ctx.font='bold 12px monospace';ctx.textAlign='center';
      ctx.fillText('[T] Trò chuyện · Mua hàng với Người bán 🏪',W/2,H/2+24);
    }
  }
  // Workbench proximity prompt
  if(typeof WB_X!=='undefined'){
    const wdx=S.px-WB_X,wdy=S.py-WB_Y,wdist=Math.sqrt(wdx*wdx+wdy*wdy);
    if(wdist<WB_RADIUS*1.4&&!sleeping){
      ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(W/2-150,H/2-10,300,20);
      ctx.fillStyle='#44ffaa';ctx.font='bold 11px monospace';ctx.textAlign='center';
      ctx.fillText('⚒️ Bàn Chế Tạo · [H] Mở chế tạo nâng cao',W/2,H/2+5);
    }
  }
  // NPC2 Melee proximity prompt
  {
    const ndx=S.px-NPC2_X,ndy=S.py-NPC2_Y,ndist=Math.sqrt(ndx*ndx+ndy*ndy);
    if(ndist<NPC2_RADIUS*1.5&&!sleeping){
      ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(W/2-150,H/2+8,300,22);
      ctx.fillStyle='#ff9944';ctx.font='bold 12px monospace';ctx.textAlign='center';
      ctx.fillText('[G] Người bán Vũ Khí Cận Chiến ⚔️  [V] Đánh cận chiến',W/2,H/2+24);
      if(S_melee){
        const mw=MELEE_WEAPONS[S_melee];
        const cdStr=meleeSkillT>0?` · Skill ${meleeSkillT.toFixed(1)}s`:'';
        const shStr=mw.isShield?` · 🛡 ${~~shieldBlock}/${mw.shieldHp}`:'';
        ctx.fillStyle='rgba(0,0,0,.65)';ctx.fillRect(W/2-140,H/2+28,280,20);
        ctx.fillStyle='#ffcc44';ctx.font='11px monospace';ctx.textAlign='center';
        ctx.fillText(`${mw.e} ${mw.n}${shStr}${mw.hasSkill?cdStr:''}`,W/2,H/2+42);
      }
    }
  }
  // E-key proximity prompt near bed
  if(S.hasBed&&!sleeping){
    const bdx=S.px-BED_X,bdy=S.py-BED_Y,bdist=Math.sqrt(bdx*bdx+bdy*bdy);
    if(bdist<BED_RADIUS*1.5){
      ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(W/2-110,H/2+28,220,20);
      if(sleepCooldown>0){
        ctx.fillStyle='#ff8844';ctx.font='11px monospace';ctx.textAlign='center';
        ctx.fillText(`🛏️ Giường đang hồi phục: ${~~sleepCooldown}s`,W/2,H/2+42);
      } else {
        ctx.fillStyle='#aaddff';ctx.font='bold 11px monospace';ctx.textAlign='center';
        ctx.fillText('[K] Ngủ +50 HP · Zombie bị đóng băng 10s',W/2,H/2+42);
      }
    }
  }
  // reload bar
  if(reloading){
    const pct=1-reloadT/gw().rl;
    ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(W/2-60,H-42,120,14);
    ctx.fillStyle='#ef9f27';ctx.fillRect(W/2-60,H-42,120*pct,14);
    ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='center';
    ctx.fillText('NẠP ĐẠN...',W/2,H-31);
  }

  // buffs
  let bx=7;
  if(sliding){ctx.fillStyle='rgba(0,180,255,.25)';ctx.fillRect(bx,7,60,17);ctx.fillStyle='#00eeff';ctx.font='bold 10px monospace';ctx.textAlign='left';ctx.fillText('🏄SLIDE!',bx+3,20);bx+=66;}
  if(S.spd>0){ctx.fillStyle='rgba(0,200,255,.2)';ctx.fillRect(bx,7,54,17);ctx.fillStyle='#00ccff';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText('💨'+~~S.spd+'s',bx+3,20);bx+=60;}
  if(S.rpd>0){ctx.fillStyle='rgba(255,100,0,.2)';ctx.fillRect(bx,7,54,17);ctx.fillStyle='#ff8800';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText('🔥'+~~S.rpd+'s',bx+3,20);bx+=60;}
  if(S.srg>0){ctx.fillStyle='rgba(0,255,150,.15)';ctx.fillRect(bx,7,54,17);ctx.fillStyle='#00ff88';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText('♻️'+~~S.srg+'s',bx+3,20);bx+=60;}
  // Gun speed penalty indicator
  const gsp=gw().spdMul||1;
  if(gsp<1){ctx.fillStyle='rgba(255,50,50,.18)';ctx.fillRect(bx,7,60,17);ctx.fillStyle='#ff6666';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText(`🐢-${~~((1-gsp)*100)}%`,bx+3,20);bx+=66;}
  if(gsp>1){ctx.fillStyle='rgba(100,255,100,.15)';ctx.fillRect(bx,7,60,17);ctx.fillStyle='#88ff88';ctx.font='10px monospace';ctx.textAlign='left';ctx.fillText(`⚡+${~~((gsp-1)*100)}%`,bx+3,20);}

  // Melee weapon HUD
  if(S_melee){
    const mw=MELEE_WEAPONS[S_melee];
    const cdReady=meleeT<=0;
    const skillCD=mw.hasSkill?(meleeSkillT>0?`[4]${meleeSkillT.toFixed(0)}s`:'[4]✓'):'';
    const shieldStr=mw.isShield?` 🛡${~~shieldBlock}`:'';
    const active=weaponSlot===2;
    ctx.fillStyle=active?(cdReady?'rgba(255,100,0,.45)':'rgba(120,60,0,.35)'):'rgba(60,40,20,.3)';
    ctx.fillRect(5,H-62,140,17);
    if(active&&meleeT>0){
      // cooldown bar
      const pct=1-meleeT/mw.delay;
      ctx.fillStyle='rgba(255,140,0,.5)';ctx.fillRect(5,H-62,~~(140*pct),17);
    }
    ctx.fillStyle=active?(cdReady?'#ff9944':'#885522'):'#554433';
    ctx.font=`bold 10px monospace`;ctx.textAlign='left';
    ctx.fillText(`[2]${mw.e}${mw.n}${shieldStr} ${skillCD}`,9,H-48);
  }

  // ammo
  ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(5,H-23,96,17);
  ctx.fillStyle=w.c;ctx.font='bold 10px monospace';ctx.textAlign='left';
  ctx.fillText(w.e+' '+S.ammo+' / '+getRes(),9,H-9);

  // trap HUD (selected trap indicator)
  if(S.traps){
    const tdef=TRAP_DEFS[selectedTrap];
    const tcount=(S.traps[selectedTrap]||0);
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(5,H-42,118,17);
    ctx.fillStyle=tcount>0?'#ffdd44':'#555';ctx.font='bold 10px monospace';ctx.textAlign='left';
    ctx.fillText(`${tdef.e} ${tdef.label} ×${tcount}  [P]đặt [X]đổi`,9,H-28);
  }

  // minimap
  const ms=2.2,mmx=W-MW*ms-5,mmy=5;
  ctx.fillStyle='rgba(0,0,0,.45)';ctx.fillRect(mmx-1,mmy-1,MW*ms+2,MH*ms+2);
  for(let r=0;r<MH;r++)for(let c=0;c<MW;c++){
    const t=MAP[r][c];
    if(t===1){ctx.fillStyle='#3a3a3a';ctx.fillRect(mmx+c*ms,mmy+r*ms,ms-.5,ms-.5);}
    if(t===4){ctx.fillStyle='#6a8a9a';ctx.fillRect(mmx+c*ms,mmy+r*ms,ms-.5,ms-.5);}
  }
  for(const z of zombies)if(z.alive){ctx.fillStyle=z.elite?'#aa44ff':'#e24b4a';ctx.fillRect(mmx+z.x*ms-1,mmy+z.y*ms-1,3,3);}
  // Traps on minimap
  for(const tr of traps)if(tr.active){const def=TRAP_DEFS[tr.type];const tc=def.col;ctx.fillStyle=tc;ctx.fillRect(mmx+tr.x*ms-1.5,mmy+tr.y*ms-1.5,3,3);}
  // Bed on minimap
  if(S.hasBed){ctx.fillStyle='#4488ff';ctx.fillRect(mmx+BED_X*ms-2,mmy+BED_Y*ms-2,5,4);}
  // Workbench on minimap
  if(typeof WB_X!=='undefined'){ctx.fillStyle='#44ffaa';ctx.fillRect(mmx+WB_X*ms-2,mmy+WB_Y*ms-2,4,4);}
  ctx.fillStyle='#ef9f27';ctx.fillRect(mmx+S.px*ms-2,mmy+S.py*ms-2,4,4);

  // pointer lock hint overlay (PC mode only)
  if(mode==='pc'&&!pointerLocked&&alive&&!shopOpen){
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ef9f27';ctx.font='bold 16px monospace';ctx.textAlign='center';
    ctx.fillText('🖱 Click để vào FPS Mode',W/2,H/2-10);
    ctx.fillStyle='#555';ctx.font='11px monospace';
    ctx.fillText('Di chuyển chuột = xoay góc nhìn  ·  ESC = thoát',W/2,H/2+14);
  }

  // game over
  if(!alive){
    ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#e24b4a';ctx.font='bold 28px monospace';ctx.textAlign='center';
    ctx.fillText('☠  GAME OVER',W/2,H/2-28);
    ctx.fillStyle='#888';ctx.font='14px monospace';
    ctx.fillText(`Điểm: ${S.score}  Wave: ${S.wave}  Kills: ${S.kills}`,W/2,H/2+4);
    ctx.fillStyle='#ffd700';ctx.font='12px monospace';ctx.fillText('Xu Clau: '+S.coins,W/2,H/2+26);
    ctx.fillStyle='#ef9f27';ctx.font='12px monospace';ctx.fillText('Tải lại trang để chơi lại',W/2,H/2+50);
  }

  // ── MŨI TÊN HƯỚNG DẪN ──
  if(alive&&S.wave<=3&&!shopOpen&&!meleeShopOpen&&!sleeping){
    const guides=[];
    const insideNow=isIndoor(S.px,S.py);

    if(!insideNow){
      // Chưa vào nhà → chỉ đến cửa
      guides.push({wx:27.5,wy:7.5,col:'#00ffcc',label:'VÀO NHÀ'});
    } else {
      // Chỉ đến NPC shop
      const dnx=S.px-NPC_X,dny=S.py-NPC_Y;
      if(Math.sqrt(dnx*dnx+dny*dny)>NPC_RADIUS*1.2)
        guides.push({wx:NPC_X,wy:NPC_Y,col:'#ffd700',label:'SHOP'});
      // Chỉ đến NPC vũ khí nếu chưa có
      if(!S_melee){
        const dmx=S.px-NPC2_X,dmy=S.py-NPC2_Y;
        if(Math.sqrt(dmx*dmx+dmy*dmy)>NPC2_RADIUS*1.2)
          guides.push({wx:NPC2_X,wy:NPC2_Y,col:'#ff8844',label:'VŨ KHÍ CK'});
      }
      // Chỉ đến giường nếu đã mua
      if(S.hasBed){
        const dbx=S.px-BED_X,dby=S.py-BED_Y;
        if(Math.sqrt(dbx*dbx+dby*dby)>BED_RADIUS*1.5)
          guides.push({wx:BED_X,wy:BED_Y,col:'#aaddff',label:'GIƯỜNG'});
      }
      // Chỉ đến bàn chế tạo
      if(typeof WB_X!=='undefined'){
        const dwx=S.px-WB_X,dwy=S.py-WB_Y;
        if(Math.sqrt(dwx*dwx+dwy*dwy)>WB_RADIUS*1.5)
          guides.push({wx:WB_X,wy:WB_Y,col:'#44ffaa',label:'CHẾ TẠO'});
      }
    }

    const pulse=0.65+Math.sin(performance.now()*0.004)*0.35;
    const viewAngG=S.ang+recoilAng;

    for(const g of guides){
      const gdx=g.wx-S.px,gdy=g.wy-S.py;
      const gDist=Math.sqrt(gdx*gdx+gdy*gdy);
      let relAng=Math.atan2(gdy,gdx)-viewAngG;
      while(relAng>Math.PI)relAng-=Math.PI*2;
      while(relAng<-Math.PI)relAng+=Math.PI*2;

      const edgeR=Math.min(W,H)*0.36;
      // Trong FPS: relAng=0 = thẳng trước = mũi tên ở TRÊN màn hình
      // Canvas Y đi xuống nên đảo sin: ay = H/2 - sin(relAng)*edgeR
      const ax=W/2+Math.sin(relAng)*edgeR;
      const ay=H/2-Math.cos(relAng)*edgeR;

      ctx.save();
      ctx.globalAlpha=pulse;
      ctx.translate(ax,ay);
      // ax/ay dùng sin/cos đảo → relAng=0 → mũi tên ở trên, trỏ xuống vào tâm
      // đầu nhọn tại -y → rotate(relAng) để trỏ vào tâm
      ctx.rotate(relAng);

      // Viền đen
      ctx.strokeStyle='rgba(0,0,0,0.8)';ctx.lineWidth=5;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(0,10);ctx.lineTo(0,-10);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-11,4);ctx.lineTo(0,-14);ctx.lineTo(11,4);ctx.stroke();

      // Mũi tên màu
      ctx.strokeStyle=g.col;ctx.lineWidth=2.5;
      ctx.beginPath();ctx.moveTo(0,10);ctx.lineTo(0,-10);ctx.stroke();
      ctx.fillStyle=g.col;
      ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(-11,4);ctx.lineTo(11,4);ctx.closePath();ctx.fill();

      ctx.restore();

      // Label
      ctx.save();
      ctx.globalAlpha=pulse;
      ctx.textAlign='center';
      ctx.font='bold 9px monospace';
      ctx.fillStyle='rgba(0,0,0,0.75)';
      ctx.fillRect(ax-24,ay+14,48,13);
      ctx.fillStyle=g.col;
      ctx.fillText(`${g.label} ${~~gDist}m`,ax,ay+24);
      ctx.restore();
    }
  }
}

