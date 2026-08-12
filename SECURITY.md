# Security Policy

Mohor Clothings is a small, continuously-deployed static site — there are no
versioned releases to track, so the usual "supported versions" table doesn't
really apply here. The `main` branch is what's live at
[mohor.me](https://mohor.me) at all times.

## Reporting a Vulnerability

If you find a security issue — for example, a way to bypass price
verification at checkout, access another customer's order or profile data,
or reach the admin dashboard without proper authentication — please report
it privately rather than opening a public GitHub issue.

**How to report:** open a [private security advisory](../../security/advisories/new)
on this repository, or contact the maintainer directly via the store's
WhatsApp/Instagram listed on [mohor.me](https://mohor.me).

Please include:
- A description of the issue and its potential impact
- Steps to reproduce it
- Any relevant screenshots, requests, or console output

**What to expect:** an acknowledgement within a few days, and a fix
prioritized based on severity. Since this is a small storefront (not a
large service), please allow reasonable time to patch before any public
disclosure.

## Scope notes

- The Firebase config (API key, project ID) visible in the client code is
  expected to be public for a Firebase web app — it is **not** a secret.
  Actual data access is controlled by Firestore Security Rules configured
  in the Firebase console, which are outside this repository.
- Order pricing is re-verified against the live product catalog before
  being saved (see `getCanonicalPrice` in `cart.js`) as a client-side
  mitigation against a tampered cart total. A determined attacker could
  still call the Firestore SDK directly, bypassing this file entirely — the
  authoritative guard belongs in Firestore Security Rules or a Cloud
  Function validating each order write server-side.
- `admin.html` is intentionally not linked from the public site; access
  should still be restricted via Firebase Auth + Firestore rules, not
  obscurity alone.
