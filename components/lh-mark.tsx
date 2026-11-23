/**
 * LhMark — the Language Harness mark: two overlapping speech bubbles, the
 * same shapes as build/icon-flat.svg without the app-icon squircle, inlined
 * as JSX so it rides along with the components (no network fetch,
 * recolorable, crisp at any size). No padding: sizing/padding is the
 * consumer's job. The back bubble is the gray outline; the front bubble is
 * the strong line ink (white in dark, the foreground in light) with its three
 * dots cut out, so it reads on any theme background.
 *
 * Sits in the sidebar band (also the traffic-light gutter's resident in the
 * merged desktop chrome).
 */

const dot = (cx: number) => `M${cx - 36} 590a36 36 0 1 0 72 0a36 36 0 1 0 -72 0Z`;

export function LhMark({ className = "" }: { className?: string }) {
	return (
		<svg viewBox="136 236 756 688" className={className} aria-hidden="true">
			<path
				d="M520 258 H760 A110 110 0 0 1 870 368 V556 A110 110 0 0 1 760 666 H742 L782 768 L652 666 H520 A110 110 0 0 1 410 556 V368 A110 110 0 0 1 520 258 Z"
				fill="none"
				stroke="rgb(148,148,148)"
				strokeWidth={44}
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			<path
				d={`M276 380 H556 A118 118 0 0 1 674 498 V682 A118 118 0 0 1 556 800 H396 L262 902 L298 800 H276 A118 118 0 0 1 158 682 V498 A118 118 0 0 1 276 380 Z ${dot(300)} ${dot(416)} ${dot(532)}`}
				fillRule="evenodd"
				style={{ fill: "var(--lh-line-strong)" }}
			/>
		</svg>
	);
}
