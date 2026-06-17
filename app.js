"use strict";

const MAX_TEXT_BYTES = 200 * 1024;
const MAX_WORDS = 5000;
const MAX_HASHES = 200;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MORSE = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.", g: "--.", h: "....", i: "..", j: ".---",
  k: "-.-", l: ".-..", m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.", s: "...",
  t: "-", u: "..-", v: "...-", w: ".--", x: "-..-", y: "-.--", z: "--..",
  0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-", 5: ".....", 6: "-....", 7: "--...",
  8: "---..", 9: "----.", ".": ".-.-.-", ",": "--..--", "?": "..--..", "/": "-..-.", "-": "-....-", "@": ".--.-."
};

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const clean = hex.replace(/\s+/g, "");
  if (!/^(?:[0-9a-f]{2})*$/i.test(clean)) {
    throw new Error("Hex input must contain pairs of 0-9 and a-f characters.");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

function assertSize(text, label = "Input") {
  if (encoder.encode(text).length > MAX_TEXT_BYTES) {
    throw new Error(`${label} is too large. Keep it under 200 KB for this static browser tool.`);
  }
}

function toBase64(text) {
  const bytes = encoder.encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value) {
  const normalized = value.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return decoder.decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function toBase64Url(text) {
  return toBase64(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(text) {
  return fromBase64(text.replace(/-/g, "+").replace(/_/g, "/"));
}

function toBase32(text) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = encoder.encode(text);
  let bits = "";
  bytes.forEach((byte) => {
    bits += byte.toString(2).padStart(8, "0");
  });
  let output = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    output += alphabet[Number.parseInt(chunk, 2)];
  }
  return output.padEnd(Math.ceil(output.length / 8) * 8, "=");
}

function fromBase32(value) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = value.toUpperCase().replace(/=+$/g, "").replace(/\s+/g, "");
  if (!/^[A-Z2-7]*$/.test(clean)) {
    throw new Error("Base32 input must contain A-Z and 2-7 characters.");
  }
  let bits = "";
  for (const char of clean) {
    bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }
  return decoder.decode(Uint8Array.from(bytes));
}

function htmlEncode(text) {
  return text.replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char];
  });
}

function htmlDecode(text) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

function textToBinary(text) {
  return Array.from(encoder.encode(text), (byte) => byte.toString(2).padStart(8, "0")).join(" ");
}

function binaryToText(text) {
  const clean = text.trim().split(/\s+/).filter(Boolean);
  if (!clean.every((part) => /^[01]{8}$/.test(part))) {
    throw new Error("Binary input must use 8-bit groups separated by spaces.");
  }
  return decoder.decode(Uint8Array.from(clean.map((part) => Number.parseInt(part, 2))));
}

function buildHexdump(text) {
  const bytes = encoder.encode(text);
  const lines = [];
  for (let offset = 0; offset < bytes.length; offset += 16) {
    const chunk = bytes.slice(offset, offset + 16);
    const hex = Array.from(chunk, (byte) => byte.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
    const ascii = Array.from(chunk, (byte) => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : ".")).join("");
    lines.push(`${offset.toString(16).padStart(8, "0")}  ${hex}  |${ascii}|`);
  }
  return lines.join("\n");
}

function extractMatches(text, pattern) {
  const matches = text.match(pattern) || [];
  return [...new Set(matches)].join("\n") || "No matches found.";
}

