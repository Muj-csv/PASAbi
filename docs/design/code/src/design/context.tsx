/**
 * One provider for theme + language, so components never hard-code a colour or a string.
 * Wrap the app root:  <DesignProvider lang={lang} force="light">…</DesignProvider>
 */
import React, { createContext, useContext, useMemo } from 'react';
import { Palette, Scheme, useTheme } from './theme';
import { CAVEATS, CopyKey, Lang, t as translate } from './copy';

interface DesignValue {
  c: Palette;
  scheme: Scheme;
  lang: Lang;
  t: (key: CopyKey, vars?: Record<string, string | number>) => string;
  caveats: (typeof CAVEATS)[Lang];
}

const DesignContext = createContext<DesignValue | null>(null);

export function DesignProvider({
  lang,
  force,
  children,
}: {
  lang: Lang;
  /** 'light' for the demo; leave undefined to follow the system. */
  force?: Scheme;
  children: React.ReactNode;
}) {
  const { c, scheme } = useTheme(force);
  const value = useMemo<DesignValue>(
    () => ({ c, scheme, lang, t: (key, vars) => translate(key, lang, vars), caveats: CAVEATS[lang] }),
    [c, scheme, lang],
  );
  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>;
}

export function useDesign(): DesignValue {
  const v = useContext(DesignContext);
  if (!v) throw new Error('useDesign() must be used inside <DesignProvider>');
  return v;
}
