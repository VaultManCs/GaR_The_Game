/*:
 * @plugindesc (Add-on for TSR_Title) Credits from /data/credits.txt with 3-column /row[...] + /row[full=...]. Full rows use GRID width. Supports MV text codes, wrapping, faces/chars/images, multi-items '+', per-row alignment, and per-item @dir modifiers. v1.8
 * @author You
 *
 * @param Credits Text File
 * @type string
 * @default credits.txt
 *
 * @param Images Folder
 * @type string
 * @default pictures
 *
 * @param Row Separator
 * @type string
 * @default ;
 *
 * @param Column Gap
 * @type number
 * @min 0
 * @default 18
 *
 * @param Column Padding
 * @type number
 * @min 0
 * @default 6
 *
 * @param Default Font Size
 * @type number
 * @min 1
 * @default 28
 *
 * @param Animate Character Sprites
 * @type boolean
 * @on YES
 * @off NO
 * @default true
 *
 * @param Default Char Speed
 * @type number
 * @min 1
 * @default 12
 *
 * @param Loading Text
 * @type string
 * @default Loading credits...
 *
 * @help
 * credits.txt goes in /data.
 *
 * 3-column row:
 * /row[left=...; centre=...; right=...; leftAlign=left; centreAlign=center; rightAlign=right]
 *
 * Full row:
 * /row[full=TEXT; fullAlign=center]
 *
 * Per-item dir modifiers (any column):
 * centre=char:1@dir6+char:2@dir4
 * left=1@dir8   (numeric actor id also supported)
 *
 * Valid dirs: 2 (down), 4 (left), 6 (right), 8 (up)
 *
 * Non-breaking spaces:
 * \_ (renders as a space, prevents wrapping)
 */

var Imported = Imported || {};
Imported.TSR_Tittle_CreditsFile = true;