function calculateEntropy(text) {
  if (!text.length) return "Entropy: 0 bits per character";
  const counts = new Map();
  for (const char of text) counts.set(char, (counts.get(char) || 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / text.length;
    entropy -= probability * Math.log2(probability);
  }
  return [
    `Entropy: ${entropy.toFixed(4)} bits per character`,
    `Length: ${text.length.toLocaleString()} characters`,
    `Unique symbols: ${counts.size.toLocaleString()}`,
    `Estimated total entropy: ${(entropy * text.length).toFixed(2)} bits`
  ].join("\n");
}

function defang(text) {
  return text
    .replace(/https?:\/\//gi, (match) => match.replace("://", "[://]"))
    .replace(/\./g, "[.]")
    .replace(/@/g, "[@]");
}

function refang(text) {
  return text
    .replace(/\[:\/\/\]/g, "://")
    .replace(/\[\.\]/g, ".")
    .replace(/\[@\]/g, "@");
}

function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueLines(text) {
  return [...new Set(text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))].join("\n");
}

function sortLines(text) {
  return text.split(/\r?\n/).sort((a, b) => a.localeCompare(b)).join("\n");
}

function trimLines(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).join("\n");
}

function removeEmptyLines(text) {
  return text.split(/\r?\n/).filter((line) => line.trim()).join("\n");
}

function textStats(text) {
  const lines = text ? text.split(/\r?\n/) : [];
  const words = text.trim() ? text.trim().split(/\s+/) : [];
  const bytes = encoder.encode(text).length;
  return [
    `Characters: ${text.length.toLocaleString()}`,
    `Bytes: ${bytes.toLocaleString()}`,
    `Lines: ${lines.length.toLocaleString()}`,
    `Words: ${words.length.toLocaleString()}`,
    `Unique lines: ${new Set(lines).size.toLocaleString()}`,
    `SHA-ready: ${bytes <= MAX_TEXT_BYTES ? "yes" : "input too large"}`
  ].join("\n");
}

function parseUrl(text) {
  const value = text.trim();
  const parsed = new URL(value);
  const params = {};
  parsed.searchParams.forEach((paramValue, key) => {
    params[key] = paramValue;
  });
  return JSON.stringify({
    protocol: parsed.protocol,
    username: parsed.username || null,
    passwordPresent: Boolean(parsed.password),
    host: parsed.host,
    hostname: parsed.hostname,
    port: parsed.port || null,
    pathname: parsed.pathname,
    search: parsed.search || null,
    params,
    hash: parsed.hash || null,
    origin: parsed.origin
  }, null, 2);
}

function morseEncode(text) {
  return Array.from(text.toLowerCase()).map((char) => {
    if (char === " ") return "/";
    return MORSE[char] || char;
  }).join(" ");
}

function morseDecode(text) {
  const reverse = Object.fromEntries(Object.entries(MORSE).map(([key, value]) => [value, key]));
  return text.trim().split(/\s+/).map((token) => (token === "/" ? " " : reverse[token] || token)).join("");
}

function generateTimestamp() {
  const now = new Date();
  return [
    `ISO: ${now.toISOString()}`,
    `Unix seconds: ${Math.floor(now.getTime() / 1000)}`,
    `Unix milliseconds: ${now.getTime()}`,
    `Local: ${now.toLocaleString()}`
  ].join("\n");
}

function generateUuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function passwordScore(text) {
  const password = text.trim();
  if (!password) return "Password Score: provide a password or passphrase in the input panel.";
  let score = 0;
  const checks = [
    [password.length >= 12, "12+ characters"],
    [password.length >= 16, "16+ characters"],
    [/[a-z]/.test(password), "lowercase"],
    [/[A-Z]/.test(password), "uppercase"],
    [/\d/.test(password), "number"],
    [/[^A-Za-z0-9]/.test(password), "symbol"],
    [new Set(password).size >= Math.min(password.length, 10), "character variety"],
    [!/(password|admin|qwerty|letmein|welcome|123456)/i.test(password), "no common keyword"]
  ];
  const passed = checks.filter(([ok]) => ok).map(([, label]) => label);
  score = Math.round((passed.length / checks.length) * 100);
  const verdict = score >= 85 ? "Strong" : score >= 60 ? "Moderate" : "Weak";
  return [
    `Password Score: ${score}/100 (${verdict})`,
    `Length: ${password.length} characters`,
    `Passed checks: ${passed.join(", ") || "none"}`,
    "Tip: prefer long unique passphrases and never reuse passwords."
  ].join("\n");
}

