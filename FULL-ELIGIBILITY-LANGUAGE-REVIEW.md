# Full eligibility form localization — local only

Repository: irisalukiferriswheel/annuaire-joueurs-jouer-pour-de-bon.
Worktree: task-4/directory-eligibility-en. Branch: codex/short-signup-eligibility.
Verified local base: b0f016d. This is the existing `#/complete-profile` form reused
by the short-signup Wix host, not a new form or account model. No other worker's
checkout was changed. API 67f88ca, Wix d466967 and profile 68ae950 remain unchanged.

## Change

- `?lang=en` now opens English full-form labels, section headings, country/game
  names, navigation, loading/save statuses, all 16 explicit validation messages,
  and neutral server-error feedback. French remains available.
- The language select changes local React state without remounting the form or
  restarting the host subscription. URL language and document lang/title update
  without navigation. Required fields, validation rules, payload shape, game slugs,
  country codes and existing save endpoint remain unchanged.
- Pending saves stay pending and disabled while switching. A duplicate submit is
  also rejected in the handler. Unknown server error text gets localized neutral
  feedback; the draft is retained.
- Visible keyboard focus added for the language control, game choices and existing
  custom checkboxes. No new personal fields or consent defaults.

## Legal wording deliberately not translated

No waiver acceptance control exists in this source. Conservatively retained,
verbatim French and explicitly marked lang=fr:

1. Directory visibility permission label and its public-field description.
2. Introductory privacy assurance ending “Les données marquées privées ne sont jamais publiées.”
3. Public-preview assurance beginning “Nom réel, coordonnées, date de naissance…”
4. “Données privées protégées” and its administrative/safety/eligibility/consent/payment paragraph.

An English notice identifies the untranslated permission/privacy wording. No
English replacement for these passages has been activated. Their translation
requires separate legal/content review; no consent state is changed by language.
The full form has no invitation-email toggle, so its save does not rewrite the
independent invitation-email preference.

## Verification

- `npm test`: 21/21 passed, including English coverage of every existing explicit
  validation message and a check against activating the protected translations.
- `npm run build`: passed with the repository's locked dependencies. No dependency
  versions or lockfile were changed; local dependencies were downloaded for testing.
- `PLAYWRIGHT_MODULE=<existing playwright> node tests/eligibility-language.cjs`:
  passed with synthetic parent-host transport at 390px. Tests both languages,
  selected games, directory checkbox keyboard operation, minor/guardian values,
  all input/select values and required attributes, unchanged host request count,
  language-switch focus, one pending save, disabled submit, duplicate rejection,
  localized success/validation/server error, retained draft, labels, live status,
  French annotations on protected wording and no horizontal overflow/browser errors.
- Screenshot: task-4/full-eligibility-en-mobile.png. Fictional data only.
- `git diff --check`: passed.

## Remaining gates

Nothing was published or enabled. No Supabase call was made. The parent-reported
schema permission denial, partial-profile schema compatibility, approved staging,
independent-connection races, genuine Wix signup/verification/logout lifecycle and
production approval gates remain unchanged. The Wix host already passes lang=en
to this existing route; publish neither its host nor this directory build until
the parent reviews their paired diffs and staging behavior.

This replaces the earlier “full form hardcodes French” implementation blocker for
ordinary UI text. Protected legal/privacy translations remain intentionally pending.
