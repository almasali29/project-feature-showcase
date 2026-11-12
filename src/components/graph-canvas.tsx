import { useId, useRef, useState } from "react";
import type { DiagramEdge, DiagramNode } from "@/lib/manuscript";

export type GraphNode = DiagramNode & { detail?: string; tone?: "primary" | "accent" | "secondary" };
export function GraphCanvas({ nodes, edges, onSelect, onMove, label = "Interactive graph" }: { nodes: GraphNode[]; edges: DiagramEdge[]; onSelect?: (id: string) => void; onMove?: (id: string, x: number, y: number) => void; label?: string }) {
  const svg = useRef<SVGSVGElement>(null); const [dragging, setDragging] = useState<string | null>(null); const marker = `arrow-${useId().replace(/:/g, "")}`;
  const point = (id: string) => nodes.find((n) => n.id === id);
  return <svg ref={svg} viewBox="0 0 100 60" className="h-auto min-h-72 w-full touch-none rounded-md border border-border bg-card" role="group" aria-label={label} onPointerMove={(e) => { if (!dragging || !onMove || !svg.current) return; const r = svg.current.getBoundingClientRect(); onMove(dragging, Math.max(11, Math.min(89, ((e.clientX - r.left) / r.width) * 100)), Math.max(8, Math.min(52, ((e.clientY - r.top) / r.height) * 60))); }} onPointerUp={() => setDragging(null)} onPointerLeave={() => setDragging(null)}>
    <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--muted-foreground)" /></marker></defs>
    {edges.map((edge) => { const a = point(edge.from); const b = point(edge.to); if (!a || !b) return null; return <g key={edge.id}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--muted-foreground)" strokeWidth="0.35" markerEnd={`url(#${marker})`} />{edge.label && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 1} textAnchor="middle" fontSize="2.2" fill="var(--muted-foreground)">{edge.label}</text>}</g>; })}
    {nodes.map((node) => <g key={node.id} role="button" tabIndex={0} aria-label={node.detail ? `${node.label}: ${node.detail}` : node.label} className={onSelect || onMove ? "cursor-pointer" : ""} onClick={() => onSelect?.(node.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect?.(node.id); }} onPointerDown={(e) => { if (!onMove) return; e.currentTarget.setPointerCapture(e.pointerId); setDragging(node.id); onSelect?.(node.id); }}>
      <rect x={node.x - 10} y={node.y - 4} width="20" height="8" rx="1.2" fill={node.tone === "accent" ? "var(--accent)" : node.tone === "secondary" ? "var(--secondary)" : "var(--card)"} stroke="var(--primary)" strokeWidth="0.4" />
      <text x={node.x} y={node.y + 0.8} textAnchor="middle" fontSize="2.4" fill="var(--foreground)">{node.label.length > 22 ? `${node.label.slice(0, 21)}…` : node.label}</text>
    </g>)}
  </svg>;
}
