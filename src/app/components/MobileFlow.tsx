"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";

type FlowState = 
  | "invitation" 
  | "threshold" 
  | "offering" 
  | "capture" 
  | "reading" 
  | "revelation"
  | "vignette" 
  | "archive" 
  | "decline"
  | "thesis";

interface VignetteResult {
  id: string;
  playName: string;
  playwright: string;
  script: string;
  theme: string;
  context: string;
  paraphrase: string;
  imageUrl: string;
}

// Raw text arrays to stitch together for the scrolling rows
const QUOTES = [
  { text: "I have that within which passeth show; These but the trappings and the suits of woe.", play: "Hamlet", author: "William Shakespeare" },
  { text: "The air bites shrewdly; it is very cold.", play: "Hamlet", author: "William Shakespeare" },
  { text: "Nothing to be done.", play: "Waiting for Godot", author: "Samuel Beckett" },
  { text: "Let’s go. (They do not move.)", play: "Waiting for Godot", author: "Samuel Beckett" },
  { text: "Time is the longest distance between two places.", play: "The Glass Menagerie", author: "Tennessee Williams" },
  { text: "I didn’t go to the moon, I went much further—for time is the longest distance between two places.", play: "The Glass Menagerie", author: "Tennessee Williams" },
  { text: "I don’t want realism. I want magic. Yes, yes—magic.", play: "A Streetcar Named Desire", author: "Tennessee Williams" },
  { text: "The whole orchard is white. The trees look like they’re covered in snow.", play: "The Cherry Orchard", author: "Anton Chekhov" },
  { text: "It’s snowing. What does it matter?", play: "Three Sisters", author: "Anton Chekhov" },
  { text: "We shall rest. We shall hear the angels.", play: "Uncle Vanya", author: "Anton Chekhov" },
  { text: "I must stand quite alone, if I am to understand myself and everything about me.", play: "A Doll’s House", author: "Henrik Ibsen" },
  { text: "Attention must be paid.", play: "Death of a Salesman", author: "Arthur Miller" },
  { text: "Truth and illusion. Who knows the difference?", play: "Who's Afraid of Virginia Woolf?", author: "Edward Albee" },
  { text: "We’ve been through it all before. Haven’t we?", play: "Top Girls", author: "Caryl Churchill" },
  { text: "The world only spins forward.", play: "Angels in America", author: "Tony Kushner" },
  { text: "It’s not that way. It’s over here.", play: "The Bald Soprano", author: "Eugène Ionesco" },
  { text: "I am tired of being myself.", play: "4.48 Psychosis", author: "Sarah Kane" },
  { text: "Perhaps my best years are gone. But I wouldn’t want them back.", play: "Krapp’s Last Tape", author: "Samuel Beckett" },
  { text: "I was born to share in love, not hate.", play: "Antigone", author: "Sophocles" },
  { text: "The flowers fall without a sound. Spring leaves without saying goodbye.", play: "The Peony Pavilion", author: "Tang Xianzu" }
];

// Helper to generate a dense, continuous row of formatted text for mobile
const generateRowText = (startIndex: number, count: number) => {
  let row = [];
  for (let i = 0; i < count; i++) {
    const q = QUOTES[(startIndex + i) % QUOTES.length];
    row.push(
      <span key={i} className="mr-8 md:mr-16 flex items-baseline gap-4 pointer-events-none">
        <span>“{q.text}”</span> 
        <span className="text-[var(--color-text-light)] text-xl md:text-3xl lg:text-4xl font-sans tracking-widest uppercase self-end mb-1 md:mb-2">— {q.play}, {q.author}</span>
        <span className="mx-8 md:mx-16"></span>
      </span>
    );
  }
  return row;
};

