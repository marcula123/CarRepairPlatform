# Kodeoppgave | Askeladden Interns 2026

Vi skal bygge neste generasjons plattform for bilverksteder, og vi trenger hjelp til å løfte den til et nytt nivå. Vi har laget en enkel verksted-applikasjon som demonstrerer grunnfunksjonaliteten, men den har flere kjente feil og mangler som trenger oppmerksomhet.

## Kjente feil og mangler

### 1. Manglende integrasjon med Statens vegvesens kjøretøy-API

Når man legger til en ny bil, lagres ikke informasjon om merke, modell, år eller farge

- Forbedre brukergrensesnittet slik at denne informasjonen registreres og lagres i databasen
- Integrer med Statens vegvesens kjøretøy-API for automatisk utfylling av bilinformasjon basert på registreringsnummer

Eksempel på oppslag mot vegvesenet for bil med registreringsnummer EK12345:

```
https://kjoretoyoppslag.atlas.vegvesen.no/ws/no/vegvesen/kjoretoy/kjoretoyoppslag/v1/kjennemerkeoppslag/kjoretoy/EK12345
```

### 2. Forslag til vedlikeholdsoppgaver er det samme for hver bil

Redesign funksjonaliteten for `task_suggestions` slik at applikasjonen bruker en LLM for å generere forslag til vedlikeholdsoppgaver basert på informasjon om bilen. Bruk [Vercel AI SDK](https://ai-sdk.dev/)

Vi har laget en API-nøkkel for [Vercel AI Gateway](https://vercel.com/ai-gateway) til deg [her](https://share.1password.com/s#W5u1lUpHAgCREw6uLyTK8MoUXJaWRq4ntY_zJuTFbkQ). Denne legger du så til i `.env.local` i rot av repoet:

```sh
AI_GATEWAY_API_KEY=putt_api_nøkkel_her
```

### 3. Detaljesiden for bil fungerer dårlig

Forbedre siden slik at verkstedansatte enkelt kan planlegge og følge opp arbeidsdagen sin.

Noen kjente problemer med siden:

- Man kan opprette ubegrenset mange oppgaver uten kontroll eller validering
- Statusknappene endrer kun farge og har ingen faktisk funksjon
- Vanskelig å få oversikt over oppgaver (gjort, pågår, venter)
- Ingen tidsestimat på oppgaver

## Din oppgave

Din oppgave er å velge ut ett eller flere forbedringsområder, enten ved å fikse feil, forbedre brukeropplevelsen eller utvikle ny funksjonalitet

**Hva vi forventer:**

- Velg ett eller flere forbedringsområder du ønsker å jobbe med (trenger ikke være med i listen)
- Hvis noe ikke gikk som planlagt, eller du har flere ideer enn du rakk å implementere, dokumenter det i README.md så vet vi hva du har tenkt
- Instrukser for hvordan levere oppgaven finner dere [her](https://docs.google.com/forms/d/e/1FAIpQLScduGFnX-5ML1Xgvl0aqOkLCUT6M5oJ2DE0yh0GbDyll2jAvw/viewform?usp=sharing&ouid=114956975980227072759)

## Få prosjektet opp å kjøre

**Krav:**

- Node.js 18+
- npm

### 1. Installer pakker

```bash
npm install
```

### 2. Initialiser databasen

Kjør migrasjoner for å sette opp SQLite-databasen:

```bash
npm run db:push
```

### 3. Start utviklingsserver

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Databasehåndtering

### Drizzle Studio

Se og administrer databasen med Drizzle Studio:

```bash
npm run db:studio
```

Åpner et GUI på [https://local.drizzle.studio](https://local.drizzle.studio) hvor du kan bla gjennom tabeller, redigere poster og inspisere skjema.

## Prosjektstruktur

- `app/` - Next.js app router sider og API-ruter
- `server/` - tRPC router og server-side tjenester
- `db/` - Databaseskjema og konfigurasjon
- `components/` - React-komponenter
- `utils/` - Hjelpefunksjoner og tRPC-oppsett på klientsiden

## Teknologier

Applikasjonen er bygget på en moderne webstack som ligner det vi bruker i produksjon:

- **Next.js** 16 med App Router
- **TypeScript** for full typesikkerhet
- **tRPC** for typesikker kommunikasjon mellom frontend og backend
- **Drizzle ORM** for typesikker databasehåndtering
- **SQLite** med følgende tabeller:
  - `cars` - Informasjon om biler (registreringsnummer, merke, modell, årgang, farge)
  - `tasks` - Arbeidsoppgaver knyttet til biler (tittel, beskrivelse, status)
  - `task_suggestions` - AI-genererte forslag til vedlikeholdsoppgaver
- **Tailwind CSS** for styling

