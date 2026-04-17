import { Document, Packer, Paragraph, TextRun } from "docx";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function writeDocx(doc: Document, name: string): Promise<void> {
  const buf = await Packer.toBuffer(doc);
  const outPath = path.resolve(__dirname, `${name}.docx`);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- outPath is a dev-seeded file inside this script's own fixtures dir.
  fs.writeFileSync(outPath, buf);
  console.log(`wrote ${outPath} (${buf.length} bytes)`);
}

async function main(): Promise<void> {
  // messy-brief.docx — varied fonts, sizes, colors, highlights
  await writeDocx(
    new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Messy heading",
                  font: "Comic Sans MS",
                  size: 48,
                  color: "FF0000",
                  highlight: "yellow",
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Body text with mixed fonts.",
                  font: "Arial",
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: "Bold important stuff.", bold: true })],
            }),
            new Paragraph({
              children: [new TextRun({ text: "Italic emphasis here.", italics: true })],
            }),
            new Paragraph({
              children: [new TextRun({ text: "Mixed color paragraph.", color: "0000FF" })],
            }),
            new Paragraph({
              children: [new TextRun({ text: "Highlighted finding.", highlight: "cyan" })],
            }),
          ],
        },
      ],
    }),
    "messy-brief",
  );

  // clean-doc.docx — already in the target body font
  await writeDocx(
    new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Clean body paragraph.",
                  font: "IBM Plex Sans",
                  size: 22,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Another paragraph, same style.",
                  font: "IBM Plex Sans",
                  size: 22,
                }),
              ],
            }),
          ],
        },
      ],
    }),
    "clean-doc",
  );

  // tracked-changes-doc.docx — the docx lib supports trackRevisions
  await writeDocx(
    new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "This paragraph has a tracked insertion.",
                  font: "Calibri",
                }),
              ],
            }),
            // Note: full tracked-changes simulation requires raw OOXML manipulation.
            // The docx library has limited support. For a more realistic fixture
            // we may need to edit in Word directly — see TODO in README.
          ],
        },
      ],
    }),
    "tracked-changes-doc",
  );

  // image-heavy-doc.docx — skeleton; real images require base64 encoding of actual image bytes.
  // For M2 T12 we ship this as a text-only placeholder and let the manual-verification phase
  // replace it with an actual image-heavy sample.
  await writeDocx(
    new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Placeholder for image-heavy doc. Replace with a real sample during manual verification (see tests/e2e/README.md).",
                  font: "Calibri",
                }),
              ],
            }),
          ],
        },
      ],
    }),
    "image-heavy-doc",
  );
}

main().catch((err) => {
  console.error("seed failed:", err);
  process.exit(1);
});
