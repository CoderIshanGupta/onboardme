// apps/web/src/components/MermaidDiagram.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

export default function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current || !chart) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        darkMode: true,
        background: "#0f172a",
        primaryColor: "#22d3ee",
        primaryTextColor: "#f8fafc",
        primaryBorderColor: "#06b6d4",
        lineColor: "#a855f7",
        secondaryColor: "#c084fc",
        tertiaryColor: "#f0abfc",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: "16px",
        nodeTextColor: "#ffffff",
      },
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        nodeSpacing: 60,
        rankSpacing: 100,
        padding: 20,
        useMaxWidth: false,
      },
    });

    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);

        if (ref.current) {
          ref.current.innerHTML = svg;

          // Style the SVG for better visibility
          const svgElement = ref.current.querySelector("svg");
          if (svgElement) {
            svgElement.style.minWidth = "100%";
            svgElement.style.minHeight = "500px";
            svgElement.style.maxHeight = "800px";
            svgElement.removeAttribute("height");
            
            // Make text more visible
            const texts = svgElement.querySelectorAll("text");
            texts.forEach((text) => {
              text.style.fontSize = "14px";
              text.style.fontWeight = "500";
            });

            // Make nodes larger
            const nodes = svgElement.querySelectorAll(".node rect, .node circle, .node polygon");
            nodes.forEach((node) => {
              (node as SVGElement).style.strokeWidth = "2px";
            });
          }
          setError(false);
        }
      } catch (err) {
        console.error("Mermaid rendering failed:", err);
        setError(true);
      }
    };

    renderDiagram();
  }, [chart]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-400 mb-4">📊 Architecture diagram could not be rendered</p>
        <details className="text-left">
          <summary className="text-cyan-400 cursor-pointer hover:text-cyan-300">
            View raw diagram code
          </summary>
          <pre className="mt-4 text-xs text-slate-400 bg-slate-800 p-4 rounded-lg overflow-auto max-h-64">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Zoom Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            −
          </button>
          <span className="text-slate-400 text-sm min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            +
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors ml-2"
          >
            Reset
          </button>
        </div>
        <p className="text-slate-500 text-sm">
          💡 Scroll to pan • Use zoom controls to resize
        </p>
      </div>

      {/* Diagram Container */}
      <div
        className="overflow-auto rounded-xl border border-slate-700 bg-slate-950"
        style={{ maxHeight: "600px" }}
      >
        <div
          ref={ref}
          className="mermaid-container flex justify-center items-center p-8 transition-transform duration-200"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            minHeight: "500px",
          }}
        />
      </div>
    </div>
  );
}