// ============================================================
//  PERSONA — Network Visualization (Canvas)
//  v4 — mundo virtual separado do canvas, zoom/pan interno
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

    // Canvas (fixo — o que o usuario ve)
    this.canvasW = 0;
    this.canvasH = 0;

    // Mundo virtual (onde a fisica roda — maior que o canvas)
    this.W  = 0; this.H  = 0;
    this.cx = 0; this.cy = 0;

    // Zoom / pan (dentro do canvas fixo)
    this.zoom  = 1;
    this.panX  = 0;
    this.panY  = 0;
    this.baseZoom = 1; // zoom base para caber o mundo no canvas

    this._pinchDist0  = null;
    this._pinchZoom0  = 1;
    this._pinchCenter = null;
    this._dragStart   = null;
    this._isDragging  = false;
    this._lastWorldScale = 1;

    this._bindEvents();
    this._resize();
    window.addEventListener('resize', () => this._resize());

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._pauseLoop();
      else if (this.mainNode || this.nodes.length) this._resumeLoop();
    });
  }

  // ── Canvas fixo (nao cresce com nos) ──────────────────────
  _fixedHeight(w) {
    return Math.max(360, Math.min(Math.round(w * 0.85), 520));
  }

  // ── Fator de expansao do mundo virtual ────────────────────
  _worldScale() {
    const n = this.nodes.length;
    if (n <= 8)  return 1.0;
    if (n <= 14) return 1.3;
    if (n <= 20) return 1.6;
    if (n <= 30) return 2.0;
    return 2.5;
  }

  // ── Raio baseado na area do mundo virtual ─────────────────
  _nodeRadius() {
    if (!this.W || !this.H || !this.nodes.length) return 18;
    const counts = { V: 0, A: 0, Ve: 0, Az: 0 };
    this.nodes.forEach(n => { if (n.color in counts) counts[n.color]++; });
    const maxInQ = Math.max(...Object.values(counts), 1);
    const areaPerNode = (this.W / 2) * (this.H / 2) / maxInQ;
    const r = Math.sqrt(areaPerNode / Math.PI) * 0.34;
    return Math.max(10, Math.min(26, Math.round(r)));
  }

  // ── Fisica ────────────────────────────────────────────────
  _physicsParams() {
    const n = this.nodes.length;
    const r = this._nodeRadius();
    return {
      repulsion: 3000 + n * 160,
      zoneForce: Math.max(0.016, 0.032 - n * 0.0003),
      damping:   0.80,
      speedCap:  5,
      minDist:   r * 2 + 20 + Math.min(n * 0.5, 20)
    };
  }

  // ── Setup / resize ─────────────────────────────────────────
  _resize() {
    const wrap = this.canvas.parentElement;
    const cw = wrap.clientWidth;
    const ch = this._fixedHeight(cw);

    // Canvas fisico — tamanho fixo
    this.canvas.style.width  = cw + 'px';
    this.canvas.style.height = ch + 'px';
    wrap.style.height = ch + 'px';
    this.canvas.width  = Math.round(cw * this.dpr);
    this.canvas.height = Math.round(ch * this.dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    this.canvasW = cw;
    this.canvasH = ch;

    // Mundo virtual — escala com numero de nos
    const ws = this._worldScale();
    this.W  = cw * ws;
    this.H  = ch * ws;
    this.cx = this.W / 2;
    this.cy = this.H / 2;

    // baseZoom: faz o mundo inteiro caber no canvas
    this.baseZoom = 1 / ws;

    // Se o world scale mudou, resetar zoom/pan para ver tudo
    if (ws !== this._lastWorldScale) {
      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
      this._lastWorldScale = ws;
    }

    // Atualiza raio de todos os nos
    const r = this._nodeRadius();
    this.nodes.forEach(n => { n.r = r; });

    // Centros dos quadrantes no mundo virtual
    const qx = this.cx * 0.62;
    const qy = this.cy * 0.60;
    this.zoneCenters = {
      V:  { x: this.cx - qx, y: this.cy - qy },
      A:  { x: this.cx + qx, y: this.cy - qy },
      Ve: { x: this.cx + qx, y: this.cy + qy },
      Az: { x: this.cx - qx, y: this.cy + qy }
    };

    if (this.mainNode) { this.mainNode.x = this.cx; this.mainNode.y = this.cy; }
  }

  // ── Node Management ───────────────────────────────────────
  setMainUser(user) {
    this.mainNode = {
      id: user.id, name: user.name, color: user.color,
      x: this.cx, y: this.cy, vx: 0, vy: 0,
      r: 26, isMain: true
    };
    if (!this.animId) this._startLoop();
  }

  addPerson(person) {
    const sameZone = this.nodes.filter(n => n.color === person.color).length;
    const zone = this.zoneCenters[person.color] || { x: this.cx, y: this.cy };
    const baseAngle = sameZone * 137.5 * Math.PI / 180;
    const maxDist   = Math.min(this.cx, this.cy) * 0.55;
    const dist      = Math.min(50 + sameZone * 18, maxDist);
    const angle     = baseAngle + (Math.random() - 0.5) * 0.4;

    this.nodes.push({
      id: person.id, name: person.name, color: person.color,
      x: zone.x + Math.cos(angle) * dist,
      y: zone.y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      r: 18, isMain: false
    });
    this._resize();
    if (!this.animId) this._startLoop();
  }

  loadAll(mainUser, persons) {
    this.nodes = []; this.mainNode = null;
    if (mainUser) this.setMainUser(mainUser);
    persons.forEach(p => this.addPerson(p));
  }

  removePerson(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this._resize();
  }

  // ── Physics ───────────────────────────────────────────────
  _physics() {
    const allNodes = this.mainNode ? [this.mainNode, ...this.nodes] : this.nodes;
    const { repulsion, zoneForce, damping, speedCap, minDist } = this._physicsParams();

    for (let i = 0; i < allNodes.length; i++) {
      const n = allNodes[i];
      if (n.isMain) continue;

      const zone = this.zoneCenters[n.color];
      if (zone) {
        const zdx = zone.x - n.x, zdy = zone.y - n.y;
        const zdist = Math.sqrt(zdx * zdx + zdy * zdy) + 1;
        const pull  = zoneForce * (1 + zdist / 80);
        n.vx += zdx * pull;
        n.vy += zdy * pull;

        const wrongX = (zone.x > this.cx) ? (n.x < this.cx) : (n.x > this.cx);
        const wrongY = (zone.y > this.cy) ? (n.y < this.cy) : (n.y > this.cy);
        if (wrongX) n.vx += (zone.x > this.cx ? 1 : -1) * Math.abs(n.x - this.cx) * 0.05;
        if (wrongY) n.vy += (zone.y > this.cy ? 1 : -1) * Math.abs(n.y - this.cy) * 0.05;
      }

      for (let j = 0; j < allNodes.length; j++) {
        if (i === j) continue;
        const other = allNodes[j];
        const dx = n.x - other.x, dy = n.y - other.y;
        const d2 = dx * dx + dy * dy + 1;
        const d  = Math.sqrt(d2);
        if (d < minDist * 2) {
          const force = repulsion / d2;
          n.vx += (dx / d) * force;
          n.vy += (dy / d) * force;
        }
      }

      n.vx *= damping; n.vy *= damping;
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > speedCap) { n.vx = (n.vx/speed)*speedCap; n.vy = (n.vy/speed)*speedCap; }
      n.x += n.vx; n.y += n.vy;

      const pad = n.r + 24;
      n.x = Math.max(pad, Math.min(this.W - pad, n.x));
      n.y = Math.max(pad, Math.min(this.H - pad - 4, n.y));
    }

    if (this.mainNode) {
      this.mainNode.x += (this.cx - this.mainNode.x) * 0.08;
      this.mainNode.y += (this.cy - this.mainNode.y) * 0.08;
      this.mainNode.vx = 0; this.mainNode.vy = 0;
    }
  }

  // ── Rendering ─────────────────────────────────────────────
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

    this._drawNodeCount(ctx);
    if (this._worldScale() > 1) this._drawZoomHint(ctx);
  }

  _drawQuadrants(ctx) {
    const { cx, cy, W, H } = this;
    [ { x: 0,  y: 0,  w: cx, h: cy, color: PERSONALITIES.V.colorRgb  },
      { x: cx, y: 0,  w: cx, h: cy, color: PERSONALITIES.A.colorRgb  },
      { x: cx, y: cy, w: cx, h: cy, color: PERSONALITIES.Ve.colorRgb },
      { x: 0,  y: cy, w: cx, h: cy, color: PERSONALITIES.Az.colorRgb }
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
      { text: 'VERMELHO', x: 10,   y: 20,  color: PERSONALITIES.V.color,  align: 'left'  },
      { text: 'AMARELO',  x: W-10, y: 20,  color: PERSONALITIES.A.color,  align: 'right' },
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

  _drawNodeCount(ctx) {
    if (!this.nodes.length) return;
    ctx.save();
    ctx.font = '500 10px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.nodes.length} conexoes`, this.canvasW - 12, 28);
    ctx.restore();
  }

  _drawZoomHint(ctx) {
    if (this.zoom > 1.1) return; // ja fez zoom, nao precisa do hint
    ctx.save();
    ctx.font = '400 9px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.20)';
    ctx.textAlign = 'center';
    ctx.fillText('Junte 2 dedos para aproximar', this.canvasW / 2, this.canvasH - 8);
    ctx.restore();
  }

  // ── Loop ──────────────────────────────────────────────────
  _startLoop() {
    if (this.animId) return;
    const loop = () => { this._physics(); this._draw(); this.animId = requestAnimationFrame(loop); };
    this.animId = requestAnimationFrame(loop);
  }
  _pauseLoop() { if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; } }
  _resumeLoop() { if (!this.animId) this._startLoop(); }
  stopLoop() { this._pauseLoop(); }
  onTabVisible(v) { v ? this._resumeLoop() : this._pauseLoop(); }

  // ── Events ────────────────────────────────────────────────
  _bindEvents() {
    this.canvas.addEventListener('mousemove',  e => this._onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
    this.canvas.addEventListener('click',      e => this._onClick(e));

    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const pos = this._getCanvasPos(e);
      this._applyZoom(e.deltaY < 0 ? 1.12 : 0.89, pos.x, pos.y);
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
    const minZ = 0.6;
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
  }

  _onMouseLeave() {
    this.hoveredNode = null;
    this.canvas.style.cursor = 'default';
    if (this.tooltip) this.tooltip.classList.remove('visible');
  }

  _onClick(e) {
    const pos  = this._getCanvasPos(e);
    const node = this._findNodeAt(pos);
    this.selectedNode = node;
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
      const nz = Math.max(0.6, Math.min(5, this._pinchZoom0 * Math.sqrt(dx*dx+dy*dy) / this._pinchDist0));
      const { x: cx, y: cy } = this._pinchCenter;
      const curS = this._totalScale();
      const newS = this.baseZoom * nz;
      this.panX = cx - (cx - this.panX) * (newS / curS);
      this.panY = cy - (cy - this.panY) * (newS / curS);
      this.zoom = nz;
    } else if (e.touches.length === 1 && this._dragStart) {
      const nx = e.touches[0].clientX - this._dragStart.x;
      const ny = e.touches[0].clientY - this._dragStart.y;
      if (!this._isDragging && Math.abs(nx-this.panX)+Math.abs(ny-this.panY) > 6) this._isDragging = true;
      if (this._isDragging) { this.panX = nx; this.panY = ny; }
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
