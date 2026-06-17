# RIO6IX Hash Crack Lab

RIO6IX Hash Crack Lab is a static, browser-based cybersecurity toolkit for learning, CTF practice, authorized testing, encoding, decoding, hashing, hash analysis, IOC cleanup, and Hashcat command preparation.

The project is made for and created by **Chanuka Isuru Sampath (RIO6IX)**.

## Live / Hosting

This project is designed for free static hosting with GitHub Pages. It does not need a backend server, database, API key, package manager, or build step.

Local preview:

```powershell
python -m http.server 8080
```

Then open:

```text
http://127.0.0.1:8080/
```

## Pages

- `index.html` - main RIO6IX security console
- `about.html` - creator profile and official links
- `assets/mylogo.png` - site icon and header logo
- `styles.css` - responsive dark/light interface styling
- `app.js` - all client-side tool logic

## Main Features

- Encode and decode tools
- Hashing and HMAC helpers
- PBKDF2 key derivation
- Hash format analyzer
- Browser-only Crackme practice lab
- Hashcat command helper
- IOC defang/refang tools
- URL and email extraction
- URL parser
- JWT decoder
- JSON beautify and minify
- Text stats and cleanup tools
- Password score helper
- UUID and timestamp generators
- Dark mode and light mode
- Smart module search
- Related suggestion chips
- Drag-and-drop workflow module loading

## Codec Tools

Supported transform modules include:

- Base64 encode/decode
- Base64URL encode/decode
- Base32 encode/decode
- Hex encode/decode
- Binary encode/decode
- URL encode/decode
- HTML entity encode/decode
- ROT13
- Caesar shift
- Morse encode/decode
- Uppercase/lowercase
- Reverse text
- Slugify
- Sort lines
- Trim lines
- Remove empty lines
- Unique lines

## Analysis Tools

- Entropy calculation
- Hexdump
- Text statistics
- Extract URLs
- Extract email addresses
- Parse URL components
- Defang IOCs
- Refang IOCs
- Password strength scoring
- JWT header and payload decode

## Hashing Tools

Supported hash and key features:

- MD5
- SHA-1
- SHA-256
- SHA-384
- SHA-512
- HMAC with supported SHA algorithms
- PBKDF2-SHA256
- Common hash pattern detection

## Crackme Lab

The Crackme tool runs fully inside the browser and is intended for:

- CTF practice
- classroom/lab learning
- authorized hash testing
- small local demonstrations

It includes browser-protection limits for target hashes and wordlist candidates so the page does not freeze during normal use.

## Hashcat Helper

The Hashcat helper builds starter commands for common hash modes and attack modes. It is meant as a safe command builder and reference aid, not as an attack automation service.

Use Hashcat only with hashes and systems you own or have explicit permission to test.

## Security Design

This project is static-first and browser-only:

- No backend
- No telemetry
- No cookies
- No CDN scripts
- No package dependencies
- No user input sent to a server
- Dynamic results are written into text fields, not injected as executable HTML
- Content Security Policy is included in the HTML
- Input size limits reduce accidental browser denial-of-service issues

## GitHub Pages Deployment

1. Push the repository to GitHub.
2. Open the repository on GitHub.
3. Go to **Settings**.
4. Open **Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select the `master` branch or your chosen branch.
7. Select `/ (root)`.
8. Save and wait for GitHub Pages to publish.

## Ethical Use

This project is for education, CTF practice, defensive research, and authorized security testing only.

Do not use this project against accounts, hashes, systems, or data that you do not own or do not have written permission to test.

## About Chanuka Isuru Sampath (RIO6IX)

- LinkedIn: https://www.linkedin.com/in/chanuka-isuru-sampath/
- GitHub: https://github.com/RIO6IX
- Medium: https://medium.com/@chanuka1
- Portfolio Website: https://rio6ix.github.io/chanuka/
- YouTube: https://www.youtube.com/@chanukaisuru0
- Medium Publication: https://rio6ix.medium.com/

## Repository Description

RIO6IX Hash Crack Lab: a static browser-based security toolkit for encoding, decoding, hashing, hash analysis, IOC cleanup, Crackme practice, and Hashcat command help.

## License

Add a license file if you want to define public reuse terms for this project.
