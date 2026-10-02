import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type SimulationState,
  createInitialState,
  tickSimulation,
} from '@/simulation/simulationEngine';

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(() => createInitialState());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const tick = useCallback(() => {
    setState((prev) => {
      if (!prev.running) return prev;
      return tickSimulation(prev);
    });
  }, []);

  useEffect(() => {
    if (state.running) {
      const intervalMs = 1000 / state.speed;
      intervalRef.current = setInterval(tick, intervalMs);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.running, state.speed]);

  const updateState = useCallback((updater: (prev: SimulationState) => SimulationState) => {
    setState(updater);
  }, []);

  return { state, updateState };
}
