import { useState, useMemo } from "react";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const simplify = (n, d) => { const g = gcd(Math.abs(n), Math.abs(d)); return [n / g, d / g]; };

const COLORS = {
  overlap: "#4f86f7",
  firstOnly: "#ffd166",
  secondOnly: "#a8e6cf",
  empty: "#f0f4ff",
  grid: "#c8d8f8",
};

function FractionSlider({ label, numerator, denominator, onNumeratorChange, onDenominatorChange, color }) {
  return (
    <div style={{ fontFamily: "'Georgia', serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <span style={{
          fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase",
          color: "#555", minWidth: 90
        }}>{label}</span>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          background: "#fff", border: `2.5px solid ${color}`, borderRadius: 10,
          padding: "6px 18px", minWidth: 60, boxShadow: `0 2px 8px ${color}44`
        }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#222", lineHeight: 1 }}>{numerator}</span>
          <div style={{ width: 28, height: 2.5, background: color, margin: "3px 0" }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: "#222", lineHeight: 1 }}>{denominator}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 102 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "#888", width: 74, textAlign: "right" }}>Numerator</span>
          <input type="range" min={1} max={12} value={numerator}
            onChange={e => onNumeratorChange(+e.target.value)}
            style={{ accentColor: color, flex: 1, cursor: "pointer", height: 4 }} />
          <span style={{ fontSize: 12, color: "#666", width: 18 }}>{numerator}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "#888", width: 74, textAlign: "right" }}>Denominator</span>
          <input type="range" min={1} max={10} value={denominator}
            onChange={e => onDenominatorChange(+e.target.value)}
            style={{ accentColor: color, flex: 1, cursor: "pointer", height: 4 }} />
          <span style={{ fontSize: 12, color: "#666", width: 18 }}>{denominator}</span>
        </div>
      </div>
    </div>
  );
}

