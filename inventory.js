// ══════════════════════════════════════════════════
// INVENTORY & CRAFTING SYSTEM
// ══════════════════════════════════════════════════

// ── VẬT LIỆU ĐỊNH NGHĨA ──
const MATS = {
  // Bậc F
  vai:   {id:'vai',   n:'Vải',        e:'🧵', tier:'F', w:0.1},
  nhua:  {id:'nhua',  n:'Nhựa',       e:'🪣', tier:'F', w:0.1},
  go:    {id:'go',    n:'Gỗ',         e:'🪵', tier:'F', w:0.2},
  cat:   {id:'cat',   n:'Cát',        e:'🏖️', tier:'F', w:0.3},
  da:    {id:'da',    n:'Đá',         e:'🪨', tier:'F', w:0.4},
  // Bậc E
  sat:   {id:'sat',   n:'Sắt',        e:'⚙️', tier:'E', w:0.5},
  day:   {id:'day',   n:'Dây Điện',   e:'🔌', tier:'E', w:0.2},
  cao:   {id:'cao',   n:'Cao Su',     e:'⚫', tier:'E', w:0.3},
  // Bậc D
  thuytinh:{id:'thuytinh',n:'Thủy Tinh',e:'🪟',tier:'D',w:0.3},
  pinhu: {id:'pinhu', n:'Pin Hỏng',   e:'🔋', tier:'D', w:0.4},
  // Bậc C
  vang:  {id:'vang',  n:'Vàng',       e:'🪙', tier:'C', w:0.6},
  pintot:{id:'pintot',n:'Pin Tốt',    e:'🔋', tier:'C', w:0.4},
  // Bậc B
  titan: {id:'titan', n:'Titanium',   e:'🔩', tier:'B', w:0.8},
  // Bậc S
  kimcuong:{id:'kimcuong',n:'Kim Cương',e:'💎',tier:'S',w:1.0},
};

// Tỷ lệ rơi: {matId, form, chance}
// form: 'scrap'=Vụn, 'piece'=Mảnh, 'item'=Cái
const DROP_TABLE = [
  // Bậc F — 3% tổng
  {id:'vai',   form:'scrap', chance:0.006},
  {id:'nhua',  form:'scrap', chance:0.006},
  {id:'go',    form:'scrap', chance:0.006},
  {id:'cat',   form:'scrap', chance:0.006},
  {id:'da',    form:'scrap', chance:0.006},
  // Bậc E — 1.5% tổng
  {id:'sat',   form:'scrap', chance:0.005},
  {id:'day',   form:'scrap', chance:0.005},
  {id:'cao',   form:'scrap', chance:0.005},
  // Bậc D — 0.4%
  {id:'thuytinh',form:'piece',chance:0.002},
  {id:'pinhu', form:'item',  chance:0.002},
  // Bậc C — 0.08%
  {id:'vang',  form:'scrap', chance:0.0004},
  {id:'pintot',form:'item',  chance:0.0004},
  // Bậc B — 0.019%
  {id:'titan', form:'scrap', chance:0.00019},
  // Bậc S — 0.001%
  {id:'kimcuong',form:'scrap',chance:0.00001},
];

// ── PHÂN CẤP VẬT LIỆU (FORMS) ──
// scrap=Vụn, piece=Miếng, ingot=Thỏi/Ván, block=Khối, huge=Khối Lớn
const FORM_NAMES = {scrap:'Vụn',piece:'Miếng',ingot:'Thỏi',plank:'Ván',block:'Khối',huge:'Khối Lớn',item:'Cái'};
// stack limits per form
const STACK_LIMIT = {scrap:100,piece:50,ingot:20,plank:20,block:5,huge:2,item:5};
// weight per unit per form (kg)
const FORM_WEIGHT = {scrap:0.05,piece:0.4,ingot:1.5,plank:1.5,block:12,huge:55,item:0.3};

// ── INVENTORY STATE ──
// Slot: {id, form, qty} or null
// Equipment: {head,body,hands,legs,acc1,acc2}
function mkInv(){
  return {
    slots: Array(20).fill(null),
    equip: {head:null,body:null,hands:null,legs:null,acc1:null,acc2:null},
    maxSlots: 20,
    maxWeight: 100,
    // passive items carried (detect by slot contents)
  };
}

let INV = mkInv();
let invOpen = false;
let craftTab = 'basic'; // 'basic' | 'advanced'
let selectedRecipe = null;

function saveInv(){ try{localStorage.setItem('zsInv', JSON.stringify(INV));}catch(e){} }
function loadInv(){
  try{
    const r=localStorage.getItem('zsInv');
    if(r){ INV=Object.assign(mkInv(), JSON.parse(r)); return true; }
  }catch(e){}
  return false;
}
loadInv();