function rotateText(text, amount) {
  return text.replace(/[a-z]/gi, (char) => {
    const base = char <= "Z" ? 65 : 97;
    const code = char.charCodeAt(0) - base;
    return String.fromCharCode(((code + amount + 26) % 26) + base);
  });
}

function decodeJwt(token) {
  const parts = token.trim().split(".");
  if (parts.length < 2) {
    throw new Error("JWT must include at least header and payload segments.");
  }
  const header = JSON.parse(fromBase64(parts[0]));
  const payload = JSON.parse(fromBase64(parts[1]));
  return JSON.stringify({ header, payload, signaturePresent: Boolean(parts[2]) }, null, 2);
}

function runCodec() {
  const input = $("#codecInput").value;
  const operation = $("#codecOperation").value;
  const shift = Number.parseInt($("#caesarShift").value, 10) || 0;
  assertSize(input);

  const operations = {
    "base64-encode": () => toBase64(input),
    "base64-decode": () => fromBase64(input),
    "base64url-encode": () => toBase64Url(input),
    "base64url-decode": () => fromBase64Url(input),
    "base32-encode": () => toBase32(input),
    "base32-decode": () => fromBase32(input),
    "hex-encode": () => bytesToHex(encoder.encode(input)),
    "hex-decode": () => decoder.decode(hexToBytes(input)),
    "binary-encode": () => textToBinary(input),
    "binary-decode": () => binaryToText(input),
    "url-encode": () => encodeURIComponent(input),
    "url-decode": () => decodeURIComponent(input),
    "html-encode": () => htmlEncode(input),
    "html-decode": () => htmlDecode(input),
    rot13: () => rotateText(input, 13),
    caesar: () => rotateText(input, shift),
    "jwt-decode": () => decodeJwt(input),
    "json-pretty": () => JSON.stringify(JSON.parse(input), null, 2),
    "json-minify": () => JSON.stringify(JSON.parse(input)),
    upper: () => input.toUpperCase(),
    lower: () => input.toLowerCase(),
    reverse: () => Array.from(input).reverse().join(""),
    slugify: () => slugify(input),
    "unique-lines": () => uniqueLines(input),
    "sort-lines": () => sortLines(input),
    "trim-lines": () => trimLines(input),
    "remove-empty-lines": () => removeEmptyLines(input),
    "morse-encode": () => morseEncode(input),
    "morse-decode": () => morseDecode(input),
    hexdump: () => buildHexdump(input),
    entropy: () => calculateEntropy(input),
    "extract-urls": () => extractMatches(input, /\bhttps?:\/\/[^\s<>"']+/gi),
    "extract-emails": () => extractMatches(input, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi),
    "parse-url": () => parseUrl(input),
    defang: () => defang(input),
    refang: () => refang(input),
    "uuid-v4": () => generateUuid(),
    timestamp: () => generateTimestamp(),
    "password-score": () => passwordScore(input),
    "text-stats": () => textStats(input)
  };

  $("#codecOutput").value = operations[operation]();
  updateStats();
  $("#codecStatus").textContent = "Completed successfully.";
}

async function shaDigest(text, algorithm) {
  if (algorithm === "MD5") {
    return md5(text);
  }
  const digest = await crypto.subtle.digest(algorithm, encoder.encode(text));
  return bytesToHex(new Uint8Array(digest));
}

async function hmacDigest(text, secret, algorithm) {
  if (algorithm === "MD5") {
    throw new Error("Web Crypto HMAC does not support MD5. Choose SHA-1, SHA-256, SHA-384, or SHA-512.");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: algorithm },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(text));
  return bytesToHex(new Uint8Array(signature));
}

async function derivePbkdf2(text, salt, iterations) {
  const safeIterations = Math.min(Math.max(iterations || 100000, 1000), 1000000);
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(text), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: safeIterations },
    keyMaterial,
    256
  );
  return bytesToHex(new Uint8Array(bits));
}

