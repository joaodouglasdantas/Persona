// ============================================================
//  PERSONA — Network Visualization (Canvas)
//  v5b — nos fixos apos assentar, sem textos de UI
// ============================================================

class PersonaNetwork {
  constructor(canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.nodes    = [];
    this.mainNode = null;
    this.animId   = null;
    this.tooltip  = document.getElementById('network-tooltip');
    this.hoveredNode  = null;
    this.selectedNode = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvasW = 0;
    this.canvasH = 0;
    this.W  = 0; this.H  = 0;
    this.cx = 0; this.cy = 0;

    this.zoom  = 1;
    this.panX  = 0;
    this.panY  = 0;
    this.baseZoom = 1;

    this._pinchDist0  = null;
    this._pinchZoom0  = 1;
    this._pinchCenter = null;
    this._dragStart   = null;
    this._isDragging  = false;
    this._lastWorldScale = 1;
    this._settleFrames   = 0;

    this._bindEvents();
    this._resize();
    window.addEventListener('resize', () => this._resize());

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._pauseLoop();
      else if (this._settleFrames > 0) this._resumeLoop();
    });
  }

  _fixedHeight(w) {
    return Math.max(360, Math.min(Math.round(w * 0.85), 520));
  }

  _worldScale() {
    const n = this.nodes.length;
    if (n <= 6)  return 1.0;
    if (n <= 12) return 1.4;
    if (n <= 18) return 1.8;
    if (n <= 26) return 2.3;
    return 2.8;
  }

  _nodeRadius() {
    if (!this.W || !this.H || !this.nodes.length) return 18;
    const counts = { V: 0, A: 0, Ve: 0, Az: 0 };
    this.nodes.forEach(n => { if (n.color in counts) counts[n.color]++; });
    const maxInQ = Math.max(...Object.values(counts), 1);
    const ws = this._worldScale();
    const areaPerNode = (this.W / 2) * (this.H / 2) / maxInQ;
    const r = Math.sqrt(areaPerNode / Math.PI) * 0.34;
    return Math.max(13 * ws, Math.min(22 * ws, Math.round(r)));
  }

  _quadrantBounds(color) {
    const { cx, cy, W, H } = this;
    const edge = 18;
    switch (color) {
      case 'V':  return { left: edge, right: cx,     top: edge, bottom: cy     };
      case 'A':  return { left: cx,   right: W-edge, top: edge, bottom: cy     };
      case 'Ve': return { left: cx,   right: W-edge, top: cy,   bottom: H-edge };
      case 'Az': return { left: edge, right: cx,     top: cy,   bottom: H-edge };
      default:   return null;
    }
  }

  _physicsParams() {
    const n  = this.nodes.length;
    const r  = this._nodeRadius();
    const ws = this._worldScale();
    return {
      repulsion: (2800 + n * 200) * ws * ws,
      damping:   0.80,
      speedCap:  5 * ws,
      minDist:   r * 2.2 + 6,
      wallStr:   1800 * ws * ws,
    };
  }

  _resize() {
    const wrap = this.canvas.parentElement;
    const cw = wrap.clientWidth || 360;
    const ch = this._fixedHeight(cw);

    this.canvas.style.width  = cw + 'px';
    this.canvas.style.height = ch + 'px';
    wrap.style.height = ch + 'px';
    this.canvas.width  = Math.round(cw * this.dpr);
    this.canvas.height = Math.round(ch * this.dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    this.canvasW = cw;
    this.canvasH = ch;

    const ws = this._worldScale();
    this.W  = cw * ws;
    this.H  = ch * ws;
    this.cx = this.W / 2;
    this.cy = this.H / 2;
    this.baseZoom = 1 / ws;

    if (ws !== this._lastWorldScale) {
      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
      this._lastWorldScale = ws;
    }

    const r = this._nodeRadius();
    this.nodes.forEach(n => { n.r = r; });
    if (this.mainNode) { this.mainNode.x = this.cx; this.mainNode.y = this.cy; }
  }

  setMainUser(user) {
    this.mainNode = {
      id: user.id, name: user.name, color: user.color,
      x: this.cx, y: this.cy, vx: 0, vy: 0,
      r: 26, isMain: true
    };
    this._restartSettle();
  }

  addPerson(person) {
    const b = this._quadrantBounds(person.color);
    const r = this._nodeRadius();
    const margin = r + 20;
    let x, y;
    if (b) {
      const qw = b.right - b.left - margin * 2;
      const qh = b.bottom - b.top - margin * 2;
      x = b.left + margin + Math.random() * Math.max(0, qw);
      y = b.top  + margin + Math.random() * Math.max(0, qh);
    } else {
      x = this.cx + (Math.random() - 0.5) * 80;
      y = this.cy + (Math.random() - 0.5) * 80;
    }
    this.nodes.push({
      id: person.id, name: person.name, color: person.color,
      x, y,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r, isMain: false
    });
    this._resize();
    this._restartSettle();
  }

  loadAll(mainUser, persons) {
    this.nodes = []; this.mainNode = null;
    if (mainUser) this.setMainUser(mainUser);
    persons.forEach(p => this.addPerson(p));
  }

  removePerson(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this._resize();
    this._restartSettle();
  }

  _physics() {
    const allNodes = this.mainNode ? [this.mainNode, ...this.nodes] : this.nodes;
    const { repulsion, damping, speedCap, minDist, wallStr } = this._physicsParams();

    for (const n of this.nodes) {
      let fx = 0, fy = 0;

      for (const m of allNodes) {
        if (m === n) continue;
        const dx = n.x - m.x, dy = n.y - m.y;
        const d2 = dx * dx + dy * dy + 1;
        const d  = Math.sqrt(d2);
        if (d < minDist * 2.5) {
          const force = repulsion / d2;
          fx += (dx / d) * force;
          fy += (dy / d) * force;
        }
      }

      const b = this._quadrantBounds(n.color);
      if (b) {
        const pad   = n.r + 10;
        const wZone = pad * 3.5;
        const dl = n.x - (b.left  + pad); if (dl < wZone) fx += wallStr / Math.max(1, dl * dl);
        const dr = (b.right  - pad) - n.x; if (dr < wZone) fx -= wallStr / Math.max(1, dr * dr);
        const dt = n.y - (b.top   + pad); if (dt < wZone) fy += wallStr / Math.max(1, dt * dt);
        const db = (b.bottom - pad) - n.y; if (db < wZone) fy -= wallStr / Math.max(1, db * db);
      }

      n.vx = (n.vx + fx) * damping;
      n.vy = (n.vy + fy) * damping;
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > speedCap) { n.vx = (n.vx / speed) * speedCap; n.vy = (n.vy / speed) * speedCap; }
      n.x += n.vx;
      n.y += n.vy;

      if (b) {
        n.x = Math.max(b.left  + n.r + 2, Math.min(b.right  - n.r - 2, n.x));
        n.y = Math.max(b.top   + n.r + 2, Math.min(b.bottom - n.r - 2, n.y));
      } else {
        n.x = Math.max(n.r + 2, Math.min(this.W - n.r - 2, n.x));
        n.y = Math.max(n.r + 2, Math.min(this.H - n.r - 2, n.y));
      }
    }

    if (this.mainNode) {
      this.mainNode.x += (this.cx - this.mainNode.x) * 0.08;
      this.mainNode.y += (this.cy - this.mainNode.y) * 0.08;
      this.mainNode.vx = 0; this.mainNode.vy = 0;
    }
  }

  _totalScale() { return this.baseZoom * this.zoom; }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvasW, this.canvasH);
    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this._totalScale(), this._totalScale());
    this._drawQuadrants(ctx);
    if (this.mainNode) {
      this.nodes.forEach(n => this._drawEdge(ctx, this.mainNode, n));
      this.nodes.forEach(n => this._drawNode(ctx, n));
      this._drawNode(ctx, this.mainNode);
      this._drawAxisLabels(ctx);
    }
    ctx.restore();
  }

  _drawQuadrants(ctx) {
    const { cx, cy, W, H } = this;
    [
      { x: 0,  y: 0,  w: cx,   h: cy,   color: PERSONALITIES.V.colorRgb  },
      { x: cx, y: 0,  w: W-cx, h: cy,   color: PERSONALITIES.A.colorRgb  },
      { x: cx, y: cy, w: W-cx, h: H-cy, color: PERSONALITIES.Ve.colorRgb },
      { x: 0,  y: cy, w: cx,   h: H-cy, color: PERSONALITIES.Az.colorRgb }
    ].forEach(r => {
      ctx.fillStyle = `rgba(${r.color}, 0.045)`;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1; ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();

    const labels = [
      { text: 'VERMELHO', x: 10,   y: 20,   color: PERSONALITIES.V.color,  align: 'left'  },
      { text: 'AMARELO',  x: W-10, y: 20,   color: PERSONALITIES.A.color,  align: 'right' },
      { text: 'VERDE',    x: W-10, y: H-10, color: PERSONALITIES.Ve.color, align: 'right' },
      { text: 'AZUL',     x: 10,   y: H-10, color: PERSONALITIES.Az.color, align: 'left'  }
    ];
    ctx.save();
    ctx.font = '700 11px -apple-system, sans-serif';
    labels.forEach(l => { ctx.fillStyle = l.color+'70'; ctx.textAlign = l.align; ctx.fillText(l.text, l.x, l.y); });
    ctx.restore();
  }

  _drawEdge(ctx, from, to) {
    const pd = PERSONALITIES[to.color];
    const color = pd ? pd.color : '#fff';
    const hovered = this.hoveredNode === to;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = hovered ? color+'CC' : color+'38';
    ctx.lineWidth   = hovered ? 2 : 1;
    ctx.setLineDash(hovered ? [] : [5, 9]);
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }

  _drawNode(ctx, node) {
    const pd       = PERSONALITIES[node.color];
    const color    = pd ? pd.color    : '#fff';
    const colorRgb = pd ? pd.colorRgb : '255,255,255';
    const hovered  = this.hoveredNode  === node;
    const selected = this.selectedNode === node;
    const r = node.r + (hovered ? 4 : 0);
    ctx.save();

    if (hovered || selected || node.isMain) {
      const g = ctx.createRadialGradient(node.x, node.y, r*0.3, node.x, node.y, r*2.4);
      g.addColorStop(0, `rgba(${colorRgb},0.22)`); g.addColorStop(1, `rgba(${colorRgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(node.x, node.y, r*2.4, 0, Math.PI*2); ctx.fill();
    }

    const grad = ctx.createRadialGradient(node.x-r*0.3, node.y-r*0.3, 0, node.x, node.y, r);
    grad.addColorStop(0, color+'FF'); grad.addColorStop(1, color+'BB');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI*2); ctx.fill();

    ctx.strokeStyle = node.isMain ? 'rgba(255,255,255,0.85)' : color+'AA';
    ctx.lineWidth   = node.isMain ? 2.5 : (hovered ? 2 : 1.5);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `${node.isMain?'700':'600'} ${node.isMain?14:12}px -apple-system, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(node.name.split(' ').slice(0,2).map(s=>s[0]||'').join('').toUpperCase(), node.x, node.y);

    const firstName = node.name.split(' ')[0];
    const maxChars  = 8;
    const label     = firstName.length > maxChars ? firstName.slice(0,maxChars)+'...' : firstName;
    ctx.fillStyle = hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)';
    ctx.font = `${hovered?'600':'400'} 11px -apple-system, sans-serif`;
    ctx.fillText(label, node.x, node.y + r + 13);
    ctx.restore();
  }

  _drawAxisLabels(ctx) {
    if (this.W < 320) return;
    ctx.save();
    ctx.font = '600 9px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.textAlign = 'center';
    ctx.fillText('RAPIDO', this.cx, 16);
    ctx.fillText('LENTO',  this.cx, this.H - 6);
    ctx.save(); ctx.translate(11, this.cy); ctx.rotate(-Math.PI/2); ctx.fillText('TAREFA', 0, 0); ctx.restore();
    ctx.save(); ctx.translate(this.W-11, this.cy); ctx.rotate(Math.PI/2); ctx.fillText('PESSOAS', 0, 0); ctx.restore();
    ctx.restore();
  }

  // ── Loop: roda fisica por N frames, depois para ────────────
  _startLoop() {
    if (this.animId) return;
    if (this._settleFrames <= 0) { this._draw(); return; }
    const loop = () => {
      this._physics();
      this._draw();
      this._settleFrames--;
      if (this._settleFrames > 0) {
        this.animId = requestAnimationFrame(loop);
      } else {
        this.animId = null;
        this._draw();
      }
    };
    this.animId = requestAnimationFrame(loop);
  }
  _pauseLoop()  { if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; } }
  _resumeLoop() { if (!this.animId && this._settleFrames > 0) this._startLoop(); }
  stopLoop()    { this._pauseLoop(); }
  onTabVisible(v) { v ? this._resumeLoop() : this._pauseLoop(); }

  _restartSettle() {
    this._settleFrames = 300;
    this._pauseLoop();
    this._startLoop();
  }

  _redraw() { if (!this.animId) this._draw(); }

  // ── Events ────────────────────────────────────────────────
  _bindEvents() {
    this.canvas.addEventListener('mousemove',  e => this._onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
    this.canvas.addEventListener('click',      e => this._onClick(e));

    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const pos = this._getCanvasPos(e);
      this._applyZoom(e.deltaY < 0 ? 1.12 : 0.89, pos.x, pos.y);
      this._redraw();
    }, { passive: false });

    this.canvas.addEventListener('touchstart', e => this._onTouchStart(e), { passive: true });
    this.canvas.addEventListener('touchmove',  e => this._onTouchMove(e),  { passive: false });
    this.canvas.addEventListener('touchend',   e => this._onTouchEnd(e),   { passive: true });
  }

  _getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _screenToWorld(sx, sy) {
    const s = this._totalScale();
    return { x: (sx - this.panX) / s, y: (sy - this.panY) / s };
  }

  _findNodeAt(screenPos) {
    const pos = this._screenToWorld(screenPos.x, screenPos.y);
    const all = this.mainNode ? [this.mainNode, ...this.nodes] : this.nodes;
    for (let i = all.length - 1; i >= 0; i--) {
      const n = all[i];
      const dx = pos.x - n.x, dy = pos.y - n.y;
      if (Math.sqrt(dx*dx + dy*dy) <= n.r + 10) return n;
    }
    return null;
  }

  _applyZoom(factor, cx, cy) {
    const minZ = 0.5;
    const newZoom = Math.max(minZ, Math.min(5, this.zoom * factor));
    const curS = this._totalScale();
    const newS = this.baseZoom * newZoom;
    this.panX = cx - (cx - this.panX) * (newS / curS);
    this.panY = cy - (cy - this.panY) * (newS / curS);
    this.zoom = newZoom;
  }

  _onMouseMove(e) {
    const pos  = this._getCanvasPos(e);
    const node = this._findNodeAt(pos);
    const changed = this.hoveredNode !== node;
    this.hoveredNode = node;
    this.canvas.style.cursor = node ? 'pointer' : 'default';
    if (node && this.tooltip) {
      const pd = PERSONALITIES[node.color];
      this.tooltip.innerHTML = `<div class="tooltip-name">${node.name}</div><div class="tooltip-type" style="color:${pd?.color||'#fff'}">${pd?.icon||''} ${pd?.name||node.color}</div>`;
      this.tooltip.style.left = Math.min(e.clientX+14, window.innerWidth-220)+'px';
      this.tooltip.style.top  = Math.max(e.clientY-8, 8)+'px';
      this.tooltip.classList.add('visible');
    } else if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
    if (changed) this._redraw();
  }

  _onMouseLeave() {
    this.hoveredNode = null;
    this.canvas.style.cursor = 'default';
    if (this.tooltip) this.tooltip.classList.remove('visible');
    this._redraw();
  }

  _onClick(e) {
    const pos  = this._getCanvasPos(e);
    const node = this._findNodeAt(pos);
    this.selectedNode = node;
    this._redraw();
    if (node && typeof window.onNetworkNodeClick === 'function') window.onNetworkNodeClick(node);
  }

  _onTouchStart(e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this._pinchDist0 = Math.sqrt(dx*dx+dy*dy);
      this._pinchZoom0 = this.zoom;
      const rect = this.canvas.getBoundingClientRect();
      this._pinchCenter = {
        x: (e.touches[0].clientX+e.touches[1].clientX)/2 - rect.left,
        y: (e.touches[0].clientY+e.touches[1].clientY)/2 - rect.top
      };
      this._dragStart = null;
    } else if (e.touches.length === 1) {
      this._dragStart  = { x: e.touches[0].clientX - this.panX, y: e.touches[0].clientY - this.panY };
      this._isDragging = false;
      this._pinchDist0 = null;
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 2 && this._pinchDist0 !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const nz = Math.max(0.5, Math.min(5, this._pinchZoom0 * Math.sqrt(dx*dx+dy*dy) / this._pinchDist0));
      const { x: cx, y: cy } = this._pinchCenter;
      const curS = this._totalScale();
      const newS = this.baseZoom * nz;
      this.panX = cx - (cx - this.panX) * (newS / curS);
      this.panY = cy - (cy - this.panY) * (newS / curS);
      this.zoom = nz;
      this._redraw();
    } else if (e.touches.length === 1 && this._dragStart) {
      const nx = e.touches[0].clientX - this._dragStart.x;
      const ny = e.touches[0].clientY - this._dragStart.y;
      if (!this._isDragging && Math.abs(nx-this.panX)+Math.abs(ny-this.panY) > 6) this._isDragging = true;
      if (this._isDragging) { this.panX = nx; this.panY = ny; this._redraw(); }
    }
  }

  _onTouchEnd(e) {
    if (!this._isDragging && e.changedTouches?.length) {
      const node = this._findNodeAt(this._getCanvasPos(e.changedTouches[0]));
      if (node && typeof window.onNetworkNodeClick === 'function') window.onNetworkNodeClick(node);
    }
    if (e.touches.length < 2) this._pinchDist0 = null;
    if (e.touches.length === 0) { this._isDragging = false; this._dragStart = null; }
  }
}
