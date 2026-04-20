"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Folder, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Memory {
  id: string;
  play_name: string;
  playwright: string;
  script_text: string;
  image_url: string;
  created_at: string;
}

interface PlayFolder {
  playName: string;
  playwright: string;
  memories: Memory[];
  previewImage: string;
  count: number;
}

export default function MonitorView({ baseUrl }: { baseUrl: string }) {
  const [folders, setFolders] = useState<PlayFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<PlayFolder | null>(null);
  const [hiddenTextIds, setHiddenTextIds] = useState<Set<string>>(new Set());
  const [originUrl, setOriginUrl] = useState<string>(baseUrl);

  const uploadUrl = `${originUrl}/upload`;

  // Safely mount client origin so SSR doesn't use the hardcoded local IP from .env
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const toggleText = (id: string) => {
    setHiddenTextIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Fetch gallery data
  const fetchGallery = async () => {
    try {
      // Append a cache-busting timestamp so the browser never serves a stale JSON payload
      const cacheBuster = new Date().getTime();
      const res = await fetch(`${originUrl}/api/gallery?t=${cacheBuster}`, {
        cache: 'no-store', // explicitly tell Next.js/Browser not to cache
      });
      if (!res.ok) throw new Error(`Gallery fetch failed: ${res.status}`);
      
      const data = await res.json();
      if (data.folders) {
        setFolders(data.folders);
      }
    } catch (err) {
      console.error("Failed to fetch gallery", err);
    }
  };

  // Poll for updates every 5 seconds to keep the monitor live
  useEffect(() => {
    fetchGallery();
    const interval = setInterval(fetchGallery, 5000);
    return () => clearInterval(interval);
  }, [originUrl]);

  return (
    <div className="w-full min-h-screen bg-[var(--color-background)] text-[var(--color-text-dark)] flex flex-col overflow-hidden font-sans relative">
      
      {/* Main Content Area (Full Width Folders) */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!activeFolder ? (
            // Rolodex / Filing Cabinet Stacked View
            <motion.div
              key="folder-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pt-24 px-12 overflow-y-auto pb-48"
            >
              
              {folders.length === 0 ? (
                <div className="flex items-center justify-center h-full text-[var(--color-text-light)] uppercase tracking-widest text-sm font-bold">
                  The archive is currently empty.
                </div>
              ) : (
                <div className="relative w-full max-w-4xl mx-auto flex flex-col">
                  {folders.map((folder, index) => {
                    // Alternate tab position left/right/center
                    const tabPosition = index % 3 === 0 ? 'justify-start' : index % 3 === 1 ? 'justify-center' : 'justify-end';
                    
                    return (
                      <div 
                        key={folder.playName}
                        className="relative w-full transition-transform duration-300 hover:-translate-y-4"
                        style={{ marginTop: index === 0 ? '0' : '-160px', zIndex: index }}
                      >
                        {/* The Folder Tab */}
                        <div className={`flex w-full px-8 ${tabPosition}`}>
                          <div 
                            className="bg-[#f2e7d3] text-[var(--color-text-dark)] px-6 py-2 rounded-t-xl border-t border-l border-r border-black/10 shadow-md flex items-center gap-4 cursor-pointer hover:bg-white transition-colors"
                            onClick={() => setActiveFolder(folder)}
                          >
                            <span className="text-xs font-mono font-bold tracking-widest border border-[var(--color-text-dark)] px-2 py-0.5 rounded-sm">
                              {index.toString().padStart(3, '0')}
                            </span>
                            <span className="text-sm font-bold tracking-wider uppercase text-[var(--color-foreground)]">
                              {folder.playName}
                            </span>
                          </div>
                        </div>

                        {/* The Folder Body */}
                        <button
                          onClick={() => setActiveFolder(folder)}
                          className="w-full h-48 bg-[#f2e7d3] rounded-b-xl rounded-tr-xl border border-black/10 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center relative overflow-hidden group hover:bg-[#e6dcd0] transition-colors cursor-pointer"
                        >
                          {/* Inner subtle texture line */}
                          <div className="absolute top-4 left-4 right-4 bottom-4 border border-black/10 opacity-30 rounded-lg pointer-events-none" />
                          
                          <div className="flex flex-col items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity z-10 relative">
                            <Folder className="w-10 h-10 text-[var(--color-text-light)] mb-3 group-hover:text-[var(--color-text-dark)] transition-colors" />
                            <p className="text-xs text-[var(--color-text-light)] uppercase tracking-widest font-bold group-hover:text-[var(--color-foreground)] transition-colors">
                              {folder.count} {folder.count === 1 ? "Scene" : "Scenes"}
                            </p>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            // Active Folder Details
            <motion.div
              key="folder-details"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute inset-0 flex flex-col bg-[var(--color-background)] text-[var(--color-text-dark)] pb-24"
            >
              {/* Header */}
              <div className="p-8 border-b border-black/10 flex justify-between items-center bg-[#ebe7de] shadow-sm z-20">
                <div>
                  <p className="text-xs text-[var(--color-text-light)] uppercase tracking-[0.3em] mb-1 font-mono font-bold">
                    Directory // {activeFolder.playwright}
                  </p>
                  <h2 className="text-3xl uppercase tracking-widest font-bold text-[var(--color-foreground)]">
                    {activeFolder.playName}
                  </h2>
                </div>
                <button 
                  onClick={() => setActiveFolder(null)}
                  className="p-4 hover:bg-black/10 transition-colors rounded-full text-[var(--color-text-dark)] cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Memories List */}
              <div className="flex-1 overflow-y-auto p-12 bg-[var(--color-background)]">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                  {activeFolder.memories.map((memory) => {
                    const isHidden = hiddenTextIds.has(memory.id);
                    return (
                      <div 
                        key={memory.id} 
                        onClick={() => toggleText(memory.id)}
                        className="relative aspect-[4/5] bg-black group overflow-hidden shadow-2xl rounded-sm cursor-pointer border-[8px] border-[var(--color-vintage-cream)]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={memory.image_url.startsWith("http") ? memory.image_url : `${originUrl}${memory.image_url}`} 
                          alt="Scene"
                          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isHidden ? "opacity-100" : "opacity-70 group-hover:opacity-40"}`}
                        />
                        
                        <div className={`absolute inset-0 p-8 flex flex-col items-center justify-center text-center transition-opacity duration-700 ${isHidden ? "opacity-0" : "bg-gradient-to-t from-black/90 via-transparent to-black/90"}`}>
                          <div className={`text-sm md:text-base font-serif font-medium leading-loose tracking-wide text-[#f7f5f2] drop-shadow-md text-balance transition-opacity duration-700 italic ${isHidden ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}>
                             "{memory.script_text}"
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Bottom Bar: QR Code & Project Info */}
      <div className="absolute bottom-0 left-0 w-full bg-[var(--color-background)] border-t border-black/10 p-6 flex justify-between items-center z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col">
          <h1 className="text-2xl lg:text-3xl tracking-tighter font-bold text-[var(--color-foreground)]">
            A Memory, Rehearsed
          </h1>
          <p className="text-[var(--color-text-light)] font-medium tracking-widest text-xs mt-1">
            An interactive encounter between personal memory and its echoes in theatre.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-light)] text-right">
            Scan to contribute<br />your own scene
          </p>
          <div className="bg-[#ebe7de] p-2 rounded-sm shadow-md border border-black/10">
            <QRCodeSVG value={uploadUrl} size={64} fgColor="#2a2a2a" bgColor="#ebe7de" />
          </div>
        </div>
      </div>

    </div>
  );
}
