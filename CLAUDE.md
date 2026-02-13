## Language & Stack

This is primarily a TypeScript project ecosystem (React Native/Expo, Next.js, Supabase Edge Functions). Always use strict TypeScript — no implicit any, no type shortcuts. Run type checks before considering a task complete.

## Debugging

When debugging errors, address the most obvious cause first (e.g., 'Invalid JWT' means check the token/auth config directly). Do NOT over-engineer debugging with excessive diagnostic logging or roundabout investigation. Be direct.

## Dependencies & Package Management

Never use --legacy-peer-deps as a fix. Always resolve the root dependency/version conflict directly. Audit peer dependency trees before adding packages.

## Communication & Scope

When the user describes a task, confirm scope before starting: is this exploratory/learning, or a full implementation? Do not assume full feature build unless explicitly stated.

All user-provided content and data is important unless explicitly told otherwise. Do not dismiss, filter, or exclude data based on your own judgment of its relevance.

## Code Changes

When making multi-file changes (renaming types, moving components, changing schemas), update ALL consumers before committing. Search the entire codebase for references to the old name/interface before proceeding.

## Git & Security

Never commit secrets, API keys, or tokens to git. Before any git push to a public repo, check git history for exposed secrets. Use environment variables for all sensitive values.
