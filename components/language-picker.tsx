"use client";

/**
 * The new-session language pair (Language Harness): "Learning <target>" and
 * "in <base>" above the composer on home and the draft screen. Picking writes
 * the remembered pair (settings → language); the next session is created with
 * it. Any language can be named: the list carries tags (voices, dictation),
 * and "Not listed?" takes a plain name.
 */

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";
import { ChevronDownIcon, LanguagesIcon } from "lucide-react";
import {
	COMMON_LANGUAGES,
	cleanLanguageName,
	languageAutonym,
	LANGUAGE_NAME_MAX,
	parseLanguageRef,
	sameLanguage,
	type LanguageRef,
	type LanguageSettings,
} from "@/src/core";
import { MenuShell } from "@/components/menu-shell";
import { useInteractionLayers } from "@/components/interaction-layers";
import { SearchMenuList } from "@/components/settings/search-menu-list";
import { useLanguagePreference } from "@/components/language-preference";

type Half = "target" | "base";

interface CatalogEntry extends LanguageRef {
	autonym: string | null;
}

let catalog: CatalogEntry[] | undefined;
function languageCatalog(): CatalogEntry[] {
	return catalog ??= COMMON_LANGUAGES.map((language) => ({
		...language,
		autonym: language.tag ? languageAutonym(language.tag) : null,
	}));
}

/** The remembered pair as the picker shows it: the store once loaded, the
 *  page's server-side read before that (no flash, no hydration mismatch). */
export function useLanguagePair(initial?: LanguageSettings) {
	const preference = useLanguagePreference();
	const { seed, load, loaded } = preference;
	useEffect(() => {
		if (initial) seed(initial);
		else void load();
	}, [initial, seed, load]);
	const target = loaded ? preference.target : (initial?.target ?? undefined);
	const base = loaded ? preference.base : (initial?.base ?? preference.base);
	return { ...preference, target, base };
}

export type LanguagePairState = ReturnType<typeof useLanguagePair>;

export function LanguagePairControl({ pair, openTargetSignal = 0, disabled = false }: {
	pair: LanguagePairState;
	/** Increment to open the target menu (a send with no language chosen). */
	openTargetSignal?: number;
	disabled?: boolean;
}) {
	const [open, setOpen] = useState<Half | null>(null);
	const targetRef = useRef<HTMLButtonElement>(null);
	const baseRef = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (openTargetSignal > 0) setOpen("target");
	}, [openTargetSignal]);
	const choose = async (half: Half, language: LanguageRef) => {
		const next = half === "target" ? { target: language, base: pair.base } : { target: pair.target, base: language };
		if (await pair.save(next)) {
			setOpen(null);
			(half === "target" ? targetRef : baseRef).current?.focus();
		}
	};
	return (
		<div data-testid="language-pair" className="pointer-events-auto flex flex-wrap items-center gap-1.5">
			<button
				ref={targetRef}
				type="button"
				data-testid="language-target"
				disabled={disabled}
				aria-expanded={open === "target"}
				onClick={() => setOpen(open === "target" ? null : "target")}
				className={
					"flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 font-ui text-xs transition-colors " +
					(pair.target
						? "border-border bg-card text-foreground hover:bg-accent"
						: "border-dashed border-primary/70 bg-transparent text-foreground hover:bg-accent")
				}
			>
				<LanguagesIcon aria-hidden="true" className="size-3.5 text-primary" />
				{pair.target ? <>Learning <span className="font-medium">{pair.target.name}</span></> : "Choose a language to learn"}
				<ChevronDownIcon aria-hidden="true" className="size-3 text-muted-foreground" />
			</button>
			<button
				ref={baseRef}
				type="button"
				data-testid="language-base"
				disabled={disabled}
				aria-expanded={open === "base"}
				aria-label={`Explanations in ${pair.base.name}`}
				onClick={() => setOpen(open === "base" ? null : "base")}
				className="flex cursor-pointer items-center gap-1 rounded-full px-2 py-1.5 font-ui text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			>
				explained in <span className="text-foreground">{pair.base.name}</span>
				<ChevronDownIcon aria-hidden="true" className="size-3" />
			</button>
			{pair.target && sameLanguage(pair.target, pair.base) && (
				<span className="font-ui text-[11px] text-muted-foreground">(refining a language you speak)</span>
			)}
			{open && (
				<LanguageMenu
					half={open}
					anchorRef={open === "target" ? targetRef : baseRef}
					current={open === "target" ? pair.target : pair.base}
					saving={pair.saving}
					error={pair.error}
					onPick={(language) => { void choose(open, language); }}
					onClose={() => setOpen(null)}
				/>
			)}
		</div>
	);
}