export default function MobileFlow() {
  const [flowState, setFlowState] = useState<FlowState>("invitation");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<VignetteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFinalPrompt, setShowFinalPrompt] = useState(false);
  const [userWord, setUserWord] = useState<string>("");
  
  // Spotlight effect for the thesis
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [spotlightActive, setSpotlightActive] = useState(false);
  const [thesisResolved, setThesisResolved] = useState(false);

  // When thesis loads, set a timer to resolve the spotlight after 12 seconds
  useEffect(() => {
    if (flowState === "thesis") {
      setSpotlightActive(true);
      const timer = setTimeout(() => setThesisResolved(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setSpotlightActive(false);
      setThesisResolved(false);
    }
  }, [flowState]);

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!spotlightActive || thesisResolved) return;
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    setMousePosition({ x: clientX, y: clientY });
  };

  // Safely handle the timeout on mount for the Invitation screen
  useEffect(() => {
    if (flowState === "invitation") {
      const timer = setTimeout(() => setShowFinalPrompt(true), 6000);
      return () => clearTimeout(timer);
    }
  }, [flowState]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setFlowState("capture"); // Move to Word Input state after upload
      }
    },
  });

  const getBaseUrl = () => {
    return typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  };

  const handleProcessMemory = async () => {
    if (!file) return;
    
    setFlowState("reading");
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      if (userWord) {
        formData.append("word", userWord);
      }

      const url = `${getBaseUrl()}/api/upload`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const data = await res.json();
      
      const absoluteImageUrl = data.imageUrl.startsWith("http") 
        ? data.imageUrl 
        : `${getBaseUrl()}${data.imageUrl}`;

      setResult({ ...data, imageUrl: absoluteImageUrl });
      setFlowState("revelation"); // Go to the poetic line-by-line reading first
    } catch (err: any) {
      console.error("Upload Error:", err);
      setError(err.message || "An error occurred during upload. Please try again.");
      setFlowState("capture");
    }
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      setFlowState("reading");
      const url = `${getBaseUrl()}/api/share`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: result.id }),
      });

      if (res.ok) {
        setFlowState("thesis");
      } else {
        throw new Error("Failed to share memory");
      }
    } catch (err) {
      console.error("Share Error:", err);
      setFlowState("vignette");
    }
  };

  const handleDiscard = async () => {
    if (!result) return;
    try {
      setFlowState("reading");
      const url = `${getBaseUrl()}/api/share`;
      await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: result.id }),
      });
      setFlowState("thesis");
    } catch (err) {
      console.error("Discard Error:", err);
      setFlowState("vignette");
    }
  };

  const resetFlow = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setUserWord("");
    setShowFinalPrompt(false);
    setFlowState("invitation");
  };

  const handleSaveToPhone = async () => {
    if (!preview || !result) return;

    // Load the image onto a temporary canvas
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = preview;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      // Set fixed, high-res canvas dimensions
      const width = 1080;
      const height = 1350; // 4:5 aspect ratio
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Draw the image (crop/fill to 4:5 ratio)
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;

      let drawWidth, drawHeight, drawX, drawY;

      if (imgAspect > canvasAspect) {
        // Image is wider than canvas
        drawHeight = height;
        drawWidth = img.width * (height / img.height);
        drawX = (width - drawWidth) / 2;
        drawY = 0;
      } else {
        // Image is taller than canvas
        drawWidth = width;
        drawHeight = img.height * (width / img.width);
        drawX = 0;
        drawY = (height - drawHeight) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // 2. Draw a dark gradient overlay
      const gradient = ctx.createLinearGradient(0, height * 0.4, 0, height);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // Semi-transparent full-screen dark wash to ensure text legibility
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(0, 0, width, height);

      // 3. Draw the Script Text
      ctx.fillStyle = "#f7f5f2"; // Off-white
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // We need to wrap text if it's too long
      const text = `“${result.script}”`;
      const maxTextWidth = width * 0.8;
      const fontSize = 36; // Smaller, more elegant font size for the download
      ctx.font = `italic 300 ${fontSize}px serif`;
      
      const words = text.split(' ');
      let lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        let word = words[i];
        let currentWidth = ctx.measureText(currentLine + " " + word).width;
        if (currentWidth < maxTextWidth) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);

      // Draw each line centered vertically
      const totalTextHeight = lines.length * (fontSize * 1.6);
      const startY = (height / 2) - (totalTextHeight / 2);

      lines.forEach((line, index) => {
        ctx.fillText(line, width / 2, startY + (index * fontSize * 1.6));
      });

      // 4. Draw the Play and Playwright elegantly in the bottom right corner
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      
      const titleSize = 20;
      ctx.font = `italic 300 ${titleSize}px serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText(result.playName, width - 40, height - 70);

      const authorSize = 14;
      ctx.font = `300 ${authorSize}px sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText(result.playwright.toUpperCase(), width - 40, height - 40);

      // 5. Trigger download of the composited image
      const compositedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.href = compositedDataUrl;
      link.download = `A_Memory_Rehearsed_${result.playName.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-background)] text-[var(--color-text-dark)] flex flex-col justify-center items-center overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: INVITATION (EDITORIAL TYPOGRAPHY) */}
        {flowState === "invitation" && (
          <div
            key="invitation"
            className="fixed inset-0 w-screen h-screen overflow-hidden font-sans cursor-pointer text-left block"
            onClick={(e) => {
              e.preventDefault();
              if (showFinalPrompt) setFlowState("threshold");
            }}
          >
            {/* FIXED TITLE */}
            <div className="absolute top-[8%] md:top-[10%] left-[6%] md:left-[8%] z-20 flex flex-col pointer-events-none transition-opacity duration-1000" style={{ opacity: showFinalPrompt ? 0 : 1 }}>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-medium tracking-wide" style={{ color: "var(--color-foreground)" }}>
                A Memory, Rehearsed
              </h1>
              <p className="text-sm md:text-xl lg:text-2xl tracking-wide leading-snug mt-2" style={{ color: "var(--color-text-light)" }}>
                an interactive encounter between<br />
                personal memory and its echoes in theatre
              </p>
            </div>

            {/* SCROLLING TEXT FIELD */}
            <div className="absolute top-[50%] md:top-[45%] w-full flex flex-col gap-y-1 md:gap-y-2 lg:gap-y-4 pointer-events-none transition-opacity duration-3000" style={{ opacity: showFinalPrompt ? 0.1 : 1 }}>
              {[0, 1, 2, 3, 4].map((row) => {
                const speedClass = ["speed-slow", "speed-medium", "speed-fast"][row % 3];
                const opacity = 0.85 + Math.random() * 0.15; // 0.85 to 1 opacity

                const sizeClass = [
                  "text-[3rem] md:text-[5rem] lg:text-[7rem] font-normal leading-[0.8]",
                  "text-[3.5rem] md:text-[5.5rem] lg:text-[8rem] font-medium leading-[0.8]",
                  "text-[4.5rem] md:text-[6.5rem] lg:text-[10rem] font-light tracking-tighter leading-[0.7]",
                  "text-[4rem] md:text-[6rem] lg:text-[9rem] font-semibold leading-[0.8]",
                ][row % 4];

                return (
                  <div
                    key={row}
                    className={`flex items-end whitespace-nowrap ${sizeClass} animate-marquee ${speedClass}`}
                    style={{ color: "var(--color-text-dark)", opacity, width: "fit-content" }}
                  >
                    <div className="flex items-end whitespace-nowrap px-8 md:px-16 pointer-events-none">
                      {generateRowText(row * 4, 8)}
                    </div>
                    <div className="flex items-end whitespace-nowrap px-8 md:px-16 pointer-events-none">
                      {generateRowText(row * 4, 8)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FINAL PROMPT FADE IN */}
            <AnimatePresence>
              {showFinalPrompt && (
                <motion.div
                  key="invitation-prompt"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2 }}
                  className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-center items-center text-center px-6 bg-[var(--color-background)]/80"
                >
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="text-base md:text-lg font-small tracking-wide mb-2 text-[var(--color-text-dark)]"
                  >
                    Return to your photos.
                  </motion.p>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, delay: 2.5 }}
                    className="text-base md:text-lg font-small tracking-wide text-[var(--color-foreground)]"
                  >
                    Something is already there<br />waiting.
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* STEP 2: THRESHOLD (Ethical Consent) */}
        {flowState === "threshold" && (
          <motion.div
            key="threshold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col justify-center p-8 space-y-16"
          >
            <div className="space-y-6 text-base md:text-xl text-[var(--color-text-dark)] leading-tight max-w-lg mx-auto text-center">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.5 }}>
                If you bring it here,<br/>it will enter a space of rehearsal.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 2 }}>
                It may be placed beside other moments, <br/> restaged,
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 3.5 }}>
                and find itself in relation<br/>to words that came before it.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 5 }}>
                You may continue,<br/>or leave it where it is.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 1.5, delay: 7 }}
              className="w-full max-w-lg mx-auto flex justify-between px-8"
            >
              <button
                onClick={() => setFlowState("decline")}
                className="text-[var(--color-text-light)] text-sm tracking-widest hover:text-[var(--color-foreground)] transition-all cursor-pointer"
              >
                Exit
              </button>
              <button
                onClick={() => setFlowState("offering")}
                className="text-[var(--color-foreground)] text-sm tracking-widest hover:text-[var(--color-text-dark)] transition-colors cursor-pointer"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 3: THE OFFERING (Upload Interface) */}
        {flowState === "offering" && (
          <motion.div
            key="offering"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center p-8"
          >
            <div
              {...getRootProps()}
              className="cursor-pointer group flex flex-col items-center justify-center"
            >
              <input {...getInputProps()} />
              <p className="text-base text-xl tracking-wide text-[var(--color-text-dark)] group-hover:text-[var(--color-foreground)] transition-colors text-center pb-2 border-b border-[var(--color-text-light)]">
                Place it here
              </p>
            </div>
            
            {error && (
              <p className="mt-8 text-[var(--color-foreground)] text-sm tracking-wider">{error}</p>
            )}
          </motion.div>
        )}

        {/* STEP 4: CAPTURE (Memory Description) */}
        {flowState === "capture" && preview && (
          <motion.div
            key="capture"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center p-8 space-y-16"
          >
            <div className="w-48 h-48 opacity-100">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={preview} alt="Selected Memory" className="w-full h-full object-cover rounded-sm" />
            </div>

            <div className="space-y-4 text-base md:text-xl text-[var(--color-text-dark)] text-center leading-relaxed max-w-lg mx-auto">
              <p>Stay with this image for a moment.</p>
              <p>What was happening when it was taken?</p>
              <p>Where were you, in your body, <br /> in your thoughts?</p>
            </div>

            <div className="w-full max-w-sm mx-auto flex flex-col items-center space-y-8">
              <div className="w-full relative">
                <input
                  id="user-word"
                  type="text"
                  value={userWord}
                  onChange={(e) => setUserWord(e.target.value)}
                  className="w-full bg-transparent border-b border-[var(--color-text-light)] pb-2 text-lg text-center focus:border-[var(--color-text-dark)] transition-colors"
                />
                {!userWord && (
                  <label htmlFor="user-word" className="absolute top-0 left-0 w-full text-center text-[var(--color-text-light)] pointer-events-none transition-opacity">
                    what comes to you *
                  </label>
                )}
              </div>
              
              <button
                onClick={() => {
                  if (userWord.trim().length > 0) {
                    handleProcessMemory();
                  }
                }}
                className={`text-sm tracking-widest transition-colors ${
                  userWord.trim().length > 0 
                    ? "text-[var(--color-foreground)] cursor-pointer hover:text-[var(--color-text-dark)]" 
                    : "text-[var(--color-text-light)]/30 cursor-default"
                }`}
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: THE READING (Processing) */}
        {flowState === "reading" && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col items-center justify-center space-y-8"
          >
            <p className="text-sm uppercase tracking-widest animate-pulse text-[var(--color-text-light)]">
              Reading...
            </p>
          </motion.div>
        )}

        {/* STEP 6: REVELATION (Poetic Dramaturgy Sequence) */}
        {flowState === "revelation" && result && (
          <motion.div
            key="revelation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col justify-center p-8 space-y-6"
          >
            <div className="space-y-6 text-base md:text-xl text-[var(--color-text-dark)] leading-tight max-w-lg mx-auto text-left">
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.5 }}>
                Your memory has been read.<br/>
                Not as data, but as a gesture.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 2 }}>
                This line comes from <span className="italic">{result.playName} </span> by {result.playwright}
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 4 }}>
                A work shaped by {result.theme}.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 6 }}>
                In it, there is a moment where<br/>
                {result.context}.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 9 }}>
                It meets what you described—<br/>
                {result.paraphrase}.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 11.5 }} className="text-[var(--color-foreground)]">
                Not as coincidence,<br/>but as return.
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ duration: 1.5, delay: 14 }}
              className="w-full max-w-lg mx-auto pt-8 text-center"
            >
              <button
                onClick={() => setFlowState("vignette")}
                className="text-[var(--color-text-dark)] text-sm tracking-widest hover:text-[var(--color-foreground)] transition-colors cursor-pointer"
              >
                See it
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* STEP 7: THE VIGNETTE (Result & Final Consent) */}
        {flowState === "vignette" && result && preview && (
          <motion.div
            key="vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full flex flex-col"
          >
            <div className="relative flex-1 w-full overflow-hidden flex flex-col">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Memory Preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8 bg-black/20">
                  <div className="text-base md:text-lg font-serif leading-tight tracking-wide text-white drop-shadow-lg text-balance italic w-full">
                    “{result.script}”
                  </div>
                  
                  <div className="absolute bottom-8 right-8 text-right space-y-1">
                    <p className="text-sm md:text-base font-serif text-white/90">
                      {result.playName}
                    </p>
                    <p className="text-xs font-sans tracking-widest text-[#ccc]">
                      {result.playwright}
                    </p>
                  </div>
              </div>
            </div>

            <div className="p-6 bg-[var(--color-background)] space-y-6">
              <button
                onClick={handleSaveToPhone}
                className="w-full text-xs tracking-widest text-[var(--color-text-light)] hover:text-[var(--color-text-dark)] transition-colors text-center cursor-pointer"
              >
                ↓ Save to your phone
              </button>

              <div className="text-sm text-center tracking-wide text-[var(--color-text-dark)]">
                <p>Will you leave this here?</p>
              </div>

              <div className="flex justify-between px-4 pb-2">
                <button
                  onClick={handleDiscard}
                  className="text-[var(--color-text-light)] text-sm tracking-widest hover:text-[var(--color-text-dark)] transition-all cursor-pointer"
                >
                  Keep it private
                </button>
                <button
                  onClick={handleShare}
                  className="text-[var(--color-foreground)] text-sm tracking-widest hover:text-[var(--color-text-dark)] transition-colors cursor-pointer"
                >
                  Offer to archive
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 8: THE THESIS (Interactive Constellation Sequence) */}
        {flowState === "thesis" && (
          <motion.div
            key="thesis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
            className="fixed inset-0 w-full h-full bg-[#121411] text-[#f7f5f2] font-sans font-light tracking-wide cursor-default overflow-hidden select-none"
            onMouseMove={handlePointerMove}
            onTouchMove={handlePointerMove}
          >
            {/* Spotlight Mask layer */}
            <motion.div 
              className="absolute inset-0 pointer-events-none transition-opacity duration-[3000ms]"
              style={{
                opacity: thesisResolved ? 1 : 1, // Keep the mask layer active
                background: thesisResolved 
                  ? "transparent" // Fade out the mask completely to reveal everything
                  : `radial-gradient(circle 180px at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,1) 0%, rgba(0,0,0,0.8) 100%)`,
                mixBlendMode: thesisResolved ? "normal" : "screen",
                backgroundColor: thesisResolved ? "transparent" : "#000",
              }}
            />

            {/* The Constellation / Resolved Poem container */}
            {/* We position the text scattered initially, then bring it together */}
            <div className={`w-full h-full relative transition-all duration-[4000ms] ${thesisResolved ? "flex flex-col items-center justify-center p-8 overflow-y-auto pt-32" : ""}`}>
              
              <div className={`relative w-full ${thesisResolved ? "max-w-lg mx-auto text-center space-y-2 pb-32" : "h-full"}`}>
                
                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "20vw", 
                  y: thesisResolved ? 0 : "15vh", 
                  opacity: thesisResolved ? 1 : 0.8
                }} className={`transition-all duration-[4000ms] absolute md:relative ${thesisResolved ? "relative" : "w-full text-left"}`}>
                  Memory does not stay still.
                </motion.p>
                
                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "5vw", 
                  y: thesisResolved ? 0 : "25vh", 
                  opacity: thesisResolved ? 1 : 0.7
                }} className={`transition-all duration-[4000ms] delay-100 absolute md:relative ${thesisResolved ? "relative" : "w-full text-right pr-12"}`}>
                  It returns in fragments,
                </motion.p>
                
                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "60vw", 
                  y: thesisResolved ? 0 : "40vh", 
                  opacity: thesisResolved ? 1 : 0.6
                }} className={`transition-all duration-[4000ms] delay-200 absolute md:relative ${thesisResolved ? "relative" : "w-full text-left"}`}>
                  in timing, in the way a body turns
                </motion.p>

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "10vw", 
                  y: thesisResolved ? 0 : "55vh", 
                  opacity: thesisResolved ? 1 : 0.8
                }} className={`transition-all duration-[4000ms] delay-300 absolute md:relative ${thesisResolved ? "relative" : "w-full text-center"}`}>
                  toward or away.
                </motion.p>
                
                <div className={`${thesisResolved ? "h-6 relative" : "hidden"}`} />

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "40vw", 
                  y: thesisResolved ? 0 : "70vh", 
                  opacity: thesisResolved ? 1 : 0.5
                }} className={`transition-all duration-[4000ms] delay-500 absolute md:relative ${thesisResolved ? "relative" : "w-full text-left pl-8"}`}>
                  It is rehearsed—
                </motion.p>
                
                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "15vw", 
                  y: thesisResolved ? 0 : "80vh", 
                  opacity: thesisResolved ? 1 : 0.9
                }} className={`transition-all duration-[4000ms] delay-700 absolute md:relative ${thesisResolved ? "relative" : "w-full text-right"}`}>
                  not consciously, but through living.
                </motion.p>

                <div className={`${thesisResolved ? "h-6 relative" : "hidden"}`} />

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "50vw", 
                  y: thesisResolved ? 0 : "10vh", 
                  opacity: thesisResolved ? 1 : 0.6
                }} className={`transition-all duration-[4000ms] delay-200 absolute md:relative ${thesisResolved ? "relative" : "w-full text-center"}`}>
                  Theatre is where nothing is owned,
                </motion.p>

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "25vw", 
                  y: thesisResolved ? 0 : "30vh", 
                  opacity: thesisResolved ? 1 : 0.7
                }} className={`transition-all duration-[4000ms] delay-400 absolute md:relative ${thesisResolved ? "relative" : "w-full text-left pl-12"}`}>
                  only performed again.
                </motion.p>
                
                <div className={`${thesisResolved ? "h-6 relative" : "hidden"}`} />

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "70vw", 
                  y: thesisResolved ? 0 : "50vh", 
                  opacity: thesisResolved ? 1 : 0.8
                }} className={`transition-all duration-[4000ms] delay-600 absolute md:relative ${thesisResolved ? "relative" : "w-full text-right pr-8"}`}>
                  A line passes from one voice to another.
                </motion.p>

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "10vw", 
                  y: thesisResolved ? 0 : "65vh", 
                  opacity: thesisResolved ? 1 : 0.5
                }} className={`transition-all duration-[4000ms] delay-800 absolute md:relative ${thesisResolved ? "relative" : "w-full text-left"}`}>
                  A gesture is borrowed, and altered,
                </motion.p>

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "45vw", 
                  y: thesisResolved ? 0 : "85vh", 
                  opacity: thesisResolved ? 1 : 0.6
                }} className={`transition-all duration-[4000ms] delay-1000 absolute md:relative ${thesisResolved ? "relative" : "w-full text-center"}`}>
                  and carried forward.
                </motion.p>

                <div className={`${thesisResolved ? "h-6 relative" : "hidden"}`} />

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "20vw", 
                  y: thesisResolved ? 0 : "20vh", 
                  opacity: thesisResolved ? 1 : 0.9
                }} className={`transition-all duration-[4000ms] delay-150 absolute md:relative ${thesisResolved ? "relative" : "w-full text-left pl-6"}`}>
                  What feels singular
                </motion.p>

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "65vw", 
                  y: thesisResolved ? 0 : "75vh", 
                  opacity: thesisResolved ? 1 : 0.7
                }} className={`transition-all duration-[4000ms] delay-300 absolute md:relative ${thesisResolved ? "relative" : "w-full text-right pr-6"}`}>
                  is often something that has already been staged.
                </motion.p>

                <div className={`${thesisResolved ? "h-6 relative" : "hidden"}`} />

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "30vw", 
                  y: thesisResolved ? 0 : "45vh", 
                  opacity: thesisResolved ? 1 : 0.8
                }} className={`transition-all duration-[4000ms] delay-600 absolute md:relative ${thesisResolved ? "relative" : "w-full text-center"}`}>
                  What you brought here was not only memory.
                </motion.p>

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "5vw", 
                  y: thesisResolved ? 0 : "10vh", 
                  opacity: thesisResolved ? 1 : 0.6
                }} className={`transition-all duration-[4000ms] delay-900 absolute md:relative ${thesisResolved ? "relative" : "w-full text-left pl-12"}`}>
                  It was a scene.
                </motion.p>
                
                <div className={`${thesisResolved ? "h-6 relative" : "hidden"}`} />

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "55vw", 
                  y: thesisResolved ? 0 : "60vh", 
                  opacity: thesisResolved ? 1 : 0.5
                }} className={`transition-all duration-[4000ms] delay-1100 absolute md:relative ${thesisResolved ? "relative" : "w-full text-right pr-12"}`}>
                  One that has been rehearsed across time—
                </motion.p>

                <motion.p animate={{ 
                  x: thesisResolved ? 0 : "15vw", 
                  y: thesisResolved ? 0 : "35vh", 
                  opacity: thesisResolved ? 1 : 0.7
                }} className={`transition-all duration-[4000ms] delay-1200 absolute md:relative ${thesisResolved ? "relative" : "w-full text-center"}`}>
                  in other lives, in other languages, in other bodies.
                </motion.p>

                <div className={`${thesisResolved ? "h-12 relative" : "hidden"}`} />

                {/* FINAL STAGE: The powerful punchline fades in only once it resolves */}
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: thesisResolved ? 1 : 0 }} 
                  transition={{ duration: 3, delay: 4 }}
                  className={`${thesisResolved ? "relative block" : "hidden"}`}
                >
                  <p className="text-[var(--color-foreground)] font-medium">
                    You did not arrive at it alone.
                  </p>
                  <p className="text-[var(--color-foreground)] font-medium">
                    And you do not leave it alone.
                  </p>
                </motion.div>
              </div>

              {/* Fixed initial prompt to tell them to explore the darkness */}
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: thesisResolved ? 0 : 1 }}
                transition={{ duration: 2 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 mix-blend-difference"
              >
                <p className="text-[#f7f5f2]/50 uppercase tracking-[0.3em] text-xs font-mono">
                  Move to unearth
                </p>
              </motion.div>

              {/* Extremely delayed soft return button, fades in almost like an afterthought */}
              <motion.button
                initial={{ opacity: 0 }} 
                animate={{ opacity: thesisResolved ? 1 : 0 }} 
                transition={{ duration: 3, delay: 8 }}
                onClick={resetFlow}
                className={`${thesisResolved ? "relative block" : "hidden"} mt-15 text-[var(--color-text-light)] text-sm tracking-widest hover:text-[var(--color-foreground)] transition-colors cursor-pointer mx-auto`}
              >
                Return
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