// ── WEIGHT CALC ──
function calcWeight(){
  let w = 0;
  const hasFramePack = hasPassive('titanium_frame_pack') || hasPassive('magnetic_backpack');
  for(const sl of INV.slots){
    if(!sl) continue;
    let fw = (FORM_WEIGHT[sl.form]||0.1) * sl.qty;
    if(hasFramePack && (sl.form==='ingot'||sl.form==='plank'||sl.form==='block'||sl.form==='huge')) fw *= 0.8;
    w += fw;
  }
  return Math.round(w*10)/10;
}
function weightPct(){ return Math.min(1, calcWeight() / INV.maxWeight); }

// Speed multiplier from weight
function weightSpeedMul(){
  const p = weightPct();
  if(p >= 1.0) return 0;
  if(p > 0.80) return 0.4;
  if(p > 0.50) return 0.7 + (0.80-p)/0.30 * 0.3;
  return 1.0;
}

// ── PASSIVE ITEM DETECTION ──
function hasPassive(itemId){
  for(const sl of INV.slots){
    if(sl && sl.id===itemId && sl.form==='item') return true;
  }
  return false;
}

// ── ADD ITEM TO INVENTORY ──
function invAdd(id, form, qty){
  const limit = STACK_LIMIT[form]||1;
  let rem = qty;
  // try stacking into existing
  for(const sl of INV.slots){
    if(!sl || sl.id!==id || sl.form!==form) continue;
    const space = limit - sl.qty;
    if(space <= 0) continue;
    const take = Math.min(space, rem);
    sl.qty += take; rem -= take;
    if(rem <= 0) { saveInv(); return true; }
  }
  // fill empty slots
  while(rem > 0){
    const idx = INV.slots.findIndex(s=>s===null);
    if(idx < 0){ msg('❌ Kho đồ đầy!'); saveInv(); return false; }
    const take = Math.min(limit, rem);
    INV.slots[idx] = {id, form, qty:take};
    rem -= take;
  }
  saveInv();
  return true;
}

// Count total qty of (id, form) across all slots
function invCount(id, form){
  let total=0;
  for(const sl of INV.slots){ if(sl&&sl.id===id&&sl.form===form) total+=sl.qty; }
  return total;
}

// Remove qty from inventory — returns true if successful
function invRemove(id, form, qty){
  let rem = qty;
  for(let i=0; i<INV.slots.length; i++){
    const sl = INV.slots[i];
    if(!sl||sl.id!==id||sl.form!==form) continue;
    const take = Math.min(sl.qty, rem);
    sl.qty -= take; rem -= take;
    if(sl.qty<=0) INV.slots[i]=null;
    if(rem<=0) break;
  }
  saveInv();
  return rem===0;
}

// ── DROP FROM ZOMBIE ──
function rollZombieDrop(x, y){
  // magnet: auto-collect
  const hasMagnet = hasPassive('scrap_magnet') || hasPassive('magnetic_backpack');
  for(const drop of DROP_TABLE){
    if(Math.random() < drop.chance){
      const mat = MATS[drop.id];
      const form = drop.form;
      if(hasMagnet || true){ // always auto-collect for now
        const ok = invAdd(drop.id, form, 1);
        if(ok){
          const fn = FORM_NAMES[form];
          msg(`📦 Nhặt được: ${mat.e} ${fn} ${mat.n} (${mat.tier} tier)`);
          renderInvHUD();
        }
      }
      return; // only one drop per zombie
    }
  }
}

