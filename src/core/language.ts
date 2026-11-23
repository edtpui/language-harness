/**
 * Session languages (Language Harness): the language a session teaches and
 * the learner's own language. A session's pair is fixed when it is created;
 * the picker remembers the last pair in settings.json → `language`.
 *
 * Pure and browser-safe. Names and canonical tags come from Intl (full ICU in
 * Node and every supported browser); voices and dictation key on the tag.
 * A language the app has no tag for is still teachable — it has a name only,
 * so it gets no audio, dictation, or text-direction support.
 */

import { isDictationLanguage, type DictationLanguage } from "./dictation.ts";

export interface LanguageRef {
	/** Canonical BCP 47 tag ("es", "pt-BR", "yue"). Absent for a language the
	 *  learner named that has no known tag. */
	tag?: string;
	/** English display name ("Spanish", "Cantonese"). */
	name: string;
}

/** A session's language pair, stamped on the record at creation. */
export interface SessionLanguage {
	/** The language being learned. */
	target: LanguageRef;
	/** The learner's own language: explanations, glosses and feedback. */
	base: LanguageRef;
}

/** settings.json → `language`: the picker's remembered choice. */
export interface LanguageSettings {
	target?: LanguageRef;
	base?: LanguageRef;
}

export const DEFAULT_BASE_LANGUAGE: LanguageRef = Object.freeze({ tag: "en", name: "English" });

export const LANGUAGE_NAME_MAX = 60;

/** The picker's list. Names are written out where Intl's would mislead a
 *  learner ("Chinese (China)" is not a language choice; Mandarin is). Tags are
 *  canonical (Intl.getCanonicalLocales): Tagalog canonicalizes to `fil`. */
export const COMMON_LANGUAGES: readonly LanguageRef[] = Object.freeze([
	{ tag: "af", name: "Afrikaans" },
	{ tag: "sq", name: "Albanian" },
	{ tag: "am", name: "Amharic" },
	{ tag: "grc", name: "Ancient Greek" },
	{ tag: "ar", name: "Arabic" },
	{ tag: "hy", name: "Armenian" },
	{ tag: "az", name: "Azerbaijani" },
	{ tag: "eu", name: "Basque" },
	{ tag: "be", name: "Belarusian" },
	{ tag: "bn", name: "Bengali" },
	{ tag: "bs", name: "Bosnian" },
	{ tag: "pt-BR", name: "Brazilian Portuguese" },
	{ tag: "bg", name: "Bulgarian" },
	{ tag: "my", name: "Burmese" },
	{ tag: "yue", name: "Cantonese" },
	{ tag: "ca", name: "Catalan" },
	{ tag: "ceb", name: "Cebuano" },
	{ tag: "hr", name: "Croatian" },
	{ tag: "cs", name: "Czech" },
	{ tag: "da", name: "Danish" },
	{ tag: "nl", name: "Dutch" },
	{ tag: "en", name: "English" },
	{ tag: "eo", name: "Esperanto" },
	{ tag: "et", name: "Estonian" },
	{ tag: "pt-PT", name: "European Portuguese" },
	{ tag: "fil", name: "Filipino (Tagalog)" },
	{ tag: "fi", name: "Finnish" },
	{ tag: "fr", name: "French" },
	{ tag: "gl", name: "Galician" },
	{ tag: "ka", name: "Georgian" },
	{ tag: "de", name: "German" },
	{ tag: "el", name: "Greek" },
	{ tag: "gu", name: "Gujarati" },
	{ tag: "ht", name: "Haitian Creole" },
	{ tag: "ha", name: "Hausa" },
	{ tag: "haw", name: "Hawaiian" },
	{ tag: "he", name: "Hebrew" },
	{ tag: "hi", name: "Hindi" },
	{ tag: "hu", name: "Hungarian" },
	{ tag: "is", name: "Icelandic" },
	{ tag: "ig", name: "Igbo" },
	{ tag: "id", name: "Indonesian" },
	{ tag: "ga", name: "Irish" },
	{ tag: "it", name: "Italian" },
	{ tag: "ja", name: "Japanese" },
	{ tag: "jv", name: "Javanese" },
	{ tag: "kn", name: "Kannada" },
	{ tag: "kk", name: "Kazakh" },
	{ tag: "km", name: "Khmer" },
	{ tag: "ko", name: "Korean" },
	{ tag: "ku", name: "Kurdish" },
	{ tag: "lo", name: "Lao" },
	{ tag: "es-419", name: "Latin American Spanish" },
	{ tag: "la", name: "Latin" },
	{ tag: "lv", name: "Latvian" },
	{ tag: "lt", name: "Lithuanian" },
	{ tag: "mk", name: "Macedonian" },
	{ tag: "ms", name: "Malay" },
	{ tag: "ml", name: "Malayalam" },
	{ tag: "mt", name: "Maltese" },
	{ tag: "zh-CN", name: "Mandarin Chinese (Simplified)" },
	{ tag: "zh-TW", name: "Mandarin Chinese (Traditional)" },
	{ tag: "mi", name: "Māori" },
	{ tag: "mr", name: "Marathi" },
	{ tag: "mn", name: "Mongolian" },
	{ tag: "ne", name: "Nepali" },
	{ tag: "nb", name: "Norwegian (Bokmål)" },
	{ tag: "ps", name: "Pashto" },
	{ tag: "fa", name: "Persian" },
	{ tag: "pl", name: "Polish" },
	{ tag: "pt", name: "Portuguese" },
	{ tag: "pa", name: "Punjabi" },
	{ tag: "qu", name: "Quechua" },
	{ tag: "ro", name: "Romanian" },
	{ tag: "ru", name: "Russian" },
	{ tag: "sa", name: "Sanskrit" },
	{ tag: "gd", name: "Scottish Gaelic" },
	{ tag: "sr", name: "Serbian" },
	{ tag: "si", name: "Sinhala" },
	{ tag: "sk", name: "Slovak" },
	{ tag: "sl", name: "Slovenian" },
	{ tag: "so", name: "Somali" },
	{ tag: "es", name: "Spanish" },
	{ tag: "sw", name: "Swahili" },
	{ tag: "sv", name: "Swedish" },
	{ tag: "ta", name: "Tamil" },
	{ tag: "te", name: "Telugu" },
	{ tag: "th", name: "Thai" },
	{ tag: "bo", name: "Tibetan" },
	{ tag: "tok", name: "Toki Pona" },
	{ tag: "tr", name: "Turkish" },
	{ tag: "uk", name: "Ukrainian" },
	{ tag: "ur", name: "Urdu" },
	{ tag: "uz", name: "Uzbek" },
	{ tag: "vi", name: "Vietnamese" },
	{ tag: "cy", name: "Welsh" },
	{ tag: "xh", name: "Xhosa" },
	{ tag: "yi", name: "Yiddish" },
	{ tag: "yo", name: "Yoruba" },
	{ tag: "zu", name: "Zulu" },
].map((language) => Object.freeze(language)));

