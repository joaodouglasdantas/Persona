// ============================================================
//  PERSONA — Network Visualization (Canvas)
//  Teia de conexões com simulação de física simples
// ============================================================

class PersonaNetwork {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.mainNode = null;
    this.animId = null;
    this.tooltip = document.getElementById('network-tooltip');
    this.hoveredNode = null;
    this.selectedNode = null;
    this.dpr = window.devicePixelRatio || 1;

    // Physics tuning
    this.repulsion   = 3200;
    this.damping     = 0.82;
    this.centerForce = 0.04;
    this.zoneForce   = 0.025;
    this.minDist     = 90;

    this._bindEvents();
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  // ── Setup ─────────────────────────────────────────────────

  _resize() {
    const wrap = this.canvas.parentElement;
    const w = wrap.clientWidth;
    const h = Math.max(420, Math.min(w * 0.62, 560));

    this.canvas.style.width  = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width  = Math.round(w  * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.scale(this.dpr, this.dpr);

    this.W = w;
    this.H = h;
    this.cx = w / 2;
    this.cy = h / 2;

    // Re-calc zone centers (quadrants, slightly inset)
    const qx = this.cx * 0.62;
    const qy = this.cy * 0.60;
    this.zoneCenters = {
      V:  { x: this.cx - qx, y: this.cy - qy },  // top-left    (Vermelho)
      A:  { x: this.cx + qx, y: this.cy - qy },  // top-right   (Amarelo)
      Ve: { x: this.cx + qx, y: this.cy + qy },  // bottom-right(Verde)
      Az: { x: this.cx - qx, y: this.cy + qy }   // bottom-left (Azul)
    };

    // Reposition main node to center
    if (this.mainNode) {
      this.mainNode.x = this.cx;
      this.mainNode.y = this.cy;
    }
  }

  // ── Node Management ───────────────────────────────────────

  setMainUser(user) {
    this.mainNode = {
      id:    user.id,
      name:  user.name,
      color: user.color,
      x:     this.cx,
      y:     this.cy,
      vx:    0,
      vy:    0,
      r:     26,
      isMain: true
    };
    if (!this.animId) this._startLoop();
  }

  addPerson(person) {
    const zone = this.zoneCenters[person.color] || { x: this.cx, y: this.cy };
    const angle = Math.random() * Math.PI * 2;
    const dist  = 60 + Math.random() * 40;
    this.nodes.push({
      id:    person.id,
      name:  person.name,
      color: person.color,
      x:     zone.x + Math.cos(angle) * dist,
      y:     zone.y + Math.sin(angle) * dist,
      vx:    (Math.random() - 0.5) * 1,
      vy:    (Math.random() - 0.5) * 1,
      r:     18,
      isMain: false
    });
    if (!this.animId) this._startLoop();
  }

  loadAll(mainUser, persons) {
    this.nodes = [];
    this.mainNode = null;
    if (mainUser) this.setMainUser(mainUser);
    persons.forEach(p => this.addPerson(p));
  }

  removePerson(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
  }

  // ── Physics ───────────────────────────────────────────────

  _physics() {
    const allNodes = this.mainNode ? [this.mainNode, ...this.nodes] : this.nodes;

    for (let i = 0; i < allNodes.length; i++) {
      const n = allNodes[i];
      if (n.isMain) continue;

      // Zone gravity
      const zone = this.zoneCenters[n.color];
      if (zone) {
        n.vx += (zone.x - n.x) * this.zoneForce;
        n.vy += (zone.y - n.y) * this.zoneForce;
      }

      // Node-node repulsion
      for (let j = 0; j < allNodes.length; j++) {
        if (i === j) continue;
        const other = allNodes[j];
        const dx = n.x - other.x;
        const dy = n.y - other.y;
        const d2 = dx * dx + dy * dy + 1;
        const d  = Math.sqrt(d2);
        if (d < this.minDist * 2) {
          const force = this.repulsion / d2;
          n.vx += (dx / d) * force;
          n.vy += (dy / d) * force;
        }
      }

      // Damping
      n.vx *= this.damping;
      n.vy *= this.damping;

      // Speed cap
      const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (speed > 4) { n.vx = (n.vx / speed) * 4; n.vy = (n.vy / speed) * 4; }

      // Integrate
      n.x += n.vx;
      n.y += n.vy;

      // Boundary (keep away from edges, allow zone corners)
      const pad = n.r + 16;
      n.x = Math.max(pad, Math.min(this.W - pad, n.x));
      n.y = Math.max(pad, Math.min(this.H - pad, n.y));
    }

    // Main node: strong spring to center
    if (this.mainNode) {
      this.mainNode.x += (this.cx - this.mainNode.x) * this.centerForce * 2;
      this.mainNode.y += (this.cy - this.mainNode.y) * this.centerForce * 2;
      this.mainNode.vx = 0;
      this.mainNode.vy = 0;
    }
  }

  // ── Rendering ─────────────────────────────────────────────

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    // Background quadrants
    this._drawQuadrants(ctx);

    if (!this.mainNode) return;

    // Draw edges (connections from main to each person)
    this.nodes.forEach(n => this._drawEdge(ctx, this.mainNode, n));

    // Draw nodes
    this.nodes.forEach(n => this._drawNode(ctx, n));

    // Draw main node on top
    this._drawNode(ctx, this.mainNode);

    // Axis labels
    this._drawAxisLabels(ctx);
  }

