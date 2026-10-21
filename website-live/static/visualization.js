// Point Cloud Visualization Engine for [Retail] Northwind Retail Knowledge Catalog Demo

const COLORS = {
  basic: '#58a6ff', scaled: '#f85149', kc: '#3fb950',
  bronze: '#ff9f43', silver: '#a5b4fc', gold: '#ffd33d',
  ref: '#8b949e', snowflake: '#00e5ff',
  bg: '#0d1117', metadata: 'rgba(63,185,80,0.22)',
  lineage: 'rgba(230,237,243,0.45)', glossaryArc: 'rgba(63,185,80,0.75)',
};

const NEXUS_TARGETS = {
  nexus_competitor_prices: ['gold_assortment_performance', 'gold_markdown_risk_var', 'gold_gross_margin_analysis'],
  nexus_category_market_share: ['gold_assortment_performance', 'gold_gross_margin_analysis', 'gold_category_manager_scorecard'],
  nexus_consumer_panel: ['gold_customer_360', 'gold_vip_member_revenue'],
  nexus_regional_demand_index: ['gold_store_performance', 'gold_inventory_allocation'],
  nexus_promo_calendar_benchmark: ['gold_promo_margin_impact', 'gold_markdown_risk_var'],
  nexus_basket_affinity: ['gold_assortment_performance', 'gold_loyalty_account_summary'],
};

let TABLES = { bronze: [], silver: [], gold: [], ref: [] };
let BASIC_TABLES = [];
let GOLD_SOURCES = {};
let GLOSSARY_LINKS = {};

