import { useEffect } from "react";

/**
 * Sets the browser tab title to `${title} - VPRO` on mount.
 * Reacts to title changes.
 */
export function usePageTitle(title: string, isFullTitle: boolean = false) {
  useEffect(() => {
    document.title = isFullTitle ? title : `${title} | VPRO`;
  }, [title, isFullTitle]);
}
