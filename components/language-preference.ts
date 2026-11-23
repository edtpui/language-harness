"use client";

/**
 * The new-session picker's remembered language pair (settings.json →
 * `language`), shared by home and the draft screen: one confirmed value and
 * one write in flight per window. The server's settings record is the truth;
 * pages seed the first render from their server-side read.
 */

import { useSyncExternalStore } from "react";
import { DEFAULT_BASE_LANGUAGE, sanitizeLanguageSettings, type LanguageRef, type LanguageSettings, type SessionLanguage } from "@/src/core";

export interface LanguagePreferenceSnapshot {
	target?: LanguageRef;
	base: LanguageRef;
	loaded: boolean;
	saving: boolean;
	error: string | null;
}

const INITIAL: LanguagePreferenceSnapshot = { base: DEFAULT_BASE_LANGUAGE, loaded: false, saving: false, error: null };

export function createLanguagePreferenceStore(request: typeof fetch) {
	let snapshot = INITIAL;
	let loading: Promise<void> | null = null;
	let writing = false;
	const listeners = new Set<() => void>();
	const publish = (patch: Partial<LanguagePreferenceSnapshot>) => {
		snapshot = { ...snapshot, ...patch };
		for (const listener of listeners) listener();
	};
	const apply = (settings: LanguageSettings) => publish({
		target: settings.target,
		base: settings.base ?? DEFAULT_BASE_LANGUAGE,
		loaded: true,
		error: null,
	});

	/** A server-rendered page's own read: adopted only before the first load,
	 *  so a later page never overwrites a newer confirmed choice. */
	function seed(settings: LanguageSettings | undefined) {
		if (snapshot.loaded || writing) return;
		apply(sanitizeLanguageSettings(settings ?? {}));
	}

	function load(): Promise<void> {
		if (snapshot.loaded || writing) return Promise.resolve();
		loading ??= (async () => {
			try {
				const res = await request("/api/settings");
				if (!res.ok) throw new Error();
				const body = await res.json() as { settings?: { language?: unknown } | null };
				if (!snapshot.loaded && !writing) apply(sanitizeLanguageSettings(body.settings?.language ?? {}));
			} catch {
				publish({ error: "Could not load your languages. Try again." });
			} finally {
				loading = null;
			}
		})();
		return loading;
	}

	/** Replace the whole remembered pair. Resolves true once the server confirmed it. */
	async function save(next: { target?: LanguageRef; base: LanguageRef }): Promise<boolean> {
		if (writing) return false;
		writing = true;
		publish({ saving: true, error: null });
		try {
			const res = await request("/api/settings/language", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...(next.target ? { target: next.target } : {}), base: next.base }),
			});
			if (!res.ok) throw new Error();
			const body = await res.json() as { settings?: { language?: unknown } };
			apply(sanitizeLanguageSettings(body.settings?.language ?? {}));
			return true;
		} catch {
			publish({ error: "Could not save that language. Try again." });
			return false;
		} finally {
			writing = false;
			publish({ saving: false });
		}
	}

	return {
		seed, load, save,
		getSnapshot: () => snapshot,
		getServerSnapshot: () => INITIAL,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => { listeners.delete(listener); };
		},
	};
}

const store = createLanguagePreferenceStore((...args) => fetch(...args));

export function useLanguagePreference() {
	const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
	return { ...snapshot, seed: store.seed, load: store.load, save: store.save };
}

/** The pair a new session is created with, or null while no target is chosen. */
export function pairFromPreference(preference: Pick<LanguagePreferenceSnapshot, "target" | "base">): SessionLanguage | null {
	return preference.target ? { target: preference.target, base: preference.base } : null;
}
