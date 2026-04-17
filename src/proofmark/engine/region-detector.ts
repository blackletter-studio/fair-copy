import type { DocumentAdapter, Paragraph } from "../../engine/types";
import type { Region, RegionName } from "./types";

function isHeading(doc: DocumentAdapter, p: Paragraph): boolean {
  return doc.getHeadingStyle(p.ref) !== null;
}

function detectRecitals(doc: DocumentAdapter, paragraphs: Paragraph[]): Region[] {
  const regions: Region[] = [];
  const whereasRun: Paragraph[] = [];
  for (const p of paragraphs) {
    if (/^whereas,/i.test(p.text.trim())) {
      whereasRun.push(p);
    } else if (whereasRun.length > 0) {
      break;
    }
  }
  if (whereasRun.length > 0) {
    regions.push({
      name: "recitals",
      range: whereasRun.map((p) => p.ref),
      confidence: "high",
      confirmed: true,
    });
  }

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (!p) continue;
    if (!isHeading(doc, p)) continue;
    if (!/^recitals?$/i.test(p.text.trim())) continue;
    const body: Paragraph[] = [];
    for (let j = i + 1; j < paragraphs.length; j++) {
      const next = paragraphs[j];
      if (!next) break;
      if (isHeading(doc, next)) break;
      body.push(next);
    }
    if (body.length > 0) {
      regions.push({
        name: "recitals",
        range: body.map((p) => p.ref),
        confidence: "high",
        confirmed: true,
      });
    }
  }
  return regions;
}

const DEFINITION_PATTERN = /^"[^"]+"\s+(means|shall\s+mean)\b/i;

function detectDefinitions(doc: DocumentAdapter, paragraphs: Paragraph[]): Region[] {
  const regions: Region[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (!p) continue;
    if (!isHeading(doc, p)) continue;
    if (!/^definitions?$/i.test(p.text.trim())) continue;
    const body: Paragraph[] = [];
    for (let j = i + 1; j < paragraphs.length; j++) {
      const next = paragraphs[j];
      if (!next) break;
      if (isHeading(doc, next)) break;
      body.push(next);
    }
    if (body.length > 0) {
      regions.push({
        name: "definitions",
        range: body.map((p) => p.ref),
        confidence: "high",
        confirmed: true,
      });
      return regions;
    }
  }

  const patternHits = paragraphs.filter((p) => DEFINITION_PATTERN.test(p.text.trim()));
  if (patternHits.length > 0) {
    regions.push({
      name: "definitions",
      range: patternHits.map((p) => p.ref),
      confidence: "medium",
      confirmed: false,
    });
  }
  return regions;
}

function detectIndemnification(doc: DocumentAdapter, paragraphs: Paragraph[]): Region[] {
  const regions: Region[] = [];
  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i];
    if (!p) continue;
    if (!isHeading(doc, p)) continue;
    if (!/^indemni/i.test(p.text.trim())) continue;
    const body: Paragraph[] = [];
    for (let j = i + 1; j < paragraphs.length; j++) {
      const next = paragraphs[j];
      if (!next) break;
      if (isHeading(doc, next)) break;
      body.push(next);
    }
    if (body.length > 0) {
      regions.push({
        name: "indemnification",
        range: body.map((p) => p.ref),
        confidence: "high",
        confirmed: true,
      });
    }
  }
  return regions;
}

const LINE_ITEM_PATTERNS = [
  /^\$\d/, // "$123..."
  /^qty[:\s]/i, // "Qty: 5..."
  /^\d+\s*[x×]\s*\d/i, // "5 x 10..."
];

function isLineItemText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  return LINE_ITEM_PATTERNS.some((re) => re.test(trimmed));
}

function detectLineItems(paragraphs: Paragraph[]): Region[] {
  const regions: Region[] = [];
  let run: Paragraph[] = [];
  const flush = () => {
    if (run.length >= 2) {
      regions.push({
        name: "line-items",
        range: run.map((p) => p.ref),
        confidence: "medium",
        confirmed: false,
      });
    }
    run = [];
  };
  for (const p of paragraphs) {
    if (isLineItemText(p.text)) {
      run.push(p);
    } else {
      flush();
    }
  }
  flush();
  return regions;
}

const UNDERSCORE_LINE = /_{10,}/;

function isSignatureText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (/^by:/i.test(trimmed)) return true;
  if (UNDERSCORE_LINE.test(trimmed)) return true;
  return false;
}

function detectSignatureBlock(paragraphs: Paragraph[]): Region[] {
  const regions: Region[] = [];
  const total = paragraphs.length;
  if (total === 0) return regions;
  const cutoff = Math.floor(total * 0.8);
  const hits: Paragraph[] = [];
  for (let i = cutoff; i < total; i++) {
    const p = paragraphs[i];
    if (!p) continue;
    if (isSignatureText(p.text)) hits.push(p);
  }
  if (hits.length > 0) {
    regions.push({
      name: "signature-block",
      range: hits.map((p) => p.ref),
      confidence: hits.length >= 2 ? "high" : "medium",
      confirmed: hits.length >= 2,
    });
  }
  return regions;
}

export function detectRegions(doc: DocumentAdapter): Region[] {
  const paragraphs = doc.getAllParagraphs();
  if (paragraphs.length === 0) return [];
  const regions: Region[] = [];
  regions.push(...detectRecitals(doc, paragraphs));
  regions.push(...detectDefinitions(doc, paragraphs));
  regions.push(...detectIndemnification(doc, paragraphs));
  regions.push(...detectLineItems(paragraphs));
  regions.push(...detectSignatureBlock(paragraphs));
  return regions;
}

export const REGION_KINDS: RegionName[] = [
  "recitals",
  "definitions",
  "indemnification",
  "line-items",
  "signature-block",
];