// ── CRAFTING RECIPES ──
// req: [{id, form, qty}]  →  out: {id, form, qty}
const RECIPES = [
  // ── CƠ BẢN (Basic) — nén vụn ──
  {id:'c_sat_pm',   n:'Miếng Sắt',         cat:'basic',  req:[{id:'sat',  form:'scrap',qty:10}],             out:{id:'sat',  form:'piece',qty:1}},
  {id:'c_go_van',   n:'Ván Gỗ',            cat:'basic',  req:[{id:'go',   form:'piece',qty:5}],              out:{id:'go',   form:'plank',qty:1}},
  {id:'c_vai_pm',   n:'Miếng Vải',         cat:'basic',  req:[{id:'vai',  form:'scrap',qty:10}],             out:{id:'vai',  form:'piece',qty:1}},
  {id:'c_nhua_pm',  n:'Miếng Nhựa',        cat:'basic',  req:[{id:'nhua', form:'scrap',qty:10}],             out:{id:'nhua', form:'piece',qty:1}},
  {id:'c_cao_pm',   n:'Miếng Cao Su',      cat:'basic',  req:[{id:'cao',  form:'scrap',qty:10}],             out:{id:'cao',  form:'piece',qty:1}},
  {id:'c_da_pm',    n:'Miếng Đá',          cat:'basic',  req:[{id:'da',   form:'scrap',qty:10}],             out:{id:'da',   form:'piece',qty:1}},
  {id:'c_cat_pm',   n:'Miếng Cát',         cat:'basic',  req:[{id:'cat',  form:'scrap',qty:10}],             out:{id:'cat',  form:'piece',qty:1}},
  {id:'c_sat_toi',  n:'Thỏi Sắt',          cat:'basic',  req:[{id:'sat',  form:'piece',qty:5}],              out:{id:'sat',  form:'ingot',qty:1}},
  {id:'c_vang_toi', n:'Thỏi Vàng',         cat:'basic',  req:[{id:'vang', form:'scrap',qty:10},{id:'sat',form:'piece',qty:2}], out:{id:'vang',form:'ingot',qty:1}},
  {id:'c_titan_toi',n:'Thỏi Titanium',     cat:'basic',  req:[{id:'titan',form:'scrap',qty:10},{id:'sat',form:'ingot',qty:1}], out:{id:'titan',form:'ingot',qty:1}},

  // ── NÂNG CẤP KHO ──
  {id:'c_waist',    n:'Túi Đeo Hông (+5ô)',     cat:'advanced', workbench:false,
    req:[{id:'vai',form:'piece',qty:5},{id:'day',form:'scrap',qty:2}],
    out:{id:'waist_pouch',form:'item',qty:1}},
  {id:'c_scrapbag', n:'Balo Phế Liệu (+10ô)',   cat:'advanced', workbench:false,
    req:[{id:'vai',form:'piece',qty:10},{id:'nhua',form:'piece',qty:5},{id:'day',form:'scrap',qty:10}],
    out:{id:'scrap_backpack',form:'item',qty:1}},
  {id:'c_titanpack',n:'Balo Titanium (+20ô)',    cat:'advanced', workbench:true,
    req:[{id:'titan',form:'ingot',qty:2},{id:'vai',form:'piece',qty:10},{id:'cao',form:'piece',qty:5}],
    out:{id:'titanium_frame_pack',form:'item',qty:1}},

  // ── TIỆN ÍCH ──
  {id:'c_magnet',   n:'Nam Châm Sắt Vụn',   cat:'advanced', workbench:false,
    req:[{id:'sat',form:'ingot',qty:2},{id:'day',form:'scrap',qty:5},{id:'pinhu',form:'item',qty:1}],
    out:{id:'scrap_magnet',form:'item',qty:1}},
  {id:'c_compactor',n:'Máy Nén Cầm Tay',    cat:'advanced', workbench:true,
    req:[{id:'sat',form:'ingot',qty:3},{id:'pintot',form:'item',qty:1},{id:'cao',form:'piece',qty:2}],
    out:{id:'portable_compactor',form:'item',qty:1}},
  {id:'c_toolbelt', n:'Thắt Lưng Công Cụ',  cat:'advanced', workbench:false,
    req:[{id:'vai',form:'piece',qty:3},{id:'sat',form:'scrap',qty:5}],
    out:{id:'tool_belt',form:'item',qty:1}},
  {id:'c_magpack',  n:'Balo Nam Châm',       cat:'advanced', workbench:true,
    req:[{id:'scrap_backpack',form:'item',qty:1},{id:'scrap_magnet',form:'item',qty:1},{id:'vang',form:'ingot',qty:2}],
    out:{id:'magnetic_backpack',form:'item',qty:1}},

  // ── VŨ KHÍ (30 công thức) ──
  {id:'r_dao_gam',  n:'Dao Găm Gỉ',         cat:'advanced', workbench:false,
    req:[{id:'sat',form:'scrap',qty:5},{id:'nhua',form:'scrap',qty:1}],
    out:{id:'craft_dao_gam',form:'item',qty:1}},
  {id:'r_gay_dinh', n:'Gậy Đóng Đinh',      cat:'advanced', workbench:false,
    req:[{id:'go',form:'plank',qty:1},{id:'sat',form:'scrap',qty:10}],
    out:{id:'craft_gay_dinh',form:'item',qty:1}},
  {id:'r_giao',     n:'Giáo Mũi Sắt',       cat:'advanced', workbench:true,
    req:[{id:'go',form:'plank',qty:2},{id:'sat',form:'ingot',qty:1},{id:'vai',form:'scrap',qty:5}],
    out:{id:'craft_giao',form:'item',qty:1}},
  {id:'r_cung',     n:'Cung Dây Điện',       cat:'advanced', workbench:true,
    req:[{id:'go',form:'plank',qty:3},{id:'day',form:'scrap',qty:15},{id:'nhua',form:'piece',qty:2}],
    out:{id:'craft_cung',form:'item',qty:1}},
  {id:'r_bua_da',   n:'Búa Đá Tảng',         cat:'advanced', workbench:true,
    req:[{id:'da',form:'block',qty:1},{id:'go',form:'plank',qty:2},{id:'day',form:'scrap',qty:5}],
    out:{id:'craft_bua_da',form:'item',qty:1}},
  {id:'r_ma_tau',   n:'Mã Tấu Thép',         cat:'advanced', workbench:true,
    req:[{id:'sat',form:'ingot',qty:3},{id:'cao',form:'piece',qty:2}],
    out:{id:'craft_ma_tau',form:'item',qty:1}},
  {id:'r_kiem_ti',  n:'Kiếm Titanium',       cat:'advanced', workbench:true,
    req:[{id:'titan',form:'ingot',qty:5},{id:'vang',form:'ingot',qty:1},{id:'cao',form:'piece',qty:2}],
    out:{id:'craft_kiem_titan',form:'item',qty:1}},
  {id:'r_min',      n:'Mìn Tự Chế',          cat:'advanced', workbench:true,
    req:[{id:'pinhu',form:'item',qty:1},{id:'sat',form:'scrap',qty:10},{id:'nhua',form:'piece',qty:2}],
    out:{id:'craft_min',form:'item',qty:1}},
  {id:'r_dui_cui',  n:'Dùi Cui Điện',        cat:'advanced', workbench:true,
    req:[{id:'sat',form:'ingot',qty:1},{id:'pintot',form:'item',qty:1},{id:'day',form:'scrap',qty:10}],
    out:{id:'craft_dui_cui',form:'item',qty:1}},
  {id:'r_mui_ten',  n:'Mũi Tên Kim Cương',   cat:'advanced', workbench:true,
    req:[{id:'kimcuong',form:'scrap',qty:1},{id:'go',form:'plank',qty:1}],
    out:{id:'craft_mui_ten_kc',form:'item',qty:1}},

  // ── GIÁP ──
  {id:'r_giap_vai', n:'Giáp Vải Đệm',        cat:'advanced', workbench:false,
    req:[{id:'vai',form:'scrap',qty:30},{id:'day',form:'scrap',qty:5}],
    out:{id:'craft_giap_vai',form:'item',qty:1}},
  {id:'r_boc_tay',  n:'Bọc Tay Nhựa',        cat:'advanced', workbench:false,
    req:[{id:'nhua',form:'scrap',qty:10},{id:'vai',form:'scrap',qty:5}],
    out:{id:'craft_boc_tay',form:'item',qty:1}},
  {id:'r_mu_sat',   n:'Mũ Sắt Phế Liệu',     cat:'advanced', workbench:true,
    req:[{id:'sat',form:'piece',qty:2},{id:'cao',form:'scrap',qty:5}],
    out:{id:'craft_mu_sat',form:'item',qty:1}},
  {id:'r_khien_go', n:'Khiên Gỗ Gia Cố',     cat:'advanced', workbench:true,
    req:[{id:'go',form:'plank',qty:2},{id:'sat',form:'piece',qty:1}],
    out:{id:'craft_khien_go',form:'item',qty:1}},
  {id:'r_balo_day', n:'Balo Dây Điện',        cat:'advanced', workbench:true,
    req:[{id:'vai',form:'scrap',qty:20},{id:'day',form:'scrap',qty:10},{id:'nhua',form:'piece',qty:2}],
    out:{id:'craft_balo_day',form:'item',qty:1}},
  {id:'r_giap_titan',n:'Giáp Ngực Titanium', cat:'advanced', workbench:true,
    req:[{id:'titan',form:'ingot',qty:5},{id:'cao',form:'piece',qty:2},{id:'vai',form:'scrap',qty:10}],
    out:{id:'craft_giap_titan',form:'item',qty:1}},
  {id:'r_ung_cao',  n:'Ủng Cao Su',           cat:'advanced', workbench:false,
    req:[{id:'cao',form:'piece',qty:5},{id:'vai',form:'scrap',qty:10}],
    out:{id:'craft_ung_cao',form:'item',qty:1}},
  {id:'r_gang_thep',n:'Găng Tay Thép',        cat:'advanced', workbench:true,
    req:[{id:'sat',form:'piece',qty:2},{id:'sat',form:'scrap',qty:10}],
    out:{id:'craft_gang_thep',form:'item',qty:1}},
  {id:'r_mat_na',   n:'Mặt Nạ Kính',          cat:'advanced', workbench:true,
    req:[{id:'thuytinh',form:'piece',qty:5},{id:'nhua',form:'piece',qty:2},{id:'day',form:'scrap',qty:5}],
    out:{id:'craft_mat_na',form:'item',qty:1}},
  {id:'r_nhan_vang',n:'Nhẫn Vàng',            cat:'advanced', workbench:true,
    req:[{id:'vang',form:'ingot',qty:2},{id:'kimcuong',form:'scrap',qty:1}],
    out:{id:'craft_nhan_vang',form:'item',qty:1}},

  // ── CƠ SỞ ──
  {id:'r_bep_lua',  n:'Bếp Lửa Đá',           cat:'advanced', workbench:true,
    req:[{id:'da',form:'block',qty:10},{id:'go',form:'scrap',qty:50}],
    out:{id:'craft_bep_lua',form:'item',qty:1}},
  {id:'r_hom_go',   n:'Hòm Gỗ',               cat:'advanced', workbench:true,
    req:[{id:'go',form:'block',qty:5},{id:'sat',form:'ingot',qty:2}],
    out:{id:'craft_hom_go',form:'item',qty:1}},
  {id:'r_loc_nuoc', n:'Máy Lọc Nước',         cat:'advanced', workbench:true,
    req:[{id:'cat',form:'block',qty:5},{id:'da',form:'block',qty:2},{id:'thuytinh',form:'piece',qty:1}],
    out:{id:'craft_loc_nuoc',form:'item',qty:1}},
  {id:'r_sac_pin',  n:'Sạc Pin Tay',           cat:'advanced', workbench:true,
    req:[{id:'day',form:'scrap',qty:20},{id:'sat',form:'scrap',qty:10},{id:'pinhu',form:'item',qty:5}],
    out:{id:'craft_sac_pin',form:'item',qty:1}},
  {id:'r_duoc',     n:'Đuốc Sáng',             cat:'advanced', workbench:false,
    req:[{id:'go',form:'plank',qty:1},{id:'vai',form:'scrap',qty:10},{id:'thuytinh',form:'piece',qty:1}],
    out:{id:'craft_duoc',form:'item',qty:1}},
  {id:'r_hang_rao', n:'Hàng Rào Chông',        cat:'advanced', workbench:true,
    req:[{id:'go',form:'block',qty:2},{id:'sat',form:'scrap',qty:30}],
    out:{id:'craft_hang_rao',form:'item',qty:1}},
  {id:'r_cua_cuon', n:'Cửa Cuốn Sắt',          cat:'advanced', workbench:true,
    req:[{id:'sat',form:'block',qty:2},{id:'day',form:'scrap',qty:10},{id:'pintot',form:'item',qty:1}],
    out:{id:'craft_cua_cuon',form:'item',qty:1}},
  {id:'r_bay_kep',  n:'Bẫy Kẹp',              cat:'advanced', workbench:true,
    req:[{id:'sat',form:'ingot',qty:3},{id:'day',form:'scrap',qty:2}],
    out:{id:'craft_bay_kep',form:'item',qty:1}},
  {id:'r_turret',   n:'Turret Tự Động',        cat:'advanced', workbench:true,
    req:[{id:'titan',form:'block',qty:1},{id:'pintot',form:'item',qty:2},{id:'vang',form:'ingot',qty:1}],
    out:{id:'craft_turret',form:'item',qty:1}},
  {id:'r_lo_duc',   n:'Lò Đúc',               cat:'advanced', workbench:true,
    req:[{id:'da',form:'block',qty:20},{id:'sat',form:'ingot',qty:10},{id:'pintot',form:'item',qty:5}],
    out:{id:'craft_lo_duc',form:'item',qty:1}},
];

