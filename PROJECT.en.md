# Subtitle Instrumentality Project (SIP) ｜ 字幕補完計劃

> **From incomplete to complete.**
> — Building a complete multilingual subtitle library for JAV.

[中文版](PROJECT.md)

---

## What is SIP

**Subtitle Instrumentality Project** (abbreviated **SIP**, Chinese **字幕補完計劃**) is an
ongoing subtitle-library construction project.

**Name origin**: "Human Instrumentality Project" (人類補完計画) from the anime
*Neon Genesis Evangelion*. "補完" (instrumentality / completion) means
"changing from incomplete to complete" — exactly what this project does.

**Tool**: [SubSensei ｜ 字幕老師](README.md) — the browser userscript that lets viewers read subtitles.
**SIP is the project; SubSensei is the tool.** SIP builds the library, SubSensei presents it.

---

## Current Status

### Library size

| Language | Subtitles | Status |
|---|---|---|
| 🇭🇰 Cantonese | **81,443** | ✅ Primary |
| 🇹🇼 Traditional Chinese | **17,882** | ✅ Primary |
| 🇨🇳 Simplified Chinese | **3,529** | ✅ Complete |
| 🇬🇧 English | **10,987** | ✅ Complete |
| 🇰🇷 Korean | 3,079 | 🔄 In progress |
| 🇲🇾 Malay | 187 | 🔄 In progress |
| 🇹🇭 Thai | 3,295 | 🔄 In progress |
| 🇻🇳 Vietnamese | 226 | 🔄 In progress |
| 🇮🇩 Indonesian | 187 | 🔄 In progress |
| 🇵🇭 Filipino | 226 | 🔄 In progress |
| 🇩🇪 German | 226 | 🔄 In progress |
| 🇫🇷 French | 226 | 🔄 In progress |
| 🇧🇷 Portuguese | 226 | 🔄 In progress |
| 🇷🇺 Russian | 3,295 | 🔄 In progress |
| **Total** | **125,014** | |

### Technical architecture

```
Japanese source video
    ↓ WhisperJAV / Deepgram (speech recognition, STT)
Japanese SRT
    ↓ Hy-MT2-7B (local 7B model, GPU translation)
14-language SRT
    ↓ PocketBase Cloud (Singapore)
Read by users through SubSensei
```

**Everything runs locally — no paid API dependency.**

---

## Roadmap

### In progress

| Item | Status |
|---|---|
| **Full translation of the other 10 languages** | English and Simplified Chinese are complete; the other 10 are in progress (149 each) |
| **Re-run speech recognition on 497 partial subtitles** | Requires re-running WhisperJAV on the mp3 files |

### Planned

| Item | Description |
|---|---|
| **Supjav / JAVXXX support** | Broaden site coverage |
| **Subtitle distribution bar** | Show on the progress bar which segments have subtitles |
| **Viewer heat map** | Show the most replayed segments (requires collecting viewing behaviour) |

### Completed

| Milestone | Date |
|---|---|
| Cantonese library: 81,443 subtitles | 2026-11 |
| Traditional Chinese: 17,882 subtitles | 2026-11 |
| Simplified Chinese: 3,529 subtitles | 2026-11 |
| English: 10,987 subtitles | 2026-11 |
| SubSensei v1.0.0 (13 domains + 14 languages) | 2026-10-31 |
| BMC payment system live (real-card test passed) | 2026-10-23 |

---

## Why support is needed

### Costs

| Item | Description |
|---|---|
| **GPU electricity** | Translating 494 hours of audio needs roughly 50-100 GPU hours |
| **PocketBase Cloud** | Monthly server fee |
| **Storage** | 125,014 subtitles ≈ 3.9 GB (still growing) |
| **Development time** | Ongoing maintenance and new features |

### How to support

