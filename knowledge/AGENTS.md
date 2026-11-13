# Knowledge Base Architecture & Schema (LLM Wiki)

This knowledge base maintains verified legal and financial information for California divorce, legal separation, and financial readiness under California Community Property Law.

## Architecture & Layers

1. **Raw Sources (`knowledge/sources/`)**
   - Immutable markdown source documents harvested from official sites (`selfhelp.courts.ca.gov`, California Family Code, Judicial Council Forms).
   - Each source document includes metadata (URL, Title, Date Fetched, Jurisdiction).

2. **Wiki Articles (`knowledge/wiki/`)**
   - Synthesized, plain-language markdown articles explaining concepts, workflows, statutory rules, and forms.
   - Every claim in a wiki article must cite a source document in `knowledge/sources/`.
   - All wiki pages start with a explicit legal disclaimer: "This is legal information, not legal advice."

3. **Index & Catalog (`knowledge/index.md`)**
   - Central catalog listing all source documents and wiki articles with short summaries and category tags.

4. **Audit Log (`knowledge/log.md`)**
   - Append-only chronological record of ingests, edits, updates, and lint passes.

## Standard Disclaimer
All synthesized wiki pages must include:
> *Disclaimer: This platform provides legal and financial information for education and readiness in California. It does not constitute formal legal advice or attorney representation.*
