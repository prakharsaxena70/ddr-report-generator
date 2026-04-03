"use client";

import { useState } from "react";
import { PDFImage, PDFPage } from "@/lib/types";
import { ImageIcon, FileImage, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PDFImageViewerProps {
  images: PDFImage[];
  pages: PDFPage[];
}

export default function PDFImageViewer({ images, pages }: PDFImageViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const hasImages = images && images.length > 0;
  const hasPages = pages && pages.length > 0;

  if (!hasImages && !hasPages) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-slate-500">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No images found in document</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      <Tabs defaultValue={hasImages ? "images" : "pages"} className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-slate-100">
          <TabsTrigger value="images" disabled={!hasImages} className="text-xs">
            <FileImage className="h-3 w-3 mr-1" />
            Images ({images.length})
          </TabsTrigger>
          <TabsTrigger value="pages" disabled={!hasPages} className="text-xs">
            <FileImage className="h-3 w-3 mr-1" />
            Pages ({pages.length})
          </TabsTrigger>
        </TabsList>

        {hasImages && (
          <TabsContent value="images" className="m-0">
            <div className="p-4">
              <div className="relative bg-white rounded-lg border border-slate-200 overflow-hidden mb-3">
                <img
                  src={images[currentImageIndex].base64}
                  alt={`Image ${currentImageIndex + 1}`}
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
              
              {images.length > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                    disabled={currentImageIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    {currentImageIndex + 1} / {images.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                    disabled={currentImageIndex === images.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-slate-500 mt-2 text-center">
                Page {images[currentImageIndex].page} • Image {images[currentImageIndex].index}
              </p>
            </div>
          </TabsContent>
        )}

        {hasPages && (
          <TabsContent value="pages" className="m-0">
            <div className="p-4">
              <div className="relative bg-white rounded-lg border border-slate-200 overflow-hidden mb-3">
                <img
                  src={pages[currentPageIndex].base64}
                  alt={`Page ${currentPageIndex + 1}`}
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              </div>
              
              {pages.length > 1 && (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                    disabled={currentPageIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-slate-600">
                    {currentPageIndex + 1} / {pages.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                    disabled={currentPageIndex === pages.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-slate-500 mt-2 text-center">
                Page {pages[currentPageIndex].page} • {pages[currentPageIndex].width}x{pages[currentPageIndex].height}
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
