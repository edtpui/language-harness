"use client";

/**
 * The open session's language pair (Language Harness), for everything the
 * session renders: `speak` fences pick their voice from it, the header shows
 * it, and the mic can be switched to transcribe the target language. The
 * provider sits above the chat view, so the session's own dictation hooks see
 * the switch.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { LanguagesIcon } from "lucide-react";
import { dictationLanguageFor, sameLanguage, type DictationLanguage, type SessionLanguage } from "@/src/core";
import { DictationLanguageOverride } from "@/components/dictation-override";
import { useDictationActive } from "@/components/dictation-state";
import { Hint } from "@/components/ui/hint";

interface SessionLanguageValue {
	language: SessionLanguage | null;
	/** The target language's Nova-3 code; null when dictation cannot transcribe it. */
	targetDictation: DictationLanguage | null;
	dictateInTarget: boolean;
	setDictateInTarget: (value: boolean) => void;
}

const SessionLanguageContext = createContext<SessionLanguageValue>({
	language: null,
	targetDictation: null,
	dictateInTarget: false,
	setDictateInTarget: () => {},
});

export function SessionLanguageProvider({ language, children }: { language: SessionLanguage | null; children: ReactNode }) {
	const targetDictation = dictationLanguageFor(language?.target.tag);
	const [dictateInTarget, setDictateInTarget] = useState(false);
	const value = useMemo(
		() => ({ language, targetDictation, dictateInTarget, setDictateInTarget }),
		[language, targetDictation, dictateInTarget],
	);
	return (
		<SessionLanguageContext.Provider value={value}>
			<DictationLanguageOverride.Provider value={dictateInTarget ? targetDictation : null}>
				{children}
			</DictationLanguageOverride.Provider>
		</SessionLanguageContext.Provider>
	);
}

export function useSessionLanguage(): SessionLanguageValue {
	return useContext(SessionLanguageContext);
}

/** The header chip: what this session teaches, and in which language. */
export function SessionLanguageChip({ language }: { language: SessionLanguage }) {
	const label = sameLanguage(language.target, language.base)
		? `Learning ${language.target.name}`
		: `Learning ${language.target.name} · explanations in ${language.base.name}`;
	return (
		<Hint label={label} side="bottom">
			<span
				tabIndex={0}
				data-testid="session-language-chip"
				aria-label={label}
				className="lh-no-drag flex shrink-0 select-none items-center gap-1.5 rounded-full border border-border/80 px-2 py-0.5 text-xs font-medium text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
			>
				<LanguagesIcon className="size-3.5 text-primary" aria-hidden />
				{language.target.name}
			</span>
		</Hint>
	);
}

function shortCode(tag: string): string {
	return tag.split("-")[0]!.toUpperCase();
}

/** Beside the mic: transcribe the next dictation in the target language
 *  instead of the app-wide dictation language. Hidden when the session has
 *  no pair, when Deepgram cannot transcribe the target, or when the target
 *  is the learner's own language. */
export function DictationTargetSwitch({ disabled = false }: { disabled?: boolean }) {
	const { language, targetDictation, dictateInTarget, setDictateInTarget } = useSessionLanguage();
	const recording = useDictationActive();
	if (!language?.target.tag || !targetDictation || sameLanguage(language.target, language.base)) return null;
	const label = dictateInTarget
		? `Dictation transcribes ${language.target.name}. Click to use your usual dictation language.`
		: `Transcribe dictation as ${language.target.name}`;
	return (
		<Hint label={recording ? "Finish dictating to switch languages" : label} side="top">
			<button
				type="button"
				data-testid="dictation-target-switch"
				aria-pressed={dictateInTarget}
				aria-label={label}
				disabled={disabled || recording}
				onClick={() => setDictateInTarget(!dictateInTarget)}
				className={
					"flex h-7 shrink-0 items-center rounded-md border px-2 font-ui text-[11px] font-medium tracking-wider transition-colors disabled:opacity-50 " +
					(dictateInTarget
						? "border-primary/60 bg-accent text-foreground"
						: "border-border/50 bg-card/50 text-muted-foreground/70 hover:border-border hover:text-muted-foreground")
				}
			>
				{shortCode(language.target.tag)}
			</button>
		</Hint>
	);
}
