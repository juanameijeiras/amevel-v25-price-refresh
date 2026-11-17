# Published V2.5 refresh — inactive release candidate

The current `daily-refresh.yml` preview job retains its existing unpublished-only behavior. The new `production-refresh.yml` is inert unless repository variable `V25_PRODUCTION_REFRESH_ENABLED` equals `true`. No environment, secret, variable, active schedule or live theme has been changed by this preparation.

Production is pinned to theme 204653822279, CLI role `live` / Admin role MAIN and `https://pricing.amevel.com`. It requires explicit mode, switch, expected ID and host. It cannot update the former live theme or silently use a preview endpoint. Before every changed write it checks role/checksum, encrypts and stores a backup, rechecks role/content, writes only the reference snippet, then verifies exact readback. Only the armed production mode adds CLI `--allow-live`; it never publishes a theme.

Prepare the dedicated `v25-production-refresh` GitHub environment with main-only restrictions and a separately approved Theme Access credential. Preserve the existing public/free runner, pinned actions, $0 budget, encrypted backups and no artifact/cache upload. Do not provision secrets or enable the variable as part of this draft PR.

Launch order: verify and connect the isolated production pricing host in V2.5, publish only when separately authorized, pause the preview workflow, enable the production workflow variable only after approval, then verify a guarded production run. Preview and production jobs share a concurrency group. A publication/rollback or concurrent content change mid-run aborts the write. Current active preview refresh remains unchanged until cutover.

The CLI maps Shopify's published role to `live`; the internal source uses MAIN. Confirm this mapping with a read-only theme list at cutover. If the CLI changes its response shape, fail closed rather than broadening accepted roles.

Revert this PR or turn the production variable off to recover. Do not restore the reference snippet without fresh role/content checks. No quote/contact/email/RFQ or Syncro operations exist in the runner.
