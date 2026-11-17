# V2.5 ingredient reference refresh

**Active and verified.** The automation-only repository is public, Actions is enabled, and the dedicated encrypted secret is restricted to the `v25-refresh` environment on `main`. Hosted run [43954495743](https://github.com/juanameijeiras/amevel-v25-price-refresh/actions/runs/43954495743) passed on November 16, 2026, including an identical-content write, encrypted backup and exact readback. V2.5 stayed unpublished. The previous Mac-based schedule is paused. No credentials are committed to this repository.

This standalone repository does not build, deploy or publish the website or Studio. It only maintains the existing public ingredient-reference snapshot in Shopify theme **204653822279**, whether its role is **unpublished** or **published**, using the same exact theme ID. Geisha, quote-only products, form selections, formulas, uploads and quote routing remain unchanged.

## Daily behavior

The workflow runs around **06:17 America/New_York**, away from the hourly rush. GitHub schedules can be delayed; this is not an exact-time SLA. Valid stored prices remain visible while the background run checks sources. Four dairy references, three cocoa references and Classic's shared coffee reference are checked once through the existing daily cache. Changed references are written to **one file only**:

`snippets/amevel-v25-ingredient-stored-reference.liquid`

There is no browser dependency. A successful no-op makes no Shopify write. Failed references keep their old values and real checked dates. Existing source-age and 48-hour display limits remain enforced. Total failure, unsupported source/formula changes, a mid-run role change, concurrent edits or readback mismatches fail the run and preserve recovery evidence. There is no quote submission or customer-file upload.

## Zero added cost

The owner's private-repository free compute allowance was already exhausted during setup. Therefore this runner **refuses private repository execution**. Standard public Linux Actions runners are free independently of that allowance. Public-code approval was received on November 16, 2026. A repository-specific **$0 hard Actions budget** is configured, and the hosted runner uses free public Linux compute.

No Actions artifact upload or cache is used. Encrypted recovery files are stored as small Git commits; backups cannot trigger this schedule recursively. No paid service or plan upgrade is needed. If any zero-cost assumption cannot be verified, keep the job disabled.

## Public and private information

Only these automation scripts, synthetic tests, workflow, lockfile and a backup **public key** are public. No customer data, artwork, theme exports, real price fixtures, credentials or recovery private key are committed. The runtime pulls live theme files into temporary memory/disk on the ephemeral runner; it never logs their contents. Public reference endpoints and versioned formula logic are already exposed by the existing preview integration.

A dedicated Theme Access credential is required in the `v25-refresh` GitHub environment as `SHOPIFY_CLI_THEME_TOKEN`. Shopify scopes Theme Access passwords to themes broadly, **not one particular theme**. Code, branch and CLI guards restrict this job to V2.5; the credential itself has broader theme rights. Configure the environment to allow only `main`. No PR or push trigger exists, and official actions and Shopify CLI are version pinned. Never put credentials in chat, code, workflow text, logs or command arguments.

## Recovery

Before each changed write, the previous snapshot and candidate are encrypted using AES-256-GCM plus RSA-OAEP-SHA256 and committed under `backups/`. If backup creation fails, no upload occurs. The private key is kept **outside this repository** on the owner's Mac. Back it up securely; GitHub does not have it.

Download the chosen encrypted recovery file and run locally:

```
node scripts/decrypt-backup.mjs --backup encrypted.json --key /secure/local/restore-key.pem --out recovered.json
```

This only decrypts a file. Restoring Shopify still requires a fresh role/checksum check; do not overwrite concurrent work.

## Exact authorized CLI operations

Store: `y1cgpx-ke.myshopify.com`. Target: `204653822279`. Authentication is provided only through the encrypted environment variable, never arguments. `RUNTIME_DIR` below denotes a newly created runner temporary directory.

```
shopify theme list --store y1cgpx-ke.myshopify.com --no-input --json --id 204653822279
shopify theme pull --store y1cgpx-ke.myshopify.com --no-input --json --theme 204653822279 --path RUNTIME_DIR --nodelete --only snippets/amevel-v25-ingredient-stored-reference.liquid --only assets/amevel-v25-ingredient-daily.js --only snippets/amevel-v25-dairy-pricing.liquid --only snippets/amevel-v25-coffee-pricing.liquid --only snippets/amevel-v25-cocoa-index.liquid --only layout/theme.liquid
shopify theme push --store y1cgpx-ke.myshopify.com --no-input --json --theme 204653822279 --path RUNTIME_DIR --nodelete --only snippets/amevel-v25-ingredient-stored-reference.liquid
```

The list/pull operations read metadata and theme code. The push sends only the generated snapshot to the exact V2.5 theme, using the role captured at the start of the run. The read-only layout file gives the staging directory valid theme structure; it is not included in the push filter. No publication command, theme deletion or other theme ID can be selected. A published-role write is allowed only after the owner publishes this exact V2.5 theme; before that the CLI live-write flag is absent. The role and exact file text are read back after upload. The existing Mac schedule should be paused only after a successful hosted run.

## Verification and activation

Run `npm test` locally. It uses synthetic fixtures and performs no Shopify authentication or writes. Complete credential setup, public-code approval and zero-spend verification, then enable Actions and run the workflow manually once. Its optional verify_write input performs a guarded identical-content write when today’s reference is already current, allowing write access and exact readback to be verified without changing prices. Scheduled runs never enable this input. Verify exact remote content and UNPUBLISHED status before treating the hosted schedule as active. Hosted checks passed; the first scheduled daily run is still a future execution, not yet observed.

## Minimal publication-safe update

This setup keeps one existing job, environment, schedule and credential. It uses the verified fixed website-pricing service at https://amevel-pricing.vercel.app. No Studio, DNS, Syncro or quotation change is involved. Each run captures the exact V2.5 role in its plan. Before publication only an unpublished-role push is allowed. After the owner publishes this exact theme, its published-role push adds the CLI live-write flag, still restricted to the one reference snippet and exact theme ID. Every role/content check, encrypted backup and exact readback remains mandatory. The former live theme ID is always rejected. A publication/rollback during a run aborts rather than changing its accepted role. Do not run a live-theme write as part of preview validation.

Coordinate merging this update with the V2.5 pricing endpoint cutover, after verifying the new service. No extra production workflow or new Theme Access credential is required. The earlier two-workflow draft is superseded by this simpler approach. Fresh source checks and a manual no-quote reference refresh are required before claiming the hosted cutover complete.
