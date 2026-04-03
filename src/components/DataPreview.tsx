"use client";

import { DataPreview as DataPreviewType } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Rows3,
  Columns3,
  Download,
  Search,
  Maximize2,
  Table2,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataPreviewProps {
  preview: DataPreviewType;
  filename: string;
  compact?: boolean;
  onDownload?: () => void;
  onExpand?: () => void;
}

export default function DataPreview({
  preview,
  filename,
  compact = false,
  onDownload,
  onExpand,
}: DataPreviewProps) {
  if (!preview || preview.columns.length === 0) return null;

  return (
    <div className="flex flex-col h-full bg-[#0f1117] overflow-hidden">
      {/* Table Header Controls */}
      <div className="h-12 border-b border-white/5 flex items-center justify-between px-5 bg-[#0f1117] shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <Table2 className="h-4 w-4 text-indigo-400" />
            <span>Table View</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider hover:text-white cursor-pointer transition-colors">
            <LayoutGrid className="h-4 w-4" />
            <span>Visualization</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onDownload} variant="ghost" size="sm" className="h-8 gap-2 text-[10.5px] font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Dataset Summary Stats Bar */}
      <div className="px-5 py-3.5 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 shrink-0 overflow-hidden">
           <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/20 shrink-0">
              <Table2 className="h-4 w-4 text-indigo-400" />
           </div>
           <div className="min-w-0">
             <p className="text-[12px] font-bold text-white truncate">{filename}</p>
             <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-tighter">Dataset Preview</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="h-7 rounded-lg gap-1.5 px-3 border-white/10 bg-white/5 text-[10px] font-bold text-slate-400">
             <Rows3 className="h-3 w-3 text-indigo-400" />
             {preview.shape.rows.toLocaleString()} rows
           </Badge>
           <Badge variant="outline" className="h-7 rounded-lg gap-1.5 px-3 border-white/10 bg-white/5 text-[10px] font-bold text-slate-400">
             <Columns3 className="h-3 w-3 text-indigo-400" />
             {preview.shape.columns} columns
           </Badge>
        </div>
      </div>

      {/* Actual Data Table Window */}
      <div className="flex-1 overflow-auto bg-[#0f1117]">
        <Table className="relative min-w-full">
          <TableHeader className="bg-[#1a1d24] sticky top-0 z-20">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="w-12 text-center text-[10px] font-bold uppercase text-slate-500 p-0 border-r border-white/5 tracking-widest">
                ID
              </TableHead>
              {preview.columns.map((col) => {
                const colName = typeof col === "string" ? col : col.name;
                const colType = typeof col === "string" ? null : col.dtype;
                return (
                  <TableHead
                    key={colName}
                    className="px-5 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left min-w-[150px]"
                  >
                    <div className="flex flex-col group cursor-pointer hover:text-white transition-colors">
                      <div className="flex items-center justify-between">
                        {colName}
                        <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {colType && (
                        <span className="text-[9px] text-slate-500 font-medium lowercase tracking-tight">
                          {colType}
                        </span>
                      )}
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody className="bg-[#0f1117]">
            {preview.preview.map((row, i) => (
              <TableRow
                key={i}
                className="group border-white/5 hover:bg-white/5 transition-colors"
              >
                <TableCell className="w-12 text-center text-[11px] font-bold text-slate-500 bg-white/5 border-r border-white/5 group-hover:bg-white/10 transition-colors tabular-nums">
                  {i + 1}
                </TableCell>
                {preview.columns.map((col) => {
                  const colName = typeof col === "string" ? col : col.name;
                  return (
                    <TableCell
                      key={colName}
                      className="px-5 py-3.5 text-[12.5px] text-slate-300 font-medium transition-colors"
                    >
                      {(row[colName] ?? "").toString() || (
                        <span className="h-1.5 w-8 rounded-full bg-white/10 block opacity-50" />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
