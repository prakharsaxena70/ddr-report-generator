"use client";

import { useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Download, Maximize2, BarChart3 } from "lucide-react";

// Use createPlotlyComponent with the minified dist to avoid SSR issues
const Plot = dynamic(
  () =>
    import("react-plotly.js").then((mod) => {
      return mod;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">Loading chart...</span>
        </div>
      </div>
    ),
  }
);

interface PlotlyChartProps {
  dataJson: string;
  chartId?: string;
}

export default function PlotlyChart({ dataJson, chartId }: PlotlyChartProps) {
  const { data, layout, isValid } = useMemo(() => {
    try {
      const parsed = JSON.parse(dataJson);
      
      if (!parsed || !parsed.data || !Array.isArray(parsed.data) || parsed.data.length === 0) {
        return { data: [], layout: {}, isValid: false };
      }
      
      // Apply premium color palette if using default colors
      const premiumColors = [
        "#6366f1", "#8b5cf6", "#a855f7", "#06b6d4",
        "#10b981", "#f59e0b", "#ef4444", "#ec4899",
        "#3b82f6", "#14b8a6",
      ];
      
      const styledData = (parsed.data || []).map((trace: Record<string, unknown>, i: number) => ({
        ...trace,
        marker: {
          ...(typeof trace.marker === 'object' && trace.marker !== null ? trace.marker : {}),
          color:
            (typeof trace.marker === 'object' && trace.marker !== null && (trace.marker as Record<string, unknown>).color)
              ? (trace.marker as Record<string, unknown>).color
              : premiumColors[i % premiumColors.length],
          opacity: 0.9,
        },
      }));

      return {
        data: styledData,
        layout: {
          ...(parsed.layout || {}),
          autosize: true,
          margin: { l: 50, r: 30, t: 50, b: 50 },
          paper_bgcolor: "transparent",
          plot_bgcolor: "rgba(248, 250, 252, 0.5)",
          font: { family: "Inter, sans-serif", size: 12, color: "#475569" },
          title: {
            ...(typeof parsed.layout?.title === 'object' ? parsed.layout.title : { text: parsed.layout?.title }),
            font: { family: "Inter, sans-serif", size: 15, color: "#1e293b", weight: 600 },
          },
          xaxis: {
            ...(parsed.layout?.xaxis || {}),
            gridcolor: "rgba(226, 232, 240, 0.5)",
            zerolinecolor: "rgba(226, 232, 240, 0.8)",
          },
          yaxis: {
            ...(parsed.layout?.yaxis || {}),
            gridcolor: "rgba(226, 232, 240, 0.5)",
            zerolinecolor: "rgba(226, 232, 240, 0.8)",
          },
        },
        isValid: true,
      };
    } catch (e) {
      console.error("Chart parse error:", e);
      return { data: [], layout: {}, isValid: false };
    }
  }, [dataJson]);

  if (!isValid || !data.length) {
    return (
      <div className="h-[400px] rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border border-slate-200">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <BarChart3 className="h-8 w-8" />
          <span className="text-xs font-medium">Chart unavailable</span>
        </div>
      </div>
    );
  }

  const handleDownloadPNG = useCallback(() => {
    const id = chartId || "plotly-chart";
    const plotEl = document.getElementById(id);
    if (plotEl) {
      import("plotly.js-dist-min").then((Plotly) => {
        Plotly.downloadImage(plotEl, {
          format: "png",
          width: 1200,
          height: 700,
          filename: "datachat-chart",
        });
      });
    }
  }, [chartId]);

  if (!data.length) return null;

  const id = chartId || "plotly-chart";

  return (
    <div className="relative mt-3 rounded-xl border border-border/50 bg-white/80 backdrop-blur-sm p-3 shadow-sm hover:shadow-md transition-shadow duration-300">
      <Plot
        divId={id}
        data={data}
        layout={layout}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: [
            "lasso2d",
            "select2d",
          ] as string[],
        }}
        style={{ width: "100%", height: "400px" }}
        useResizeHandler
      />
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownloadPNG}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground bg-white/80 backdrop-blur-sm rounded-lg shadow-sm"
        >
          <Download className="h-3.5 w-3.5" />
          PNG
        </Button>
      </div>
    </div>
  );
}
