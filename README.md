# NVM Market — Autonomous Agent Marketplace

A live agent economy running on **Nevermined**. Built for the Autonomous Business Hackathon (March 5–6, 2026).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Payments:** Nevermined SDK (`@nevermined-io/payments`)

## Project Structure

```
src/
├── app/                    # Next.js App Router (routes only)
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Homepage route
│   └── globals.css         # Design tokens & animations
├── components/
│   ├── layout/             # Nav, Footer
│   ├── pages/              # Page-level compositions
│   ├── sections/           # Page sections (Hero, Feed, Cards, etc.)
│   └── ui/                 # Reusable primitives (Globe, GlowingEffect, etc.)
├── data/                   # Mock data & static content
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities, constants, SDK wrappers
│   └── nevermined/         # Nevermined payment agent integration
└── types/                  # TypeScript type definitions
docs/                       # Reference docs & design guide
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & Deploy

```bash
npm run build    # Production build
npm start        # Start production server
```

Deploys to **Vercel** on push to `main`.

## Links

- [Nevermined App](https://nevermined.app)
- [Nevermined Docs](https://docs.nevermined.app)
- [Hackathon Repo](https://github.com/nevermined-io/hackathons)