async function runHash() {
  const input = $("#codecInput").value;
  const algorithm = $("#hashAlgorithm").value;
  const secret = $("#hmacSecret").value;
  assertSize(input);
  assertSize(secret, "Secret");
  const digest = await shaDigest(input, algorithm);
  const lines = [`${algorithm}: ${digest}`];
  if (secret) {
    lines.push(`HMAC-${algorithm}: ${await hmacDigest(input, secret, algorithm)}`);
  }
  $("#hashOutput").value = lines.join("\n");
  $("#codecOutput").value = $("#hashOutput").value;
  updateStats();
}

async function runKdf() {
  const input = $("#codecInput").value;
  const salt = $("#kdfSalt").value || "rio6ix-salt";
  const iterations = Number.parseInt($("#kdfIterations").value, 10);
  assertSize(input);
  assertSize(salt, "Salt");
  $("#hashOutput").value = `PBKDF2-SHA256 (${iterations} iterations): ${await derivePbkdf2(input, salt, iterations)}`;
  $("#codecOutput").value = $("#hashOutput").value;
  updateStats();
}

function analyzeHash(value) {
  const hash = value.trim();
  if (!hash) return "Awaiting hash.";
  const checks = [
    [/^[a-f0-9]{32}$/i, "MD5 or NTLM length"],
    [/^[a-f0-9]{40}$/i, "SHA-1 length"],
    [/^[a-f0-9]{64}$/i, "SHA-256 length"],
    [/^[a-f0-9]{96}$/i, "SHA-384 length"],
    [/^[a-f0-9]{128}$/i, "SHA-512 length"],
    [/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/, "bcrypt"],
    [/^\$argon2(id|i|d)\$/i, "Argon2"],
    [/^\$6\$/i, "sha512crypt"],
    [/^[A-Za-z0-9+/]+={0,2}$/i, "Possibly Base64 encoded data"]
  ];
  const matches = checks.filter(([pattern]) => pattern.test(hash)).map(([, name]) => name);
  return matches.length ? `Likely format: ${matches.join(", ")}` : "Unknown format. Check length, prefix, and character set.";
}

function normalizeLines(text, max, label) {
  assertSize(text, label);
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length > max) {
    throw new Error(`${label} is limited to ${max.toLocaleString()} lines.`);
  }
  return lines;
}

async function runCrackme() {
  const targets = normalizeLines($("#targetHashes").value, MAX_HASHES, "Target hashes").map((item) => item.toLowerCase());
  const words = normalizeLines($("#wordlistInput").value, MAX_WORDS, "Wordlist");
  const algorithm = $("#crackAlgorithm").value;
  const saltMode = $("#saltMode").value;
  const salt = $("#saltValue").value;
  const targetSet = new Set(targets);
  const found = [];

  if (!targets.length || !words.length) {
    throw new Error("Add at least one target hash and one wordlist candidate.");
  }

  for (const word of words) {
    const candidate = saltMode === "prefix" ? `${salt}${word}` : saltMode === "suffix" ? `${word}${salt}` : word;
    const digest = (await shaDigest(candidate, algorithm)).toLowerCase();
    if (targetSet.has(digest)) {
      found.push(`${digest} => ${word}`);
    }
  }

  $("#crackOutput").value = found.length
    ? `Matches found:\n${found.join("\n")}`
    : `No matches in ${words.length.toLocaleString()} candidate(s).`;
  $("#codecOutput").value = $("#crackOutput").value;
  updateStats();
}

async function loadDemo() {
  $("#wordlistInput").value = "password\nadmin123\nrio6ix\nletmein\ncyberchief\nhashcat";
  $("#crackAlgorithm").value = "SHA-256";
  $("#targetHashes").value = await shaDigest("rio6ix", "SHA-256");
  $("#crackOutput").value = "Demo loaded. Run local crackme.";
  $("#codecOutput").value = $("#crackOutput").value;
  updateStats();
}

function safeCli(value) {
  return value.replace(/[^A-Za-z0-9._/?=:@%+,-]/g, "_") || "value";
}

