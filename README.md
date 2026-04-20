# A Memory, Rehearsed

*An interactive encounter between personal memory and its echoes in theatre.*

This project is a two-fold web application designed for a physical gallery exhibition. It explores the thesis that "there is nothing new under the sun"—that our most isolated, intimate, and unique memories are actually universal human conditions that have already been recorded in classical, modern, and experimental literature.

**Current Save Point:** The application has been fully refactored into a 10-step poetic state machine. The global aesthetic is soft, minimal, and non-app-like, functioning as a "stage holding time." The gallery polling works in true real-time, bypassing aggressive Next.js caching logic. The AI curation pulls from an *infinite* dataset of real theater plays. The final thesis screen has been converted into an interactive "Illuminated Memory" discovery.

---

## 🎭 The User Experience (The 10-Step Journey)

Participants in the gallery interact with a large exhibition monitor displaying a dynamic, full-screen analog filing cabinet of "directories." By scanning a QR code on the screen, participants join the interactive experience from their mobile phones.

1. **The Invitation (`invitation`)**: The user sees an ethereal, text-based interface. Dense serif typography drifts slowly across a muted background. A sequence emerges: *"Return to your photos. Something is already there waiting."*
2. **The Threshold (`threshold`)**: The user is presented with the ethical consent mapped out as a poem: *"If you bring it here, it may not remain yours alone..."*
3. **The Offering (`offering`)**: Rather than taking a new photo, participants are asked to return to their existing images via their camera roll: *"Place it here"*.
4. **The Capture (`capture`)**: The selected photo is shown faded/grayscale. A soft prompt asks: *"What was happening when it was taken?"*. The user MUST enter an intuitive word or short phrase (*"what comes to you"*).
5. **The Reading (`reading`)**: The image and text are sent to the AI Curator for processing.
6. **The Revelation (`revelation`)**: The AI responds not just with a quote, but with a full dramaturgical interpretation. It is revealed line-by-line using `framer-motion`: *"Your memory has been read... This line comes from [Play]... In it, there is a moment where [context]..."*
7. **The Vignette (`vignette`)**: The user's image reappears, composited with the quote. They are given two choices: *"Keep it private"* or *"Offer to archive"*. They may also click `"↓ Save to your phone"` which downloads a high-quality HTML5 `<canvas>` composite of their photo and the text.
8. **The Thesis / Illuminated Memory (`thesis`)**: Whether shared or declined, the journey concludes with an interactive reflection. The screen turns black. As the user moves their finger (*"Move to unearth"*), a luminous spotlight follows their touch, revealing fragments of the 27-line poem drifting through the darkness (*"Memory does not stay still..."*). After 12 seconds, the darkness fades away and the poem snaps into a structured stanza, cementing the project's thesis before the loop resets.

---

## 🏗️ Technical Architecture

This application is built as a highly robust, fully local Next.js application to ensure low latency and privacy during a live gallery exhibition.

### Frontend
- **Framework:** Next.js 16 (App Router), React
- **Styling:** Tailwind CSS. 
- **Aesthetic Constraints:** 
  - `font-sans` is the global default. 
  - Background is uniformly `--color-background` (`#f7f5f2`). 
  - Primary text is `--color-text-dark` (`#2a2a2a`). 
  - Accent/Title text is stark red (`#D7261E`).
  - Inputs and buttons have completely transparent backgrounds with no outlines, maintaining a literary, "page-like" feel.
- **Image Compositing:** When downloading a Vignette, an off-screen `<canvas>` scales the image to 4:5, paints a dark gradient for legibility, word-wraps the quote in an elegant italic serif font, and triggers a `.jpg` download.

### Backend & Storage
- **Database:** Local **SQLite** (using `better-sqlite3`). The schema stores the AI fields: `theme`, `context`, and `paraphrase`.
- **File Storage:** Images are saved directly to `public/uploads/`.
- **Caching & Polling:** The `/api/gallery` endpoint uses `export const dynamic = 'force-dynamic'` and `revalidate = 0`. The frontend `MonitorView.tsx` uses a randomized timestamp parameter (`?t=...`) inside its 5-second `setInterval` loop to guarantee that new images appear in the gallery in true real-time, bypassing Next.js cache.
- **Dynamic Routing & CORS (CRITICAL FOR MOBILE):** 
  - To ensure mobile phones don't crash with `fetch` errors, `next.config.ts` has `allowedDevOrigins` set to the host computer's IP (e.g. `172.19.133.35`). 
  - The frontend uses `typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL` to dynamically ensure that fetches resolve over the local network.

### AI Curator (Gemini)
- **Model:** Google Gemini 2.5 Flash (`@google/genai` SDK).
- **Infinite Library Scope:** The AI prompt is explicitly instructed to search from an unconstrained, *infinite* pool of diverse theatrical works (Classical, Modern, Experimental).
- **Structured Output:** The prompt takes both the base64-encoded image and the user's mandatory phrase, returning a strict JSON object containing:
  - `playName` & `playwright`
  - `script` (the exact quote)
  - `theme` (1-2 words)
  - `context` (A poetic, non-academic description of the scene)
  - `paraphrase` (A poetic echo of the user's provided `word` input)

---

## 🚀 How to Run Locally

### 1. Prerequisites
Ensure the host exhibition computer has [Node.js](https://nodejs.org/) installed.

### 2. Environment Variables
Create a `.env.local` file:
\`\`\`env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_BASE_URL=http://your_local_ip_address:3000
\`\`\`

### 3. Update `next.config.ts`
Ensure the host computer's IP is authorized in `next.config.ts` so phones don't hit CORS blocks:
\`\`\`ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "172.19.133.35",
    "http://172.19.133.35:3000" // Update this to match your current local IP
  ]
};
export default nextConfig;
\`\`\`

### 4. Start the Server
\`\`\`bash
npm run dev
\`\`\`

### 5. Access
- **Monitor View:** Open `http://localhost:3000` on the exhibition computer.
- **Mobile Flow:** Scan the QR code, which directs the phone to the local network IP `/upload` route.