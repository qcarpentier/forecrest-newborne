import { useRef, useCallback, useEffect } from "react";

var MAX_HISTORY = 80;

export default function useHistory(getSnapshot, applySnapshot) {
  var past = useRef([]);
  var future = useRef([]);
  var lastSnapshot = useRef(null);
  var skipNext = useRef(false);

  // Take a snapshot of current state for the undo stack
  var push = useCallback(function () {
    if (skipNext.current) { skipNext.current = false; return; }
    var snap = getSnapshot();
    var json = JSON.stringify(snap);
    if (json === lastSnapshot.current) return;
    if (lastSnapshot.current !== null) {
      past.current.push(lastSnapshot.current);
      if (past.current.length > MAX_HISTORY) past.current.shift();
      future.current = [];
    }
    lastSnapshot.current = json;
  }, [getSnapshot]);

  // Initialize the first snapshot
  useEffect(function () {
    if (lastSnapshot.current === null) {
      lastSnapshot.current = JSON.stringify(getSnapshot());
    }
  }, [getSnapshot]);

  var undo = useCallback(function () {
    if (past.current.length === 0) return false;
    future.current.push(lastSnapshot.current);
    var prev = past.current.pop();
    lastSnapshot.current = prev;
    skipNext.current = true;
    applySnapshot(JSON.parse(prev));
    return true;
  }, [applySnapshot]);

  var redo = useCallback(function () {
    if (future.current.length === 0) return false;
    past.current.push(lastSnapshot.current);
    var next = future.current.pop();
    lastSnapshot.current = next;
    skipNext.current = true;
    applySnapshot(JSON.parse(next));
    return true;
  }, [applySnapshot]);

  var canUndo = function () { return past.current.length > 0; };
  var canRedo = function () { return future.current.length > 0; };

  return { push: push, undo: undo, redo: redo, canUndo: canUndo, canRedo: canRedo };
}
