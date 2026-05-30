// Mock data so EVERY teammate can build their UI before the API is live.
// Also the demo-day fallback: with no API key, /api/decode returns these.
// ONE coherent timeline (today is 2026-05-30): coverage ENDS Jun 12, renewal DEADLINE Jun 5.
import type { DecodeResult, ExpressResult } from "./types";

export const MOCK_DECODE: DecodeResult = {
  title: {
    en: "A renewal notice from Kern County Medi-Cal about your health coverage.",
    es: "Un aviso de renovación de Medi-Cal del Condado de Kern sobre su cobertura médica.",
  },
  meaning: {
    en: "Your Medi-Cal coverage will end on June 12 unless you renew. The county needs you to confirm your household income to keep you covered. If you miss the deadline, you and your kids could lose health insurance.",
    es: "Su cobertura de Medi-Cal terminará el 12 de junio a menos que la renueve. El condado necesita que confirme los ingresos de su hogar para mantener su cobertura. Si no cumple con la fecha límite, usted y sus hijos podrían perder el seguro médico.",
  },
  action: {
    en: "Renew by June 5 — online at BenefitsCal.com or by calling Kern County DHS at (661) 631-6062. Have last month's pay stubs ready before you start.",
    es: "Renueve antes del 5 de junio — en línea en BenefitsCal.com o llamando al Departamento de Servicios Humanos del Condado de Kern al (661) 631-6062. Tenga listos los talones de pago del mes pasado antes de comenzar.",
  },
  deadline: "2026-06-05",
  urgency: "urgent",
  draftReply: {
    en: "Hello, I received my Medi-Cal renewal notice. I want to renew and keep my coverage. I have last month's pay stubs ready to confirm my income — please tell me how to send them and confirm my renewal is on file before June 5. Thank you very much. — María",
    es: "Hola, recibí mi aviso de renovación de Medi-Cal. Deseo renovar y mantener mi cobertura. Tengo listos los talones de pago del mes pasado para confirmar mis ingresos — por favor dígame cómo enviarlos y confirme que mi renovación quede registrada antes del 5 de junio. Muchas gracias. — María",
  },
};

// Persona-linked: same María, now answering the letter — keeps one story across both tabs.
export const MOCK_EXPRESS: ExpressResult = {
  kind: "Message to the Kern County Medi-Cal office",
  formatted:
    "Hello, my name is María. I'm calling about my Medi-Cal renewal — my notice says my coverage ends June 12. I'd like to confirm my income and make sure my renewal is complete before the June 5 deadline. What documents do you need from me? Thank you.",
  note: "Turned your worry into a calm, clear message you can read out loud on the call.",
};