// Craft item output descriptions
const CRAFT_ITEM_DESC = {
  waist_pouch:         {n:'Túi Đeo Hông',     e:'👜', d:'+5 ô kho đồ', effect:'slots+5'},
  scrap_backpack:      {n:'Balo Phế Liệu',    e:'🎒', d:'+10 ô · +20kg tải', effect:'slots+10,weight+20'},
  titanium_frame_pack: {n:'Balo Titanium',    e:'🦾', d:'+20 ô · +50kg · -20% trọng Thỏi/Khối', effect:'slots+20,weight+50,reduceheavy'},
  scrap_magnet:        {n:'Nam Châm Vụn',     e:'🧲', d:'Tự động hút Vụn bán kính 3m', effect:'magnet'},
  portable_compactor:  {n:'Máy Nén Cầm Tay', e:'⚙️', d:'Nén nhanh hơn 50%', effect:'compactor'},
  tool_belt:           {n:'Thắt Lưng CcCụ',  e:'🪢', d:'+3 hotbar slot nhanh', effect:'toolbelt'},
  magnetic_backpack:   {n:'Balo Nam Châm',    e:'🎒🧲',d:'+10ô · Hút vụn · -20% Thỏi/Khối', effect:'magnet,reduceheavy'},
};

// Apply passive item effects
function applyPassiveItems(){
  // Reset to base
  let slots = 20, weight = 100;
  const passives = [];
  for(const sl of INV.slots){
    if(!sl||sl.form!=='item') continue;
    if(sl.id==='waist_pouch')         { slots += 5 * sl.qty; }
    if(sl.id==='scrap_backpack')      { slots += 10; weight += 20; }
    if(sl.id==='titanium_frame_pack') { slots += 20; weight += 50; }
    if(sl.id==='magnetic_backpack')   { slots += 10; }
    passives.push(sl.id);
  }
  INV.maxSlots = Math.min(slots, 60);
  INV.maxWeight = weight;
  // Grow slot array if needed
  while(INV.slots.length < INV.maxSlots) INV.slots.push(null);
}

