# Full dataset import

The complete first-pass dataset contains 2,147 question records.

The GitHub connector used by this development session cannot upload the 1.4 MB generated JSON artifact after the conversation file-upload quota is exhausted. The application is intentionally left with a tiny sample dataset rather than an incomplete or misleading partial dataset.

## Exact one-time manual step

1. Download the complete dataset generated in this conversation: `gate-me-full-questions.json`.
2. Open this repository on GitHub.
3. Open `data/questions.json`.
4. Choose **Edit** / replace the file contents.
5. Paste the downloaded JSON contents into `data/questions.json`.
6. Commit directly to `main`.
7. GitHub Actions will automatically run the build and dataset validation.

Do not change any other file for this import.

After this single replacement, the existing dashboard will automatically use all 2,147 records because it imports `data/questions.json` directly.

## Local alternative

From a local clone:

```bash
cp /path/to/gate-me-full-questions.json data/questions.json
npm install
npm run build
python scripts/validate_dataset.py data/questions.json
```

The source PDFs are deliberately not required at runtime and are not included in the repository.
