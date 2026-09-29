// A 40-line router: path matching, navigate, Link. Every route is served
// from the service-worker cache (navigateFallback), so no network is needed.
// ponytail: no nested routes or loaders; add react-router if those appear.

import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";

const listeners = new Set<() => void>();

function subscribe(l: () => void) {
  listeners.add(l);
  window.addEventListener("popstate", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("popstate", l);
  };
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, () => location.pathname + location.search);
}

export function navigate(to: string, opts: { replace?: boolean } = {}): void {
  // `inApp` marks entries this app pushed, so goBack() never leaves the app.
  if (opts.replace) history.replaceState(history.state, "", to);
  else history.pushState({ inApp: true }, "", to);
  window.scrollTo(0, 0);
  listeners.forEach((l) => l());
}

/** Back within the app, or to `fallback` when the app was opened on this page. */
export function goBack(fallback: string): void {
  if ((history.state as { inApp?: boolean } | null)?.inApp) history.back();
  else navigate(fallback, { replace: true });
}

export function Link({ to, onClick, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={to} onClick={click} {...rest} />;
}
