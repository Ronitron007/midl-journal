# Fallback Plan: Legacy Peer Deps Approach

**Date:** 2026-02-01
**Status:** Backup plan if npm overrides don't work

## Problem Summary

`@10play/tentap-editor@1.0.1` bundles `react-dom@^18.2.0` as a direct dependency (not peer), which conflicts with Expo SDK 54's `react@19.1.0`.

```
@10play/tentap-editor@1.0.1
├── react-dom@"^18.2.0"     ← Forces React 18 ecosystem
│   └── requires react@"^18.3.1"
└── Your app uses react@19.1.0 (Expo SDK 54)
```

## Fallback Solution: Use `--legacy-peer-deps`

If npm overrides cause runtime issues, use this approach:

### Step 1: Clean Install with Legacy Peer Deps

```bash
cd /Users/rohanmalik/Projects/midl-journal/app

# Remove existing node_modules and lock file
rm -rf node_modules package-lock.json

# Install with legacy-peer-deps flag
npm install --legacy-peer-deps

# Install react-refresh (required by babel-preset-expo)
npm install react-refresh --save-dev --legacy-peer-deps

# Clear Metro cache and restart
npx expo start --clear
```

### Step 2: Add npm script for convenience

In `package.json`, add:

```json
{
  "scripts": {
    "install:legacy": "npm install --legacy-peer-deps"
  }
}
```

### Step 3: Document in README

Add note to README that new developers should run:

```bash
npm run install:legacy
```

## Known Trade-offs

1. **Peer dependency warnings remain** — npm will show warnings on install
2. **Potential for subtle bugs** — react-dom 18 in tentap-editor vs react 19 in app
3. **Developer experience** — must remember to use `--legacy-peer-deps`

## Long-term Fix

When upgrading to Expo SDK 55 (March 2026), check if:

- `@10play/tentap-editor` has released a version with proper React 19 support
- Alternative: Replace with a different rich text editor that supports React 19

## Packages Requiring Legacy Peer Deps

| Package                 | Version | Issue                                     |
| ----------------------- | ------- | ----------------------------------------- |
| `@10play/tentap-editor` | 1.0.1   | Bundles `react-dom@^18.2.0` as direct dep |

## Related Files

- `package.json` — main dependencies
- `docs/TODO.md` — SDK 55 upgrade notes
