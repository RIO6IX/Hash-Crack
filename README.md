# RIO6IX Hash Crack Lab

Static RIO6IX browser security console for encode/decode, hashing, IOC cleanup, text analysis, safe crackme practice, and Hashcat command help.

Made for and created by Chanuka Isuru Sampath (RIO6IX).

## About Chanuka Isuru Sampath (RIO6IX)

- LinkedIn: https://www.linkedin.com/in/chanuka-isuru-sampath/
- GitHub: https://github.com/RIO6IX
- Medium: https://medium.com/@chanuka1
- Portfolio Website: https://rio6ix.github.io/chanuka/
- YouTube: https://www.youtube.com/@chanukaisuru0
- Medium Publication: https://rio6ix.medium.com/

## Features

- Text, Base64, Base32, Base64URL, hex, binary, URL, HTML entity, ROT13, Caesar, Morse, JWT, and JSON tools.
- Smart module search with related suggestions and drag-and-drop workflow selection.
- IOC defang/refang, URL parsing, URL/email extraction, UUID/timestamp generation, text stats, and password scoring.
- SHA-1, SHA-256, SHA-384, SHA-512, MD5, HMAC, and PBKDF2 helpers.
- Hash analyzer for common hash lengths and prefixes.
- Browser-only crackme lab with limits for CTF and authorized testing.
- Hashcat command builder for common modes.
- Dark and light themes with saved preference.
- No backend, cookies, telemetry, CDN scripts, or build step.

## Security notes

- The site is static and processes data locally in the browser.
- Dynamic output is written to textareas or text nodes, not injected as executable HTML.
- Inputs are size-limited to reduce accidental browser denial of service.
- A restrictive CSP meta tag is included for static hosting. For production-grade custom hosting, also configure equivalent HTTP security headers.
- Use only with hashes, data, and systems you own or have written permission to test.

## GitHub Pages deployment

1. Push these files to a GitHub repository.
2. Open the repository on GitHub.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder.
6. Save. GitHub Pages will publish the static site after the workflow finishes.

## Local preview

Open `index.html` directly in a browser or run a simple local server:

```powershell
python -m http.server 8080
```

Then visit `http://localhost:8080`.