function LanguageMenu({ half, anchorRef, current, saving, error, onPick, onClose }: {
	half: Half;
	anchorRef: RefObject<HTMLButtonElement | null>;
	current?: LanguageRef;
	saving: boolean;
	error: string | null;
	onPick: (language: LanguageRef) => void;
	onClose: () => void;
}) {
	const interactions = useInteractionLayers();
	const [custom, setCustom] = useState("");
	const [customError, setCustomError] = useState<string | null>(null);
	useEffect(() => {
		const onPointerDown = (event: PointerEvent) => {
			const popup = interactions.getTopLayer();
			if (popup?.kind !== "popup" || popup.anchorRef?.current !== anchorRef.current || !interactions.isElementEligible(popup.rootRef.current)) return;
			const target = event.target as Element;
			if (target instanceof Element && target.closest('[data-testid="language-menu"]')) return;
			if (!anchorRef.current?.contains(target)) onClose();
		};
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [interactions, anchorRef, onClose]);
	const submitCustom = (event?: FormEvent) => {
		event?.preventDefault();
		const name = cleanLanguageName(custom);
		const language = name ? parseLanguageRef({ name }) : null;
		if (!language) {
			setCustomError(`Letters only, up to ${LANGUAGE_NAME_MAX} characters.`);
			return;
		}
		setCustomError(null);
		onPick(language);
	};
	return (
		<MenuShell
			anchorRef={anchorRef}
			testid="language-menu"
			align="left"
			preferredSide="up"
			onClose={(reason) => { onClose(); if (reason === "escape") anchorRef.current?.focus(); return "closed"; }}
			menuClass="flex w-80 max-w-[calc(100vw-1rem)] flex-col rounded-xl border border-border bg-card p-2 text-xs shadow-xl"
		>
			<div onKeyDown={(event) => {
				// Enter in the search must not submit the composer underneath;
				// a focused option still needs its native click.
				if (event.key === "Enter") {
					if (event.target instanceof HTMLInputElement) event.preventDefault();
					event.stopPropagation();
				}
			}}>
				<div className="mb-1.5 px-1 font-ui text-[11px] uppercase tracking-wider text-muted-foreground">
					{half === "target" ? "Language to learn" : "Explanations in"}
				</div>
				{error && <div role="alert" className="mb-1.5 text-destructive">{error}</div>}
				<SearchMenuList
					items={languageCatalog()}
					itemKey={(item) => item.tag ?? item.name}
					searchTerms={(item) => [item.name, item.autonym ?? "", item.tag ?? ""]}
					isSelected={(item) => sameLanguage(item, current)}
					onPick={(item) => onPick({ ...(item.tag ? { tag: item.tag } : {}), name: item.name })}
					disabled={saving}
					searchTestid="language-search"
					listTestid="language-list"
					optionTestid={(item) => `language-option-${item.tag ?? item.name}`}
					ariaLabel={half === "target" ? "Search languages to learn" : "Search explanation languages"}
					placeholder="Search languages…"
					empty="No listed language matches. Name it below."
					renderItem={(item) => (
						<span className="flex items-baseline justify-between gap-2 text-card-foreground">
							<span>{item.name}</span>
							{item.autonym && item.autonym.toLowerCase() !== item.name.toLowerCase() && (
								<span lang={item.tag} className="truncate text-muted-foreground">{item.autonym}</span>
							)}
						</span>
					)}
				/>
				<form onSubmit={submitCustom} className="mt-2 flex items-center gap-1.5 border-t border-border/60 px-1 pt-2">
					<input
						type="text"
						data-testid="language-custom"
						value={custom}
						maxLength={LANGUAGE_NAME_MAX}
						disabled={saving}
						onChange={(event) => { setCustom(event.target.value); setCustomError(null); }}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								event.stopPropagation();
								submitCustom();
							}
						}}
						placeholder="Not listed? Type its name"
						aria-label="Name a language that is not listed"
						className="lh-input min-w-0 flex-1 rounded-lg border bg-background px-2 py-1.5 text-foreground outline-none focus:ring-1 focus:ring-ring"
					/>
					<button
						type="submit"
						disabled={saving || custom.trim().length === 0}
						className="rounded-lg border border-border px-2 py-1.5 text-foreground transition-colors hover:bg-accent disabled:opacity-40"
					>
						Use
					</button>
				</form>
				{customError && <div role="alert" className="mt-1 px-1 text-destructive">{customError}</div>}
				{half === "target" && (
					<p className="mt-1.5 px-1 text-[11px] leading-snug text-muted-foreground">
						Unlisted languages are taught too, without audio or dictation.
					</p>
				)}
			</div>
		</MenuShell>
	);
}
