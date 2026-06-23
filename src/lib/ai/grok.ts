// Servicio de IA (Grok / xAI). Único punto de contacto con la API.
// La capa de dominio NUNCA llama a la API directamente. Ver docs/02-prompts-grok.md.

import {
  PROMPT_CORRECCION,
  PROMPT_AMPLIACION,
  PROMPT_SUPERVISION,
  type EstandarRedaccion,
  DEFAULT_ESTANDAR,
} from "./prompts";

const GROK_API_BASE_URL = process.env.GROK_API_BASE_URL ?? "https://api.x.ai/v1";
const GROK_MODEL = process.env.GROK_MODEL ?? "grok-2-latest";

interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function chat(messages: GrokMessage[], temperature: number): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("GROK_API_KEY no configurada");

  const res = await fetch(`${GROK_API_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: GROK_MODEL, messages, temperature }),
  });

  if (!res.ok) {
    throw new Error(`Grok API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("Respuesta de Grok inválida");
  return content.trim();
}

/** (1) Corrige ortografía/gramática sin ampliar ni inventar. */
export async function corregir(descripcionContratista: string): Promise<string> {
  return chat(
    [
      { role: "system", content: PROMPT_CORRECCION.system },
      { role: "user", content: PROMPT_CORRECCION.user({ descripcionContratista }) },
    ],
    0.3,
  );
}

/** (2) Amplía/profesionaliza el texto al estándar institucional (configurable por tenant). */
export async function ampliar(args: {
  textoObligacionContrato: string;
  descripcionContratista: string;
  estandar?: EstandarRedaccion;
}): Promise<{ texto: string; promptVersion: string; modelo: string }> {
  const estandar = args.estandar ?? DEFAULT_ESTANDAR;
  const texto = await chat(
    [
      { role: "system", content: PROMPT_AMPLIACION.system(estandar) },
      {
        role: "user",
        content: PROMPT_AMPLIACION.user({
          textoObligacionContrato: args.textoObligacionContrato,
          descripcionContratista: args.descripcionContratista,
        }),
      },
    ],
    0.6,
  );
  return { texto, promptVersion: PROMPT_AMPLIACION.version, modelo: GROK_MODEL };
}

/** (3) Genera el informe de supervisión en 3ª persona a partir del informe de actividades. */
export async function generarInformeSupervision(args: {
  nombreContratista: string;
  numeroContrato: string;
  objetoContrato: string;
  numeroCuota: number;
  informeActividadesCompleto: string;
}): Promise<{ texto: string; promptVersion: string; modelo: string }> {
  const texto = await chat(
    [
      { role: "system", content: PROMPT_SUPERVISION.system },
      { role: "user", content: PROMPT_SUPERVISION.user(args) },
    ],
    0.4,
  );
  return { texto, promptVersion: PROMPT_SUPERVISION.version, modelo: GROK_MODEL };
}