  _drawQuadrants(ctx) {
    const { cx, cy, W, H } = this;
    const regions = [
      { x: 0,  y: 0,  w: cx, h: cy, color: PERSONALITIES.V.colorRgb  },  // top-left  = Vermelho
      { x: cx, y: 0,  w: cx, h: cy, color: PERSONALITIES.A.colorRgb  },  // top-right = Amarelo
      { x: cx, y: cy, w: cx, h: cy, color: PERSONALITIES.Ve.colorRgb },  // bot-right = Verde
      { x: 0,  y: cy, w: cx, h: cy, color: PERSONALITIES.Az.colorRgb }   // bot-left  = Azul
    ];

    regions.forEach(r => {
      ctx.fillStyle = `rgba(${r.color}, 0.04)`;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });

    // Dividing lines
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

    // Zone name labels (corner)
    const labels = [
      { text: 'VERMELHO', x: 12, y: 18, color: PERSONALITIES.V.color, anchor: 'left' },
      { text: 'AMARELO',  x: W-12, y: 18, color: PERSONALITIES.A.color,  anchor: 'right' },
      { text: 'VERDE',    x: W-12, y: H-10, color: PERSONALITIES.Ve.color, anchor: 'right' },
      { text: 'AZUL',     x: 12, y: H-10, color: PERSONALITIES.Az.color, anchor: 'left' }
    ];
    ctx.save();
    ctx.font = `700 9px -apple-system, sans-serif`;
    labels.forEach(l => {
      ctx.fillStyle = l.color + '80';
      ctx.textAlign = l.anchor === 'left' ? 'left' : 'right';
      ctx.fillText(l.text, l.x, l.y);
    });
    ctx.restore();
  }