// ── SORT & COMPRESS ──
function sortInventory(){
  const nonNull = INV.slots.filter(s=>s!==null);
  // group same id+form
  const map = {};
  for(const sl of nonNull){
    const k = sl.id+'|'+sl.form;
    if(!map[k]) map[k]={...sl,qty:0};
    map[k].qty += sl.qty;
  }
  // rebuild slots capped at stack limit
  const newSlots = [];
  for(const k of Object.keys(map)){
    const sl = map[k];
    const lim = STACK_LIMIT[sl.form]||1;
    let rem = sl.qty;
    while(rem>0){
      const take = Math.min(lim, rem);
      newSlots.push({id:sl.id,form:sl.form,qty:take});
      rem -= take;
    }
  }
  while(newSlots.length < INV.maxSlots) newSlots.push(null);
  INV.slots = newSlots.slice(0, INV.maxSlots);
  saveInv();
  msg('🗂️ Đã sắp xếp kho đồ!');
  renderInvUI();
}

function compressAll(){
  applyPassiveItems();
  const hasFastComp = hasPassive('portable_compactor');
  let compressed = 0;
  // compress scrap→piece for all mat types
  for(const matId of Object.keys(MATS)){
    while(invCount(matId,'scrap') >= 10){
      invRemove(matId,'scrap',10);
      invAdd(matId,'piece',1);
      compressed++;
    }
    while(invCount(matId,'piece') >= 5 && (matId==='go')){
      invRemove(matId,'piece',5); invAdd(matId,'plank',1); compressed++;
    }
    while(invCount(matId,'piece') >= 5 && matId!=='go'){
      invRemove(matId,'piece',5); invAdd(matId,'ingot',1); compressed++;
    }
  }
  if(compressed>0){ msg(`🗜️ Đã nén ${compressed} lần!`); renderInvUI(); }
  else msg('Không có gì để nén.');
}

