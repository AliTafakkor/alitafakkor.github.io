/* ── Real Brain Wireframe ──────────────────────── */
(function () {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;
  let smoothRY = 0, smoothRX = 0, targetRY = 0, targetRX = 0, spinVal = 0;
  let mouseNX = 0.5, mouseNY = 0.5;
  let cursorOnPage = false;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', e => {
    cursorOnPage = true;
    mouseNX = e.clientX / window.innerWidth;
    mouseNY = e.clientY / window.innerHeight;
    // More responsive rotation — brain turns to follow cursor
    targetRY = (mouseNX - 0.5) * 0.35;
    targetRX = (mouseNY - 0.5) * 0.12;
  });
  document.addEventListener('mouseleave', () => { cursorOnPage = false; });

  let meshR = null, meshL = null;

  const base = document.currentScript
    ? document.currentScript.src.replace(/\/[^/]+$/, '')
    : '/assets/js';
  const meshPath = base.replace('/js', '/data') + '/brain_mesh.json';

  fetch(meshPath)
    .then(r => r.json())
    .then(d => { meshR = d.R; meshL = d.L; requestAnimationFrame(draw); })
    .catch(() => {
      fetch('/assets/data/brain_mesh.json')
        .then(r => r.json())
        .then(d => { meshR = d.R; meshL = d.L; requestAnimationFrame(draw); });
    });

  let last = null, last0 = null;

  function draw(ts) {
    if (!meshR || !meshL) { requestAnimationFrame(draw); return; }
    if (last0 === null) last0 = ts;
    if (last  === null) last  = ts;

    const dt = Math.min((ts - last) * 0.001, 0.05);
    last = ts;

    spinVal += dt * 0.06;
    // Faster lerp when cursor is active so rotation feels snappy
    const lerpRate = cursorOnPage ? 0.05 : 0.02;
    smoothRY += (targetRY - smoothRY) * lerpRate;
    smoothRX += (targetRX - smoothRX) * lerpRate;

    // Intro enlarge: ease-out cubic over 2.4 s
    const introT     = Math.min(1, (ts - last0) / 2400);
    const introScale = introT < 1 ? 1 - Math.pow(1 - introT, 3) : 1;

    ctx.clearRect(0, 0, W, H);

    const a = spinVal + smoothRY, b = smoothRX;
    const cosA = Math.cos(a), sinA = Math.sin(a);
    const cosB = Math.cos(b), sinB = Math.sin(b);

    const cx = W / 2, cy = H / 2 + H * 0.04;
    const sc = Math.min(W, H) * 0.44 * introScale;

    const isDark = document.body.classList.contains('theme-dark');
    const col    = isDark ? '122,191,158' : '74,140,106';

    // Cursor position in canvas space (for spotlight)
    const cursorX = mouseNX * W;
    const cursorY = mouseNY * H;
    const spotR   = 110;  // spotlight radius in px
    const spotR2  = spotR * spotR;

    function drawHemi(mesh) {
      const { coords, tris } = mesh;
      const nV = coords.length / 3;
      const px = new Float32Array(nV);
      const py = new Float32Array(nV);
      const pz = new Float32Array(nV);

      for (let i = 0; i < nV; i++) {
        const xi = coords[i*3], yi = coords[i*3+1], zi = coords[i*3+2];
        const vx = xi, vy = -zi, vd = yi;
        // Y rotation
        const vx2 =  vx * cosA + vd * sinA;
        const vd2 = -vx * sinA + vd * cosA;
        // X tilt
        const vy2 =  vy * cosB - vd2 * sinB;
        const vd3 =  vy * sinB + vd2 * cosB;

        px[i] = vx2 * sc + cx;
        py[i] = vy2 * sc + cy;
        pz[i] = vd3;
      }

      // ── Depth-bucket base draw ───────────────────
      let minZ = pz[0], maxZ = pz[0];
      for (let i = 1; i < nV; i++) {
        if (pz[i] < minZ) minZ = pz[i];
        if (pz[i] > maxZ) maxZ = pz[i];
      }
      const zR = maxZ - minZ || 1;

      const B = 8;
      const buckets = Array.from({ length: B }, () => []);
      const nF = tris.length / 3;
      for (let f = 0; f < nF; f += 2) {
        const ta = tris[f*3], tb = tris[f*3+1], tc = tris[f*3+2];
        const d  = (pz[ta] + pz[tb] + pz[tc]) / 3;
        const bi = Math.min(B - 1, Math.floor((d - minZ) / zR * B));
        buckets[bi].push(ta, tb, tc);
      }

      ctx.lineWidth = 0.5;
      for (let bi = 0; bi < B; bi++) {
        if (!buckets[bi].length) continue;
        const alpha = (0.06 + bi / B * 0.30).toFixed(3);
        ctx.beginPath();
        const f = buckets[bi];
        for (let i = 0; i < f.length; i += 3) {
          const ta = f[i], tb = f[i+1], tc = f[i+2];
          ctx.moveTo(px[ta], py[ta]);
          ctx.lineTo(px[tb], py[tb]);
          ctx.lineTo(px[tc], py[tc]);
          ctx.closePath();
        }
        ctx.strokeStyle = `rgba(${col},${alpha})`;
        ctx.stroke();
      }

      // ── Cursor spotlight — single pass, two Path2Ds ──
      if (cursorOnPage) {
        const inner = new Path2D();
        const outer = new Path2D();
        for (let f = 0; f < nF; f += 2) {          // same subsampling as bucket draw
          const ta = tris[f*3], tb = tris[f*3+1], tc = tris[f*3+2];
          const dx = (px[ta] + px[tb] + px[tc]) / 3 - cursorX;
          const dy = (py[ta] + py[tb] + py[tc]) / 3 - cursorY;
          const d2 = dx*dx + dy*dy;
          if (d2 >= spotR2) continue;               // outside spotlight — skip fast
          const falloff = 1 - d2 / spotR2;
          const p = falloff > 0.5 ? inner : (falloff > 0.15 ? outer : null);
          if (!p) continue;
          p.moveTo(px[ta], py[ta]);
          p.lineTo(px[tb], py[tb]);
          p.lineTo(px[tc], py[tc]);
          p.closePath();
        }
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = `rgba(${col}, 0.65)`;
        ctx.stroke(inner);
        ctx.strokeStyle = `rgba(${col}, 0.28)`;
        ctx.stroke(outer);
      }
    }

    drawHemi(meshR);
    drawHemi(meshL);
    requestAnimationFrame(draw);
  }
})();