const TAG_SHAPE = /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/;

/** The canonical form of a BCP 47 tag, or null when it is not one. */
export function canonicalLanguageTag(raw: unknown): string | null {
	if (typeof raw !== "string") return null;
	const tag = raw.trim();
	if (tag.length === 0 || tag.length > 35 || !TAG_SHAPE.test(tag)) return null;
	try {
		return Intl.getCanonicalLocales(tag)[0] ?? null;
	} catch {
		return null;
	}
}

function primarySubtag(tag: string): string {
	return tag.split("-")[0]!.toLowerCase();
}

/** The English name the app shows and tells the model, or null when neither
 *  the list nor Intl knows the tag (Intl echoes unknown codes back). */
export function englishLanguageName(tag: string): string | null {
	const canonical = canonicalLanguageTag(tag);
	if (!canonical) return null;
	const listed = COMMON_LANGUAGES.find((language) => language.tag === canonical);
	if (listed) return listed.name;
	try {
		const name = new Intl.DisplayNames(["en"], { type: "language", fallback: "none" }).of(canonical);
		return name && name.toLowerCase() !== canonical.toLowerCase() ? name : null;
	} catch {
		return null;
	}
}

/** The language's name for itself ("español"), or null when unknown. */
export function languageAutonym(tag: string): string | null {
	const canonical = canonicalLanguageTag(tag);
	if (!canonical) return null;
	try {
		const name = new Intl.DisplayNames([canonical], { type: "language", fallback: "none" }).of(canonical);
		return name && name.toLowerCase() !== canonical.toLowerCase() ? name : null;
	} catch {
		return null;
	}
}

const NAME_SHAPE = /^[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N} ()'’.,-]*$/u;

/** A learner-typed language name: one line of letters and light punctuation.
 *  It is quoted into the model's instructions, so nothing structural passes. */
export function cleanLanguageName(raw: unknown): string | null {
	if (typeof raw !== "string") return null;
	// A line break or control character is never part of a language's name:
	// refuse it rather than fold it into one line.
	if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
	const name = raw.replace(/ {2,}/g, " ").trim();
	if (name.length === 0 || name.length > LANGUAGE_NAME_MAX || !NAME_SHAPE.test(name)) return null;
	return name;
}

