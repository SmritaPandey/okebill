import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to warn users about unsaved changes when navigating away.
 * Attaches a `beforeunload` event listener when `isDirty` is true.
 *
 * Usage:
 *   const { markDirty, markClean } = useUnsavedChanges();
 *   // Call markDirty() when form values change
 *   // Call markClean() after successful save
 *
 * Or pass isDirty directly:
 *   useUnsavedChanges(formHasChanges);
 */
export function useUnsavedChanges(isDirtyProp?: boolean) {
  const isDirtyRef = useRef(isDirtyProp ?? false);

  // Sync with prop if provided
  useEffect(() => {
    if (isDirtyProp !== undefined) {
      isDirtyRef.current = isDirtyProp;
    }
  }, [isDirtyProp]);

  const markDirty = useCallback(() => { isDirtyRef.current = true; }, []);
  const markClean = useCallback(() => { isDirtyRef.current = false; }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        // Most browsers ignore custom messages but require returnValue
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  return { markDirty, markClean, isDirtyRef };
}
