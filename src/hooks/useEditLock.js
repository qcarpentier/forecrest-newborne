import { useCallback, useRef } from "react";

/**
 * Hook that wraps element locking around an edit modal flow.
 *
 * Usage:
 *   var lock = useEditLock(lockCtx, "stream");
 *   // Open modal:  lock.open("item-id", function() { setEditing(item); });
 *   // Close modal: lock.close(function() { setEditing(null); });
 *   // Check row:   lock.check("item-id") → null | { displayName }
 */
export default function useEditLock(lockCtx, prefix) {
  var currentKeyRef = useRef(null);

  var open = useCallback(function (itemId, onSuccess) {
    if (!lockCtx) {
      /* No lock context (local mode) — just open */
      if (onSuccess) onSuccess();
      return true;
    }

    var key = prefix + ":" + itemId;
    var result = lockCtx.acquireLock(key);

    if (!result.success) {
      return result; // { success: false, lockedBy: "Name" }
    }

    currentKeyRef.current = key;
    if (onSuccess) onSuccess();
    return result; // { success: true, lockedBy: null }
  }, [lockCtx, prefix]);

  var close = useCallback(function (onDone) {
    if (lockCtx && currentKeyRef.current) {
      lockCtx.releaseLock(currentKeyRef.current);
      currentKeyRef.current = null;
    }
    if (onDone) onDone();
  }, [lockCtx]);

  var check = useCallback(function (itemId) {
    if (!lockCtx) return null;
    return lockCtx.isLocked(prefix + ":" + itemId);
  }, [lockCtx, prefix]);

  return { open: open, close: close, check: check };
}