/** Validate one language: a known tag (its name is the list's or Intl's) or a
 *  named language without a tag. Unknown keys are dropped. */
export function parseLanguageRef(raw: unknown): LanguageRef | null {
	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
	const record = raw as Record<string, unknown>;
	if (record.tag !== undefined) {
		const tag = canonicalLanguageTag(record.tag);
		if (!tag) return null;
		const name = englishLanguageName(tag) ?? cleanLanguageName(record.name);
		return name ? { tag, name } : null;
	}
	const name = cleanLanguageName(record.name);
	if (!name) return null;
	// A typed name that is really a listed language gains its tag (and so its
	// voices and dictation), whatever the learner's capitalization.
	const listed = COMMON_LANGUAGES.find((language) => language.name.toLowerCase() === name.toLowerCase());
	return listed ? { tag: listed.tag, name: listed.name } : { name };
}

export function parseSessionLanguage(raw: unknown): SessionLanguage | null {
	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
	const record = raw as Record<string, unknown>;
	const target = parseLanguageRef(record.target);
	const base = parseLanguageRef(record.base);
	return target && base ? { target, base } : null;
}

/** settings.json `language`: each half independently valid or dropped. */
export function sanitizeLanguageSettings(raw: unknown): LanguageSettings {
	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return {};
	const record = raw as Record<string, unknown>;
	const out: LanguageSettings = {};
	const target = parseLanguageRef(record.target);
	if (target) out.target = target;
	const base = parseLanguageRef(record.base);
	if (base) out.base = base;
	return out;
}

export function sameLanguage(a: LanguageRef | undefined, b: LanguageRef | undefined): boolean {
	if (!a || !b) return false;
	return a.tag !== undefined || b.tag !== undefined ? a.tag === b.tag : a.name.toLowerCase() === b.name.toLowerCase();
}

const RTL_PRIMARY = new Set(["ar", "fa", "he", "ur", "ps", "sd", "ug", "yi", "dv", "ckb", "syr", "arc"]);

/** Right-to-left script by default (Arabic, Hebrew, Persian…). */
export function isRtlLanguage(tag: string | undefined): boolean {
	if (!tag) return false;
	const canonical = canonicalLanguageTag(tag);
	if (!canonical) return false;
	if (/-(Arab|Hebr|Thaa|Syrc)(?:-|$)/.test(canonical)) return true;
	if (/-(Latn|Cyrl)(?:-|$)/.test(canonical)) return false;
	return RTL_PRIMARY.has(primarySubtag(canonical));
}

// ─── Speech recognition (Deepgram Nova-3) ────────────────────────────────────

/** Tags Deepgram files under another code. Cantonese is zh-HK there; Filipino
 *  canonicalizes from tl, which is Deepgram's code; Bokmål is plain no;
 *  Singapore Mandarin is written in simplified characters. */
const DICTATION_ALIASES: Readonly<Record<string, DictationLanguage>> = {
	yue: "zh-HK",
	fil: "tl",
	nb: "no",
	nn: "no",
	"zh-SG": "zh",
};

/** The Nova-3 code for a language, or null when Deepgram does not transcribe
 *  it (dictation then stays in the learner's chosen dictation language). */
export function dictationLanguageFor(tag: string | undefined): DictationLanguage | null {
	if (!tag) return null;
	const canonical = canonicalLanguageTag(tag);
	if (!canonical) return null;
	if (isDictationLanguage(canonical)) return canonical;
	const alias = DICTATION_ALIASES[canonical] ?? DICTATION_ALIASES[primarySubtag(canonical)];
	if (alias) return alias;
	// Cantonese and Mandarin share the zh primary subtag: never cross them.
	if (primarySubtag(canonical) === "zh") return null;
	const primary = primarySubtag(canonical);
	return isDictationLanguage(primary) ? primary : null;
}

// ─── Speech synthesis (device voices) ────────────────────────────────────────

function normalizeVoiceTag(raw: string): string {
	return raw.replace(/_/g, "-").trim().toLowerCase();
}

const PRIMARY_ALIASES: Readonly<Record<string, string>> = { iw: "he", in: "id", ji: "yi", tl: "fil", cmn: "zh", nn: "no", nb: "no" };

function isCantoneseTag(tag: string): boolean {
	return tag === "yue" || tag.startsWith("yue-") || tag === "zh-hk" || tag.startsWith("zh-hk-") || tag === "zh-yue" || tag.startsWith("zh-hant-hk");
}

/** How well a device voice fits a language: 0 = never use it, 3 = exact.
 *  Voices report tags like "es-MX", "es_ES" or "zh-HK". */
