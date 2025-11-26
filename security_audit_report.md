# Security Audit Report

**Date:** 2025-11-26
**Project:** Portfolio Website
**Auditor:** Antigravity (AI Security Expert)

## Executive Summary
The portfolio website is primarily a static site with a contact form integration using Google Apps Script. The overall security posture is reasonable for a static site, but there are several low-to-medium risk vulnerabilities identified, particularly regarding external link handling, unused dependencies, and potential abuse of the contact form.

## Findings

### 1. Tabnabbing Vulnerability (Reverse Tabnabbing)
*   **Severity:** Low to Medium
*   **Description:** Several external links use `target="_blank"` without `rel="noopener noreferrer"`. This allows the opened page to access the `window.opener` object of the original page. A malicious site could manipulate the original page (e.g., redirecting it to a phishing site) while the user is distracted.
*   **Affected Files:** `index.html` (Lines 55, 107, 129, 155, 263, 264, 265, 266)
*   **Recommendation:** Add `rel="noopener noreferrer"` to all `<a>` tags with `target="_blank"`.

### 2. Unused External Dependencies
*   **Severity:** Low
*   **Description:** The `index.html` file includes Firebase scripts (`firebase-app-compat.js`, `firebase-database-compat.js`) that do not appear to be used in the application logic (`app.js`).
*   **Risk:** Including unused third-party scripts increases the attack surface (supply chain attacks) and negatively impacts page load performance.
*   **Affected Files:** `index.html` (Lines 17-18)
*   **Recommendation:** Remove the unused Firebase script tags.

### 3. Lack of Input Validation & Rate Limiting (Contact Form)
*   **Severity:** Medium
*   **Description:** The contact form submits data to a Google Apps Script endpoint.
    *   **Client-side:** There is minimal validation.
    *   **Server-side (Google Script):** The provided script instructions do not include validation or rate limiting.
*   **Risk:**
    *   **Spam:** The endpoint can be flooded with requests, filling up the Google Sheet and spamming the email.
    *   **Formula Injection:** Malicious input starting with `=` could execute formulas in the Google Sheet (CSV Injection).
*   **Recommendation:**
    *   **Client-side:** Implement stricter input validation in `app.js`.
    *   **Server-side:** Update the Google Apps Script to sanitize inputs (prepend `'` to potential formulas) and implement a honeypot field or CAPTCHA to prevent bot abuse.

### 4. Missing Content Security Policy (CSP)
*   **Severity:** Low
*   **Description:** The website lacks a Content Security Policy (CSP) header or meta tag.
*   **Risk:** CSP helps prevent Cross-Site Scripting (XSS) and other code injection attacks by defining which dynamic resources are allowed to load.
*   **Recommendation:** Implement a strict CSP meta tag in `index.html`.

## Next Steps
1.  Apply fixes for the Tabnabbing vulnerability in `index.html`.
2.  Remove unused Firebase scripts from `index.html`.
3.  Discuss implementation of a Honeypot field for the contact form to reduce spam.
