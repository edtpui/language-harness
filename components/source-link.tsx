"use client";

/**
 * The AGPL-3.0 source offer (§13): everyone who uses Language Harness —
 * including over a network — can get its Corresponding Source. The URL is
 * package.json's homepage unless the build sets LH_SOURCE_URL (a deployment
 * of modified code points it at that exact source).
 */

import { ExternalLinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsRow } from "@/components/settings/controls";

export const SOURCE_URL = process.env.LH_SOURCE_URL ?? "";
export const UPSTREAM_URL = "https://github.com/amosblomqvist/learnharness";

/** The quiet always-visible link (sidebar footer). */
export function SourceCodeLink({ className, url = SOURCE_URL }: { className?: string; url?: string }) {
	if (!url) return null;
	return (
		<a
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			data-testid="source-code-link"
			title="Language Harness is free software under the GNU AGPL-3.0. Get its source code here."
			className={cn("flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent hover:text-foreground", className)}
		>
			Source
			<ExternalLinkIcon aria-hidden="true" className="size-3" />
		</a>
	);
}

/** Settings → General: the license, the upstream credit and the source. */
export function SourceCodeSettingsRow({ url = SOURCE_URL }: { url?: string }) {
	return (
		<SettingsRow
			label="Source code"
			testid="row-source-code"
			hint={
				<>
					Language Harness is free software under the GNU AGPL-3.0, a modified version of{" "}
					<a href={UPSTREAM_URL} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">LearnHarness</a>{" "}
					by Amos Blomqvist. You may get, change and share its source under the same license.
				</>
			}
		>
			{url ? (
				<a
					href={url}
					target="_blank"
					rel="noopener noreferrer"
					data-testid="source-code-settings-link"
					className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent"
				>
					View source
					<ExternalLinkIcon aria-hidden="true" className="size-3" />
				</a>
			) : (
				<span className="text-xs text-muted-foreground">Not configured</span>
			)}
		</SettingsRow>
	);
}
