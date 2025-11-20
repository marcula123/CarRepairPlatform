/**
 * AI Service for generating task suggestions
 *
 * This is a boilerplate implementation. Replace the mock implementation
 * with actual AI API calls (e.g., OpenAI, Anthropic, etc.)
 */

/**
 * AI Service for generating task suggestions
 */

import { generateText } from "ai";

export interface TaskSuggestion {
  title: string;
  description: string | null;
  estimatedMinutes: number | null;
}

export interface CarInfo {
  id: number;
  regNr: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
}

/* Legger til API for å forbedre taskSuggestion (Oppgave 2) */

/**
 * Generate AI-powered task suggestions for a car
 *
 * @param carInfo - Information about the car
 * @returns Array of task suggestions
 */
export async function generateTaskSuggestions(
  carInfo: CarInfo
): Promise<TaskSuggestion[]> {
  const { text } = await generateText({
    model: "openai/gpt-4.1-mini",
    temperature: 0.6,
    prompt: `Du er en del av en del av en nettside som skal gi vedlikeholdsoppgaver til biler for mekanikeren. Basert på informasjon under skal du lage 3 konkrete vedlikeholdsoppgaver. Oppgavene skal være praktiske ting en mekaniker faktisk kan gjøre. Returner KUN et gyldig JSON-array på formen: [{"title": , "description":, "estimatedMinutes":}]. Der estimatedMinutes er en int. Du skal ikke ha noen markdown eller annet format enn dette, ingen andre kommentarer eller forklarende tekst heller. Bilinformasjonen er:- Registreringsnummer: ${carInfo.regNr} - Merke: ${carInfo.make} - Modell: ${carInfo.model} - Årsmodell: ${carInfo.year} - Farge: ${carInfo.color} `,
  });

  const parsed = JSON.parse(text);
  const suggestions: TaskSuggestion[] = (parsed as any[]).map((item, index) => {
    const rawTitle = item?.title ?? `Vedlikeholdsoppgave ${index + 1}`;
    const rawDescription = item?.description ?? null;
    let estimated: number | null = null;
    if (typeof item?.estimatedMinutes === "number") {
      // sjekking
      const n = Math.round(item.estimatedMinutes);
      if (n >= 15 && n <= 240) {
        estimated = n;
      }
    }
    return {
      title: String(rawTitle).slice(0, 120),
      description: rawDescription ? String(rawDescription).slice(0, 500) : null,
      estimatedMinutes: estimated,
    };
  });

  return suggestions;
}
