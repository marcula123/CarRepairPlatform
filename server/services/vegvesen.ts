import { StringFormatParams } from "zod/v4/core";

/* Statens vegvesens kjøretøyAPI*/
const VEGVESEN_BASE_URL =
  "https://kjoretoyoppslag.atlas.vegvesen.no/ws/no/vegvesen/kjoretoy/kjoretoyoppslag/v1";
export interface VegvesenCar {
  make: string;
  model: string;
  year: number;
  color: string;
}

/**
 * Finner informasjonen til bilen som søkes etter
 *
 * @param inputRegNr - Registreringsnummeret til bilen
 * @returns VegvesenCar interfacet
 */

export async function carLookUp(inputRegNr: string): Promise<VegvesenCar> {
  const regNr = inputRegNr.trim().toUpperCase();
  const response = await fetch(
    `${VEGVESEN_BASE_URL}/kjennemerkeoppslag/kjoretoy/${encodeURIComponent(
      regNr
    )}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Finner ikke ${regNr} i Statens Vegvesen");
  }

  const data: any = await response.json();

  const technical = data?.tekniskKjoretoy;
  const registration = data?.registrering;
  const make: string = technical?.merke ?? "Ukjent";
  const model: string = technical?.handelsbetegnelse ?? "Ukjent";
  const firstRegDate = registration?.forstegangsregistrering;

  if (!firstRegDate) {
    throw new Error("Mangler førstegangsregistrering fra Vegvesenet");
  }

  const year = Number(String(firstRegDate).slice(0, 4));

  if (Number.isNaN(year)) {
    throw new Error("Klarte ikke å tolke år fra førstegangsregistrering");
  }

  const color: string = technical?.karosseri.farge ?? null;
  return { make, model, year, color };
}