class PointCloud {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.nodeMap = {};
    this.agentMode = 'basic';
    this.activeNodes = [];
    this.animationState = null;
    this.animationTime = 0;
    this.hoveredNode = null;
    this.metadataLines = [];
    this.activeLineage = [];
    this.activeGlossaryArcs = [];
    this._searchPulseRadius = 0;
    this._searchPulseAlpha = 0;
    this._pulseStartTime = 0;
    this.zoom = 1; this.targetZoom = 1;
    this.panX = 0; this.panY = 0;
    this.targetPanX = 0; this.targetPanY = 0;
    this._zoomedIn = false;
    this._termLabelPositions = [];
    this.onNodeClick = null;
    this.onTermClick = null;
    this.resize();
    this._buildNodes();
    this._setupMouse();
    this._animate();
  }

  configure(config) {
    TABLES = config.tables || { bronze: [], silver: [], gold: [], ref: [] };
    BASIC_TABLES = config.basic_tables || [];
    GOLD_SOURCES = config.gold_sources || {};
    GLOSSARY_LINKS = config.glossary_links || {};
    this.nodes = [];
    this.nodeMap = {};
    this.activeNodes = [];
    this.animationState = null;
    this.metadataLines = [];
    this.activeLineage = [];
    this.activeGlossaryArcs = [];
    this._buildNodes();
  }

  setSnowflakeTables(tableNames) {
    if (!tableNames || tableNames.length === 0) return;
    TABLES.snowflake = tableNames;
    this.nodes = this.nodes.filter(n => n.layer !== 'snowflake');
    for (const name of tableNames) {
      const node = {
        id: this.nodes.length, name, layer: 'snowflake',
        x: 0, y: 0, baseX: 0, baseY: 0,
        radius: 5,
        color: COLORS.snowflake,
        alpha: 0.9, glow: 0, label: '', labelAlpha: 0,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: (0.0002 + Math.random() * 0.0003) * (Math.random() > 0.5 ? 1 : -1),
        jitterX: 0, jitterY: 0,
      };
      this.nodes.push(node);
      this.nodeMap[name] = node;
    }
    this._positionNodes();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.w = rect.width;
    this.h = rect.height;
    this.cx = this.w / 2;
    this.cy = this.h / 2;
    if (this.nodes.length) this._positionNodes();
  }

  _buildNodes() {
    let id = 0;
    for (const [layer, tables] of Object.entries(TABLES)) {
      for (const name of tables) {
        const node = {
          id: id++, name, layer,
          x: 0, y: 0, baseX: 0, baseY: 0,
          radius: layer === 'gold' ? 4 : layer === 'ref' ? 2 : 3,
          color: COLORS[layer],
          alpha: 1, glow: 0, label: '', labelAlpha: 0,
          orbitAngle: Math.random() * Math.PI * 2,
          orbitSpeed: (0.0002 + Math.random() * 0.0003) * (Math.random() > 0.5 ? 1 : -1),
          jitterX: 0, jitterY: 0,
        };
        this.nodes.push(node);
        this.nodeMap[name] = node;
      }
    }
    this._positionNodes();
  }

  _positionNodes() {
    const maxR = Math.min(this.cx, this.cy) * 0.85;
    for (const node of this.nodes) {
      if (node.layer === 'snowflake') this._positionSnowflake(node, maxR);
      else if (this.agentMode === 'basic') this._positionBasic(node, maxR);
      else if (this.agentMode === 'scaled') this._positionScaled(node, maxR);
      else this._positionKC(node, maxR);
    }
  }

  _positionBasic(node, maxR) {
    const isBasic = BASIC_TABLES.includes(node.name);
    if (isBasic) {
      const idx = BASIC_TABLES.indexOf(node.name);
      const angle = (idx / BASIC_TABLES.length) * Math.PI * 2 - Math.PI / 2;
      node.baseX = this.cx + Math.cos(angle) * maxR * 0.25;
      node.baseY = this.cy + Math.sin(angle) * maxR * 0.25;
      node.alpha = 1; node.radius = 6;
    } else {
      node.baseX = this.cx + Math.cos(node.orbitAngle) * maxR * (0.7 + Math.random() * 0.3);
      node.baseY = this.cy + Math.sin(node.orbitAngle) * maxR * (0.7 + Math.random() * 0.3);
      node.alpha = 0.18; node.radius = 1.5;
    }
  }

  _positionScaled(node, maxR) {
    const r = maxR * (0.15 + Math.random() * 0.8);
    node.baseX = this.cx + Math.cos(node.orbitAngle) * r;
    node.baseY = this.cy + Math.sin(node.orbitAngle) * r;
    node.alpha = 0.5 + Math.random() * 0.3;
    node.radius = node.layer === 'gold' ? 3.5 : node.layer === 'ref' ? 2 : 3;
  }

  _positionKC(node, maxR) {
    const rings = { bronze: 0.75, silver: 0.55, gold: 0.3, ref: 0.9 };
    const ringR = maxR * (rings[node.layer] || 0.7);
    const tables = TABLES[node.layer];
    const idx = tables.indexOf(node.name);
    const angle = (idx / tables.length) * Math.PI * 2 + (node.layer === 'silver' ? 0.1 : 0);
    node.baseX = this.cx + Math.cos(angle) * ringR;
    node.baseY = this.cy + Math.sin(angle) * ringR;
    node.alpha = node.layer === 'ref' ? 0.3 : 0.7;
    node.radius = node.layer === 'gold' ? 4.5 : node.layer === 'ref' ? 2 : 3;
  }

  _positionSnowflake(node, maxR) {
    const tables = TABLES.snowflake || [];
    const idx = tables.indexOf(node.name);
    const count = tables.length || 1;
    const clusterCx = this.cx + maxR * 0.72;
    const clusterCy = this.cy + maxR * 0.65;
    const clusterR = Math.min(54, maxR * 0.23);
    const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
    node.baseX = clusterCx + Math.cos(angle) * clusterR;
    node.baseY = clusterCy + Math.sin(angle) * clusterR;
    if (this.agentMode !== 'kc') {
      node.alpha = 0;
      node.glow = 0;
      node.radius = 0;
      return;
    }
    node.alpha = 0.92;
    node.radius = 5.5;
  }

  setMode(mode) {
    this.agentMode = mode;
    this.activeNodes = [];
    this.animationState = null;
    this.metadataLines = [];
    this.activeLineage = [];
    this.activeGlossaryArcs = [];
    this._searchPulseRadius = 0;
    this._searchPulseAlpha = 0;
    this._resetZoom();
    for (const n of this.nodes) { n.glow = 0; n.labelAlpha = 0; n.label = ''; }
    this._positionNodes();
  }

  triggerQuery(tablesUsed, toolCalls, metadataCited, lineagePath, glossaryTermsCited) {
    this.activeNodes = [];
    this.metadataLines = [];
    this.activeLineage = [];
    this.activeGlossaryArcs = [];
    for (const n of this.nodes) { n.glow = 0; n.labelAlpha = 0; n.label = ''; }

    const used = new Set(tablesUsed || []);
    this.activeNodes = this.nodes.filter(n => used.has(n.name) && (this.agentMode === 'kc' || n.layer !== 'snowflake'));

    if (metadataCited) {
      for (let i = 0; i < this.activeNodes.length && i < metadataCited.length; i++) {
        this.activeNodes[i].label = metadataCited[i];
      }
    }

    this.animationState = this.agentMode;
    this.animationTime = 0;

    // Build lineage lines for active tables
    if (this.agentMode === 'kc' && tablesUsed) {
      this._buildLineageForTables(tablesUsed, lineagePath);
    }

    // Build glossary arcs for cited terms
    if (this.agentMode === 'kc' && glossaryTermsCited) {
      this._buildGlossaryArcs(glossaryTermsCited);
    }
  }

  _buildLineageForTables(tablesUsed, lineagePath) {
    const allLineage = [];
    const defaultAlpha = this.animationState ? 0 : 0.65;
    const usedSet = new Set(tablesUsed || []);
    const hasActiveGold = (tablesUsed || []).some(t => t.startsWith('gold_'));

    if (lineagePath && lineagePath.length > 1) {
      for (let i = 0; i < lineagePath.length - 1; i++) {
        const src = this.nodeMap[lineagePath[i]];
        const tgt = this.nodeMap[lineagePath[i + 1]];
        if (src && tgt) allLineage.push({ src, tgt, alpha: defaultAlpha });
      }
    }

    for (const tbl of tablesUsed) {
      // Gold → silver source links
      if (tbl.startsWith('gold_') && GOLD_SOURCES[tbl]) {
        for (const silverTbl of GOLD_SOURCES[tbl]) {
          const src = this.nodeMap[silverTbl];
          const tgt = this.nodeMap[tbl];
          if (src && tgt) allLineage.push({ src, tgt, alpha: defaultAlpha });

          // Silver → bronze (same base name)
          const baseName = silverTbl.replace('silver_', '');
          const bronzeTbl = 'bronze_' + baseName;
          const bSrc = this.nodeMap[bronzeTbl];
          if (bSrc && src) allLineage.push({ src: bSrc, tgt: src, alpha: defaultAlpha });
        }
      }
      // Silver → bronze direct
      if (tbl.startsWith('silver_')) {
        const bronzeTbl = tbl.replace('silver_', 'bronze_');
        const src = this.nodeMap[bronzeTbl];
        const tgt = this.nodeMap[tbl];
        if (src && tgt) allLineage.push({ src, tgt, alpha: defaultAlpha });
      }
      // NEXUS Snowflake → Gold registered cross-cloud lineage ONLY (max 14 links total)
      if (tbl.startsWith('nexus_') && NEXUS_TARGETS[tbl]) {
        const src = this.nodeMap[tbl];
        const activeTargets = NEXUS_TARGETS[tbl].filter(g => usedSet.has(g));
        const targetsToDraw = (hasActiveGold && activeTargets.length > 0)
          ? activeTargets
          : NEXUS_TARGETS[tbl];
        for (const goldTbl of targetsToDraw) {
          const tgt = this.nodeMap[goldTbl];
          if (src && tgt) allLineage.push({ src, tgt, alpha: defaultAlpha, crossCloud: true });
        }
      }
    }

    // Deduplicate
    const seen = new Set();
    this.activeLineage = allLineage.filter(l => {
      const key = l.src.name + '->' + l.tgt.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  _buildGlossaryArcs(termsCited) {
    this.activeGlossaryArcs = [];
    for (const term of termsCited) {
      const tables = GLOSSARY_LINKS[term];
      if (!tables || tables.length < 2) continue;
      const nodes = tables.map(t => this.nodeMap[t]).filter(Boolean);
      if (nodes.length < 2) continue;
      for (let i = 0; i < nodes.length - 1; i++) {
        this.activeGlossaryArcs.push({
          a: nodes[i], b: nodes[i + 1],
          term, alpha: 0, labelAlpha: 0,
        });
      }
    }
  }

  _screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.cx) / this.zoom + this.cx - this.panX,
      y: (screenY - this.cy) / this.zoom + this.cy - this.panY,
    };
  }

  _worldToScreen(wx, wy) {
    return {
      x: this.cx + (wx - this.cx + this.panX) * this.zoom,
      y: this.cy + (wy - this.cy + this.panY) * this.zoom,
    };
  }

  _hitTest(screenX, screenY) {
    const { x: mx, y: my } = this._screenToWorld(screenX, screenY);
    for (const n of this.nodes) {
      if (n.layer === 'snowflake' && this.agentMode !== 'kc') continue;
      if (n.alpha < 0.15) continue;
      const dx = n.x - mx, dy = n.y - my;
      if (dx * dx + dy * dy < 100) return n;
    }
    return null;
  }

  _setupMouse() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.hoveredNode = this._hitTest(e.clientX - rect.left, e.clientY - rect.top);
      this.canvas.style.cursor = this.hoveredNode ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left, screenY = e.clientY - rect.top;
      const { x: wx, y: wy } = this._screenToWorld(screenX, screenY);

      for (const tl of this._termLabelPositions) {
        if (Math.abs(wx - tl.x) < tl.hw && Math.abs(wy - tl.y) < tl.hh) {
          if (this.onTermClick) {
            const sp = this._worldToScreen(tl.x, tl.y);
            this.onTermClick(tl.term, sp.x + rect.left, sp.y + rect.top);
          }
          return;
        }
      }

      const node = this._hitTest(screenX, screenY);
      if (node && this.onNodeClick) {
        const sp = this._worldToScreen(node.x, node.y);
        this.onNodeClick(node.name, sp.x + rect.left, sp.y + rect.top);
      }
    });
  }

  _animate() {
    this.animationTime += 16;
    const t = this.animationTime;

    for (const n of this.nodes) {
      n.orbitAngle += n.orbitSpeed;
      n.jitterX = Math.sin(t * 0.001 + n.id) * 1.5;
      n.jitterY = Math.cos(t * 0.0012 + n.id * 1.3) * 1.5;
      n.x += (n.baseX + n.jitterX - n.x) * 0.03;
      n.y += (n.baseY + n.jitterY - n.y) * 0.03;
    }

    this.zoom += (this.targetZoom - this.zoom) * 0.04;
    this.panX += (this.targetPanX - this.panX) * 0.04;
    this.panY += (this.targetPanY - this.panY) * 0.04;

    if (this._searchPulseAlpha > 0) {
      const pulseElapsed = t - this._pulseStartTime;
      this._searchPulseRadius = (pulseElapsed / 1000) * Math.min(this.cx, this.cy);
      this._searchPulseAlpha = Math.max(0, 1 - pulseElapsed / 1000);
    }

    if (this.animationState) this._updateQueryAnimation();
    this._draw();
    requestAnimationFrame(() => this._animate());
  }

  _updateQueryAnimation() {
    const elapsed = this.animationTime;

    if (this.agentMode === 'basic') {
      for (const n of this.activeNodes)
        n.glow = elapsed > 500 ? Math.min((elapsed - 500) / 500, 1) : 0;
      if (elapsed > 2000) this.animationState = null;

    } else if (this.agentMode === 'scaled') {
      if (elapsed < 1500) {
        for (const n of this.nodes) {
          if (n.alpha < 0.15) continue;
          n.glow = (Math.random() < 0.03 && elapsed < 1200) ? 0.6 : n.glow * 0.9;
        }
      }
      for (const n of this.activeNodes)
        n.glow = elapsed > 1500 ? Math.min((elapsed - 1500) / 500, 0.7) : n.glow;
      if (elapsed > 3000) this.animationState = null;

    } else if (this.agentMode === 'kc') {
      // Search pulse (0-1s)
      this._searchPulseRadius = elapsed < 1000 ? (elapsed / 1000) * Math.min(this.cx, this.cy) : 0;
      this._searchPulseAlpha = elapsed < 1000 ? 1 - elapsed / 1000 : 0;

      // Tables illuminate (1s+)
      for (let i = 0; i < this.activeNodes.length; i++) {
        const delay = 1000 + i * 400;
        const n = this.activeNodes[i];
        n.glow = elapsed > delay ? Math.min((elapsed - delay) / 400, 1) : 0;
        n.labelAlpha = elapsed > delay + 2000 ? Math.min((elapsed - delay - 2000) / 500, 1) : 0;
      }

      // Lineage lines light up (1.5s+)
      for (const line of this.activeLineage) {
        line.alpha = elapsed > 1500 ? Math.min((elapsed - 1500) / 600, 0.5) : 0;
      }

      // Glossary arcs appear (2.5s+)
      for (const arc of this.activeGlossaryArcs) {
        arc.alpha = elapsed > 2500 ? Math.min((elapsed - 2500) / 500, 0.6) : 0;
        arc.labelAlpha = elapsed > 3000 ? Math.min((elapsed - 3000) / 500, 0.7) : 0;
      }

      if (elapsed > 4000 && !this._zoomedIn) this._triggerZoomToActive();
      if (elapsed > 6000) this.animationState = null;
    }
  }

  _draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    // Subtle radial vignette on dark canvas
    const bgGrad = ctx.createRadialGradient(this.cx, this.cy, 20, this.cx, this.cy, Math.max(this.w, this.h) * 0.7);
    bgGrad.addColorStop(0, '#131922');
    bgGrad.addColorStop(1, '#0d1117');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.w, this.h);

    // Apply zoom/pan transform
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.cx + this.panX, -this.cy + this.panY);

    // KC ring hints
    if (this.agentMode === 'kc') {
      const maxR = Math.min(this.cx, this.cy) * 0.85;
      for (const r of [0.75, 0.55, 0.3]) {
        ctx.beginPath();
        ctx.arc(this.cx, this.cy, maxR * r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(230,237,243,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Snowflake NEXUS cluster boundary and label (KC Agent only)
    if (this.agentMode === 'kc' && TABLES.snowflake && TABLES.snowflake.length > 0) {
      const maxR = Math.min(this.cx, this.cy) * 0.85;
      const clusterCx = this.cx + maxR * 0.72;
      const clusterCy = this.cy + maxR * 0.65;
      const clusterR = Math.min(54, maxR * 0.23);

      ctx.beginPath();
      ctx.arc(clusterCx, clusterCy, clusterR + 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,229,255,0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,229,255,0.38)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '600 10px system-ui';
      ctx.fillStyle = 'rgba(0,229,255,0.88)';
      ctx.textAlign = 'center';
      ctx.fillText('NEXUS · Snowflake (External)', clusterCx, clusterCy - clusterR - 24);
      ctx.textAlign = 'left';
    }

    // Search pulse
    if (this._searchPulseRadius > 0 && this._searchPulseAlpha > 0) {
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, this._searchPulseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(63,185,80,${this._searchPulseAlpha * 0.45})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // --- Layer 1: Lineage lines (including registered NEXUS -> Gold cross-cloud links) ---
    for (const line of this.activeLineage) {
      if (line.alpha <= 0) continue;
      const isCross = line.crossCloud || line.src.layer === 'snowflake' || line.tgt.layer === 'snowflake';
      if (isCross && this.agentMode !== 'kc') continue;
      ctx.beginPath();
      ctx.moveTo(line.src.x, line.src.y);
      let mx = (line.src.x + line.tgt.x) / 2;
      let my = (line.src.y + line.tgt.y) / 2;
      if (isCross) {
        const cpx = mx;
        const cpy = my - 18;
        ctx.quadraticCurveTo(cpx, cpy, line.tgt.x, line.tgt.y);
        mx = (line.src.x + 2 * cpx + line.tgt.x) / 4;
        my = (line.src.y + 2 * cpy + line.tgt.y) / 4;
      } else {
        ctx.lineTo(line.tgt.x, line.tgt.y);
      }
      ctx.strokeStyle = isCross
        ? `rgba(0,229,255,${Math.min(line.alpha * 1.15, 0.72)})`
        : `rgba(230,237,243,${Math.min(line.alpha * 1.1, 0.65)})`;
      if (isCross) ctx.setLineDash([4, 3]);
      ctx.lineWidth = isCross ? 1.3 : 1.1;
      ctx.stroke();
      if (isCross) ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(mx, my, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = isCross
        ? `rgba(0,229,255,${Math.min(line.alpha * 1.25, 0.85)})`
        : `rgba(230,237,243,${Math.min(line.alpha * 1.1, 0.75)})`;
      ctx.fill();
    }

    // --- Layer 2: Glossary arcs (curved, green, dashed) ---
    this._termLabelPositions = [];
    const seenTerms = new Set();
    for (const arc of this.activeGlossaryArcs) {
      if (arc.alpha <= 0) continue;
      const a = arc.a, b = arc.b;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const curvature = Math.min(dist * 0.3, 60);
      const cpx = mx - (dy / dist) * curvature;
      const cpy = my + (dx / dist) * curvature;

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cpx, cpy, b.x, b.y);
      ctx.strokeStyle = `rgba(63,185,80,${arc.alpha})`;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.3;
      ctx.stroke();
      ctx.setLineDash([]);

      if (arc.labelAlpha > 0 && !seenTerms.has(arc.term)) {
        seenTerms.add(arc.term);
        const labelX = (a.x + 2 * cpx + b.x) / 4;
        const labelY = (a.y + 2 * cpy + b.y) / 4;
        ctx.font = '10px system-ui';
        const tw = ctx.measureText(arc.term).width;
        const lw = tw + 8, lh = 16;
        ctx.fillStyle = `rgba(22,27,34,${arc.labelAlpha * 0.95})`;
        ctx.fillRect(labelX - tw / 2 - 4, labelY - 9, lw, lh);
        ctx.strokeStyle = `rgba(63,185,80,${arc.labelAlpha * 0.65})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX - tw / 2 - 4, labelY - 9, lw, lh);
        ctx.fillStyle = `rgba(126,231,135,${arc.labelAlpha})`;
        ctx.fillText(arc.term, labelX - tw / 2, labelY + 3);
        this._termLabelPositions.push({
          term: arc.term, x: labelX, y: labelY, hw: lw / 2, hh: lh / 2,
        });
      }
    }

    // Beams from active BigQuery nodes to center
    for (const n of this.activeNodes) {
      if (n.layer === 'snowflake') continue;
      if (n.glow > 0.3) {
        const col = COLORS[this.agentMode];
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(this.cx, this.cy);
        ctx.strokeStyle = `${col}${Math.floor(n.glow * 160).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Nodes (Diamonds for NEXUS Snowflake in KC mode, Circles for BigQuery Medallion)
    for (const n of this.nodes) {
      if (n.layer === 'snowflake' && this.agentMode !== 'kc') continue;
      if (n.alpha < 0.01) continue;
      const alpha = Math.min(n.alpha + n.glow * 0.5, 1);
      const hexAlpha = Math.floor(alpha * 255).toString(16).padStart(2, '0');

      if (n.layer === 'snowflake') {
        const r = n.radius + n.glow * 3.5;
        ctx.save();
        ctx.translate(n.x, n.y);
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.rect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
        ctx.fillStyle = n.color + hexAlpha;
        ctx.fill();
        ctx.strokeStyle = `rgba(230,237,243,${Math.min(alpha * 0.7, 0.9)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        if (n.glow > 0.2) {
          const gr = n.radius + n.glow * 9;
          ctx.save();
          ctx.translate(n.x, n.y);
          ctx.rotate(Math.PI / 4);
          ctx.beginPath();
          ctx.rect(-gr * 0.85, -gr * 0.85, gr * 1.7, gr * 1.7);
          ctx.fillStyle = n.color + Math.floor(n.glow * 50).toString(16).padStart(2, '0');
          ctx.fill();
          ctx.restore();
        }
      } else {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + n.glow * 3, 0, Math.PI * 2);
        ctx.fillStyle = n.color + hexAlpha;
        ctx.fill();

        if (n.glow > 0.2) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + n.glow * 8, 0, Math.PI * 2);
          ctx.fillStyle = n.color + Math.floor(n.glow * 45).toString(16).padStart(2, '0');
          ctx.fill();
        }
      }

      if (n.labelAlpha > 0 && n.label) {
        ctx.font = '10px system-ui';
        ctx.fillStyle = `rgba(230,237,243,${n.labelAlpha * 0.9})`;
        ctx.fillText(n.label, n.x + n.radius + 6, n.y + 3);
      }
    }

    // Active table name labels with bounding-box de-confliction (KC and scaled)
    if (this.agentMode === 'kc' || this.agentMode === 'scaled') {
      ctx.font = '10px system-ui';
      const placedRects = [];
      for (const tl of this._termLabelPositions) {
        placedRects.push({
          x1: tl.x - tl.hw - 3, y1: tl.y - tl.hh - 3,
          x2: tl.x + tl.hw + 3, y2: tl.y + tl.hh + 3,
        });
      }
      if (this.agentMode === 'kc' && TABLES.snowflake && TABLES.snowflake.length > 0) {
        const maxR = Math.min(this.cx, this.cy) * 0.85;
        const clusterCx = this.cx + maxR * 0.72;
        const clusterCy = this.cy + maxR * 0.65;
        const clusterR = Math.min(54, maxR * 0.23);
        placedRects.push({
          x1: clusterCx - 85, y1: clusterCy - clusterR - 36,
          x2: clusterCx + 85, y2: clusterCy - clusterR - 16,
        });
      }

      // Compute visible world viewport bounds to avoid clipping labels at canvas edges
      const topLeft = this._screenToWorld(8, 8);
      const bottomRight = this._screenToWorld(this.w - 8, this.h - 8);

      const tierPriority = { snowflake: 0, gold: 1, silver: 2, bronze: 3, ref: 4 };
      const sortedActive = [...this.activeNodes]
        .filter(n => n.glow > 0.3 && (this.agentMode === 'kc' || n.layer !== 'snowflake'))
        .sort((a, b) => (tierPriority[a.layer] ?? 5) - (tierPriority[b.layer] ?? 5));

      const crowded = sortedActive.length > 10 && this.zoom < 1.15;

      for (const n of sortedActive) {
        if (crowded && n.layer !== 'gold' && n.layer !== 'snowflake') continue;
        const label = n.name.replace(/^(gold|silver|bronze|ref)_/, '');
        const tw = ctx.measureText(label).width;
        const bw = tw + 6;
        const bh = 14;
        const r = n.radius + 4;

        const candidates = [
          { x: n.x + r, y: n.y - 7 },
          { x: n.x - r - bw, y: n.y - 7 },
          { x: n.x - bw / 2, y: n.y - r - bh - 2 },
          { x: n.x - bw / 2, y: n.y + r + 2 },
          { x: n.x + r, y: n.y - 22 },
          { x: n.x + r, y: n.y + 8 },
          { x: n.x - r - bw, y: n.y - 22 },
          { x: n.x - r - bw, y: n.y + 8 },
        ];

        let chosen = null;
        for (const c of candidates) {
          const rect = { x1: c.x, y1: c.y, x2: c.x + bw, y2: c.y + bh };
          if (rect.x1 < topLeft.x || rect.x2 > bottomRight.x || rect.y1 < topLeft.y || rect.y2 > bottomRight.y) {
            continue;
          }
          const overlaps = placedRects.some(p =>
            !(rect.x2 + 2 < p.x1 || rect.x1 - 2 > p.x2 || rect.y2 + 2 < p.y1 || rect.y1 - 2 > p.y2)
          );
          if (!overlaps) {
            chosen = rect;
            break;
          }
        }

        if (!chosen) continue;
        placedRects.push(chosen);

        const isSF = n.layer === 'snowflake';
        ctx.fillStyle = `rgba(22,27,34,${n.glow * 0.95})`;
        ctx.fillRect(chosen.x1, chosen.y1, bw, bh);
        ctx.strokeStyle = isSF
          ? `rgba(0,229,255,${n.glow * 0.85})`
          : `rgba(48,54,61,${n.glow * 0.9})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(chosen.x1, chosen.y1, bw, bh);
        ctx.fillStyle = isSF
          ? `rgba(0,229,255,${n.glow * 0.95})`
          : `rgba(230,237,243,${n.glow * 0.95})`;
        ctx.fillText(label, chosen.x1 + 3, chosen.y1 + 11);
      }
    }

    // Agent center orb — diamond shape with concentric rings
    const agentColor = COLORS[this.agentMode];
    const pulse = this.animationState ? Math.sin(this.animationTime * 0.004) * 0.15 : 0;
    const size = 12;

    // Outer pulsing ring
    const ringR = 22 + pulse * 30;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = agentColor + '30';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Second ring (dashed)
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, ringR + 8, 0, Math.PI * 2);
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = agentColor + '18';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Soft glow
    const grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, ringR);
    grad.addColorStop(0, agentColor + '18');
    grad.addColorStop(1, agentColor + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, ringR, 0, Math.PI * 2);
    ctx.fill();

    // Diamond shape (rotated square)
    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.rect(-size / 2, -size / 2, size, size);
    ctx.fillStyle = agentColor;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Inner dot
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.restore();

    // Tooltip (drawn outside zoom transform so it stays crisp at screen scale)
    if (this.hoveredNode) {
      const n = this.hoveredNode;
      const sx = this.cx + (n.x - this.cx + this.panX) * this.zoom;
      const sy = this.cy + (n.y - this.cy + this.panY) * this.zoom;
      ctx.font = '12px system-ui';
      const tw = ctx.measureText(n.name).width;
      ctx.fillStyle = 'rgba(22,27,34,0.96)';
      const rx = sx + 8, ry = sy - 18, rw = tw + 12, rh = 22, rr = 4;
      ctx.beginPath();
      ctx.moveTo(rx + rr, ry);
      ctx.lineTo(rx + rw - rr, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
      ctx.lineTo(rx + rw, ry + rh - rr);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
      ctx.lineTo(rx + rr, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
      ctx.lineTo(rx, ry + rr);
      ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
      ctx.fill();
      ctx.strokeStyle = n.layer === 'snowflake' ? '#00e5ff' : '#30363d';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#e6edf3';
      ctx.fillText(n.name, sx + 14, sy - 3);
    }

    // Basic agent labels (outside zoom — basic doesn't zoom)
    if (this.agentMode === 'basic') {
      ctx.font = '11px system-ui';
      for (const n of this.nodes) {
        if (BASIC_TABLES.includes(n.name) && n.alpha > 0.5) {
          ctx.fillStyle = 'rgba(230,237,243,0.88)';
          ctx.fillText(n.name.replace('gold_', ''), n.x + n.radius + 6, n.y + 3);
        }
      }
    }
  }

  // === Event-driven animation methods (for live WebSocket mode) ===

  triggerSearchPulse() {
    this._searchPulseRadius = 0;
    this._searchPulseAlpha = 1;
    this._pulseStartTime = this.animationTime;
  }

  illuminateTable(tableName) {
    const node = this.nodeMap[tableName];
    if (!node) return;
    if (node.layer === 'snowflake' && this.agentMode !== 'kc') return;
    node.glow = 1;
    node.alpha = 1;
    if (!this.activeNodes.includes(node)) this.activeNodes.push(node);
    if (this.agentMode === 'kc') {
      this._buildLineageForTables(this.activeNodes.map(n => n.name), []);
    }
  }

  illuminateTables(tableNames) {
    for (const name of tableNames) {
      const node = this.nodeMap[name];
      if (!node) continue;
      if (node.layer === 'snowflake' && this.agentMode !== 'kc') continue;
      node.glow = 1;
      node.alpha = 1;
      if (!this.activeNodes.includes(node)) this.activeNodes.push(node);
    }
    if (this.agentMode === 'kc') {
      this._buildLineageForTables(this.activeNodes.map(n => n.name), []);
    }
  }

  showGlossaryArcsForTerms(termNames) {
    if (this.agentMode !== 'kc') return;
    for (const term of termNames) {
      const tables = GLOSSARY_LINKS[term];
      if (!tables || tables.length < 2) continue;
      const nodes = tables.map(t => this.nodeMap[t]).filter(Boolean);
      for (let i = 0; i < nodes.length - 1; i++) {
        this.activeGlossaryArcs.push({
          a: nodes[i], b: nodes[i + 1],
          term, alpha: 0.6, labelAlpha: 0.7,
        });
      }
    }
  }

  _computeActiveRegion() {
    const pts = [];
    for (const n of this.activeNodes) pts.push({ x: n.x, y: n.y });
    for (const l of this.activeLineage) {
      pts.push({ x: l.src.x, y: l.src.y });
      pts.push({ x: l.tgt.x, y: l.tgt.y });
    }
    for (const a of this.activeGlossaryArcs) {
      pts.push({ x: a.a.x, y: a.a.y });
      pts.push({ x: a.b.x, y: a.b.y });
    }
    if (pts.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = 80;
    return {
      cx: (minX + maxX) / 2, cy: (minY + maxY) / 2,
      w: maxX - minX + pad * 2, h: maxY - minY + pad * 2,
    };
  }

  _triggerZoomToActive() {
    if (this.agentMode !== 'kc') return;
    const region = this._computeActiveRegion();
    if (!region) return;
    const scaleX = this.w / region.w;
    const scaleY = this.h / region.h;
    this.targetZoom = Math.min(scaleX, scaleY, 2.5);
    this.targetPanX = this.cx - region.cx;
    this.targetPanY = this.cy - region.cy;
    this._zoomedIn = true;
  }

  _resetZoom() {
    this.targetZoom = 1; this.targetPanX = 0; this.targetPanY = 0;
    this._zoomedIn = false;
  }

  zoomToActive() {
    this._triggerZoomToActive();
  }

  setNodeLabel(tableName, label) {
    const node = this.nodeMap[tableName];
    if (node) { node.label = label; node.labelAlpha = 1; }
  }

  clearAnimation() {
    this.activeNodes = [];
    this.activeLineage = [];
    this.activeGlossaryArcs = [];
    this.metadataLines = [];
    this.animationState = null;
    this._searchPulseRadius = 0;
    this._searchPulseAlpha = 0;
    this._resetZoom();
    for (const n of this.nodes) { n.glow = 0; n.labelAlpha = 0; n.label = ''; }
  }
}

window.PointCloud = PointCloud;
