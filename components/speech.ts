"use client";

/**
 * Device speech synthesis for `speak` fences (Language Harness). The browser
 * (or Electron's Chromium) owns the voices: phones and Edge ship many
 * languages, desktop Chromium ships few, and Electron only has the OS voices.
 * Nothing here downloads or proxies audio.
 */

import { useSyncExternalStore } from "react";

const NO_VOICES: readonly SpeechSynthesisVoice[] = Object.freeze([]);

function synthesis(): SpeechSynthesis | null {
	return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined"
		? window.speechSynthesis
		: null;
}

let cached: readonly SpeechSynthesisVoice[] = NO_VOICES;

/** getVoices() returns a fresh array on every call; keep one reference per
 *  distinct voice list so useSyncExternalStore sees a stable snapshot. */
function currentVoices(): readonly SpeechSynthesisVoice[] {
	const voices = synthesis()?.getVoices() ?? [];
	const same = voices.length === cached.length && voices.every((voice, i) => voice.voiceURI === cached[i]!.voiceURI);
	if (!same) cached = voices.length ? Object.freeze([...voices]) : NO_VOICES;
	return cached;
}

function subscribe(listener: () => void): () => void {
	const speech = synthesis();
	if (!speech) return () => {};
	// Chromium fills the list asynchronously and announces it once.
	speech.addEventListener("voiceschanged", listener);
	return () => speech.removeEventListener("voiceschanged", listener);
}

function subscribeNothing(): () => void {
	return () => {};
}

/** The device's voices; empty on the server and before Chromium loads them. */
export function useSpeechVoices(): readonly SpeechSynthesisVoice[] {
	return useSyncExternalStore(subscribe, currentVoices, () => NO_VOICES);
}

/** Whether this browser can speak at all (false on the server). */
export function useSpeechSupported(): boolean {
	return useSyncExternalStore(subscribeNothing, () => synthesis() !== null, () => false);
}

export const SLOW_RATE = 0.7;

/**
 * Speak lines one after another with one voice. `onLine` reports the line
 * being spoken, then null when playback ends, fails or is cancelled.
 * Starting playback cancels whatever this page was saying. Returns a stop
 * function.
 */
export function speakLines(lines: readonly string[], voice: SpeechSynthesisVoice, rate: number, onLine: (index: number | null) => void): () => void {
	const speech = synthesis();
	if (!speech || lines.length === 0) {
		onLine(null);
		return () => {};
	}
	speech.cancel();
	let finished = false;
	const finish = () => {
		if (finished) return;
		finished = true;
		onLine(null);
	};
	lines.forEach((text, index) => {
		const utterance = new SpeechSynthesisUtterance(text);
		utterance.voice = voice;
		utterance.lang = voice.lang;
		utterance.rate = rate;
		utterance.onstart = () => { if (!finished) onLine(index); };
		utterance.onerror = finish;
		if (index === lines.length - 1) utterance.onend = finish;
		speech.speak(utterance);
	});
	return () => {
		if (finished) return;
		speech.cancel();
		finish();
	};
}
