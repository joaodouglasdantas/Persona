// ============================================================
//  PERSONA — Network Visualization (Canvas)
//  v2 — overflow-safe, muitos nós, performance, mobile
// ============================================================

class PersonaNetwork {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.nodes   = [];
    this.mainNode = null;
    this.animId  = null;
    this.tooltip = document.getElementById('network-tooltip');
    this.hoveredNode  = null;
    this.selectedNode = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR at 2 for perf

    this._bindEvents();
    this._resize();
    window.addEventListener('resize', () => this._resize());

    // Pause when browser tab is hidden — evita processamento desnecessário
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._pauseLoop();
      else if (this.mainNode || this.nodes.length) this._resumeLoop();
    });
  }

  // ── Altura dinâmica ────────────────────────────────────────
  _calcHeight(w) {
    const n = this.nodes.length;
    if (n <= 8)  return Math.max(400, Math.min(w * 0.60, 520));
    if (n <= 16) return Math.max(480, Math.min(w * 0.68, 620));
    if (n <= 30) return Math.max(560, Math.min(w * 0.75, 720));
    return Math.max(640, Math.min(w * 0.82, 840));   // 30+ nós
  }

  // ── Física dinâmica por quantidade de nós ──────────────────
  _physicsParams() {
    const n = this.nodes.length;
    return {
      repulsion:  2800 + n * 120,   // mais nós → mais repulsão
      zoneForce:  Math.max(0.010, 0.028 - n * 0.0005),
      damping:    0.80,
      speedCap:   4,
      minDist:    76 + Math.min(n * 1.5, 40)
    };
  }

  // ── Setup / resize ─────────────────────────────────────────
  _resize() {
    const wrap = this.canvas.parentElement;
    const w = wrap.clientWidth;
    const h = this._calcHeight(w);

    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    wrap.style.height = h + 'px';
    this.canvas.width  = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    this.W  = w;
    this.H  = h;
    this.cx = w / 2;
    this.cy = h / 2;

    // Quadrant zone centers — inset 62/60% from center
    const qx = this.cx * 0.62;
    const qy = this.cy * 0.60;
    this.zoneCenters = {
      V:  { x: this.cx - qx, y: this.cy - qy },  // top-left    Vermelho
      A:  { x: this.cx + qx, y: this.cy - qy },  // top-right   Amarelo
      Ve: { x: this.cx + qx, y: this.cy + qy },  // bot-right   Verde
      Az: { x: this.cx - qx, y: this.cy + qy }   // bot-left    Azul
    };

    if (this.mainNode) {
      this.mainNode.x = this.cx;
      this.mainNode.y = this.cy;
    }
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
    // Calcula quantos nós já estão nesta zona para dispersar em espiral
    const sameZone = this.nodes.filter(n => n.color === person.color).length;
    const zone = this.zoneCenters[person.color] || { x: this.cx, y: this.cy };

    // Espiral: cada nó novo na mesma zona vai ligeiramente mais longe e rotacionado
    const baseAngle = (sameZone * 137.5 * Math.PI / 180); // ângulo áureo
    const dist = 55 + sameZone * 18;
    const angle = baseAngle + (Math.random() - 0.5) * 0.4;

    this.nodes.push({
      id: person.id, name: person.name, color: person.color,
      x: zone.x + Math.cos(angle) * dist,
      y: zone.y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      r: 18, isMain: false
    });

    // Recalcula canvas height quando adicionamos nós
    this._resize();
    if (!this.animId) this._startLoop();
  }

  loadAll(mainUser, persons) {
    this.nodes    = [];
    this.mainNode = null;
    if (mainUser) this.setMainUser(mainUser);
    persons.forEach(p => this.addPerson(p));
  }

  removePerson(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this._resize(); // ajusta altura ao remover
  }

  // ── Physics ───────────────────────────────────────────────

  _physics() {
    const allNodes = this.mainNode ? [this.mainNode, ...this.nodes] : this.nodes;
    const { repulsion, zoneForce, damping, speedCap, minDist } = this._physicsParams();

    for (let i = 0; i < allNodes.length; i++) {
      const n = allNodes[i];
      if (n.isMain) continue;

      // Gravidade em direção ao centro da zona
      const zone = this.zoneCenters[n.color];
      if (zone) {
        n.vx += (zone.x - n.x) * zoneForce;
        n.vy += (zone.y - n.y) * zoneForce;
      }

      // Repulsão entre nós
      for (let j = 0; j < allNodes.length; j++) {
        if (i === j) continue;
        const other = allNodes[j];
        const dx = n.x - other.x;
        const dy = n.y - other.y;
        const d2 = dx * dx + dy * dy + 1;
        const d  = Math.sqrt(d2);
        if (d < minDist * 2) {
          const force = repulsion / d2;
          n.vx += (dx / d) * force;
          n.vy += (dy / d) * force;
        }
      }

      n.vx *= damping;
      n.vy *= damping;

      // Cap de velocidade
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > speedCap) {
        n.vx = (n.vx / speed) * speedCap;
        n.vy = (n.vy / speed) * speedCap;
      }

      n.x += n.vx;
      n.y += n.vy;

      // Bordas — deixa espaço para o label abaixo do nó
      const pad = n.r + 20;
      n.x = Math.max(pad, Math.min(this.W - pad, n.x));
      n.y = Math.max(pad, Math.min(this.H - pad - 4, n.y));
    }

    // Nó principal ancorado no centro
    if (this.mainNode) {
      this.mainNode.x += (this.cx - this.mainNode.x) * 0.08;
      this.mainNode.y += (this.cy - this.mainNode.y) * 0.08;
      this.mainNode.vx = 0;
      this.mainNode.vy = 0;
    }
  }

  // ── Rendering ─────────────────────────────────────────────

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    this._drawQuadrants(ctx);
    if (!this.mainNode) return;

    // Edges
    this.nodes.forEach(n => this._drawEdge(ctx, this.mainNode, n));
    // Nodes (secundários primeiro, main por cima)
    this.nodes.forEach(n => this._drawNode(ctx, n));
    this._drawNode(ctx, this.mainNode);

    this._drawAxisLabels(ctx);
    this._drawNodeCount(ctx);
  }

  _drawQuadrants(ctx) {
    const { cx, cy, W, H } = this;
    const regions = [
      { x: 0,  y: 0,  w: cx, h: cy, color: PERSONALITIES.V.colorRgb  },
      { x: cx, y: 0,  w: cx, h: cy, color: PERSONALITIES.A.colorRgb  },
      { x: cx, y: cy, w: cx, h: cy, color: PERSONALITIES.Ve.colorRgb },
      { x: 0,  y: cy, w: cx, h: cy, color: PERSONALITIES.Az.colorRgb }
    ];
    regions.forEach(r => {
      ctx.fillStyle = `rgba(${r.color}, 0.045)`;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Rótulos dos quadrantes no canto
    const labels = [
      { text: 'VERMELHO', x: 10, y: 16, color: PERSONALITIES.V.color,  align: 'left'  },
      { text: 'AMARELO',  x: W-10, y: 16, color: PERSONALITIES.A.color,  align: 'right' },
      { text: 'VERDE',    x: W-10, y: H-8, color: PERSONALITIES.Ve.color, align: 'right' },
      { text: 'AZUL',     x: 10, y: H-8, color: PERSONALITIES.Az.color, align: 'left'  }
    ];
    ctx.save();
    ctx.font = '700 9px -apple-system, sans-serif';
    labels.forEach(l => {
      ctx.fillStyle  = l.color + '70';
      ctx.textAlign  = l.align;
      ctx.fillText(l.text, l.x, l.y);
    });
    ctx.restore();
  }

  _drawEdge(ctx, from, to) {
    const pd = PERSONALITIES[to.color];
    const color = pd ? pd.color : '#fff';
    const hovered = this.hoveredNode === to;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = hovered ? color + 'CC' : color + '38';
    ctx.lineWidth   = hovered ? 2 : 1;
    ctx.setLineDash(hovered ? [] : [5, 9]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
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
      const g = ctx.createRadialGradient(node.x, node.y, r * 0.3, node.x, node.y, r * 2.4);
      g.addColorStop(0, `rgba(${colorRgb}, 0.22)`);
      g.addColorStop(1, `rgba(${colorRgb}, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const grad = ctx.createRadialGradient(node.x - r*0.3, node.y - r*0.3, 0, node.x, node.y, r);
    grad.addColorStop(0, color + 'FF');
    grad.addColorStop(1, color + 'BB');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = node.isMain ? 'rgba(255,255,255,0.85)' : color + 'AA';
    ctx.lineWidth   = node.isMain ? 2.5 : (hovered ? 2 : 1.5);
    ctx.stroke();

    ctx.fillStyle    = '#fff';
    ctx.font         = `${node.isMain ? '700' : '600'} ${node.isMain ? 13 : 11}px -apple-system, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    const initials   = node.name.split(' ').slice(0, 2).map(s => s[0] || '').join('').toUpperCase();
    ctx.fillText(initials, node.x, node.y);

    const firstName   = node.name.split(' ')[0];
    const maxChars    = this.W < 400 ? 6 : 10;
    const displayName = firstName.length > maxChars
      ? firstName.slice(0, maxChars) + '…'
      : firstName;

    ctx.fillStyle = hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.52)';
    ctx.font      = `${hovered ? '600' : '400'} ${this.W < 400 ? 9 : 10}px -apple-system, sans-serif`;
    ctx.fillText(displayName, node.x, node.y + r + 12);

    ctx.restore();
  }

  _drawAxisLabels(ctx) {
    if (this.W < 320) return;
    ctx.save();
    ctx.font      = '600 8px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.textAlign = 'center';
    ctx.fillText('▲ RÁPIDO', this.cx, 13);
    ctx.fillText('▼ LENTO',  this.cx, this.H - 4);
    ctx.save();
    ctx.translate(9, this.cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('TAREFA ◄', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(this.W - 9, this.cy);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('PESSOAS ►', 0, 0);
    ctx.restore();
    ctx.restore();
  }

  _drawNodeCount(ctx) {
    const total = this.nodes.length;
    if (total === 0) return;
    const txt = `${total} conexão${total !== 1 ? 'ões' : ''}`;
    ctx.save();
    ctx.font      = '500 10px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.textAlign = 'right';
    ctx.fillText(txt, this.W - 12, 28);
    ctx.restore();
  }


  _startLoop() {
    if (this.animId) return;
    const loop = () => {
      this._physics();
      this._draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  _pauseLoop() {
    if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
  }

  _resumeLoop() {
    if (!this.animId) this._startLoop();
  }

  stopLoop() { this._pauseLoop(); }

  onTabVisible(visible) {
    if (visible) this._resumeLoop();
    else this._pauseLoop();
  }

  _bindEvents() {
    this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
    this.canvas.addEventListener('click',     e => this._onClick(e));
    // Touch support
    this.canvas.addEventListener('touchstart', e => this._onTouch(e), { passive: true });
    this.canvas.addEventListener('touchend',   e => this._onTouch(e), { passive: true });
  }

  _getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  _findNodeAt(pos) {
    const all = this.mainNode ? [this.mainNode, ...this.nodes] : this.nodes;
    for (let i = all.length - 1; i >= 0; i--) {
      const n = all[i];
      const dx = pos.x - n.x, dy = pos.y - n.y;
      if (Math.sqrt(dx*dx + dy*dy) <= n.r + 10) return n;
    }
    return null;
  }

  _onMouseMove(e) {
    const pos  = this._getCanvasPos(e);
    const node = this._findNodeAt(pos);
    this.hoveredNode = node;
    this.canvas.style.cursor = node ? 'pointer' : 'default';

    if (node && this.tooltip) {
      const pd = PERSONALITIES[node.color];
      this.tooltip.innerHTML = `
        <div class="tooltip-name">${node.name}</div>
        <div class="tooltip-type" style="color:${pd?.color || '#fff'}">${pd?.icon || ''} ${pd?.name || node.color}</div>
        ${node.isMain ? '<div class="tooltip-type" style="margin-top:4px">✦ Você</div>' : ''}
      `;
      const tx = Math.min(e.clientX + 14, window.innerWidth - 220);
      const ty = Math.max(e.clientY - 8, 8);
      this.tooltip.style.left = tx + 'px';
      this.tooltip.style.top  = ty + 'px';
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
    if (node && typeof window.onNetworkNodeClick === 'function') {
      window.onNetworkNodeClick(node);
    }
  }

  _onTouch(e) {
    if (!e.changedTouches?.length) return;
    const t = e.changedTouches[0];
    if (e.type === 'touchend') {
      const pos  = this._getCanvasPos(t);
      const node = this._findNodeAt(pos);
      if (node && typeof window.onNetworkNodeClick === 'function') {
        window.onNetworkNodeClick(node);
      }
    }
  }
}
