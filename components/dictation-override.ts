"use client";

import { createContext } from "react";
import type { DictationLanguage } from "@/src/core";

/** A session-scoped dictation language that wins over the app-wide
 *  preference for runs started inside it (a language session's "dictate in
 *  the target language" switch). Null = use the app-wide preference. A run
 *  keeps the language it started with. */
export const DictationLanguageOverride = createContext<DictationLanguage | null>(null);
