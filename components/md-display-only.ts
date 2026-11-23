"use client";

import { createContext } from "react";

/** Local rendering profile for host-mounted, display-only Markdown. Ordinary
 * transcript rendering (including SSR/static Streamdown) stays interactive.
 * Its own module so block renderers can read it without importing md-blocks. */
export const MarkdownDisplayOnlyContext = createContext(false);
