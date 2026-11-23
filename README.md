# Language Harness

**An agent harness for learning languages — any language.**

Language Harness uses AI agents to take you from what you can already do in a language to what you want to be able to do with it. It measures where your ability ends, plans the shortest route to your goal, and teaches one new word, form or pattern at a time, with audio for everything you should hear. Practice sessions then make the language come to mind when you need it.

> **A modified version of [LearnHarness](https://github.com/amosblomqvist/learnharness)** by Amos Blomqvist, forked from LearnHarness v0.7.0 on 2026-11-23 and changed to teach languages instead of general concepts. Like LearnHarness, it is free software under the [GNU AGPL-3.0](LICENSE). The [changes](#what-changed-from-learnharness) are listed below.

## How it works

1. **Placement.** Before teaching, the tutor pins down what you want to do with the language (travel, conversation, reading, family, an exam), which variety you need, and which skills matter. Then it brackets your level on each strand — sound, script, vocabulary, grammar, comprehension, production — with real sentences to understand, build or hear. Complete beginners skip straight to what transfers from the languages they already know.
2. **Plan.** It works out a dependency map from that starting point to your goal: the core patterns at the bottom, the structures and vocabulary your goal needs above them. You see the map and can change it; it adapts when your answers show something different.
3. **Teach.** Each step brings in one new element inside language you already understand. Examples come before rules, so you notice the pattern before it is named; minimal pairs isolate exactly what is new; differences from your own language are named before they turn into errors. Every step ends with a check that makes you use the new element in a sentence you haven't seen.
4. **Practice.** Separate sessions pose short, varied demands — recall, telling confusable forms apart, building whole utterances — interleaved across what you've learned, with hints held to the minimum and retests in fresh sentences.

The tutor writes explanations in your language and moves more of its own prose into the target language as your level allows. Words and rules taught in lessons accumulate in a persistent knowledge graph that later sessions build on.

### Hear it, say it

- **Pronunciation audio.** Every phrase the tutor wants you to hear comes in a `speak` block with play buttons (normal or slow, one line or the whole dialogue). Listening exercises hide the text until you reveal it.
- **Your device's voices.** Audio uses the browser's built-in speech synthesis: free and keyless, but coverage depends on the device. Phones and Microsoft Edge have voices for many languages; desktop Chromium has fewer; the desktop app has only the operating system's voices. When no voice exists for a language, the block says so and still shows the text.
- **Speaking practice.** With a Deepgram key, dictation can transcribe the target language: the switch next to the microphone toggles between your usual dictation language and the session's target (shown for the [languages Deepgram Nova-3 supports](https://developers.deepgram.com/docs/models-languages-overview)).

### Any language

Pick from the list (about a hundred languages, each with its standard tag, so voices and dictation work) or type any language's name — a heritage dialect, a classical language, a constructed one. Languages without a known tag are taught without audio or dictation, with pronunciation given in writing. You can also choose the language explanations are written in, including the target language itself if you're refining one you already speak.

## Run it

Language Harness currently runs from source. It needs Node.js 22 or newer (CI uses Node 26).

```sh
npm ci
npm run plugins:setup   # local SDKs and locked plugin dependencies
npm run dev             # http://localhost:3000
```

For a production server: `npm run build`, then `npm start`. Open **Settings → Providers** to connect a model provider (API keys, supported subscriptions, the Claude Code CLI, or any OpenAI-compatible endpoint including a local model server), pick your Strong/Cheap/Vision models, choose the language to learn above the composer, and say what you want to be able to do.

**There is no login.** Anyone who can reach the server can read every session and setting and spend your API credits. Keep it on `localhost` or a private network you trust (a tailnet, for example); never expose it to the public internet without an authenticating proxy in front. To reach it by a host name rather than an IP address, list the name in `LH_ALLOWED_HOSTS` — see [Development](docs/development.md#other-devices-on-your-network).

The test suite runs with `npm test` (on Windows, run `NODE_ENV=test npx tsx --test "tests/*.test.ts" "tests/*.test.tsx"` from Git Bash, since the npm script uses POSIX environment syntax). Desktop packaging is inherited from LearnHarness and is unsigned in this fork; see [Desktop builds and releases](docs/desktop-release.md).

## What changed from LearnHarness

- **The teaching doctrine.** The prober, teacher, practice and side-question prompts teach languages: placement by skill strand with CEFR-calibrated bracketing, one-new-element steps with examples before rules, production-first checks, transfer-error repair, and practice modes for recall, discrimination and composition. The theory is in [docs/language-methodology.md](docs/language-methodology.md); LearnHarness's original theory stays in [docs/teaching-methodology.md](docs/teaching-methodology.md).
- **Session languages.** Each session records its target language and explanation language at creation (`src/core/language.ts`); the pair is added to every agent's instructions, remembered for the next session (Settings section `language`), and shown in the session header.
- **Audio.** `speak` fences with device-voice playback (`components/speak-block.tsx`, `components/speech.ts`), with voice matching that never reads Cantonese with a Mandarin voice or the reverse.
- **Dictation in the target language,** per session (`components/session-language.tsx`).
- **Name, icon and feeds.** Renamed to Language Harness with its own icon; desktop updates and startup announcements read this repository, never LearnHarness's.
- **Source offer.** A *Source* link in the sidebar and a *Source code* row in Settings → General point to this repository (AGPL-3.0 §13).

Everything else — models and providers, plans, the knowledge graph, side questions, research, demos, plugins — is LearnHarness's, documented in [docs/](docs/README.md).

## Your keys, your data

Chats, the knowledge graph, settings and API keys stay on the machine running the server, as plain files. Model requests go to the providers you configure; web research, dictation and speech synthesis on some devices contact external services. Prompts are visible and editable in Settings.

## License and source

Language Harness is licensed under the [GNU Affero General Public License v3.0](LICENSE), the same license as LearnHarness. If you run a modified version for other people, the AGPL requires you to offer them its source: build with `LH_SOURCE_URL` set to where that source is published, and the in-app links will point there.

LearnHarness is © Amos Blomqvist and its contributors; the plugins in `plugins/` carry their own license files.