function buildHashcatCommand() {
  const mode = $("#hashcatMode").value;
  const attack = $("#attackMode").value;
  const hashFile = safeCli($("#hashFileName").value);
  const wordlist = safeCli($("#wordlistName").value);
  const parts = ["hashcat", "-m", mode, "-a", attack, hashFile, wordlist];
  if ($("#optimizedKernels").checked) parts.push("-O");
  if ($("#showStatus").checked) parts.push("--status", "--status-timer=30");
  if ($("#restoreSafe").checked) parts.push("--restore");
  $("#hashcatOutput").value = `${parts.join(" ")}\n\n# Authorized testing only. Store hashes and wordlists outside public repositories.`;
  $("#codecOutput").value = $("#hashcatOutput").value;
  updateStats();
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("rio6ix-theme", theme);
  $("#themeIcon").textContent = theme === "light" ? "Light" : "Dark";
}

function showError(message, outputSelector) {
  $(outputSelector).value = `Error: ${message}`;
  if (outputSelector !== "#codecOutput") {
    $("#codecOutput").value = $(outputSelector).value;
  }
  updateStats();
}

function wireSafeClick(selector, handler, outputSelector) {
  const element = $(selector);
  if (!element) return;
  element.addEventListener("click", async () => {
    try {
      await handler();
    } catch (error) {
      showError(error.message || "Unexpected error.", outputSelector);
      if (selector === "#codecRun") {
        $("#codecStatus").textContent = "Check the input and operation.";
      }
    }
  });
}

function initializeTabs() {
  $$(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      selectTab(button.dataset.tab);
    });
  });
}