**[☕ Buy Me a Coffee](https://buymeacoffee.com/neo2codes)**

**Donate USD$30 or more** → become a supporter → receive SubSensei supporter quota
(100 loads per day) and the benefits below.

> **⚠️ This is a donation-based support program, not a membership purchase.**
> Your donation builds the subtitle library; the supporter quota is a thank-you gift.

---

## Supporter Benefits

### 1. 100 subtitles per day

Free accounts load 3 per day; supporters get **100 per day**.

### 2. Priority translation for newly released videos

If you donate and specify a language, new videos in that language are processed first.

**How it works**: mention "please prioritize English" when donating, and English subtitles
for newly added releases move to the front of the backlog.

### 3. Bulk subtitle requests

Use the "回報" (Report) button in the SubSensei panel to request subtitles in bulk:

- All works by a particular actress
- All videos in a series (e.g. `SSIS`, `MIDE`, `FC2-PPV`)

**How to use:**
1. Click "回報" (Report) in the panel on any page
2. Choose "請求字幕" (Request subtitles)
3. Write the actress name or series code in the details field
4. Submit — it enters the backlog and is prioritized for supporters

---

## FAQ

### Q: Is donating the same as buying membership?

**No.** You are supporting the construction of the SIP project, and we provide SubSensei
supporter quota and related benefits as a thank-you. It is a gift, not a commercial transaction.

### Q: What is the donation used for?

| Purpose | Share |
|---|---|
| GPU translation (electricity) | Largest |
| PocketBase Cloud server | Secondary |
| Development time | Ongoing |

### Q: Can I use it without donating?

**Yes.** The free quota is 3 loads per day, the library is fully accessible, and all
features are identical.

### Q: When will the library be finished?

**It is an ongoing effort.** There are currently 125,014 subtitles, mainly in Cantonese,
Traditional Chinese, Simplified Chinese, and English; the other 10 languages are expanding.

### Q: Can I request subtitles for a specific video?

Yes. In the SubSensei panel click "回報" (Report) → "請求字幕" (Request subtitles).
It enters the backlog (no guaranteed turnaround).

### Q: What about requesting a whole series?

Use the same "回報" → "請求字幕" flow and write the actress name or series code
(e.g. "all works by Yua Mikami" or "the SSIS series"). Supporter status is prioritized.

### Q: What if a subtitle has errors?

In the SubSensei panel click "回報" (Report) → "字幕錯字" (Wrong text) or
"翻譯不準確" (Inaccurate translation). Reports automatically include the version number,
UI language, and browser user agent, which makes them easy to investigate.

---

## Technical details

### Subtitle quality markers

| Marker | Meaning |
|---|---|
| `premium` | File ≥ 2 KB, complete content |
| `partial` | File < 2 KB, incomplete content (orange "殘次" badge) |

**Why a subtitle is partial**: most often the speech-recognition step itself produced very
few cues (e.g. a two-hour video with a single line), not a translation problem.

**Common causes:**
- The video contains very little dialogue (music only, ambient sound, no spoken lines)
- Loud background music, overlapping speakers, accents, or poor recording quality

### Translation models

| Purpose | Model |
|---|---|
| Speech recognition (STT) | WhisperJAV (local) |
| Translation | Hy-MT2-7B Q4_K_M (local llama.cpp) |
| Translation settings | temperature 0.5, batch 15, workers 16 |

### Data storage

**PocketBase Cloud** (Singapore)

- `subtitles` — 125,014 records
- `users` — accounts
- `tip_events` — payment records
- `tip_accumulator` — donation totals
- `reports` — user reports
- `access_logs` — access log

---

## Links

| Link | Content |
|---|---|
| [SubSensei README](README.en.md) | Install and usage (English) |
| [CHANGELOG](CHANGELOG.md) | Full version history |
| [FAQ](docs/FAQ.md) | Detailed FAQ |
| [GitHub Issues](https://github.com/neo2codes/subsensei/issues) | Report problems |
| [Buy Me a Coffee](https://buymeacoffee.com/neo2codes) | Support the project |
| [PROJECT.md](PROJECT.md) | 中文版 |

---

## License

MIT — see [LICENSE](LICENSE)

**Scope**: covers the userscript source code only.
The Subtitle Instrumentality Project database (all SRT files, translations, and metadata)
is proprietary and is not covered by the MIT license.
