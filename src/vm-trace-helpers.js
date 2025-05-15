/**
 * vm-trace-helpers.js  ·  Last updated 2025-05-12
 *
 * row(depth, pcChars, op, opd, sp, hints)
 * pv(value)           – single-token preview
 *
 * Exports: { row, pv }  and also attaches them to global for convenience.
 */

/* ── private state ────────────────────────────────────────── */
let __tick = 0;                               // instruction counter

const __pcB = idxChars => idxChars >>> 1;      // char index → byte (dec)

/* ── preview helper ──────────────────────────────────────── */
function pv(v, maxStr = 500, depth = 0, seen = new WeakSet()) { // Increased maxStr from 24 to 500
  try {
    /* -------- primitives ------------------------------------ */
    if (v == null) return String(v);
    if (typeof v === 'string')
      return JSON.stringify(v.length > maxStr ? v.slice(0, maxStr) + '…' : v);
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);


       if (v instanceof Error) {
     const msg = v.message ?? '';
     const head   = msg.length > maxStr ? msg.slice(0, maxStr) + '…' : msg;
     return `[Error ${v.name}: ${head}]`;
   }

    /* -------- functions ------------------------------------- */
    if (typeof v === 'function')
      return v.vmMarker ? `[vm#${v.bytecodeSize}]`
                        : `[fn ${v.name || '<>'}]`;

    /* -------- depth / cycle guard --------------------------- */
    if (seen.has(v)) return '{Circular}';
    if (depth >= 3)   return `{len=${Array.isArray(v) ? v.length : Object.keys(v).length}}`; // Increased max depth from 1 to 3
    seen.add(v);

    /* -------- typed arrays ---------------------------------- */
    if (ArrayBuffer.isView(v) && !Array.isArray(v)) {
      const displayCount = 500; // Increased from 8 to 500
      const bytes = Array.prototype.slice.call(v, 0, displayCount)
                     .map(b => '0x' + b.toString(16).padStart(2, '0'))
                     .join(' ');
      return `[len=${v.length} ${bytes}${v.length > displayCount ? ' …' : ''}]`;
    }

    /* -------- plain arrays ---------------------------------- */
    if (Array.isArray(v)) {
      const displayCount = 500; // Increased from 8 to 500 to show more array elements
      const head = v.slice(0, displayCount)
                    .map(el => pv(el, maxStr, depth + 1, seen))
                    .join(' ');
      return `[len=${v.length} ${head}${v.length > displayCount ? ' …' : ''}]`;
    }

    /* -------- generic objects ------------------------------- */
    const keys = Object.keys(v);
    const displayCount = 100; // Increased from 4 to 100
    const head = keys.slice(0, displayCount).map(k => {
      const valTok = pv(v[k], maxStr, depth + 1, seen);
      return `${k}:${valTok}`;
    }).join(', ');
    return `{len=${keys.length} ${head}${keys.length > displayCount ? ', …' : ''}}`;
  } catch {
    return '[?]';
  }
}



/* ── trace-line emitter ──────────────────────────────────── */
function row(depth, pcChars, op, opd, sp, hints = {}) {
  const core = [
    ++__tick,                    // tick
    depth,                       // call depth
    __pcB(pcChars),              // byte offset (dec)
    op,
    opd === undefined ? '-' : String(opd),
    sp
  ];

  const extras = Object.entries(hints).map(([k, v]) => `${k}=${v}`);
  console.log([...core, ...extras].join('\t'));
}

/* ── exports & globals ───────────────────────────────────── */
module.exports = { row, pv };
global.row = row;
global.pv  = pv;