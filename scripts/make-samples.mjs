#!/usr/bin/env node
// SAMPLE GENERATOR — owned by Michael. Produces real AcroForm PDFs in
// scripts/samples/ so the eval harness (and live QA) can exercise the REAL
// extraction path — including the pdf-lib widget-rect coordinate join — without
// shipping any third-party copyrighted form. Deterministic + reproducible.
//
//   node scripts/make-samples.mjs
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "samples");

// An SBA-like borrower form with a real AcroForm: a name, an ADDRESS BLOCK laid
// out as adjacent rows (the grouping test), EIN, loan amount, and a signature.
async function sbaLikeForm() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([612, 792]); // US Letter
  const form = pdf.getForm();
  const { width: W, height: H } = page.getSize();

  const label = (t, x, yTop, size = 9) =>
    page.drawText(t, { x, y: H - yTop, size, font, color: rgb(0.3, 0.34, 0.4) });
  // y is measured from the TOP for layout convenience; pdf-lib wants bottom-left.
  const box = (name, xTop, yTop, w, h) => {
    const tf = form.createTextField(name);
    tf.addToPage(page, { x: xTop, y: H - yTop - h, width: w, height: h, borderWidth: 1, borderColor: rgb(0.6, 0.65, 0.72) });
    return tf;
  };

  page.drawText("U.S. Small Business Administration", { x: 40, y: H - 50, size: 16, font: bold, color: rgb(0.06, 0.09, 0.16) });
  page.drawText("Form 1919 (sample) — 7(a) Borrower Information", { x: 40, y: H - 70, size: 11, font, color: rgb(0.4, 0.45, 0.5) });

  label("Business legal name", 40, 110);
  box("business_legal_name", 40, 116, 330, 18);
  label("EIN (Tax ID)", 390, 110);
  box("ein", 390, 116, 150, 18);

  // ADDRESS BLOCK — four adjacent rows; the model should collapse to ONE step.
  label("Street address", 40, 170);
  box("addr_street", 40, 176, 400, 18);
  label("City", 40, 212);
  box("addr_city", 40, 218, 200, 18);
  label("State", 260, 212);
  box("addr_state", 260, 218, 60, 18);
  label("ZIP", 340, 212);
  box("addr_zip", 340, 218, 100, 18);

  label("Loan amount requested", 40, 268);
  box("loan_amount", 40, 274, 200, 18);
  label("Owner full name", 40, 320);
  box("owner_name", 40, 326, 300, 18);

  label("Signature", 40, 700);
  const sig = form.createTextField("signature");
  sig.addToPage(page, { x: 40, y: H - 700 - 24, width: 260, height: 24, borderWidth: 1, borderColor: rgb(0.6, 0.65, 0.72) });

  // Pin the metadata dates so the bytes are deterministic (no spurious git diffs).
  const fixed = new Date("2026-01-01T00:00:00Z");
  pdf.setCreationDate(fixed);
  pdf.setModificationDate(fixed);
  return pdf.save();
}

// Plain-text fixtures for the non-form doc classes. The analyzer reads text
// directly (no AcroForm), so these exercise the extraction/Requirement-spine
// across classes. All synthetic — no copyrighted forms.
const TEXT_SAMPLES = {
  "lease-agreement.txt": `RESIDENTIAL LEASE AGREEMENT
This Lease is between Landlord (Greenfield Properties) and Tenant.
Tenant full name: ________________________
Premises: 412 Oak St, Apt 3, Bakersfield, CA 93301
Term: 12 months, beginning July 1, 2026.
Monthly rent: $1,800, due on the 1st of each month. Late fee $75 after the 5th.
Security deposit: $1,800, refundable, due at signing.
Tenant must provide proof of income (recent pay stubs) before move-in.
By signing, Tenant agrees to the full 12-month term and is responsible for rent
for the entire term even if Tenant moves out early.
Tenant signature: __________________  Date: __________
This lease must be signed and returned by June 15, 2026.`,

  "medical-bill.txt": `MERCY GENERAL HOSPITAL — STATEMENT OF ACCOUNT
Account number: 88-204517
Service date: 04/12/2026   Patient responsibility after insurance: $1,240.00
This is not a bill from your insurance. Your plan has processed the claim.
Amount due: $1,240.00      Please pay by: 07/15/2026
Questions about your bill? Call Patient Billing at 1-800-555-0199.
You may request an itemized statement of charges at any time.
Financial assistance / charity care may be available if you qualify.
Unpaid balances may be referred to a collection agency after 90 days.`,

  "court-summons.txt": `SUPERIOR COURT OF CALIFORNIA, COUNTY OF KERN
SUMMONS (CIVIL)   Case Number: BCV-26-104882
NOTICE TO DEFENDANT: You are being sued.
Plaintiff: Coastline Credit LLC.
You have 30 CALENDAR DAYS after this summons is served on you to file a written
response at this court and have a copy served on the plaintiff. A letter or phone
call will not protect you.
If you do not respond on time, you may lose the case by default, and your wages,
money, and property may be taken without further warning from the court.
There are free self-help centers and legal aid services. If you cannot pay the
filing fee, ask the court clerk for a fee waiver.
You must respond by June 25, 2026.`,
};

async function main() {
  await mkdir(OUT, { recursive: true });
  const sba = await sbaLikeForm();
  await writeFile(path.join(OUT, "sba-like-acroform.pdf"), sba);
  console.log(`wrote ${OUT}/sba-like-acroform.pdf (${sba.length} bytes)`);
  for (const [name, body] of Object.entries(TEXT_SAMPLES)) {
    await writeFile(path.join(OUT, name), body, "utf8");
    console.log(`wrote ${OUT}/${name} (${body.length} chars)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
