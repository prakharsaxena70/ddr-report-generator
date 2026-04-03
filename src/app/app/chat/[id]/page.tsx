"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import PDFImageViewer from "@/components/PDFImageViewer";
import { getSession, sendMessageStream, uploadFile } from "@/lib/api";
import { ChatMessage, DataPreview, PDFData } from "@/lib/types";
import { Loader2, FileImage } from "lucide-react";


export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentFile, setCurrentFile] = useState<{ filename: string; preview: DataPreview; pdfData?: PDFData } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load session data when page loads
  useEffect(() => {
    if (!sessionId) return;
    
    const loadSession = async () => {
      try {
        setIsLoading(true);
        const session = await getSession(sessionId);
        
        if (session) {
          setMessages(session.messages || []);
          setCurrentFile({
            filename: session.filename,
            preview: {
              shape: session.file_meta?.shape || { rows: 0, columns: 0 },
              columns: session.file_meta?.columns || [],
              preview: session.file_meta?.preview || [],
            },
            pdfData: session.file_meta?.pdf_data,
          });
        }
      } catch (err) {
        console.error("Failed to load session:", err);
        setError("Failed to load chat session");
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  const handleNewMessage = (userMsg: ChatMessage, assistantMsg: ChatMessage) => {
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
  };

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await uploadFile(file);
      
      // Update URL to new session
      router.push(`/app/chat/${response.session_id}`);
      
      setCurrentFile({
        filename: response.filename,
        preview: response.preview,
        pdfData: response.pdf_data,
      });
      setMessages([]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setCurrentFile(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-slate-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/app")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const hasPdfImages = currentFile?.pdfData && (currentFile.pdfData.images.length > 0 || currentFile.pdfData.pages.length > 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {hasPdfImages ? (
        <div className="flex h-full">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <ChatInterface
              sessionId={sessionId}
              messages={messages}
              onNewMessage={handleNewMessage}
              onGenerateReport={() => {}}
              isThinking={false}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              currentFile={currentFile}
              isUploading={isUploading}
            />
          </div>
          
          {/* PDF Images Sidebar */}
          <div className="w-[400px] border-l border-slate-200 bg-slate-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                Document Images
              </h3>
              <PDFImageViewer 
                images={currentFile!.pdfData!.images} 
                pages={currentFile!.pdfData!.pages} 
              />
            </div>
          </div>
        </div>
      ) : (
        <ChatInterface
          sessionId={sessionId}
          messages={messages}
          onNewMessage={handleNewMessage}
          onGenerateReport={() => {}}
          isThinking={false}
          onFileSelect={handleFileSelect}
          onRemoveFile={handleRemoveFile}
          currentFile={currentFile}
          isUploading={isUploading}
        />
      )}
    </div>
  );
}
