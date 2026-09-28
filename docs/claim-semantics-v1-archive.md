# Claim Semantics Ontology v1 archive

The archive at [`archive/claim-semantics/v1/`](../archive/claim-semantics/v1/) freezes the exact working-tree benchmark inputs used to identify the v1 state before Ontology v2 migration. It supplements the Git commit because the active review ledger and several benchmark documents were uncommitted at capture time. Archived files are byte-for-byte copies; the archive does not replace active datasets or reviews.

The machine-readable [`archive-manifest.json`](../archive/claim-semantics/v1/archive-manifest.json) records source and archived paths, byte sizes, SHA-256 checksums, file roles, Git tracking state, dataset row/group/split/source counts, repository identity, and the reproducible v1 identifiers returned by the current `datasetVersion()` and `protocolVersion()` implementations. It identifies the ontology as `v1`; no v2 protocol hash is created. The detached `archive-manifest.sha256` pins the manifest bytes; its SHA-256 is `76dce0723c59ad1e8a7f79816aa27f25ab56902f33843c7f979de2c518f2c1ee`.

## Contents and review-ledger choice

The snapshot includes Development and Validation, the canonical `reviews.json`, benchmark definitions/types/provider prompts and adapters/review rules/scoring/stability sources, generation and case sources, the review and workbench routes, methodology and protocol documentation, package manifests, historical checkpoint and run reports, and a Git status/diff snapshot. It also captures the pre-existing untracked v2 proposal and implementation plan as contemporaneous design context, not as v1 runtime rules.

At capture, `reviews.json` was valid JSON, 79,648 bytes, with 297 records and SHA-256 `73d52e2a45cc380fe9ec131c10a72c977e61bf121fda2e37c8cd348efa6fc19c`. The untracked `reviews-86e92888-b886-48fe-9b5c-116ea7fcdf2e.tmp` was separately preserved as a noncanonical artifact. It was older, had 57 records whose keys were all present in `reviews.json`, and had no temp-only records. The application writes a random-name temporary file and atomically renames it over `reviews.json`; no matching review-writing process was running during inspection. The temp file was not treated as canonical.

## Dataset snapshot

| Dataset | Rows | Groups | Split counts | Source counts | SHA-256 |
| --- | ---: | ---: | --- | --- | --- |
| Development | 285 | 102 | development: 285 | seed: 185; adversarial-batch-01: 48; adversarial-expansion: 52 | `cd59299f0d921ab6d45fed357a11588c47a219a5bf391469d86879a6a6288734` |
| Validation | 119 | 37 | validation: 119 | seed: 119 | `4f083b2afe102a68bbf7a09a6131e701e4b8c4c0a73f1716eef68e883c429ab7` |

The current implementation identifiers reproduced from the captured bytes are `datasetVersion = 9072ab74e090` and `protocolVersion = fa8e3397e12d9852`. These are the existing v1 implementation’s truncated SHA-256 identifiers, not newly defined protocol hashes. The protocol identifier was computed with Next.js environment loading; all five settings included by the current hash function resolved to their documented fallback values. The raw `.env.local` file was excluded because it may contain credentials; the manifest records the settings fingerprint without copying that file.

## Repository identity at capture

- Git HEAD: `a1aef5a18519c31f8fc4025a3ace01dfd206da7b`
- Branch: `main` (tracking `origin/main`)
- Working tree: dirty
- Pre-existing relevant changes captured: modified `datasets/claim-semantics/reviews.json`; untracked temporary review file; untracked v2 proposal and implementation plan.

The archive includes exact status/diff snapshots. The verifier script was also present as archival tooling when the status snapshot was taken; it is not part of the v1 benchmark inputs.

## Verification

From the repository root, run:

```powershell
python scripts/verify_claim_semantics_v1_archive.py
```

The read-only verifier checks the detached manifest checksum, then confirms every listed archived file exists and matches its recorded byte size and SHA-256. The manifest does not hash itself; its detached checksum is checked separately.

V1 review decisions and provider results remain historical evidence under the v1 definitions and protocol. Any future v2 results must be labeled with their own ontology/protocol identity; v1 and v2 scores are not automatically directly comparable because the semantic tasks and definitions differ.