function selectTab(target) {
  $$(".tab-button").forEach((item) => {
    const active = item.dataset.tab === target;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
  });
  $$(".tool-panel").forEach((panel) => {
    const active = panel.dataset.panel === target;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  $(".io-panel").classList.toggle("show-crackme", target === "crack");
}

function activeTab() {
  return $(".tab-button.active")?.dataset.tab || "encode";
}

async function bake() {
  const tab = activeTab();
  if (tab === "encode") {
    runCodec();
  } else if (tab === "hash") {
    const activeName = $("#activeOperationName").textContent.toLowerCase();
    if (activeName.includes("pbkdf2")) {
      await runKdf();
    } else {
      await runHash();
    }
  } else if (tab === "crack") {
    await runCrackme();
  } else if (tab === "hashcat") {
    buildHashcatCommand();
  }
}

function maybeAutoBake() {
  if ($("#autoBake").checked) {
    window.clearTimeout(maybeAutoBake.timer);
    maybeAutoBake.timer = window.setTimeout(() => {
      bake().catch((error) => {
        $("#codecOutput").value = `Error: ${error.message || "Unexpected error."}`;
        updateStats();
      });
    }, 250);
  }
}

function updateStats() {
  $("#inputStats").textContent = `${$("#codecInput").value.length.toLocaleString()} chars`;
  $("#outputStats").textContent = `${$("#codecOutput").value.length.toLocaleString()} chars`;
}

function initializeOperationsPalette() {
  const labels = {
    "base64-encode": ["Base64 Encode", "Codec Forge"],
    "base64-decode": ["Base64 Decode", "Codec Forge"],
    "base64url-encode": ["Base64URL Encode", "Codec Forge"],
    "base64url-decode": ["Base64URL Decode", "Codec Forge"],
    "base32-encode": ["Base32 Encode", "Codec Forge"],
    "base32-decode": ["Base32 Decode", "Codec Forge"],
    "hex-encode": ["Hex Encode", "Codec Forge"],
    "hex-decode": ["Hex Decode", "Codec Forge"],
    "binary-encode": ["Binary Encode", "Codec Forge"],
    "binary-decode": ["Binary Decode", "Codec Forge"],
    "url-encode": ["URL Encode", "Encoding"],
    "url-decode": ["URL Decode", "Decoding"],
    "html-encode": ["HTML Entity Encode", "Encoding"],
    "html-decode": ["HTML Entity Decode", "Decoding"],
    rot13: ["ROT13", "Language"],
    caesar: ["Caesar Shift", "Language"],
    "jwt-decode": ["JWT Decode", "Data format"],
    "json-pretty": ["JSON Beautify", "Data format"],
    "json-minify": ["JSON Minify", "Data format"],
    upper: ["To Uppercase", "Language"],
    lower: ["To Lowercase", "Language"],
    reverse: ["Reverse", "Language"],
    slugify: ["Slugify", "Text Ops"],
    "unique-lines": ["Unique Lines", "Text Ops"],
    "sort-lines": ["Sort Lines", "Text Ops"],
    "trim-lines": ["Trim Lines", "Text Ops"],
    "remove-empty-lines": ["Remove Empty Lines", "Text Ops"],
    "morse-encode": ["Morse Encode", "Signal"],
    "morse-decode": ["Morse Decode", "Signal"],
    hexdump: ["Hexdump", "Data format"],
    entropy: ["Entropy", "Analysis"],
    "extract-urls": ["Extract URLs", "Extractors"],
    "extract-emails": ["Extract Emails", "Extractors"],
    "parse-url": ["Parse URL", "URL Intelligence"],
    defang: ["Defang IOCs", "Threat intel"],
    refang: ["Refang IOCs", "Threat intel"],
    "hash-md5": ["MD5 Hash", "Hashing"],
    "hash-sha1": ["SHA-1 Hash", "Hashing"],
    "hash-sha256": ["SHA-256 Hash", "Hashing"],
    "hash-sha512": ["SHA-512 Hash", "Hashing"],
    pbkdf2: ["PBKDF2", "Key derivation"],
    crackme: ["Crackme", "Local lab"],
    hashcat: ["Hashcat Helper", "Command builder"],
    "uuid-v4": ["UUID v4", "Generator"],
    timestamp: ["Timestamp", "Generator"],
    "password-score": ["Password Score", "Audit"],
    "text-stats": ["Text Stats", "Audit"]
  };
  const keywords = {
    "base64-encode": "b64 encode convert text ascii",
    "base64-decode": "b64 decode convert text ascii",
    "base32-encode": "b32 encode totp dns",
    "base32-decode": "b32 decode totp dns",
    "base64url-encode": "jwt url safe b64 encode",
    "base64url-decode": "jwt url safe b64 decode",
    "hex-encode": "hexadecimal bytes encode",
    "hex-decode": "hexadecimal bytes decode",
    "binary-encode": "bits zero one encode",
    "binary-decode": "bits zero one decode",
    "url-encode": "percent uri query encode",
    "url-decode": "percent uri query decode",
    "html-encode": "xss entity escape html",
    "html-decode": "entity unescape html",
    "jwt-decode": "token json web token bearer",
    "json-pretty": "beautify format json",
    "json-minify": "compress json",
    hexdump: "bytes offset ascii dump",
    "extract-urls": "links http https indicators ioc",
    "extract-emails": "mail address osint",
    "parse-url": "url parts host query domain path",
    defang: "ioc threat intel safe url domain email",
    refang: "ioc restore url domain email",
    rot13: "cipher caesar letter",
    caesar: "cipher shift letter",
    upper: "uppercase caps",
    lower: "lowercase",
    reverse: "flip backwards",
    slugify: "seo filename lowercase dash",
    "unique-lines": "dedupe duplicate list",
    "sort-lines": "alphabetical order list",
    "trim-lines": "whitespace clean",
    "remove-empty-lines": "blank clean list",
    "morse-encode": "dots dashes signal",
    "morse-decode": "dots dashes signal",
    "hash-md5": "digest weak legacy",
    "hash-sha1": "digest weak legacy",
    "hash-sha256": "digest secure checksum",
    "hash-sha512": "digest secure checksum",
    pbkdf2: "derive key password salt iterations",
    crackme: "ctf wordlist local crack practice",
    hashcat: "command mode attack gpu",
    "uuid-v4": "guid random id",
    timestamp: "time unix epoch iso",
    "password-score": "strength audit password",
    "text-stats": "count words lines bytes"
  };

  function activateOperation(button) {
    $$(".operation-item").forEach((item) => item.classList.toggle("active", item === button));
    const operation = button.dataset.operation;
    const tab = button.dataset.tab;
    selectTab(tab);
    const option = $(`#codecOperation option[value='${operation}']`);
    if (option) {
      $("#codecOperation").value = operation;
    }
    if (operation.startsWith("hash-")) {
      $("#hashAlgorithm").value = operation === "hash-md5" ? "MD5" : operation === "hash-sha1" ? "SHA-1" : operation === "hash-sha512" ? "SHA-512" : "SHA-256";
    }
    const [name, badge] = labels[operation] || [button.textContent.trim(), "Module"];
    $("#activeOperationName").textContent = name;
    $("#activeOperationBadge").textContent = badge;
    $("#dropZone").textContent = `${name} loaded. Drop another module here or run this one.`;
    maybeAutoBake();
  }

  function scoreOperation(button, query) {
    const operation = button.dataset.operation;
    const haystack = `${button.textContent} ${operation} ${keywords[operation] || ""}`.toLowerCase();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return 1;
    let score = 0;
    terms.forEach((term) => {
      if (haystack.includes(term)) score += 10;
      if (operation.includes(term)) score += 5;
      if (button.textContent.toLowerCase().startsWith(term)) score += 8;
      let cursor = 0;
      for (const char of term) {
        cursor = haystack.indexOf(char, cursor);
        if (cursor === -1) return;
        cursor += 1;
      }
      score += 2;
    });
    return score;
  }

  function renderSuggestions(query) {
    const box = $("#suggestionBox");
    const ranked = $$(".operation-item")
      .map((button) => ({ button, score: scoreOperation(button, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, query ? 6 : 4);
    box.replaceChildren();
    if (!ranked.length) {
      const empty = document.createElement("span");
      empty.className = "suggestion-empty";
      empty.textContent = "No related modules";
      box.append(empty);
      return;
    }
    ranked.forEach(({ button }) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "suggestion-chip";
      chip.textContent = button.textContent.trim();
      chip.addEventListener("click", () => activateOperation(button));
      box.append(chip);
    });
  }

  $$(".operation-item").forEach((button) => {
    button.draggable = true;
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", button.dataset.operation);
      event.dataTransfer.effectAllowed = "copy";
      button.classList.add("dragging");
    });
    button.addEventListener("dragend", () => button.classList.remove("dragging"));
    button.addEventListener("click", () => {
      activateOperation(button);
    });
  });

  $("#operationSearch").addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    $$(".operation-item").forEach((button) => {
      button.hidden = query && scoreOperation(button, query) === 0;
    });
    renderSuggestions(query);
  });

  $("#dropZone").addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    $("#dropZone").classList.add("drag-over");
  });
  $("#dropZone").addEventListener("dragleave", () => $("#dropZone").classList.remove("drag-over"));
  $("#dropZone").addEventListener("drop", (event) => {
    event.preventDefault();
    $("#dropZone").classList.remove("drag-over");
    const operation = event.dataTransfer.getData("text/plain");
    const button = $(`.operation-item[data-operation='${operation}']`);
    if (button) activateOperation(button);
  });

  renderSuggestions("");
}

