# GATE ME PYQ Dashboard

A React + Vite command center for organizing GATE Mechanical Engineering previous-year questions by course section, year, subtopic, answer key, and solution status.

## Current architecture

- React + TypeScript + Vite frontend
- Local-first progress stored in browser localStorage
- Question-bank filtering by subject/year/search
- Practice mode with answer submission and solution reveal
- Python/PyMuPDF ingestion pipeline under `scripts/ingest.py`
- Source traceability fields: year, source PDF, page, question number
- Taxonomy metadata can be expanded into subject -> chapter -> subtopic -> concept

## Data status

The supplied source archive was analyzed locally and produced a first-pass dataset of **2,147 indexed records**. The repository connector cannot transfer that large generated JSON artifact directly from the local runtime, so this GitHub bootstrap contains a small runnable sample `data/questions.json` rather than silently claiming that the complete generated dataset was committed.

The complete generated dataset is available in the local project artifact from this conversation. Source PDFs are not included in this repository; redistribute them only if you have permission.

The supplied archive did not contain 2025/2026 source papers. Several older papers are image/scanned PDFs and need OCR for complete extraction.

## Run locally

```bash
npm install
npm run dev
```

To regenerate the question bank from PDFs you are permitted to use:

```bash
mkdir -p data/source_pdfs
# place permitted source PDFs there
npm run ingest
npm run build
```

## Product roadmap

1. Complete OCR extraction for scanned papers.
2. Normalize and de-duplicate papers/sets.
3. Expand classification to subject -> chapter -> subtopic -> concept.
4. Validate answer keys and add question type, marks, and negative-marking metadata.
5. Build a structured worked-solution store and review workflow.
6. Add exam mode, timed sessions, weak-area analytics, and progress history.
7. Add deployment and automated data-quality checks.

Question classification and solution data should be treated as reviewable metadata rather than assumed to be perfect.
