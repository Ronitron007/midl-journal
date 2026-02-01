# MIDL Journal TODO

## Immediate
1. **[BLOCKED]** Set up TestFlight/internal distribution - waiting on Apple Developer account activation
2. **[NEXT]** Add meditation & journaling reminders - meditation: scheduled time, journaling: conditional (only if no entry for day)
3. ~~Document RAG architecture~~ ✅

## Can Wait
4. Refine UI for MIDL meditators - based on scraped data, tailored experience
5. **[NEW]** Integrate rich text editor (10tap-editor) - see `docs/plans/2026-01-28-rich-text-editor-integration.md`

## Future Features
6. Sync meditation time to Apple Health mindfulness - HealthKit integration
7. Research & set up payments vendor - evaluate RevenueCat/Stripe/Apple IAP

---

## 🔧 Technical Debt: Expo SDK 55 Upgrade

**When:** March 2026 (after SDK 55 exits beta, ~6-8 weeks from Jan 22, 2026)

**Why:**
- SDK 54 is the LAST version to support Legacy Architecture
- SDK 55 brings React Native 0.83.1 and React 19.2.0
- Currently using downgraded packages for SDK 54 compatibility (losing bug fixes & performance improvements)
- Hermes v1 engine available with 15-30% performance improvements

**Current Package Downgrades (to be reverted after upgrade):**
| Package | Current (Downgraded) | Available | Notes |
|---------|---------------------|-----------|-------|
| `react-native-worklets` | 0.5.1 | 0.7.2+ | Multithreading engine for animations |
| `@react-native-community/datetimepicker` | 8.4.4 | 8.6.0+ | Date/time picker component |
| `react-native-webview` | 13.15.0 | 13.16.0+ | WebView for rich text editor |

**Upgrade Steps:**
```bash
# 1. Update Expo SDK
npx expo install expo@^55.0.0

# 2. Auto-fix all dependency versions
npx expo install --fix

# 3. Clear caches and rebuild
npx expo start --clear
```

**Pre-upgrade Checklist:**
- [ ] Verify `@10play/tentap-editor` supports New Architecture
- [ ] Check all dependencies for New Architecture compatibility
- [ ] Test in a separate branch before merging
- [ ] Monitor Expo changelog: https://expo.dev/changelog
