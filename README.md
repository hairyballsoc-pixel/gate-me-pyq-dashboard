# GATE ME PYQ Dashboard

A local-first React + Vite dashboard for practising GATE Mechanical Engineering previous-year questions.

## Implemented

- Full question-bank UI driven by \`data/questions.json\`
- Subject, chapter, year, type, answer/solution and text filters
- Question preview with source/page traceability
- Targeted practice sessions from the current filter set
- MCQ/NAT-style answer checking
- Stored worked-solution reveal only after a correct submission
- Bookmarks
- Automatic wrong-answer review queue
- Browser-local accuracy, attempts and subject progress
- Responsive desktop/mobile UI
- Optional Tesseract OCR ingestion
- Dataset validation and GitHub Actions build checks

## Data boundary

The supplied source archive reaches **2024**. It does not contain 2025/2026 papers, so the dashboard does not fabricate those years.

The uploaded normalized dataset is the source of truth for the current question bank. Some older/image-heavy source papers may still require OCR and manual review. The application distinguishes answer keys from worked solutions and never invents explanations.

Source PDFs are not included because redistribution rights depend on the source.

## Development

\`\`\`bash
npm ci
npm run dev
npm run build
python scripts/validate_dataset.py data/questions.json
\`\`\`

For permitted PDFs:

\`\`\`bash
npm run ingest
python scripts/validate_dataset.py data/questions.json
\`\`\`

For sparse/scanned pages:

\`\`\`bash
python scripts/ingest.py --ocr
\`\`\`

Tesseract must be installed separately.

## Data model

The schema supports **Subject → Chapter → Subtopic → Concept** plus source/page provenance, answer keys, solution status, marks and negative marking when verified.

Solution status is deliberately conservative: \`none\`, \`source\`, \`authored\`, or \`verified\`.
