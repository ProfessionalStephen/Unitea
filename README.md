# esm-hotfix — restore production auth

## What broke

After deploying Cycle 1-7, `npm install` updated `package-lock.json` to a newer
`@vercel/node` runtime. The new runtime enforces strict ESM resolution: every
relative import must include the `.js` extension. The existing codebase used
extensionless imports (`from "../_lib/session"`) which the old runtime tolerated.

Result: `/api/auth/me`, `/api/auth/google/callback`, and every other serverless
function crashed with:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/var/task/api/_lib/session'
```

Auth callback returned 500 → cookie never set → silent sign-in failure.

## Fix

Added `.js` extension to all 41 relative imports across `api/` and `shared/`.
Tests + frontend build + API typecheck all pass.

## Apply (PowerShell)

```powershell
cd C:\Users\Moobe\repos\Unitea
git checkout main
git pull
git checkout -b esm-hotfix

Expand-Archive -Path $HOME\Downloads\esm-hotfix.zip -DestinationPath $HOME\Downloads\hotfix-tmp -Force
Copy-Item -Path $HOME\Downloads\hotfix-tmp\esm-hotfix\* -Destination . -Recurse -Force
Remove-Item $HOME\Downloads\hotfix-tmp -Recurse -Force

# Verify
npm test            # 136 passed
npm run build       # builds, same bundle hash as before
npx tsc -b tsconfig.node.json   # clean

git add -A
git commit -m "Fix ESM resolution: add .js to all relative imports in api/ and shared/"
git push -u origin esm-hotfix
```

## Merge + redeploy

1. Open PR on GitHub
2. Wait for Vercel preview to build green
3. Merge to main
4. Vercel will auto-deploy. Watch the deployments list.
5. **Important:** if the new deployment shows "Production: Staged" again,
   click ⋯ → Promote to Production (same gotcha as last time — the previous
   manual rollback pinned that deployment).
6. Hard refresh on https://unicity-kpi.vercel.app and try sign-in. Should work.

## Why this happened

The npm install during the audit session implicitly bumped transitive deps in
`package-lock.json`. The old code had a latent bug (missing `.js` extensions);
the old runtime hid it. New runtime exposed it.

Long-term: enable a CI step that runs `node --experimental-vm-modules` against
each API entrypoint, or pin `@vercel/node` to a known-good version.