function initializeCopyButtons() {
  $$(".copy-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const target = $(`#${button.dataset.copy}`);
      await navigator.clipboard.writeText(target.value);
      const original = button.textContent;
      button.textContent = "Copied";
      window.setTimeout(() => {
        button.textContent = original;
      }, 1200);
    });
  });
}

function md5(input) {
  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }
  function add32(a, b) { return (a + b) & 0xffffffff; }
  function rhex(n) {
    let s = "";
    for (let j = 0; j < 4; j += 1) {
      s += ((n >> (j * 8 + 4)) & 0x0f).toString(16) + ((n >> (j * 8)) & 0x0f).toString(16);
    }
    return s;
  }
  function md5cycle(x, k) {
    let [a, b, c, d] = x;
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  }
  function md5blk(s) {
    const blocks = [];
    for (let i = 0; i < 64; i += 4) {
      blocks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return blocks;
  }
  function md51(s) {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i;
    for (i = 64; i <= n; i += 64) md5cycle(state, md5blk(s.substring(i - 64, i)));
    s = s.substring(i - 64);
    const tail = new Array(16).fill(0);
    for (i = 0; i < s.length; i += 1) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      tail.fill(0);
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  const binary = unescape(encodeURIComponent(input));
  return md51(binary).map(rhex).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  initializeTabs();
  initializeCopyButtons();
  initializeOperationsPalette();

  setTheme(localStorage.getItem("rio6ix-theme") || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
  $("#themeToggle").addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
  });

  wireSafeClick("#crackRun", runCrackme, "#crackOutput");
  wireSafeClick("#demoLoad", loadDemo, "#crackOutput");
  $("#bakeButton").addEventListener("click", () => {
    bake().catch((error) => showError(error.message || "Unexpected error.", "#codecOutput"));
  });

  $("#codecSwap").addEventListener("click", () => {
    const input = $("#codecInput");
    const output = $("#codecOutput");
    [input.value, output.value] = [output.value, input.value];
    updateStats();
    $("#codecStatus").textContent = "Swapped input and output.";
  });
  $("#codecClear").addEventListener("click", () => {
    $("#codecInput").value = "";
    $("#codecOutput").value = "";
    updateStats();
    $("#codecStatus").textContent = "Cleared.";
  });
  $("#crackClear").addEventListener("click", () => {
    $("#targetHashes").value = "";
    $("#wordlistInput").value = "";
    $("#crackOutput").value = "";
    $("#codecOutput").value = "";
    updateStats();
  });
  $("#hashAnalyzer").addEventListener("input", (event) => {
    $("#hashGuess").textContent = analyzeHash(event.target.value);
  });
  $("#codecInput").addEventListener("input", () => {
    updateStats();
    maybeAutoBake();
  });
  $("#codecOperation").addEventListener("change", maybeAutoBake);
  $("#caesarShift").addEventListener("input", maybeAutoBake);
  $("#hashAlgorithm").addEventListener("change", maybeAutoBake);
  $("#hmacSecret").addEventListener("input", maybeAutoBake);
  $("#kdfSalt").addEventListener("input", maybeAutoBake);
  $("#kdfIterations").addEventListener("input", maybeAutoBake);
  $("#hashcatMode").addEventListener("change", maybeAutoBake);
  $("#attackMode").addEventListener("change", maybeAutoBake);
  $("#hashFileName").addEventListener("input", maybeAutoBake);
  $("#wordlistName").addEventListener("input", maybeAutoBake);
  $("#optimizedKernels").addEventListener("change", maybeAutoBake);
  $("#showStatus").addEventListener("change", maybeAutoBake);
  $("#restoreSafe").addEventListener("change", maybeAutoBake);
  $("#wordlistInput").addEventListener("input", maybeAutoBake);
  $("#targetHashes").addEventListener("input", maybeAutoBake);
  $("#saltMode").addEventListener("change", maybeAutoBake);
  $("#saltValue").addEventListener("input", maybeAutoBake);
  $("#recipeClear").addEventListener("click", () => {
    $("#codecInput").value = "";
    $("#codecOutput").value = "";
    $("#wordlistInput").value = "";
    $("#targetHashes").value = "";
    $("#codecStatus").textContent = "Workflow cleared.";
    updateStats();
  });
  $("#recipeSave").addEventListener("click", () => {
    $("#codecStatus").textContent = `Pinned module: ${$("#activeOperationName").textContent}.`;
  });
  updateStats();
});
