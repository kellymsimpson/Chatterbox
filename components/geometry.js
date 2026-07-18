/**
 * Projective helpers for flap fills + sticker skew (PRD §8.7).
 * Maps a unit square (or axis-aligned rect) onto a destination quad via CSS matrix3d.
 */

/** @typedef {[number, number]} Pt */
/** @typedef {{ C0: Pt, C1: Pt, C2: Pt, C3: Pt }} Quad */

/**
 * Solve for projective transform mapping unit square corners
 * (0,0), (1,0), (1,1), (0,1) → quad C0..C3.
 * Returns a CSS matrix3d() string (column-major, 4×4).
 */
export function matrix3dFromUnitSquare(quad) {
  const dst = [quad.C0, quad.C1, quad.C2, quad.C3];
  const m = projectiveMatrix(
    [[0, 0], [1, 0], [1, 1], [0, 1]],
    dst,
  );
  return matrixToCss(m);
}

/** Map an element of size (w×h) onto a destination quad. */
export function matrix3dFromRect(w, h, quad) {
  const dst = [quad.C0, quad.C1, quad.C2, quad.C3];
  const m = projectiveMatrix(
    [[0, 0], [w, 0], [w, h], [0, h]],
    dst,
  );
  return matrixToCss(m);
}

/**
 * 2D projective transform: 8 DOF, maps 4 source points → 4 dest points.
 * Returns 3×3 row-major homogeneous matrix.
 */
function projectiveMatrix(src, dst) {
  // Build system for mapping src→dst via perspective (see CSS matrix3d trick / transform2d).
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const h = solve8(A, b);
  // 3×3 with h8 = 1
  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];
}

/** Gaussian elimination for 8×8. */
function solve8(A, b) {
  const n = 8;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const div = M[col][col];
    if (Math.abs(div) < 1e-12) continue;
    for (let c = col; c <= n; c++) M[col][c] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}

function matrixToCss(m3) {
  // CSS matrix3d is column-major 4×4. Embed 2D projective in xy + perspective via m36/m37.
  const [[a, b, c], [d, e, f], [g, h, i]] = m3;
  // [[a,b,0,c],[d,e,0,f],[0,0,1,0],[g,h,0,i]]
  const vals = [
    a, d, 0, g,
    b, e, 0, h,
    0, 0, 1, 0,
    c, f, 0, i,
  ];
  return `matrix3d(${vals.map((v) => Number(v.toFixed(6))).join(',')})`;
}

/** Axis-aligned bounding box of a quad. */
export function quadBounds(quad) {
  const pts = [quad.C0, quad.C1, quad.C2, quad.C3];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

/** SVG polygon points attribute from a quad. */
export function quadToPoints(quad) {
  return [quad.C0, quad.C1, quad.C2, quad.C3]
    .map(([x, y]) => `${x},${y}`)
    .join(' ');
}

/**
 * Expand a quad outward from its centroid (Option 2 oversize-and-clip).
 * @param {Quad} quad
 * @param {number} [factor=1.18] scale from centroid (1.18 ≈ 18% outward)
 */
export function expandQuadFromCentroid(quad, factor = 1.18) {
  const pts = [quad.C0, quad.C1, quad.C2, quad.C3];
  const cx = pts.reduce((s, p) => s + p[0], 0) / 4;
  const cy = pts.reduce((s, p) => s + p[1], 0) / 4;
  const grow = ([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor];
  return {
    C0: grow(quad.C0),
    C1: grow(quad.C1),
    C2: grow(quad.C2),
    C3: grow(quad.C3),
  };
}

/** Cream paper fills used as the authoritative silhouette for fill clipping. */
const PAPER_SILHOUETTE_FILLS = new Set([
  '#FAF7F0', '#EFE9DD', '#faf7f0', '#efe9dd',
]);

/**
 * Extract paper silhouette path `d` values from a frame SVG document.
 * Uses solid cream paper fills only — not numbers, creases, or gradient overlays.
 * @param {Document} svgDoc
 * @returns {string[]}
 */
export function extractPaperSilhouettePathDs(svgDoc) {
  const out = [];
  const seen = new Set();
  for (const path of svgDoc.querySelectorAll('path')) {
    if (path.closest('[id*="Flap Numbers"], [id$="-warp"], [id*="-warp_"]')) continue;
    if (/crease/i.test(path.id || '')) continue;
    const fill = path.getAttribute('fill') || '';
    if (!PAPER_SILHOUETTE_FILLS.has(fill)) continue;
    const op = path.getAttribute('fill-opacity');
    if (op != null && Number(op) < 1) continue; // skip tint overlays on same shape
    const d = path.getAttribute('d');
    if (!d || seen.has(d)) continue;
    seen.add(d);
    out.push(d);
  }
  return out;
}

/**
 * Point-in-convex-quad test (C0→C1→C2→C3 winding).
 * @param {number} x
 * @param {number} y
 * @param {Quad} quad
 */
export function pointInQuad(x, y, quad) {
  const pts = [quad.C0, quad.C1, quad.C2, quad.C3];
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % 4];
    const cross = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
    if (Math.abs(cross) < 1e-9) continue;
    const s = cross > 0 ? 1 : -1;
    if (sign === 0) sign = s;
    else if (s !== sign) return false;
  }
  return sign !== 0;
}

/** Convert play-space point → decorate-local using V35_close ↔ decorate bridge. */
export function playPointToLocal(pt, origin) {
  return [pt[0] - origin[0], pt[1] - origin[1]];
}

export function playQuadToLocal(quad, origin) {
  return {
    C0: playPointToLocal(quad.C0, origin),
    C1: playPointToLocal(quad.C1, origin),
    C2: playPointToLocal(quad.C2, origin),
    C3: playPointToLocal(quad.C3, origin),
  };
}
