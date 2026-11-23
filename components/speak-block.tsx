"use client";

/**
 * ```speak fences (Language Harness): each line is one utterance with a play
 * button. Text before the first " | " is spoken; the rest (romanization,
 * gloss) is shown beside it and never read aloud. Fence options:
 * `lang=<tag>` (or a bare tag) overrides the session's target language;
 * `hidden` conceals the text until the learner reveals it (listening items).
 * Voices are the device's own; with none for the language the rows still
 * show their text and say why nothing plays.
 */

import { useContext, useEffect, useRef, useState } from "react";
import { EyeIcon, PlayIcon, SquareIcon, TurtleIcon } from "lucide-react";
import { canonicalLanguageTag, englishLanguageName, isRtlLanguage, pickVoice } from "@/src/core";
import { cn } from "@/lib/utils";
import { Hint } from "@/components/ui/hint";
import { blurAfterPointerClick } from "@/components/focus-hygiene";
import { useSessionLanguage } from "@/components/session-language";
import { SLOW_RATE, speakLines, useSpeechSupported, useSpeechVoices } from "@/components/speech";
import { MarkdownDisplayOnlyContext } from "@/components/md-display-only";

export interface SpeakLine {
	/** The words read aloud. */
	say: string;
	/** Shown beside the line, never spoken. */
	notes: string[];
}

export interface SpeakFence {
	lines: SpeakLine[];
	/** An explicit language from the fence options, canonicalized. */
	lang?: string;
	hidden: boolean;
}

const NOTE_SEPARATOR = /\s+\|\s+/;

