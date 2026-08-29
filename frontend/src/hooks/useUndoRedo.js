import { useState, useCallback } from 'react';

export const useUndoRedo = (initialState) => {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = useCallback((newState, overwrite = false) => {
    const value = typeof newState === 'function' ? newState(history[currentIndex]) : newState;
    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[currentIndex] = value;
      setHistory(historyCopy);
    } else {
      const updatedHistory = history.slice(0, currentIndex + 1);
      setHistory([...updatedHistory, value]);
      setCurrentIndex(updatedHistory.length);
    }
  }, [currentIndex, history]);

  const undo = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  return [state, setState, undo, redo, currentIndex > 0, currentIndex < history.length - 1];
};