(function(){
  'use strict';

  // ---------------- Params ----------------
  var P = PluginManager.parameters('TSR_Tittle_CreditsFile') || {};
  var TXT_FILE    = String(P['Credits Text File'] || 'credits.txt').trim();
  var IMG_FOLDER  = String(P['Images Folder'] || 'pictures').trim();
  var ROW_SEP     = String(P['Row Separator'] || ';');
  var COL_GAP     = Number(P['Column Gap'] || 18);
  var COL_PAD     = Number(P['Column Padding'] || 6);
  var FONT_SIZE   = Number(P['Default Font Size'] || 28);
  var ANIM_CHARS  = String(P['Animate Character Sprites'] || 'true') === 'true';
  var DEF_SPEED   = Number(P['Default Char Speed'] || 12);
  var LOADING_TXT = String(P['Loading Text'] || 'Loading credits...');

  var FACE_W = (Window_Base && Window_Base._faceWidth)  ? Window_Base._faceWidth  : 144;
  var FACE_H = (Window_Base && Window_Base._faceHeight) ? Window_Base._faceHeight : 144;

  // ---------------- TXT Loader ----------------
  var Txt = { loaded:false, loading:false, text:null };

  function loadTxt(){
    if (Txt.loaded || Txt.loading) return;
    Txt.loading = true;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/' + TXT_FILE);
    xhr.overrideMimeType('text/plain');

    xhr.onload = function(){
      Txt.text = String(xhr.responseText || '').replace(/\r\n/g, '\n');
      Txt.loaded = true;
      Txt.loading = false;
    };
    xhr.onerror = function(){
      Txt.text = null;
      Txt.loaded = true;
      Txt.loading = false;
    };

    xhr.send();
  }

  function fallbackText(){
    if (window.TSR && TSR.Title && TSR.Title.credit_text) return TSR.Title.credit_text;
    return LOADING_TXT;
  }

  // Start TXT load when Credits is opened
  if (Scene_Title && Scene_Title.prototype.commandCredits) {
    var _cmdCredits = Scene_Title.prototype.commandCredits;
    Scene_Title.prototype.commandCredits = function(){
      loadTxt();
      _cmdCredits.call(this);
    };
  }

  // ---------------- Helpers ----------------
  function normBreaks(t){
    // Convert \_ to NBSP (shows as space, doesn't wrap)
    return String(t || '')
      .replace(/\\_/g, '\u00A0')
      .replace(/\\n/g, '\n')
      .replace(/<\s*br\s*>/gi, '\n')
      .replace(/<\s*lb\s*>/gi, '\n')
      .replace(/<\s*line\s*break\s*>/gi, '\n')
      .replace(/&lt;\s*br\s*&gt;/gi, '\n')
      .replace(/&lt;\s*lb\s*&gt;/gi, '\n')
      .replace(/&lt;\s*line\s*break\s*&gt;/gi, '\n');
  }

  function splitRowParts(inner){
    return String(inner || '').split(ROW_SEP).map(function(s){ return s.trim(); }).filter(Boolean);
  }

  function kvFirstEq(part){
    var idx = part.indexOf('=');
    if (idx < 0) return null;
    return { k: part.slice(0, idx).trim().toLowerCase(), v: part.slice(idx+1).trim() };
  }

  function clampDir(d){
    d = Number(d);
    return (d===2||d===4||d===6||d===8) ? d : 2;
  }

  function normAlign(a, def){
    a = String(a || '').toLowerCase();
    if (a === 'centre') a = 'center';
    if (a === 'left' || a === 'center' || a === 'right') return a;
    return def || 'left';
  }

  function stripForMeasure(s){
    s = String(s || '');
    s = s.replace(/\u00A0/g, ' ');
    s = s.replace(/\\C\[\d+\]/gi,'');
    s = s.replace(/\\I\[\d+\]/gi,'  ');
    s = s.replace(/\\V\[\d+\]/gi,'0');
    s = s.replace(/\\N\[\d+\]/gi,'A');
    s = s.replace(/\\P\[\d+\]/gi,'A');
    s = s.replace(/\\G/gi,'G');
    s = s.replace(/\\\{/g,'');
    s = s.replace(/\\\}/g,'');
    s = s.replace(/\\\\/g,'\\');
    return s;
  }

  function getActor(id){
    return (window.$dataActors && $dataActors[id]) ? $dataActors[id] : null;
  }

  // ---------------- Parse TXT ----------------
  function parseBlocks(text){
    var lines = String(text || '').split('\n');
    var blocks = [];

    for (var i=0;i<lines.length;i++){
      var line = lines[i];

      var mSpace = line.match(/^\s*\/space\[(\d+)\]\s*$/i);
      if (mSpace){ blocks.push({type:'space', px:Number(mSpace[1])||0}); continue; }

      var mRow = line.match(/^\s*\/row\[(.+?)\]\s*$/i);
      if (mRow){ blocks.push(parseRow(mRow[1])); continue; }

      blocks.push({type:'text', text: line});
    }

    return blocks;
  }

  function parseRow(inner){
    var parts = splitRowParts(inner);

    var row = {
      type:'row', // 'row' or 'full'
      left:'', centre:'', right:'',
      full:'', fullAlign:'center',

      leftAlign:'left',
      centreAlign:'center',
      rightAlign:'right',

      scale:100,
      leftScale:null, centreScale:null, rightScale:null,
      leftDir:null, centreDir:null, rightDir:null,
      leftSpeed:null, centreSpeed:null, rightSpeed:null
    };

    for (var i=0;i<parts.length;i++){
      var kv = kvFirstEq(parts[i]);
      if (!kv) continue;
      var k = kv.k, v = kv.v;

      if (k === 'full') { row.type = 'full'; row.full = v; continue; }
      if (k === 'fullalign') { row.fullAlign = normAlign(v, 'center'); continue; }

      if (k === 'leftalign') { row.leftAlign = normAlign(v, 'left'); continue; }
      if (k === 'centrealign' || k === 'centeralign') { row.centreAlign = normAlign(v, 'center'); continue; }
      if (k === 'rightalign') { row.rightAlign = normAlign(v, 'right'); continue; }

      if (k==='left') row.left=v;
      else if (k==='centre' || k==='center') row.centre=v;
      else if (k==='right') row.right=v;

      else if (k==='scale') row.scale = Number(v) || row.scale;
      else if (k==='leftscale') row.leftScale = Number(v);
      else if (k==='centrescale' || k==='centerscale') row.centreScale = Number(v);
      else if (k==='rightscale') row.rightScale = Number(v);

      else if (k==='leftdir') row.leftDir = clampDir(v);
      else if (k==='centredir' || k==='centerdir') row.centreDir = clampDir(v);
      else if (k==='rightdir') row.rightDir = clampDir(v);

      else if (k==='leftspeed') row.leftSpeed = Number(v);
      else if (k==='centrespeed' || k==='centerspeed') row.centreSpeed = Number(v);
      else if (k==='rightspeed') row.rightSpeed = Number(v);
    }

    return row;
  }
// ---------------- Cells (supports multi items with '+') ----------------
  function baseTokenToCell(base){
    var s = String(base||'').trim();
    if (!s) return {kind:'none', raw:''};
    var lower = s.toLowerCase();

    if (lower.indexOf('face:')===0) return {kind:'face', raw:s.slice(5).trim()};
    if (lower.indexOf('char:')===0) return {kind:'char', raw:s.slice(5).trim()};
    if (lower.indexOf('img:')===0)  return {kind:'img',  raw:s.slice(4).trim()};
    if (lower.indexOf('text:')===0) return {kind:'text', raw:s.slice(5)};

    if (/^\d+$/.test(s)) return {kind:'actor', raw:s};
    if (/\.(png|jpg|jpeg|webp)$/i.test(s)) return {kind:'img', raw:s};

    return {kind:'text', raw:s};
  }

  function parseModsIntoCell(cell, mods){
    cell.mods = cell.mods || {};
    for (var i=0;i<mods.length;i++){
      var m = String(mods[i] || '').trim().toLowerCase();
      if (!m) continue;

      // accept dir6, dir=6, dir:6
      if (m.indexOf('dir') === 0) {
        var val = m.replace(/^dir\s*[:=]?\s*/,'');
        var d = clampDir(val);
        cell.mods.dir = d;
      }
    }
    return cell;
  }

  function tokenToCell(token){
    var s = String(token||'').trim();
    if (!s) return {kind:'none', raw:''};

    // Split modifiers: "char:1@dir6@dir=4"
    var parts = s.split('@').map(function(p){ return p.trim(); }).filter(Boolean);
    var base = parts.shift();
    var cell = baseTokenToCell(base);
    if (parts.length) parseModsIntoCell(cell, parts);
    return cell;
  }

  function detectCells(raw){
    var s = String(raw||'').trim();
    if (!s) return [{kind:'none', raw:''}];

    if (s.indexOf('+')>=0){
      var parts = s.split('+').map(function(p){ return p.trim(); }).filter(Boolean);
      var cells = parts.map(tokenToCell);

      // Only treat as multi if tokens are explicit visuals/actor or explicit text:
      for (var i=0;i<cells.length;i++){
        if (cells[i].kind==='text' && parts[i].toLowerCase().indexOf('text:')!==0) {
          return [tokenToCell(s)];
        }
      }
      return cells;
    }

    return [tokenToCell(s)];
  }

  // ---------------- Window_Credit patch ----------------
  if (typeof Window_Credit === 'undefined') return;

  function ensureCache(win){
    if (!win._tcCache) win._tcCache = {};
    if (!win._tcChars) win._tcChars = [];
  }
  function ck(kind,v){ return kind+':'+v; }

  function prime(win, cell){
    ensureCache(win);
    if (cell.kind==='none' || cell.kind==='text') return;

    if (cell.kind==='img'){
      var k = ck('img', cell.raw);
      if (!win._tcCache[k]) win._tcCache[k] = ImageManager.loadBitmap('img/'+IMG_FOLDER+'/', cell.raw, 0, true);
      return;
    }

    var id = Number(cell.raw)||0;
    var a = getActor(id);
    if (!a) return;

    if (cell.kind==='face'){
      if (!a.faceName) return;
      var kf = ck('face', id);
      if (!win._tcCache[kf]) win._tcCache[kf] = ImageManager.loadFace(a.faceName);
      return;
    }

    if (cell.kind==='char' || cell.kind==='actor'){
      if (a.characterName){
        var kc = ck('char', id);
        if (!win._tcCache[kc]) win._tcCache[kc] = ImageManager.loadCharacter(a.characterName);
      } else if (a.faceName){
        var kff = ck('face', id);
        if (!win._tcCache[kff]) win._tcCache[kff] = ImageManager.loadFace(a.faceName);
      }
    }
  }

  function ready(win, cell){
    ensureCache(win);
    if (cell.kind==='none' || cell.kind==='text') return true;

    if (cell.kind==='img'){
      var bi = win._tcCache[ck('img', cell.raw)];
      return bi && bi.isReady && bi.isReady();
    }

    var id = Number(cell.raw)||0;
    var a = getActor(id);
    if (!a) return true;

    if (cell.kind==='face'){
      if (!a.faceName) return true;
      var bf = win._tcCache[ck('face', id)];
      return bf && bf.isReady && bf.isReady();
    }

    if (cell.kind==='char' || cell.kind==='actor'){
      if (a.characterName){
        var bc = win._tcCache[ck('char', id)];
        return bc && bc.isReady && bc.isReady();
      }
      if (a.faceName){
        var bf2 = win._tcCache[ck('face', id)];
        return bf2 && bf2.isReady && bf2.isReady();
      }
    }
    return true;
  }

  // wrap splits ONLY on normal spaces (NBSP stays non-breaking)
  function wrapLines(win, text, maxWidth){
    var t = normBreaks(text);
    var paras = String(t||'').split('\n');
    var out = [];

    for (var p=0;p<paras.length;p++){
      var para = paras[p];
      if (para.trim()===''){ out.push(''); continue; }

      var words = para.split(/ +/);
      var line = '';

      for (var i=0;i<words.length;i++){
        var test = line ? (line + ' ' + words[i]) : words[i];
        if (win.textWidth(stripForMeasure(test)) > maxWidth && line){
          out.push(line);
          line = words[i];
        } else {
          line = test;
        }
      }
      if (line) out.push(line);
    }
    return out;
  }

  function drawWrappedAligned(win, text, x, y, width, align){
    var lines = wrapLines(win, text, width);
    for (var i=0;i<lines.length;i++){
      var line = lines[i];
      var w = win.textWidth(stripForMeasure(line));
      var dx = x;
      if (align === 'center') dx = x + Math.max(0, Math.floor((width - w)/2));
      else if (align === 'right') dx = x + Math.max(0, width - w);
      win.drawTextEx(line, dx, y + i*win.lineHeight());
    }
    return lines.length * win.lineHeight();
  }

  function charFrameRect(bitmap, charName, charIndex, pattern, dir){
    var dirRow = (dir===4?1:dir===6?2:dir===8?3:0);
    var big = ImageManager.isBigCharacter(charName);
    var bw,bh,pw,ph,bx,by;
    if (big){
      bw=bitmap.width; bh=bitmap.height; pw=bw/3; ph=bh/4; bx=0; by=0;
    } else {
      bw=bitmap.width/4; bh=bitmap.height/2; pw=bw/3; ph=bh/4;
      bx=(charIndex%4)*bw; by=Math.floor(charIndex/4)*bh;
    }
    return { sx: bx+pw*pattern, sy: by+ph*dirRow, sw: pw, sh: ph };
  }

  function walkPattern(frameCount, speed){
    var seq=[1,2,1,0];
    return seq[Math.floor(frameCount/Math.max(1,speed))%seq.length];
  }

  function drawFace(win, actorId, x, y, scale){
    var a=getActor(actorId);
    if (!a||!a.faceName) return {w:0,h:0};
    var bmp=win._tcCache[ck('face', actorId)];
    if (!bmp) return {w:0,h:0};
    var fi=a.faceIndex||0;
    var sx=(fi%4)*FACE_W, sy=Math.floor(fi/4)*FACE_H;
    var dw=Math.round(FACE_W*(scale/100)), dh=Math.round(FACE_H*(scale/100));
    win.contents.blt(bmp,sx,sy,FACE_W,FACE_H,x,y,dw,dh);
    return {w:dw,h:dh};
  }

  function drawChar(win, actorId, x, y, scale, dir, speed){
    var a=getActor(actorId);
    if (!a) return {w:0,h:0,usedFace:false};

    if (!a.characterName){
      if (a.faceName){
        var f=drawFace(win, actorId, x, y, scale);
        return {w:f.w,h:f.h,usedFace:true};
      }
      return {w:0,h:0,usedFace:false};
    }

    var bmp=win._tcCache[ck('char', actorId)];
    if (!bmp) return {w:0,h:0,usedFace:false};

    var pat=ANIM_CHARS ? walkPattern(Graphics.frameCount, speed) : 1;
    var rr=charFrameRect(bmp,a.characterName,a.characterIndex,pat,dir);
    var dw=Math.round(rr.sw*(scale/100)), dh=Math.round(rr.sh*(scale/100));
    win.contents.blt(bmp,rr.sx,rr.sy,rr.sw,rr.sh,x,y,dw,dh);

    if (ANIM_CHARS){
      win._tcChars.push({ actorId:actorId, charName:a.characterName, charIndex:a.characterIndex, dx:x, dy:y, dw:dw, dh:dh, dir:dir, speed:speed, lastPat:pat });
    }
    return {w:dw,h:dh,usedFace:false};
  }

  function drawImg(win, filename, x, y, scale){
    var bmp=win._tcCache[ck('img', filename)];
    if (!bmp) return {w:0,h:0};
    var dw=Math.round(bmp.width*(scale/100)), dh=Math.round(bmp.height*(scale/100));
    win.contents.blt(bmp,0,0,bmp.width,bmp.height,x,y,dw,dh);
    return {w:dw,h:dh};
  }
function updateCharAnimations(win){
    if (!ANIM_CHARS) return;
    if (!win._tcChars || !win._tcCache) return;
    for (var i=0;i<win._tcChars.length;i++){
      var d=win._tcChars[i];
      var bmp=win._tcCache[ck('char', d.actorId)];
      if (!bmp || !bmp.isReady || !bmp.isReady()) continue;
      var newPat=walkPattern(Graphics.frameCount, d.speed);
      if (newPat===d.lastPat) continue;
      d.lastPat=newPat;
      var rr=charFrameRect(bmp,d.charName,d.charIndex,newPat,d.dir);
      win.contents.clearRect(d.dx,d.dy,d.dw,d.dh);
      win.contents.blt(bmp,rr.sx,rr.sy,rr.sw,rr.sh,d.dx,d.dy,d.dw,d.dh);
    }
  }

  // Patch Window_Credit
  var _WC_update = Window_Credit.prototype.update;
  Window_Credit.prototype.update = function(){
    _WC_update.call(this);
    if (this._tcWaiting && Txt.loaded && Txt.text){
      this._tcWaiting=false;
      this._text=Txt.text;
      this.refresh();
      this.show();
    }
    updateCharAnimations(this);
  };

  Window_Credit.prototype.startMessage = function(){
    loadTxt();
    if (!Txt.loaded){
      this._tcWaiting=true;
      this._text=LOADING_TXT;
      this.refresh();
      this.show();
      return;
    }
    if (!Txt.text){
      this._tcWaiting=false;
      this._text=fallbackText();
      this.refresh();
      this.show();
      return;
    }
    this._tcWaiting=false;
    this._text=Txt.text;
    this.refresh();
    this.show();
  };

  var _WC_refresh = Window_Credit.prototype.refresh;
  Window_Credit.prototype.refresh = function(){
    ensureCache(this);
    this.resetFontSettings();
    this.contents.fontSize = FONT_SIZE;

    if (!Txt.loaded || !Txt.text || this._text !== Txt.text){
      _WC_refresh.call(this);
      return;
    }

    var blocks=parseBlocks(Txt.text);

    // prime assets for 3-column rows
    for (var i=0;i<blocks.length;i++){
      if (blocks[i].type!=='row') continue;
      detectCells(blocks[i].left).forEach(prime.bind(null,this));
      detectCells(blocks[i].centre).forEach(prime.bind(null,this));
      detectCells(blocks[i].right).forEach(prime.bind(null,this));
    }

    // wait for assets
    for (var j=0;j<blocks.length;j++){
      if (blocks[j].type!=='row') continue;
      var ok=true;
      detectCells(blocks[j].left).forEach(function(c){ if(!ready(this,c)) ok=false; }, this);
      detectCells(blocks[j].centre).forEach(function(c){ if(!ready(this,c)) ok=false; }, this);
      detectCells(blocks[j].right).forEach(function(c){ if(!ready(this,c)) ok=false; }, this);
      if (!ok){
        this.contents.clear();
        this.drawTextEx(LOADING_TXT, this.textPadding(), 1);
        return;
      }
    }

    // 3-column grid layout
    var fullW=this.contentsWidth();
    var colW=Math.floor((fullW - COL_GAP*2)/3);
    if (colW<1) colW=1;

    var x0=this.textPadding();
    var x1=x0;
    var x2=x0+colW+COL_GAP;
    var x3=x0+colW*2+COL_GAP*2;

    var wText = colW - COL_PAD*2;

    // Full rows use GRID width (same as 3 columns combined), with same inner padding
    var gridX = x1;
    var gridW = (colW*3) + (COL_GAP*2);
    var fullTextX = gridX + COL_PAD;
    var fullTextW = Math.max(1, gridW - COL_PAD*2);

    function rowScale(r,which){
      var s=r.scale||100;
      if (which==='left'&&isFinite(r.leftScale)) return Number(r.leftScale)||s;
      if (which==='centre'&&isFinite(r.centreScale)) return Number(r.centreScale)||s;
      if (which==='right'&&isFinite(r.rightScale)) return Number(r.rightScale)||s;
      return s;
    }
    function rowDir(r,which){
      var d=2;
      if (which==='left'&&isFinite(r.leftDir)) d=r.leftDir;
      if (which==='centre'&&isFinite(r.centreDir)) d=r.centreDir;
      if (which==='right'&&isFinite(r.rightDir)) d=r.rightDir;
      return clampDir(d);
    }
    function rowSpeed(r,which){
      var s=DEF_SPEED;
      if (which==='left'&&isFinite(r.leftSpeed)) s=r.leftSpeed;
      if (which==='centre'&&isFinite(r.centreSpeed)) s=r.centreSpeed;
      if (which==='right'&&isFinite(r.rightSpeed)) s=r.rightSpeed;
      s=Number(s);
      return (isFinite(s)&&s>0)?s:DEF_SPEED;
    }

    function cellSize(win, cell, scale, dir){
      if (cell.kind==='img'){
        var bmp=win._tcCache[ck('img', cell.raw)];
        if (!bmp) return {w:0,h:0};
        return {w:Math.round(bmp.width*(scale/100)), h:Math.round(bmp.height*(scale/100))};
      }
      if (cell.kind==='face') return {w:Math.round(FACE_W*(scale/100)), h:Math.round(FACE_H*(scale/100))};
      if (cell.kind==='char' || cell.kind==='actor'){
        var id=Number(cell.raw)||0;
        var a=getActor(id);
        if (!a) return {w:0,h:0};
        if (!a.characterName) return {w:Math.round(FACE_W*(scale/100)), h:Math.round(FACE_H*(scale/100))};
        var bmpC=win._tcCache[ck('char', id)];
        if (!bmpC) return {w:0,h:0};
        var rr=charFrameRect(bmpC,a.characterName,a.characterIndex,1,dir);
        return {w:Math.round(rr.sw*(scale/100)), h:Math.round(rr.sh*(scale/100))};
      }
      return {w:0,h:0};
    }

    function colHeight(win, raw, scale, dir){
      var cells=detectCells(raw);
      if (cells.length===1 && (cells[0].kind==='text'||cells[0].kind==='none')){
        if (cells[0].kind==='none') return 0;
        return wrapLines(win, cells[0].raw, wText).length * win.lineHeight();
      }
      var mh=0;
      for (var i=0;i<cells.length;i++){
        // dir for size uses per-item override if present
        var d = dir;
        if (cells[i].mods && isFinite(cells[i].mods.dir)) d = clampDir(cells[i].mods.dir);
        var sz=cellSize(win,cells[i],scale,d);
        if (sz.h>mh) mh=sz.h;
      }
      return mh;
    }

    function drawFullAligned(win, text, yStart, align){
      var lines = wrapLines(win, text, fullTextW);
      for (var i=0;i<lines.length;i++){
        var line = lines[i];
        var w = win.textWidth(stripForMeasure(line));

        var dx = fullTextX;
        if (align === 'center') dx = fullTextX + Math.max(0, Math.floor((fullTextW - w)/2));
        else if (align === 'right') dx = fullTextX + Math.max(0, fullTextW - w);

        win.drawTextEx(line, dx, yStart + i*win.lineHeight());
      }
      return lines.length * win.lineHeight();
    }

    // measure total height
    var totalH=0;
    for (var k=0;k<blocks.length;k++){
      var b=blocks[k];
      if (b.type==='space') totalH += b.px;
      else if (b.type==='text'){
        totalH += wrapLines(this, b.text, fullTextW).length * this.lineHeight();
      } else if (b.type==='full'){
        totalH += wrapLines(this, b.full, fullTextW).length * this.lineHeight();
      } else if (b.type==='row'){
        var sL=rowScale(b,'left'), sC=rowScale(b,'centre'), sR=rowScale(b,'right');
        var dL=rowDir(b,'left'), dC=rowDir(b,'centre'), dR=rowDir(b,'right');
        totalH += Math.max(
          colHeight(this,b.left,sL,dL),
          colHeight(this,b.centre,sC,dC),
          colHeight(this,b.right,sR,dR),
          this.lineHeight()
        );
      }
    }

    this._allTextHeight=Math.max(totalH,1);
    this.createContents();
    this.origin.y=-this.height;
    this.contents.clear();
    this._tcChars=[];

    // draw blocks
    var y=1;

    function drawColumn(win, raw, baseX, rowH, scale, dir, speed, align){
      var cells=detectCells(raw);

      // text
      if (cells.length===1 && (cells[0].kind==='text'||cells[0].kind==='none')){
        if (cells[0].kind==='text'){
          drawWrappedAligned(win, cells[0].raw, baseX + COL_PAD, y, wText, align);
        }
        return;
      }

      // visuals (multi) with alignment + per-item dir overrides
      var gap=8, sizes=[], totalW=0;
      for (var i=0;i<cells.length;i++){
        var d = dir;
        if (cells[i].mods && isFinite(cells[i].mods.dir)) d = clampDir(cells[i].mods.dir);
        var sz=cellSize(win,cells[i],scale,d);
        sizes.push({sz:sz, dir:d});
        totalW += sz.w + (i<cells.length-1?gap:0);
      }

      var startX;
      if (align === 'right') startX = baseX + colW - COL_PAD - totalW;
      else if (align === 'center') startX = baseX + Math.floor((colW - totalW)/2);
      else startX = baseX + COL_PAD;

      startX = Math.max(baseX + COL_PAD, Math.min(startX, baseX + colW - COL_PAD - totalW));
      var cx = startX;

      for (var j=0;j<cells.length;j++){
        var c=cells[j];
        var info = sizes[j];
        var sz2=info.sz;
        var dy = y + Math.floor((rowH - sz2.h)/2);

        if (c.kind==='img') drawImg(win, c.raw, cx, dy, scale);
        else if (c.kind==='face') drawFace(win, Number(c.raw)||0, cx, dy, scale);
        else if (c.kind==='char' || c.kind==='actor') drawChar(win, Number(c.raw)||0, cx, dy, scale, info.dir, speed);

        cx += sz2.w + gap;
      }
    }

    for (var n=0;n<blocks.length;n++){
      var bb=blocks[n];

      if (bb.type==='space'){ y += bb.px; continue; }

      if (bb.type==='text'){
        var lines = wrapLines(this, bb.text, fullTextW);
        for (var t=0;t<lines.length;t++){
          this.drawTextEx(lines[t], fullTextX, y + t*this.lineHeight());
        }
        y += lines.length * this.lineHeight();
        continue;
      }

      if (bb.type==='full'){
        y += drawFullAligned(this, bb.full, y, bb.fullAlign);
        continue;
      }

      if (bb.type!=='row') continue;

      var sL=rowScale(bb,'left'), sC=rowScale(bb,'centre'), sR=rowScale(bb,'right');
      var dL=rowDir(bb,'left'), dC=rowDir(bb,'centre'), dR=rowDir(bb,'right');
      var spL=rowSpeed(bb,'left'), spC=rowSpeed(bb,'centre'), spR=rowSpeed(bb,'right');

      var rowH=Math.max(
        colHeight(this,bb.left,sL,dL),
        colHeight(this,bb.centre,sC,dC),
        colHeight(this,bb.right,sR,dR),
        this.lineHeight()
      );

      drawColumn(this, bb.left,   x1, rowH, sL, dL, spL, bb.leftAlign);
      drawColumn(this, bb.centre, x2, rowH, sC, dC, spC, bb.centreAlign);
      drawColumn(this, bb.right,  x3, rowH, sR, dR, spR, bb.rightAlign);

      y += rowH;
    }
  };

})(); // end IIFE