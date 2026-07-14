## Pitch Deck: "Daily Voice Journal" (Budfi) — Acquisition Pitch

I'll generate a downloadable 12-slide PPTX at `/mnt/documents/budfi-pitch-deck.pptx` using `pptxgenjs`, with a dark-slate + teal palette matching the app's aesthetic. Each slide will be visually varied (stat cards, icon rows, two-column layouts) — no generic bullet walls.

### Slide outline

1. **Cover** — Budfi / Daily Voice Journal · "AI-Powered Wellness Journaling Platform" · asking price $150K+ · contact info.
2. **The Problem** — Journaling apps are static; users lack insight, accountability, and healing tools. Mental wellness market is booming but fragmented.
3. **The Solution** — All-in-one AI wellness platform: journaling + voice + goals + AI insights + community + sound therapy.
4. **Product Overview** — Screenshot-style mock of the gamified dashboard with feature callouts.
5. **Core Features (Free tier)** — Text/voice journaling, mood tracking, gamified goals calendar, hour-based activity logging, todo & calendar widgets, frequency sound therapy, Google Calendar sync, profile system.
6. **Premium Features (Paid tier)** — AI Insights (Gemini 2.5), AI Chat coach with full-context personalization, Community feed, Dream analysis, natural-language journal search.
7. **Tech Stack & Architecture** — React 18 + Vite + TS + Tailwind, Supabase (Auth/DB/Storage/Edge Functions), Lovable AI Gateway (Gemini), Razorpay payments, ElevenLabs voice agent "Meera", RLS-secured RBAC admin panel.
8. **Monetization** — Razorpay live: ₹199/mo · ₹1,999/yr (India) · $4.99/mo · $49.99/yr (Intl). Premium gating on high-value AI features. Admin dashboard for subscription control.
9. **Market Opportunity** — Digital mental wellness market ~$7B → $17B by 2030 · journaling apps segment growing 15%+ CAGR · India-first with global pricing built in.
10. **What's Included in Sale** — Full source code, Supabase schema + edge functions, Razorpay integration, admin panel, ElevenLabs + Lovable AI integration, deployment configs (Hostinger `.htaccess`), all legal pages (Privacy/Refund/Contact/Pricing), branded landing page.
11. **Growth Levers for Buyer** — Mobile app wrapper, B2B corporate wellness licensing, therapist-referral network, expand ElevenLabs voice interactions, affiliate/referral program, more premium tiers.
12. **The Ask & Contact** — Asking **$150,000+** (open to offers) · turnkey transfer of code, database, integrations · Contact: info@budfi.in · +91-9439044619.

### Technical details

- Script: `/tmp/build_deck.js` using `pptxgenjs` (already available per skill).
- 1920×1080 slide size, dark-slate `#0F172A` background with teal `#14B8A6` accents and amber `#F59E0B` highlights (matches Dashboard).
- Fonts: Georgia headers, Calibri body.
- Layouts vary per slide: stat cards, 2-col split, icon+text rows, hero cover, closing CTA.
- QA: convert to PDF via `run_libreoffice.py`, render slide images with `pdftoppm`, view each image, fix issues, re-render.
- Final output: `<presentation-artifact path="budfi-pitch-deck.pptx" mime_type="application/vnd.openxmlformats-officedocument.presentationml.presentation">`.

No app code will be modified — this is a document-generation task only.