  _drawEdge(ctx, from, to) {
    const colorData = PERSONALITIES[to.color];
    const color = colorData ? colorData.color : '#ffffff';
    const isHovered = this.hoveredNode === to;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = isHovered
      ? color + 'CC'
      : color + '40';
    ctx.lineWidth = isHovered ? 2 : 1;
    ctx.setLineDash(isHovered ? [] : [5, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  _drawNode(ctx, node) {
    const colorData = PERSONALITIES[node.color];
    const color     = colorData ? colorData.color : '#ffffff';
    const colorRgb  = colorData ? colorData.colorRgb : '255,255,255';
    const isHovered  = this.hoveredNode === node;
    const isSelected = this.selectedNode === node;
    const r = node.r + (isHovered ? 4 : 0);

    ctx.save();

    // Glow
    if (isHovered || isSelected || node.isMain) {
      const glow = ctx.createRadialGradient(node.x, node.y, r * 0.3, node.x, node.y, r * 2.5);
      glow.addColorStop(0, `rgba(${colorRgb}, 0.25)`);
      glow.addColorStop(1, `rgba(${colorRgb}, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Circle fill
    const grad = ctx.createRadialGradient(node.x - r*0.3, node.y - r*0.3, 0, node.x, node.y, r);
    grad.addColorStop(0, color + 'FF');
    grad.addColorStop(1, color + 'CC');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = node.isMain ? 'rgba(255,255,255,0.8)' : color + 'BB';
    ctx.lineWidth = node.isMain ? 2.5 : (isHovered ? 2 : 1.5);
    ctx.stroke();

    // Label (initials or emoji)
    ctx.fillStyle = '#ffffff';
    ctx.font = `${node.isMain ? '700' : '600'} ${node.isMain ? 13 : 11}px -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = node.name.split(' ').slice(0,2).map(s => s[0]).join('').toUpperCase();
    ctx.fillText(initials, node.x, node.y);

    // Name below node
    ctx.fillStyle = isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)';
    ctx.font = `${isHovered ? '600' : '400'} 10px -apple-system, sans-serif`;
    ctx.fillText(node.name.split(' ')[0], node.x, node.y + r + 12);

    ctx.restore();
  }

  _drawAxisLabels(ctx) {
    ctx.save();
    ctx.font = '600 8.5px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.textAlign = 'center';
    // Top: RÁPIDO
    ctx.fillText('▲ RÁPIDO', this.cx, 14);
    // Bottom: LENTO
    ctx.fillText('▼ LENTO', this.cx, this.H - 4);
    // Left: TAREFA
    ctx.save();
    ctx.translate(10, this.cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('TAREFA ◄', 0, 0);
    ctx.restore();
    // Right: PESSOAS
    ctx.save();
    ctx.translate(this.W - 10, this.cy);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('PESSOAS ►', 0, 0);
    ctx.restore();
    ctx.restore();
  }

  // ── Animation Loop ─────────────────────────────────────────

  _startLoop() {
    const loop = () => {
      this._physics();
      this._draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stopLoop() {
    if (this.animId) { cancelAnimationFrame(this.animId); this.animId = null; }
  }

  // ── Events ─────────────────────────────────────────────────

  _bindEvents() {
    this.canvas.addEventListener('mousemove', e => this._onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
    this.canvas.addEventListener('click', e => this._onClick(e));
  }

  _getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left),
      y: (e.clientY - rect.top)
    };
  }

  _findNodeAt(pos) {
    const allNodes = this.mainNode ? [this.mainNode, ...this.nodes] : this.nodes;
    for (let i = allNodes.length - 1; i >= 0; i--) {
      const n = allNodes[i];
      const dx = pos.x - n.x;
      const dy = pos.y - n.y;
      if (Math.sqrt(dx*dx + dy*dy) <= n.r + 8) return n;
    }
    return null;
  }

  _onMouseMove(e) {
    const pos  = this._getCanvasPos(e);
    const node = this._findNodeAt(pos);

    this.hoveredNode = node;
    this.canvas.style.cursor = node ? 'pointer' : 'default';

    if (node && this.tooltip) {
      const color = PERSONALITIES[node.color];
      this.tooltip.innerHTML = `
        <div class="tooltip-name">${node.name}</div>
        <div class="tooltip-type" style="color:${color?.color || '#fff'}">${color?.icon || ''} ${color?.name || node.color}</div>
        ${node.isMain ? '<div class="tooltip-type" style="margin-top:4px">✦ Você</div>' : ''}
      `;
      this.tooltip.style.left = (e.clientX + 14) + 'px';
      this.tooltip.style.top  = (e.clientY - 8)  + 'px';
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
}
