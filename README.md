# Minna 🧠

En personlig assistent som kommer ihåg åt dig, och tjatar tills det är gjort. Den kan användas privat, på jobbet och i skolan.

## Kom igång

```bash
npm install
npm run dev
```

Öppna sedan http://localhost:3000

## Det här finns nu (steg 1–2)

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
  app/            sidor: Idag (/), /paminnelser, /rutiner, /schema, /installningar
  components/     UI-komponenter + NagEngine (tjat-motorn)
  lib/
    types.ts      datamodell
    store.tsx     tillstånd + lagring
    nag.ts        när det ska tjatas
    checklists.ts rutiner och packlistor
    messages.ts   texter per ton
```

## Nästa steg

3. AI-assistent (Claude API): skriv eller prata naturligt, till exempel "påminn mig på fredag att ringa tandläkaren".
4. Google Kalender och Gmail.
5. Jobbfunktioner: mötesförberedelser, uppföljningar, veckorapport.
6. Konto och synk (Supabase) och push-notiser när appen är stängd.
7. Mobilapp med Expo.