/** Parse a fence body and its info-string options. Pure. */
export function parseSpeakFence(source: string, meta: string): SpeakFence {
	let lang: string | undefined;
	let hidden = false;
	for (const token of meta.split(/\s+/).filter(Boolean)) {
		if (token === "hidden") hidden = true;
		else if (token.startsWith("lang=")) lang = canonicalLanguageTag(token.slice(5).replace(/^["']|["']$/g, "")) ?? lang;
		else if (!lang) lang = canonicalLanguageTag(token) ?? undefined;
	}
	const lines = source
		.split(/\r?\n/)
		.map((line) => {
			// The leading space lets a line that starts with "| " count as all
			// notes (nothing to speak) while "a|b" stays one phrase.
			const [say, ...notes] = ` ${line.trim()}`.split(NOTE_SEPARATOR);
			return { say: say!.trim(), notes: notes.map((note) => note.trim()).filter(Boolean) };
		})
		.filter((line) => line.say.length > 0);
	return { lines, ...(lang ? { lang } : {}), hidden };
}

export function SpeakBlock({ source, meta, incomplete = false }: { source: string; meta: string; incomplete?: boolean }) {
	const displayOnly = useContext(MarkdownDisplayOnlyContext);
	const { language } = useSessionLanguage();
	const fence = parseSpeakFence(source, meta);
	const tag = fence.lang ?? language?.target.tag;
	const supported = useSpeechSupported();
	const voices = useSpeechVoices();
	const voice = tag ? pickVoice(voices, tag) : null;
	const [playing, setPlaying] = useState<number | null>(null);
	const [slow, setSlow] = useState(false);
	const [revealed, setRevealed] = useState(!fence.hidden);
	const stopRef = useRef<(() => void) | null>(null);
	useEffect(() => () => stopRef.current?.(), []);

	if (fence.lines.length === 0) return null;
	const languageName = tag ? englishLanguageName(tag) ?? tag : language?.target.name;
	// Chromium fills the voice list asynchronously: an empty list is "none
	// yet", not proof that the language has no voice.
	const unavailable = !supported
		? "This browser can't play speech."
		: !tag
			? "No language is set for this audio."
			: voices.length === 0
				? "No voices are available in this browser yet."
				: !voice
					? `No ${languageName} voice on this device. Install one in your system's speech or language settings.`
					: null;
	const rtl = isRtlLanguage(tag);
	const canPlay = !displayOnly && !incomplete && unavailable === null && voice !== null;

	const play = (from: number, to: number) => {
		if (!voice) return;
		stopRef.current?.();
		const startedAt = from;
		stopRef.current = speakLines(fence.lines.slice(from, to).map((line) => line.say), voice, slow ? SLOW_RATE : 1, (index) => {
			setPlaying(index === null ? null : startedAt + index);
			if (index === null) stopRef.current = null;
		});
	};
	const stop = () => stopRef.current?.();

	return (
		<div data-testid="speak-block" data-streamdown="speak" className="my-3 rounded-lg border border-border/60 bg-card/40 px-1.5 py-1">
			{(fence.lines.length > 1 || fence.hidden || canPlay) && !displayOnly && (
				<div className="flex items-center justify-end gap-1 px-1 pb-0.5 text-[11px] text-muted-foreground">
					{fence.hidden && (
						<button
							type="button"
							data-testid="speak-reveal"
							aria-pressed={revealed}
							onClick={(e) => { blurAfterPointerClick(e); setRevealed((value) => !value); }}
							className="flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-accent hover:text-foreground"
						>
							<EyeIcon className="size-3" aria-hidden />
							{revealed ? "Hide text" : "Show text"}
						</button>
					)}
					{canPlay && (
						<Hint label={slow ? "Playing slowly" : "Play slowly"} side="top">
							<button
								type="button"
								data-testid="speak-slow"
								aria-pressed={slow}
								aria-label="Play slowly"
								onClick={(e) => { blurAfterPointerClick(e); setSlow((value) => !value); }}
								className={cn("flex size-6 items-center justify-center rounded transition-colors hover:bg-accent hover:text-foreground", slow && "bg-accent text-foreground")}
							>
								<TurtleIcon className="size-3.5" aria-hidden />
							</button>
						</Hint>
					)}
					{canPlay && fence.lines.length > 1 && (
						<button
							type="button"
							data-testid="speak-play-all"
							onClick={(e) => { blurAfterPointerClick(e); if (playing !== null) stop(); else play(0, fence.lines.length); }}
							className="rounded px-1.5 py-0.5 transition-colors hover:bg-accent hover:text-foreground"
						>
							{playing !== null ? "Stop" : "Play all"}
						</button>
					)}
				</div>
			)}
			<ol className="flex flex-col">
				{fence.lines.map((line, index) => (
					<li key={index} className={cn("flex items-start gap-2 rounded-md px-1 py-1", playing === index && "bg-accent/60")}>
						{!displayOnly && (
							<button
								type="button"
								data-testid="speak-play"
								aria-label={playing === index ? "Stop" : `Play: ${revealed ? line.say : `line ${index + 1}`}`}
								disabled={!canPlay}
								onClick={(e) => {
									blurAfterPointerClick(e);
									if (playing === index) stop();
									else play(index, index + 1);
								}}
								className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:border-border hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
							>
								{playing === index ? <SquareIcon className="size-3" aria-hidden /> : <PlayIcon className="size-3.5" aria-hidden />}
							</button>
						)}
						<div className="min-w-0 flex-1 py-0.5">
							{revealed ? (
								<span lang={tag} dir={rtl ? "rtl" : "auto"} className="text-[1.05em] text-foreground">{line.say}</span>
							) : (
								<span className="select-none text-muted-foreground/70" aria-label="Hidden text">· · ·</span>
							)}
							{revealed && line.notes.length > 0 && (
								<span className="ml-2 text-sm text-muted-foreground">{line.notes.join(" · ")}</span>
							)}
						</div>
					</li>
				))}
			</ol>
			{unavailable && !displayOnly && !incomplete && (
				<p data-testid="speak-unavailable" className="px-1 pt-0.5 pb-0.5 text-[11px] text-muted-foreground">{unavailable}</p>
			)}
		</div>
	);
}