// ── CHECK RECIPE ──
function canCraft(recipe){
  const nb = nearWorkbench();
  if(recipe.workbench && !nb) return false;
  for(const req of recipe.req){
    if(invCount(req.id, req.form) < req.qty) return false;
  }
  return true;
}

function doCraft(recipe){
  const nb = nearWorkbench();
  if(!canCraft(recipe)){
    if(recipe.workbench && !nb) msg('❌ Cần đứng gần Bàn Chế Tạo (Workbench)!');
    else msg('❌ Không đủ nguyên liệu!');
    return;
  }
  // check space
  const hasSpace = INV.slots.filter(s=>s===null).length > 0 ||
    INV.slots.some(s=>s&&s.id===recipe.out.id&&s.form===recipe.out.form&&s.qty<(STACK_LIMIT[recipe.out.form]||1));
  if(!hasSpace){ msg('❌ Kho đồ đầy!'); return; }

  for(const req of recipe.req) invRemove(req.id, req.form, req.qty);
  invAdd(recipe.out.id, recipe.out.form, recipe.out.qty);
  applyPassiveItems();
  msg(`✅ Chế tạo thành công: ${recipe.n}!`);
  saveInv(); renderCraftUI(); renderInvHUD();
}

// ── NEAR WORKBENCH CHECK ──
// Workbench position inside house — phòng bên trái (cột ~31-32, hàng ~10)
const WB_X = 31.5, WB_Y = 10.0, WB_RADIUS = 2.5;
function nearWorkbench(){
  const dx=S.px-WB_X, dy=S.py-WB_Y;
  return Math.sqrt(dx*dx+dy*dy) < WB_RADIUS;
}

// ── INVENTORY UI ──
let invOvEl = null;
function buildInvOverlay(){
  if(document.getElementById('invOv')) return;
  const ov = document.createElement('div');
  ov.id='invOv';
  ov.style.cssText=`display:none;position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:60;
    align-items:flex-start;justify-content:center;padding:8px;overflow-y:auto;`;
  ov.innerHTML=`
  <div style="width:100%;max-width:700px;font-family:monospace;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <span style="color:#ef9f27;font-size:14px;font-weight:bold;letter-spacing:2px;">🎒 KHO ĐỒ</span>
      <span id="invWeight" style="font-size:11px;color:#aaa;"></span>
      <div style="display:flex;gap:4px;">
        <button onclick="sortInventory()" style="${btnCSS('#1a1a00','#6a6a00','#ffff44')}">🗂️ Sắp Xếp</button>
        <button onclick="compressAll()" style="${btnCSS('#001a00','#006a00','#44ff44')}">🗜️ Nén Tất Cả</button>
        <button onclick="closeInv()" style="${btnCSS('#1a0000','#6a0000','#ff4444')}">✕ Đóng [F]</button>
      </div>
    </div>
    <!-- WEIGHT BAR -->
    <div style="background:#111;border:1px solid #333;border-radius:4px;height:10px;margin-bottom:8px;overflow:hidden;">
      <div id="invWBar" style="height:100%;transition:width .2s;background:#44ff44;width:0%"></div>
    </div>
    <!-- SLOTS -->
    <div style="color:#888;font-size:10px;margin-bottom:4px;">📦 ITEMS (${INV.maxSlots} ô)</div>
    <div id="invSlots" style="display:grid;grid-template-columns:repeat(5,1fr);gap:3px;margin-bottom:10px;"></div>
    <div style="color:#555;font-size:10px;text-align:center;">⚒️ Để chế tạo, hãy đứng gần Bàn Chế Tạo và nhấn [H]</div>
  </div>`;
  document.body.appendChild(ov);
  invOvEl = ov;
}
function btnCSS(bg,br,col){
  return `background:${bg};border:1px solid ${br};color:${col};font-size:10px;padding:3px 8px;border-radius:4px;cursor:pointer;font-family:monospace;`;
}

