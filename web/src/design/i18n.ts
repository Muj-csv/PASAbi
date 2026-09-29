import type { Category } from "@pasabi/core";

import { kvGet, kvSet, live } from "../storage/kv";

import { CAVEATS, translate, type CopyKey, type Lang } from "./copy";

const LANG_KEY = "lang.v1";

/** English first (team decision, 2026-09-29); Filipino one tap away. */
export const lang = live<Lang>("en");

export async function restoreLang(): Promise<void> {
  const stored = await kvGet<Lang>(LANG_KEY);
  if (stored === "en" || stored === "fil") {
    lang.set(stored);
    document.documentElement.lang = stored;
  }
}

export async function setLang(next: Lang): Promise<void> {
  lang.set(next);
  document.documentElement.lang = next === "fil" ? "fil" : "en";
  await kvSet(LANG_KEY, next);
}

export type T = ((key: CopyKey, vars?: Record<string, string | number>) => string) & {
  lang: Lang;
  cat: (c: Category) => string;
  caveats: (typeof CAVEATS)[Lang];
};

/** The translator for the current language; re-renders on a language switch. */
export function useT(): T {
  const l = lang.use();
  const t = ((key: CopyKey, vars?: Record<string, string | number>) => translate(key, l, vars)) as T;
  t.lang = l;
  t.cat = (c) => translate(`cat.${c}` as CopyKey, l);
  t.caveats = CAVEATS[l];
  return t;
}