export default function FractionAreaModel() {
  const [aN, setAN] = useState(2);
  const [aD, setAD] = useState(3);
  const [bN, setBN] = useState(3);
  const [bD, setBD] = useState(4);

  // Grid is aD columns × bD rows, each "whole" unit is 1×1
  // We need to show ceil(aN/aD) × ceil(bN/bD) whole units
  const colUnits = Math.ceil(aN / aD);
  const rowUnits = Math.ceil(bN / bD);

  const totalCols = aD * colUnits;
  const totalRows = bD * rowUnits;

  // Which cells are "shaded" for fraction A (first aN columns out of every aD in a unit tile)
  // and fraction B (first bN rows out of every bD in a unit tile)
  const isAcol = (col) => (col % aD) < aN % aD || Math.floor(col / aD) < Math.floor(aN / aD);
  const isBrow = (row) => (row % bD) < bN % bD || Math.floor(row / bD) < Math.floor(bN / bD);

  // Count overlap cells
  const overlapCount = useMemo(() => {
    let count = 0;
    for (let r = 0; r < totalRows; r++)
      for (let c = 0; c < totalCols; c++)
        if (isAcol(c) && isBrow(r)) count++;
    return count;
  }, [aN, aD, bN, bD, totalCols, totalRows]);

  const productN = aN * bN;
  const productD = aD * bD;
  const [simpN, simpD] = simplify(productN, productD);

  // Grid cell size
  const maxGridW = 360;
  const maxGridH = 280;
  const cellW = clamp(Math.floor(maxGridW / totalCols), 10, 48);
  const cellH = clamp(Math.floor(maxGridH / totalRows), 10, 48);
  const gridW = cellW * totalCols;
  const gridH = cellH * totalRows;

  const cells = useMemo(() => {
    const arr = [];
    for (let r = 0; r < totalRows; r++) {
      for (let c = 0; c < totalCols; c++) {
        const inA = isAcol(c);
        const inB = isBrow(r);
        let fill = COLORS.empty;
        if (inA && inB) fill = COLORS.overlap;
        else if (inA) fill = COLORS.firstOnly;
        else if (inB) fill = COLORS.secondOnly;
        arr.push({ r, c, fill, inA, inB });
      }
    }
    return arr;
  }, [aN, aD, bN, bD, totalCols, totalRows]);

  // Mixed number display
  const toMixed = (n, d) => {
    if (n < d) return null;
    const whole = Math.floor(n / d);
    const rem = n % d;
    return { whole, rem, d };
  };

  const mixedA = toMixed(aN, aD);
  const mixedB = toMixed(bN, bD);
  const mixedP = toMixed(simpN, simpD);

  const renderFrac = (n, d, color) => (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1, verticalAlign: "middle" }}>
      <span style={{ fontSize: 26, fontWeight: 800, color: color || "#222" }}>{n}</span>
      <span style={{ width: "100%", height: 2.5, background: color || "#333", display: "block", margin: "2px 0" }} />
      <span style={{ fontSize: 26, fontWeight: 800, color: color || "#222" }}>{d}</span>
    </span>
  );

  const renderMixed = (m, color) => m ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, verticalAlign: "middle" }}>
      <span style={{ fontSize: 22, fontWeight: 700, color: color || "#222" }}>{m.whole}</span>
      {m.rem > 0 && renderFrac(m.rem, m.d, color)}
    </span>
  ) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#ffffff",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 16px 40px"
    }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          fontSize: 11, letterSpacing: 5, textTransform: "uppercase",
          color: "#9ab", fontWeight: 600, marginBottom: 6
        }}>Visual Math</div>
        <h1 style={{
          fontSize: 28, fontWeight: 900, margin: 0, color: "#1a1a2e",
          letterSpacing: -1
        }}>Fraction Multiplication</h1>
        <p style={{ fontSize: 13, color: "#888", marginTop: 6, fontStyle: "italic" }}>
          Area Model — drag the sliders to explore
        </p>
      </div>

      {/* Main card */}
      <div style={{
        background: "#fff", border: "1.5px solid #e0e8f8",
        borderRadius: 20, boxShadow: "0 8px 40px #4f86f71a",
        padding: "28px 32px", width: "100%", maxWidth: 600
      }}>

        {/* Equation display */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 16, marginBottom: 28,
          padding: "16px 24px", background: "#f8faff",
          borderRadius: 14, border: "1px solid #e0e8f8"
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {renderFrac(aN, aD, "#d97706")}
            {mixedA && <span style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>= {renderMixed(mixedA, "#d97706")}</span>}
          </div>
          <span style={{ fontSize: 28, fontWeight: 300, color: "#aaa", lineHeight: 1 }}>×</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {renderFrac(bN, bD, "#059669")}
            {mixedB && <span style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>= {renderMixed(mixedB, "#059669")}</span>}
          </div>
          <span style={{ fontSize: 28, fontWeight: 300, color: "#aaa", lineHeight: 1 }}>=</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            {renderFrac(productN, productD, COLORS.overlap)}
            {(simpN !== productN || simpD !== productD) && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "#aaa" }}>simplified:</span>
                {renderFrac(simpN, simpD, "#4f86f7")}
              </div>
            )}
            {mixedP && renderMixed(mixedP, "#4f86f7")}
          </div>
        </div>

        {/* Sliders */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
          <FractionSlider label="Fraction A" numerator={aN} denominator={aD}
            onNumeratorChange={v => setAN(clamp(v, 1, 12))}
            onDenominatorChange={v => setAD(clamp(v, 1, 10))}
            color="#f59e0b" />
          <div style={{ height: 1, background: "#eef2ff" }} />
          <FractionSlider label="Fraction B" numerator={bN} denominator={bD}
            onNumeratorChange={v => setBN(clamp(v, 1, 12))}
            onDenominatorChange={v => setBD(clamp(v, 1, 10))}
            color="#10b981" />
        </div>

        {/* Area Model Grid */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            {/* Column header: A = aN/aD */}
            <div style={{
              position: "absolute", top: -22, left: 0, width: gridW,
              textAlign: "center", fontSize: 12, color: "#d97706", fontWeight: 700, letterSpacing: 1
            }}>
              ← {aN}/{aD} →
            </div>
            {/* Row header */}
            <div style={{
              position: "absolute", left: -38, top: 0, height: gridH,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "#059669", fontWeight: 700, letterSpacing: 1,
              writingMode: "vertical-rl", transform: "rotate(180deg)"
            }}>
              ↑ {bN}/{bD} ↓
            </div>

            {/* SVG Grid */}
            <svg width={gridW} height={gridH} style={{ display: "block", borderRadius: 6, overflow: "hidden" }}>
              {/* Cells */}
              {cells.map(({ r, c, fill }) => (
                <rect key={`${r}-${c}`}
                  x={c * cellW} y={r * cellH}
                  width={cellW} height={cellH}
                  fill={fill}
                  stroke="#fff" strokeWidth={1}
                />
              ))}

              {/* Unit grid lines (thick black borders around wholes) */}
              {Array.from({ length: colUnits + 1 }, (_, i) => (
                <line key={`vc-${i}`}
                  x1={i * aD * cellW} y1={0}
                  x2={i * aD * cellW} y2={gridH}
                  stroke="#111" strokeWidth={3.5}
                />
              ))}
              {Array.from({ length: rowUnits + 1 }, (_, i) => (
                <line key={`hr-${i}`}
                  x1={0} y1={i * bD * cellH}
                  x2={gridW} y2={i * bD * cellH}
                  stroke="#111" strokeWidth={3.5}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Legend + count */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center",
          marginBottom: 16
        }}>
          {[
            { color: COLORS.overlap, label: `Overlap (product): ${overlapCount} cells` },
            { color: COLORS.firstOnly, label: `Fraction A only` },
            { color: COLORS.secondOnly, label: `Fraction B only` },
            { color: COLORS.empty, label: `Neither` },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#666" }}>
              <div style={{ width: 14, height: 14, borderRadius: 3, background: color, border: "1px solid #ddd" }} />
              {label}
            </div>
          ))}
        </div>

        {/* Insight box */}
        <div style={{
          background: "#f0f5ff", borderLeft: `4px solid ${COLORS.overlap}`,
          borderRadius: "0 10px 10px 0", padding: "12px 18px",
          fontSize: 13, color: "#444", lineHeight: 1.7
        }}>
          <strong style={{ color: "#4f86f7" }}>How it works:</strong>{" "}
          The grid has <strong>{totalCols} × {totalRows}</strong> small squares = <strong>{totalCols * totalRows}</strong> total cells
          ({aD}×{bD} = {productD} per unit).
          The blue overlap region has <strong>{overlapCount}</strong> cells,
          which equals <strong>{productN}/{productD}</strong> of the whole
          {(simpN !== productN || simpD !== productD) && <> = <strong>{simpN}/{simpD}</strong></>}.
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: "#bbb", letterSpacing: 1 }}>
        FRACTION AREA MODEL · INTERACTIVE
      </div>
    </div>
  );
}