function setCraftTab(tab){
  craftTab=tab;
  if(craftInvOpen) renderCraftUI();
  else renderInvUI();
}

function openInv(){
  if(!invOvEl) buildInvOverlay();
  invOpen=true;
  applyPassiveItems();
  invOvEl.style.display='flex';
  if(typeof pointerLocked!=='undefined'&&pointerLocked) document.exitPointerLock();
  renderInvUI();
}

// ── OPEN CRAFTING (phím H) — chỉ mở được khi đứng gần workbench ──
let craftOvEl = null;
let craftInvOpen = false;

function buildCraftOverlay(){
  if(document.getElementById('craftOv')) return;
  const ov = document.createElement('div');
  ov.id='craftOv';
  ov.style.cssText=`display:none;position:fixed;inset:0;background:rgba(0,0,0,.93);z-index:60;
    align-items:flex-start;justify-content:center;padding:8px;overflow-y:auto;`;
  ov.innerHTML=`
  <div style="width:100%;max-width:700px;font-family:monospace;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <span style="color:#44ffaa;font-size:14px;font-weight:bold;letter-spacing:2px;">⚒️ BÀN CHẾ TẠO</span>
      <div style="display:flex;gap:4px;">
        <button id="craftTabBasic"  onclick="setCraftTab('basic')"    style="${btnCSS('#001a10','#005a30','#44ffaa')}">⚗️ Cơ Bản</button>
        <button id="craftTabAdv"    onclick="setCraftTab('advanced')" style="${btnCSS('#001a10','#005a30','#44ffaa')}">🔧 Nâng Cao</button>
        <button onclick="closeCraft()" style="${btnCSS('#1a0000','#6a0000','#ff4444')}">✕ Đóng [H]</button>
      </div>
    </div>
    <div id="craftRecipeList" style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;"></div>
  </div>`;
  document.body.appendChild(ov);
  craftOvEl = ov;
}

function openCraft(){
  if(!nearWorkbench()){
    msg('❌ Phải đứng gần Bàn Chế Tạo mới có thể chế tạo! [H]');
    return;
  }
  if(!craftOvEl) buildCraftOverlay();
  craftInvOpen = true;
  craftOvEl.style.display = 'flex';
  if(typeof pointerLocked!=='undefined'&&pointerLocked) document.exitPointerLock();
  renderCraftUI();
}

function closeCraft(){
  craftInvOpen = false;
  if(craftOvEl) craftOvEl.style.display = 'none';
  if(typeof mode!=='undefined'&&mode==='pc') setTimeout(()=>{ if(typeof requestPointerLock!=='undefined') requestPointerLock(); },80);
}

function renderCraftUI(){
  if(!craftOvEl||!craftInvOpen) return;
  // Re-check proximity every render — nếu đi ra xa thì đóng
  if(!nearWorkbench()){
    closeCraft();
    msg('❌ Đã rời xa Bàn Chế Tạo!');
    return;
  }
  const nb = true; // guaranteed near workbench at this point
  const cl = document.getElementById('craftRecipeList');
  cl.innerHTML='';
  const recs = RECIPES.filter(r=>r.cat===craftTab);
  for(const rec of recs){
    const ok = canCraft(rec);
    const needWB = rec.workbench; // all workbench recipes are fine since we're near
    const div = document.createElement('div');
    div.style.cssText=`background:#0e0e0e;border:1px solid ${ok?'#2a5a2a':'#1a1a1a'};border-radius:5px;padding:6px;`;
    const reqHtml = rec.req.map(r=>{
      const mat=MATS[r.id]; const ci=CRAFT_ITEM_DESC[r.id];
      const e=mat?mat.e:(ci?ci.e:'📦');
      const n=mat?mat.n:(ci?ci.n:r.id);
      const fn=FORM_NAMES[r.form]||r.form;
      const have=invCount(r.id,r.form);
      const col=have>=r.qty?'#44ff44':'#ff4444';
      return `<span style="color:${col}">${e}${fn[0]} ${n} ${have}/${r.qty}</span>`;
    }).join(' + ');
    const outMat=MATS[rec.out.id]; const outCI=CRAFT_ITEM_DESC[rec.out.id];
    const outE=outMat?outMat.e:(outCI?outCI.e:'📦');
    div.innerHTML=`
      <div style="color:#ccc;font-size:10px;font-weight:bold;margin-bottom:3px;">${outE} ${rec.n}</div>
      <div style="font-size:9px;color:#555;margin-bottom:4px;">${reqHtml}</div>
      <button onclick="doCraft(RECIPES.find(r=>r.id==='${rec.id}'))"
        style="${btnCSS(ok?'#0a1a0a':'#0a0a0a', ok?'#2a6a2a':'#222', ok?'#4caf50':'#333')};width:100%;margin-top:2px;"
        ${ok?'':'disabled'}>⚒️ Chế Tạo</button>`;
    cl.appendChild(div);
  }
  // Tab highlight
  const tb=document.getElementById('craftTabBasic');
  const ta=document.getElementById('craftTabAdv');
  if(tb)tb.style.borderColor = craftTab==='basic'?'#44ffaa':'#005a30';
  if(ta)ta.style.borderColor = craftTab==='advanced'?'#44ffaa':'#005a30';
}
function closeInv(){
  invOpen=false;
  if(invOvEl) invOvEl.style.display='none';
  if(typeof mode!=='undefined'&&mode==='pc') setTimeout(()=>{ if(typeof requestPointerLock!=='undefined') requestPointerLock(); },80);
}

