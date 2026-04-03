"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessageComponent, ChatLoadingSkeleton, TypingIndicator } from "./ChatMessage";
import { ChatMessage } from "@/lib/types";
import { sendMessageStream, enhancePrompt } from "@/lib/api";
import {
  Paperclip,
  FileText,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Globe,
  FileSpreadsheet,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  sessionId: string;
  messages: ChatMessage[];
  onNewMessage: (userMsg: ChatMessage, assistantMsg: ChatMessage) => void;
  onGenerateReport: () => void;
  isThinking?: boolean;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  currentFile: { filename: string; preview: any } | null;
  isUploading: boolean;
  onShowTools?: () => void;
}

export default function ChatInterface({
  sessionId,
  messages,
  onNewMessage,
  onGenerateReport,
  isThinking = false,
  onFileSelect,
  onRemoveFile,
  currentFile,
  isUploading,
  onShowTools,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [".csv", ".xlsx", ".pdf"];
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
      alert("Only CSV, XLSX, PDF allowed");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Max 10MB");
      return;
    }

    onFileSelect(file);
    e.target.value = "";
  };

  const handleEnhance = async () => {
    if (!input.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(input);
      if (enhanced && enhanced !== input && enhanced.length > 5) {
        setInput(enhanced);
      }
    } catch (err) {
      console.error("Enhance failed:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const [streamingContent, setStreamingContent] = useState<{
    steps: string[];
    sections: Record<string, string>;
    charts: string[];
    isComplete: boolean;
  }>({
    steps: [],
    sections: {},
    charts: [],
    isComplete: false,
  });

  const handleSend = async (retryContent?: string) => {
    const q = (retryContent || input).trim();
    if (!q || !sessionId || isLoading) return;

    if (!retryContent) {
      setInput("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
    
    setIsLoading(true);
    setError(null);
    setFailedMessage(null);
    setStreamingContent({
      steps: [],
      sections: {},
      charts: [],
      isComplete: false,
    });

    const userMsg: ChatMessage = { role: "user", content: q };

    try {
      let finalText = "";
      let finalCharts: string[] = [];
      let finalCode = "";

      await sendMessageStream(sessionId, q, (chunk) => {
        switch (chunk.type) {
          case "step":
            setStreamingContent((prev) => ({
              ...prev,
              steps: [...prev.steps, chunk.content || ""],
            }));
            break;
          case "section":
            setStreamingContent((prev) => ({
              ...prev,
              sections: {
                ...prev.sections,
                [chunk.section || ""]: chunk.content || "",
              },
            }));
            break;
          case "charts":
            setStreamingContent((prev) => ({
              ...prev,
              charts: new Array(chunk.count || 0).fill(""),
            }));
            break;
          case "complete":
            finalText = chunk.text || "";
            finalCharts = chunk.charts || [];
            finalCode = chunk.code || "";
            setStreamingContent((prev) => ({
              ...prev,
              charts: finalCharts,
              isComplete: true,
            }));
            break;
          case "error":
            throw new Error(chunk.content || "Stream error");
        }
      });

      // Create final message
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: finalText,
        plotly_json: finalCharts[0] || null,
        charts: finalCharts,
        code: finalCode,
      };
      onNewMessage(userMsg, assistantMsg);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Failed to get response";
      setError(errorText);
      setFailedMessage(q);
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `**Error:** ${errorText}`,
      };
      onNewMessage(userMsg, errorMsg);
    } finally {
      setIsLoading(false);
      setStreamingContent({
        steps: [],
        sections: {},
        charts: [],
        isComplete: false,
      });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleRetry = () => {
    if (failedMessage) {
      handleSend(failedMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Show empty state
  const showEmptyState = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {/* File Chip at Top */}
        {currentFile && (
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-100 px-4 py-3">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800">{currentFile.filename}</p>
                  <p className="text-[11px] text-slate-500">{currentFile.preview.shape.rows.toLocaleString()} rows</p>
                </div>
                <button 
                  onClick={onRemoveFile}
                  className="ml-1 p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {showEmptyState && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
                <span className="text-2xl font-bold text-white">B</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to analyze your data</h3>
              <p className="text-sm text-slate-500">Upload a file and ask any question about it</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isLastAssistant = i === messages.length - 1 && msg.role === "assistant";
            return (
              <MessageBubble
                key={i}
                message={msg}
                isLast={i === messages.length - 1}
                onRetry={msg.role === "assistant" && msg.content.startsWith("**Error:**") ? handleRetry : undefined}
                streamingSteps={isLastAssistant && isLoading ? streamingContent.steps : []}
                streamingSections={isLastAssistant && isLoading ? streamingContent.sections : {}}
              />
            );
          })}

          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm max-w-[90%]">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm focus-within:shadow-md focus-within:border-indigo-300 transition-all">
            <div className="flex items-start gap-3 p-3">
              <button
                type="button"
                onClick={triggerFileUpload}
                className="mt-1 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What data or problem to analyze? Type @ for mentions and / for shortcuts."
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-slate-800 placeholder:text-slate-400 resize-none py-2 min-h-[40px] max-h-[120px]"
              />
              
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "mt-1 p-2 rounded-xl transition-all",
                  input.trim()
                    ? "bg-slate-800 text-white hover:bg-slate-700 shadow-md"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowRight className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleEnhance}
              disabled={isEnhancing || !input.trim()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                isEnhancing || !input.trim()
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              )}
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Enhance
                </>
              )}
            </button>

            <button
              onClick={onGenerateReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Generate Report
            </button>

            <div className="flex-1" />
            
            <span className="text-[11px] text-slate-400">
              AI may make mistakes. Please verify important information.
            </span>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv,.xlsx,.pdf"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isLast,
  onRetry,
  streamingSteps = [],
  streamingSections = {},
}: {
  message: ChatMessage;
  isLast: boolean;
  onRetry?: () => void;
  streamingSteps?: string[];
  streamingSections?: Record<string, string>;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] sm:max-w-[75%] bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3 rounded-[20px] rounded-br-md text-[15px] leading-relaxed shadow-lg shadow-indigo-500/20">
          {message.content}
        </div>
      </div>
    );
  }

  const isError = message.content.startsWith("**Error:**");

  return (
    <div className="flex flex-col items-start w-full">
      <div className={cn(
        "max-w-[95%] w-full space-y-2",
        isError && "opacity-80"
      )}>
        <div className={cn(
          "bg-white border rounded-2xl rounded-bl-md p-5 shadow-sm",
          isError ? "border-red-200 bg-red-50" : "border-slate-200"
        )}>
          <ChatMessageComponent 
            message={message} 
            streamingSteps={streamingSteps}
            streamingSections={streamingSections}
          />
        </div>

        {/* Message Actions */}
        <div className="flex items-center gap-1 pl-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
