// ============================================================
//  PERSONA — Network Visualization (Canvas)
//  v6 — layout em grade determinístico, sem física
// ============================================================

class PersonaNetwork {
  constructor(canvas) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.nodes    = [];
    this.mainNode = null;
    this.tooltip  = document.getElementById('network-tooltip');
    this.hoveredNode  = null;
    this.selectedNode = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvasW = 0; this.canvasH = 0;
    this.W = 0; this.H = 0;
    this.cx = 0; this.cy = 0;

    this.zoom = 1; this.panX = 0; this.panY = 0;
    this.baseZoom = 1;

    this._pinchDist0  = null; this._pinchZoom0 = 1;
    this._pinchCenter = null; this._dragStart  = null;
    this._isDragging  = false;

    this._bindEvents();
    this._resize();
    window.addEventListener('resize', () => { this._resize(); this._layout(); this._draw(); });
  }

  // ── Dimensoes ─────────────────────────────────────────────
  _fixedHeight(w) {
    return Math.max(360, Math.min(Math.round(w * 0.85), 520));
  }

  // Mundo virtual: apenas para zoom de qualidade (nao para fisica)
  _worldScale() {
    const n = this.nodes.length;
    if (n <= 10) return 1.0;
    if (n <= 20) return 1.5;
    return 2.0;
  }

  _quadrantBounds(color) {
    const { cx, cy, W, H } = this;
    const e = 16;
    switch (color) {
      case 'V':  return { left: e,  right: cx,   top: e,  bottom: cy   };
      case 'A':  return { left: cx, right: W-e,  top: e,  bottom: cy   };
      case 'Ve': return { left: cx, right: W-e,  top: cy, bottom: H-e  };
      case 'Az': return { left: e,  right: cx,   top: cy, bottom: H-e  };
      default:   return null;
    }
  }

  // Raio calculado pela celula da grade do quadrante mais cheio
  _nodeRadius() {
    if (!this.nodes.length) return 18;
    const counts = { V: 0, A: 0, Ve: 0, Az: 0 };
    this.nodes.forEach(n => { if (n.color in counts) counts[n.color]++; });
    const maxInQ = Math.max(...Object.values(counts), 1);
    const cols = Math.ceil(Math.sqrt(maxInQ));
    const rows = Math.ceil(maxInQ / cols);
    const cellW = (this.W / 2) / cols;
    const cellH = (this.H / 2) / rows;
    return Math.max(8, Math.min(28, Math.round(Math.min(cellW, cellH) * 0.40)));
  }

  // ── Layout em grade — posiciona todos os nos ──────────────
  _layout() {
    const r = this._nodeRadius();
    this.nodes.forEach(n => { n.r = r; });

    for (const color of ['V', 'A', 'Ve', 'Az']) {
      const group = this.nodes.filter(n => n.color === color);
      if (!group.length) continue;

      const b = this._quadrantBounds(color);
      if (!b) continue;

      const count = group.length;
      const cols  = Math.ceil(Math.sqrt(count));
      const rows  = Math.ceil(count / cols);
      const pad   = r + 10;
      const innerW = b.right  - b.left - pad * 2;
      const innerH = b.bottom - b.top  - pad * 2;
      const stepX  = cols > 1 ? innerW / (cols - 1) : 0;
      const stepY  = rows > 1 ? innerH / (rows - 1) : 0;

      group.forEach((node, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);

        // Centraliza a ultima linha se incompleta
        const itemsInRow  = (row === rows - 1) ? count - row * cols : cols;
        const rowOffsetX  = (cols - itemsInRow) * (cols > 1 ? stepX : 0) / 2;

        node.x = b.left + pad + col * stepX + rowOffsetX;
        node.y = b.top  + pad + row * stepY;
        node.vx = 0; node.vy = 0;
      });
    }
  }

  // ── Gerenciamento de nos ──────────────────────────────────
  _resize() {
    const wrap = this.canvas.parentElement;
    const cw   = wrap.clientWidth || 360;
    const ch   = this._fixedHeight(cw);

    this.canvas.style.width  = cw + 'px';
    this.canvas.style.height = ch + 'px';
    wrap.style.height = ch + 'px';
    this.canvas.width  = Math.round(cw * this.dpr);
    this.canvas.height = Math.round(ch * this.dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    this.canvasW = cw; this.canvasH = ch;
    const ws = this._worldScale();
    this.W = cw * ws; this.H = ch * ws;
    this.cx = this.W / 2; this.cy = this.H / 2;
    this.baseZoom = 1 / ws;

    // Se ja ha dados, relayoutar e redesenhar
    if (this.mainNode) {
      this.mainNode.x = this.cx;
      this.mainNode.y = this.cy;
      this._layout();
      this._draw();
    }
  }

  setMainUser(user) {
    this.mainNode = {
      id: user.id, name: user.name, color: user.color,
      x: this.cx, y: this.cy, vx: 0, vy: 0, r: 26, isMain: true
    };
    this._draw();
  }

  addPerson(person) {
    this.nodes.push({
      id: person.id, name: person.name, color: person.color,
      x: 0, y: 0, vx: 0, vy: 0, r: 18, isMain: false
    });
    this._resize();
    this._layout();
    this._draw();
  }

  loadAll(mainUser, persons) {
    this.nodes = []; this.mainNode = null;
    if (mainUser) {
      this.mainNode = {
        id: mainUser.id, name: mainUser.name, color: mainUser.color,
        x: 0, y: 0, vx: 0, vy: 0, r: 26, isMain: true
      };
    }
    persons.forEach(p => {
      this.nodes.push({
        id: p.id, name: p.name, color: p.color,
        x: 0, y: 0, vx: 0, vy: 0, r: 18, isMain: false
      });
    });
    // rAF garante que o DOM ja tem dimensoes reais antes de renderizar
    const render = () => {
      this._resize();
      if (this.mainNode) { this.mainNode.x = this.cx; this.mainNode.y = this.cy; }
      this._layout();
      this._draw();
    };
    requestAnimationFrame(render);
  }

  removePerson(id) {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this._resize();
    this._layout();
    this._draw();
  }

  // ── Renderizacao ──────────────────────────────────────────
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
      { x: 0,  y: 0,  w: cx,   h: cy,   c: PERSONALITIES.V.colorRgb  },
      { x: cx, y: 0,  w: W-cx, h: cy,   c: PERSONALITIES.A.colorRgb  },
      { x: cx, y: cy, w: W-cx, h: H-cy, c: PERSONALITIES.Ve.colorRgb },
      { x: 0,  y: cy, w: cx,   h: H-cy, c: PERSONALITIES.Az.colorRgb }
    ].forEach(q => {
      ctx.fillStyle = `rgba(${q.c},0.045)`;
      ctx.fillRect(q.x, q.y, q.w, q.h);
    });

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1; ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();

    const labels = [
      { t: 'VERMELHO', x: 10,   y: 20,   c: PERSONALITIES.V.color,  a: 'left'  },
      { t: 'AMARELO',  x: W-10, y: 20,   c: PERSONALITIES.A.color,  a: 'right' },
      { t: 'VERDE',    x: W-10, y: H-10, c: PERSONALITIES.Ve.color, a: 'right' },
      { t: 'AZUL',     x: 10,   y: H-10, c: PERSONALITIES.Az.color, a: 'left'  }
    ];
    ctx.save();
    ctx.font = '700 11px -apple-system,sans-serif';
    labels.forEach(l => {
      ctx.fillStyle = l.c + '70'; ctx.textAlign = l.a;
      ctx.fillText(l.t, l.x, l.y);
    });
    ctx.restore();
  }

  _drawEdge(ctx, from, to) {
    const pd  = PERSONALITIES[to.color];
    const col = pd ? pd.color : '#fff';
    const hov = this.hoveredNode === to;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = hov ? col + 'CC' : col + '38';
    ctx.lineWidth   = hov ? 2 : 1;
    ctx.setLineDash(hov ? [] : [5, 9]);
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }

  _drawNode(ctx, node) {
    const pd  = PERSONALITIES[node.color];
    const col = pd ? pd.color    : '#fff';
    const rgb = pd ? pd.colorRgb : '255,255,255';
    const hov = this.hoveredNode  === node;
    const sel = this.selectedNode === node;
    const r   = node.r + (hov ? 3 : 0);
    ctx.save();

    if (hov || sel || node.isMain) {
      const g = ctx.createRadialGradient(node.x, node.y, r * 0.3, node.x, node.y, r * 2.4);
      g.addColorStop(0, `rgba(${rgb},0.22)`); g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(node.x, node.y, r * 2.4, 0, Math.PI * 2); ctx.fill();
    }

    const gr = ctx.createRadialGradient(node.x - r * 0.3, node.y - r * 0.3, 0, node.x, node.y, r);
    gr.addColorStop(0, col + 'FF'); gr.addColorStop(1, col + 'BB');
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = node.isMain ? 'rgba(255,255,255,0.85)' : col + 'AA';
    ctx.lineWidth   = node.isMain ? 2.5 : (hov ? 2 : 1.5);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `${node.isMain ? '700' : '600'} ${node.isMain ? 14 : 12}px -apple-system,sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(
      node.name.split(' ').slice(0, 2).map(s => s[0] || '').join('').toUpperCase(),
      node.x, node.y
    );

    const fn = node.name.split(' ')[0];
    ctx.fillStyle = hov ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)';
    ctx.font = `${hov ? '600' : '400'} 11px -apple-system,sans-serif`;
    ctx.fillText(fn.length > 8 ? fn.slice(0, 8) + '...' : fn, node.x, node.y + r + 13);
    ctx.restore();
  }

  _drawAxisLabels(ctx) {
    if (this.W < 320) return;
    ctx.save();
    ctx.font = '600 9px -apple-system,sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.textAlign = 'center';
    ctx.fillText('RAPIDO', this.cx, 16);
    ctx.fillText('LENTO',  this.cx, this.H - 6);
    ctx.save(); ctx.translate(11, this.cy);       ctx.rotate(-Math.PI / 2); ctx.fillText('TAREFA',  0, 0); ctx.restore();
    ctx.save(); ctx.translate(this.W - 11, this.cy); ctx.rotate(Math.PI / 2);  ctx.fillText('PESSOAS', 0, 0); ctx.restore();
    ctx.restore();
  }

  // Compatibilidade com chamadas do app.js
  stopLoop() { /* sem loop */ }
  onTabVisible(v) {
    if (v) {
      // Aba ficou visivel: re-renderizar com dimensoes reais
      requestAnimationFrame(() => {
        this._resize(); // _resize ja chama _layout e _draw internamente
      });
    }
  }

  // ── Interacao ─────────────────────────────────────────────
  _bindEvents() {
    this.canvas.addEventListener('mousemove',  e => this._onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
    this.canvas.addEventListener('click',      e => this._onClick(e));
    this.canvas.addEventListener('wheel', e => {
      e.preventDefault();
      this._applyZoom(e.deltaY < 0 ? 1.12 : 0.89, this._getCanvasPos(e));
      this._draw();
    }, { passive: false });
    this.canvas.addEventListener('touchstart', e => this._onTouchStart(e), { passive: true  });
    this.canvas.addEventListener('touchmove',  e => this._onTouchMove(e),  { passive: false });
    this.canvas.addEventListener('touchend',   e => this._onTouchEnd(e),   { passive: true  });
  }

  _getCanvasPos(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  _screenToWorld(sx, sy) {
    const s = this._totalScale();
    return { x: (sx - this.panX) / s, y: (sy - this.panY) / s };
  }

  _findNodeAt(sp) {
    const p   = this._screenToWorld(sp.x, sp.y);
    const all = this.mainNode ? [this.mainNode, ...this.nodes] : this.nodes;
    for (let i = all.length - 1; i >= 0; i--) {
      const n  = all[i];
      const dx = p.x - n.x, dy = p.y - n.y;
      if (Math.sqrt(dx * dx + dy * dy) <= n.r + 8) return n;
    }
    return null;
  }

  _applyZoom(factor, pos) {
    const { x: cx, y: cy } = pos;
    const newZ = Math.max(0.4, Math.min(6, this.zoom * factor));
    const cs   = this._totalScale();
    const ns   = this.baseZoom * newZ;
    this.panX  = cx - (cx - this.panX) * (ns / cs);
    this.panY  = cy - (cy - this.panY) * (ns / cs);
    this.zoom  = newZ;
  }

  _onMouseMove(e) {
    const pos  = this._getCanvasPos(e);
    const node = this._findNodeAt(pos);
    const ch   = this.hoveredNode !== node;
    this.hoveredNode = node;
    this.canvas.style.cursor = node ? 'pointer' : 'default';
    if (node && this.tooltip) {
      const pd = PERSONALITIES[node.color];
      this.tooltip.innerHTML = `<div class="tooltip-name">${node.name}</div><div class="tooltip-type" style="color:${pd?.color||'#fff'}">${pd?.icon||''} ${pd?.name||node.color}</div>`;
      this.tooltip.style.left = Math.min(e.clientX + 14, window.innerWidth - 220) + 'px';
      this.tooltip.style.top  = Math.max(e.clientY - 8, 8) + 'px';
      this.tooltip.classList.add('visible');
    } else if (this.tooltip) {
      this.tooltip.classList.remove('visible');
    }
    if (ch) this._draw();
  }

  _onMouseLeave() {
    this.hoveredNode = null;
    this.canvas.style.cursor = 'default';
    if (this.tooltip) this.tooltip.classList.remove('visible');
    this._draw();
  }

  _onClick(e) {
    const node = this._findNodeAt(this._getCanvasPos(e));
    this.selectedNode = node;
    this._draw();
    if (node && typeof window.onNetworkNodeClick === 'function') window.onNetworkNodeClick(node);
  }

  _onTouchStart(e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this._pinchDist0 = Math.sqrt(dx * dx + dy * dy);
      this._pinchZoom0 = this.zoom;
      const rect = this.canvas.getBoundingClientRect();
      this._pinchCenter = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top
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
      const nz = Math.max(0.4, Math.min(6, this._pinchZoom0 * Math.sqrt(dx * dx + dy * dy) / this._pinchDist0));
      const { x: cx, y: cy } = this._pinchCenter;
      const cs = this._totalScale(), ns = this.baseZoom * nz;
      this.panX = cx - (cx - this.panX) * (ns / cs);
      this.panY = cy - (cy - this.panY) * (ns / cs);
      this.zoom = nz;
      this._draw();
    } else if (e.touches.length === 1 && this._dragStart) {
      const nx = e.touches[0].clientX - this._dragStart.x;
      const ny = e.touches[0].clientY - this._dragStart.y;
      if (!this._isDragging && Math.abs(nx - this.panX) + Math.abs(ny - this.panY) > 6) this._isDragging = true;
      if (this._isDragging) { this.panX = nx; this.panY = ny; this._draw(); }
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