function renderInvUI(){
  if(!invOvEl||!invOpen) return;
  applyPassiveItems();
  const w = calcWeight();
  const wp = weightPct();
  const wCol = wp>=1?'#222':wp>0.8?'#ff4444':wp>0.5?'#ffaa00':'#44ff44';
  const wTextCol = wp>=1?'#ff0000':wp>0.8?'#ff6666':wp>0.5?'#ffcc44':'#aaffaa';

  document.getElementById('invWeight').textContent=`⚖️ ${w}/${INV.maxWeight}kg`;
  document.getElementById('invWeight').style.color=wTextCol;
  const bar = document.getElementById('invWBar');
  bar.style.width=(wp*100)+'%'; bar.style.background=wCol;

  // Slots
  const sg = document.getElementById('invSlots');
  sg.style.gridTemplateColumns=`repeat(${Math.min(5, INV.maxSlots)},1fr)`;
  sg.innerHTML='';
  for(let i=0;i<INV.maxSlots;i++){
    const sl = INV.slots[i];
    const div = document.createElement('div');
    div.style.cssText=`background:#0e0e0e;border:1px solid #1e1e1e;border-radius:5px;padding:4px;
      text-align:center;min-height:52px;cursor:${sl?'pointer':'default'};position:relative;`;
    if(sl){
      const mat = MATS[sl.id];
      const ci = CRAFT_ITEM_DESC[sl.id];
      const e = mat?mat.e:(ci?ci.e:'📦');
      const n = mat?mat.n:(ci?ci.n:sl.id);
      const fn = FORM_NAMES[sl.form]||sl.form;
      div.innerHTML=`<div style="font-size:18px">${e}</div>
        <div style="font-size:8px;color:#ccc;line-height:1.2">${fn}</div>
        <div style="font-size:8px;color:#888;line-height:1.2">${n}</div>
        <div style="position:absolute;top:2px;right:3px;font-size:9px;color:#ffd700">×${sl.qty}</div>`;
      div.title=`${fn} ${n} ×${sl.qty}`;
      div.onclick=()=>showSlotMenu(i);
    } else {
      div.innerHTML=`<div style="color:#222;font-size:18px;line-height:52px;">·</div>`;
    }
    sg.appendChild(div);
  }
}

function showSlotMenu(idx){
  const sl = INV.slots[idx];
  if(!sl) return;
  const mat=MATS[sl.id]; const ci=CRAFT_ITEM_DESC[sl.id];
  const n=mat?mat.n:(ci?ci.n:sl.id);
  const fn=FORM_NAMES[sl.form]||sl.form;
  const info = ci ? `\n📋 ${ci.d}` : '';
  // Simple drop confirm
  if(confirm(`${fn} ${n} ×${sl.qty}${info}\n\nBỏ bỏ 1 cái?`)){
    INV.slots[idx].qty--;
    if(INV.slots[idx].qty<=0) INV.slots[idx]=null;
    saveInv(); renderInvUI(); renderInvHUD();
  }
}

// ── HUD MINI (weight bar) ──
function renderInvHUD(){
  // update weight indicator in hud
  let el = document.getElementById('invHudW');
  if(!el) return;
  const wp = weightPct();
  const col = wp>=1?'#ff0000':wp>0.8?'#ff6666':wp>0.5?'#ffcc44':'#888';
  el.style.color=col;
  el.textContent=`⚖️${~~calcWeight()}kg`;
}

// ── INIT OVERLAY ──
window.addEventListener('DOMContentLoaded',()=>{
  buildInvOverlay();
  applyPassiveItems();
  // Inject weight indicator into hud2
  const hud2=document.getElementById('hud2');
  if(hud2){
    const sp=document.createElement('span');
    sp.id='invHudW';sp.style.cssText='color:#888;cursor:pointer;';
    sp.title='Trọng lượng kho đồ';
    sp.onclick=()=>openInv();
    hud2.appendChild(sp);
    renderInvHUD();
  }
});