export function voiceMatchRank(voiceLang: string, targetTag: string): number {
	const voice = normalizeVoiceTag(voiceLang);
	const target = normalizeVoiceTag(targetTag);
	if (!voice || !target) return 0;
	// Cantonese characters read by a Mandarin voice (or the reverse) teach
	// the wrong language: the two never substitute for each other.
	if (isCantoneseTag(target)) return isCantoneseTag(voice) ? (voice === target ? 3 : 2) : 0;
	if (isCantoneseTag(voice)) return 0;
	if (voice === target) return 3;
	const voicePrimary = PRIMARY_ALIASES[primarySubtag(voice)] ?? primarySubtag(voice);
	const targetPrimary = PRIMARY_ALIASES[primarySubtag(target)] ?? primarySubtag(target);
	if (voicePrimary !== targetPrimary) return 0;
	// Same language, another region or script: fine when no region was asked
	// for, a fallback when one was.
	return target.includes("-") ? 1 : 2;
}

/** The fields of SpeechSynthesisVoice the picker reads (testable without a DOM). */
export interface VoiceLike {
	name: string;
	lang: string;
	default?: boolean;
	localService?: boolean;
}

const NATURAL_VOICE = /natural|neural|premium|enhanced|google|siri/i;

/** The best device voice for a language, or null when none fits. */
export function pickVoice<V extends VoiceLike>(voices: readonly V[], targetTag: string): V | null {
	let best: V | null = null;
	let bestScore = 0;
	for (const voice of voices) {
		const rank = voiceMatchRank(voice.lang, targetTag);
		if (rank === 0) continue;
		const score = rank * 10 + (NATURAL_VOICE.test(voice.name) ? 4 : 0) + (voice.default ? 1 : 0);
		if (score > bestScore) {
			best = voice;
			bestScore = score;
		}
	}
	return best;
}

// ─── The model-facing block ──────────────────────────────────────────────────

function described(language: LanguageRef): string {
	return language.tag ? `${language.name} (\`${language.tag}\`)` : language.name;
}

/**
 * The per-session block appended to every conversation agent's instructions.
 * `null` means the record has no pair (created through the API without one):
 * the agent asks before teaching anything.
 */
export function sessionLanguageInstructions(language: SessionLanguage | null): string {
	if (!language) {
		return [
			"## This session's language",
			"",
			"No language pair was recorded when this session was created. Before anything else, ask the learner — one short question — which language they want to learn and which language they want explanations in. Treat their answer as the session's target and base languages from then on.",
			"",
			"Because the app has no session language to fall back on, every `speak` fence must name its language, e.g. ```` ```speak lang=es ````.",
		].join("\n");
	}
	const { target, base } = language;
	const same = sameLanguage(target, base);
	const lines = [
		"## This session's language",
		"",
		`- **Target language:** ${described(target)}. Everything this session measures, teaches and practices is ${target.name}.`,
		same
			? `- **The learner's language:** also ${target.name} — they are refining a language they already use, so explanations are in ${target.name} too, pitched at their level.`
			: `- **The learner's language:** ${described(base)}. Explanations, instructions, glosses and feedback are written in ${base.name}; ${target.name} is the material. Let ${target.name} take over more of your own prose only as far as their measured level lets them follow it.`,
	];
	if (target.tag) {
		lines.push(
			`- **Audio:** the app reads \`speak\` fences aloud with a ${target.name} voice from the learner's device, when the device has one. Put every phrase they should hear inside one.`,
		);
		const dictation = dictationLanguageFor(target.tag);
		lines.push(dictation
			? `- **Speech input:** the learner can dictate in ${target.name} as well as in their own language, so answers may arrive as transcribed speech. Read recognition noise (homophones, missing punctuation) leniently; read the language itself — word choice, word order, endings — strictly.`
			: `- **Speech input:** dictation does not transcribe ${target.name}; their ${target.name} arrives typed. Ask for spoken practice only as something they say aloud to themselves.`);
	} else {
		lines.push(
			`- **Audio:** the app has no language tag for ${target.name}, so it cannot play audio. Give pronunciation in writing — IPA, plus a romanization or a sound-alike in ${base.name} — and still put phrases in \`speak\` fences, which display without a play button.`,
		);
	}
	if (target.tag && isRtlLanguage(target.tag)) {
		lines.push(`- **Script direction:** ${target.name} is written right to left. Keep each ${target.name} sentence on its own line or in a \`speak\` fence rather than mixed mid-sentence with ${base.name}, so the text direction stays readable.`);
	}
	return lines.join("\n");
}
