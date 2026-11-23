import React from "react";
(globalThis as Record<string, unknown>).React = React;

import { renderWithInteractionLayers as renderToStaticMarkup } from "./interaction-layer-render.tsx";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DraftShell } from "../components/new-session.tsx";
import { LanguagePairControl, type LanguagePairState } from "../components/language-picker.tsx";
import { SessionLanguageChip, SessionLanguageProvider, DictationTargetSwitch } from "../components/session-language.tsx";
import { SpeakBlock } from "../components/speak-block.tsx";
import { SourceCodeLink, SourceCodeSettingsRow } from "../components/source-link.tsx";
import { MarkdownDisplayOnlyContext } from "../components/md-display-only.ts";

/**
 * Language Harness surfaces, server-rendered: the new-session language pair,
 * the session chip and mic switch, `speak` blocks (no speech engine on the
 * server, so they render their text and say why nothing plays) and the AGPL
 * source offer.
 */

const spanish = { target: { tag: "es", name: "Spanish" }, base: { tag: "en", name: "English" } };

function pair(overrides: Partial<LanguagePairState> = {}): LanguagePairState {
	return {
		target: undefined, base: { tag: "en", name: "English" }, loaded: true, saving: false, error: null,
		seed: () => {}, load: async () => {}, save: async () => true,
		...overrides,
	};
}

describe("the new-session language pair", () => {
	it("asks for a language to learn until one is chosen", () => {
		const html = renderToStaticMarkup(<LanguagePairControl pair={pair()} />);
		assert.ok(html.includes("Choose a language to learn"));
		assert.ok(html.includes("explained in <span"));
		assert.ok(html.includes("English"));
	});

	it("shows the chosen pair", () => {
		const html = renderToStaticMarkup(<LanguagePairControl pair={pair({ target: spanish.target })} />);
		assert.match(html, /Learning <span[^>]*>Spanish<\/span>/);
		assert.ok(!html.includes("refining a language you speak"));
	});

	it("says so when the learner refines their own language", () => {
		const html = renderToStaticMarkup(<LanguagePairControl pair={pair({ target: { tag: "en", name: "English" } })} />);
		assert.ok(html.includes("refining a language you speak"));
	});

	it("leads the draft's action row and names the target in the opening copy", () => {
		const html = renderToStaticMarkup(
			<DraftShell busy={false} text="" onChange={() => {}} onSend={() => {}}
				language={<LanguagePairControl pair={pair({ target: spanish.target })} />} targetName="Spanish" />,
		);
		assert.ok(html.indexOf('data-testid="language-pair"') < html.indexOf('data-testid="composer"'));
		assert.ok(html.includes("The tutor will open with a short placement check of your Spanish."));
		assert.ok(html.includes("What do you want to be able to do in Spanish?"));
	});
});

describe("the session's language", () => {
	it("shows the pair as a header chip", () => {
		const html = renderToStaticMarkup(<SessionLanguageChip language={spanish} />);
		assert.ok(html.includes('data-testid="session-language-chip"'));
		assert.ok(html.includes("Learning Spanish · explanations in English"));
	});

	it("offers the mic switch only when dictation can transcribe the target", () => {
		const withSwitch = renderToStaticMarkup(<SessionLanguageProvider language={spanish}><DictationTargetSwitch /></SessionLanguageProvider>);
		assert.ok(withSwitch.includes('data-testid="dictation-target-switch"'));
		assert.ok(withSwitch.includes('aria-pressed="false"'));
		assert.ok(withSwitch.includes(">ES</button>"));
		for (const language of [null, { target: { tag: "haw", name: "Hawaiian" }, base: spanish.base }, { target: { name: "Old Norse" }, base: spanish.base }, { target: spanish.base, base: spanish.base }]) {
			const html = renderToStaticMarkup(<SessionLanguageProvider language={language}><DictationTargetSwitch /></SessionLanguageProvider>);
			assert.ok(!html.includes("dictation-target-switch"), JSON.stringify(language));
		}
	});
});

describe("speak blocks", () => {
	it("render every line with the session language and explain why nothing plays here", () => {
		const html = renderToStaticMarkup(
			<SessionLanguageProvider language={spanish}>
				<SpeakBlock source={"¿Dónde está la estación? | Where is the station?\nGracias"} meta="" />
			</SessionLanguageProvider>,
		);
		assert.equal(html.match(/data-testid="speak-play"/g)?.length, 2);
		assert.ok(html.includes('lang="es"'));
		assert.ok(html.includes("¿Dónde está la estación?"));
		assert.ok(html.includes("Where is the station?"));
		assert.ok(html.includes("This browser can&#x27;t play speech."));
		assert.ok(html.includes("disabled"));
	});

	it("hide the text of listening items behind a reveal", () => {
		const html = renderToStaticMarkup(
			<SessionLanguageProvider language={spanish}>
				<SpeakBlock source="Me llamo Ana." meta="hidden" />
			</SessionLanguageProvider>,
		);
		assert.ok(html.includes('data-testid="speak-reveal"'));
		assert.ok(html.includes("Show text"));
		assert.ok(!html.includes("Me llamo Ana."));
	});

	it("use the fence's own language and right-to-left direction", () => {
		const html = renderToStaticMarkup(<SpeakBlock source="مرحبا" meta="lang=ar" />);
		assert.ok(html.includes('lang="ar"'));
		assert.ok(html.includes('dir="rtl"'));
	});

	it("drop the controls in display-only markdown", () => {
		const html = renderToStaticMarkup(
			<MarkdownDisplayOnlyContext.Provider value={true}>
				<SpeakBlock source="hola" meta="lang=es" />
			</MarkdownDisplayOnlyContext.Provider>,
		);
		assert.ok(html.includes("hola"));
		assert.ok(!html.includes("speak-play"));
		assert.ok(!html.includes("speak-unavailable"));
	});

	it("render nothing for an empty fence", () => {
		assert.equal(renderToStaticMarkup(<SpeakBlock source={"\n  \n"} meta="" />), "");
	});
});

describe("the AGPL source offer", () => {
	it("links the source from the sidebar and settings", () => {
		const url = "https://github.com/edtpui/language-harness";
		const link = renderToStaticMarkup(<SourceCodeLink url={url} />);
		assert.ok(link.includes(`href="${url}"`));
		assert.ok(link.includes('rel="noopener noreferrer"'));
		const row = renderToStaticMarkup(<SourceCodeSettingsRow url={url} />);
		assert.ok(row.includes("GNU AGPL-3.0"));
		assert.ok(row.includes("https://github.com/amosblomqvist/learnharness"));
		assert.ok(row.includes(`href="${url}"`));
	});

	it("never renders an empty link", () => {
		assert.equal(renderToStaticMarkup(<SourceCodeLink url="" />), "");
		assert.ok(renderToStaticMarkup(<SourceCodeSettingsRow url="" />).includes("Not configured"));
	});
});
