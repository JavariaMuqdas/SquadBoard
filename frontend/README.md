# SquadBoard — Frontend

Group Project Task Tracker for student teams. React + Vite + Tailwind CSS.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## Libraries
- **tailwindcss** — styling (theme in `tailwind.config.js`)
- **framer-motion** — animations
- **lucide-react** — icons
- **react-router-dom** — routing
- **react-helmet-async** — per-page SEO tags

## Structure
```
src/
  components/layout/   Navbar, Footer
  components/home/     Home page sections (Hero, Features, HowItWorks, ReportShowcase, Audience, Pricing, Faq, FinalCta)
  components/ui/       Seo, Reveal (scroll animation), SectionHeading, Logo
  data/home.js         All Home page text content in one place
  pages/Home.jsx       Home page + SEO + JSON-LD
public/                favicon, robots.txt, sitemap.xml
```

`/api` requests are proxied to Laravel on `http://127.0.0.1:8000` during development (see `vite.config.js`).

See **ROADMAP.md** for the full build plan.
