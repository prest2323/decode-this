// Mock data so EVERY teammate can build their UI before the API is live.
// Import these in your component during development.
import type { DecodeResult, ExpressResult } from "./types";

export const MOCK_DECODE: DecodeResult = {
  title: {
    en: "A notice from Medi-Cal about your health coverage.",
    es: "Un aviso de Medi-Cal sobre su cobertura médica.",
  },
  meaning: {
    en: "Your benefits will end on June 12 unless you renew. You need to confirm your income to keep your coverage.",
    es: "Sus beneficios terminarán el 12 de junio a menos que los renueve. Debe confirmar sus ingresos para mantener su cobertura.",
  },
  action: {
    en: "Call the number on the letter or renew online before June 5. Have last month's pay stubs ready.",
    es: "Llame al número de la carta o renueve en línea antes del 5 de junio. Tenga listos los talones de pago del mes pasado.",
  },
  deadline: "2026-06-05",
  urgency: "urgent",
  draftReply:
    "Hello, I received your renewal notice and would like to confirm my income to keep my Medi-Cal coverage. Please let me know the documents you need. Thank you.",
};

export const MOCK_EXPRESS: ExpressResult = {
  kind: "Email to your child's teacher",
  formatted:
    "Dear Ms. Rivera,\n\nMy son Mateo is feeling sick today and will not be able to attend school. Please let me know if there is any work he should make up. Thank you for understanding.\n\nSincerely,\nMaría",
  note: "Turned your note into a polite email the teacher will appreciate.",
};
