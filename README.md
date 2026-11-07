# Minna

> Engelsk app med ljus, redaktionell design. Presentationssida på `/`, själva appen på `/app`.

En personlig assistent som kommer ihåg åt dig, och tjatar tills det är gjort. Den kan användas privat, på jobbet och i skolan.

## Kom igång

```bash
npm install
npm run dev
```

Öppna sedan http://localhost:3000

## Chatt med Minna (AI)

Skriv eller prata som till en person, till exempel *"Jag har kemiprov på torsdag"* eller *"Gör en packlista för gymmet måndagar och torsdagar"*. Minna lägger in påminnelser, rutiner och packlistor automatiskt. Varje sak den skapar kan ångras direkt i chatten.

Chatten kräver en API-nyckel från **OpenAI** (https://platform.openai.com/api-keys) eller **Claude** (https://console.anthropic.com). Finns `OPENAI_API_KEY` används OpenAI, annars Claude.

- **Lokalt:** kopiera `.env.example` till `.env.local` och fyll i nyckeln.
- **Vercel:** Settings → Environment Variables → lägg till `OPENAI_API_KEY` (och gärna `MINNA_ACCESS_CODE`), och publicera om.

Om du sätter `MINNA_ACCESS_CODE` måste samma kod anges i appen under Inställningar → Chatt. Det hindrar andra som hittar länken från att använda din API-nyckel.

Tekniskt: `src/app/api/chat/route.ts` väljer leverantör och anropar den via `src/lib/assistant/providers/`. Verktygen (`src/lib/assistant/tools.ts`) körs i webbläsaren (`src/lib/assistant/execute.ts`), där all data finns.

## Det här finns nu (steg 1–3)

- **Områden:** Privat 🏠, Jobb 💼 och Skola 🎒. Slå på de du vill ha.
- **Påminnelser** med tid, upprepning och **tjat-nivå** (av / mild / normal / mamma-läge).
- **Idag-vy:** det som väntar, senare idag, checklistor och imorgon.
- **Rutiner och checklistor**, till exempel "Innan du går hemifrån" eller "Planera arbetsdagen".
- **Skolschema:** Du får packlista kvällen innan och en morgonkoll, utifrån vilka ämnen du har.
- **Ton:** varm, saklig eller rolig.
- **Arbetstid:** inga jobbnotiser utanför arbetstid.
- **Notiser** i webbläsaren, och appen kan läggas på hemskärmen (PWA).
- **Backup:** exportera och importera data.

All data sparas lokalt i webbläsaren (localStorage).

## Struktur

```
src/
  app/page.tsx    presentationssidan (/)
  app/app/        appen: /app (Today), /app/chat, /app/tasks, /app/mom-mode,
                  /app/routines, /app/school, /app/memory, /app/settings, /app/more
  components/     UI-komponenter + NagEngine (tjat-motorn)
  components/Core.tsx  Minna Core (produktbild + diskreta tillstånd i CSS)
  components/site/     presentationssidans komponenter
  lib/
    types.ts      datamodell
    store.tsx     tillstånd + lagring
    nag.ts        när det ska tjatas
    checklists.ts rutiner och packlistor
    messages.ts   texter per ton
```

## Nästa steg

4. Google Kalender och Gmail.
5. Jobbfunktioner: mötesförberedelser, uppföljningar, veckorapport.
6. Konto och synk (Supabase) och push-notiser när appen är stängd.
7. Mobilapp med Expo.

## Bilder

Higgsfield-bilderna ligger i `public/assets/minna-editorial/`:

- `minna-organize.png`, `minna-workflow.png`, `minna-mom-mode.png`: de levererade bilderna
- `minna-core-product.png`: kärnan utklippt (rund mask) ur `minna-organize.png`

Saknas fortfarande: `minna-hero-editorial.png`, `minna-hero-mobile.png`, `minna-memory.png`,
`minna-onboarding.png`, `minna-social-og.png`. Sidan använder kärnan eller ren typografi i stället.
