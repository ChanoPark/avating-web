import { useEffect, useReducer, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { matchRequestKeys } from '@entities/match-request';
import { simulationKeys, useSessionTurnsSuspense } from '@entities/simulation';
import type { SessionTurns } from '@entities/simulation';
import { ApiError } from '@shared/lib/errors';
import {
  EMPTY_TRANSCRIPT,
  lastCompletedIndex,
  reduceTranscript,
  type Transcript,
} from '../model/transcript';
import { watchTurnStream, type WatchTiming } from './watchTurnStream';

function fromHistory({ turns, completed }: SessionTurns): Transcript {
  return reduceTranscript(EMPTY_TRANSCRIPT, { type: 'history', turns, completed });
}

type SimulationWatchOptions = {
  running: boolean;
  timing?: WatchTiming | undefined;
};

export type SimulationWatchState = {
  transcript: Transcript;
  live: boolean;
  reconnecting: boolean;
};

export function useSimulationWatch(
  sessionId: string,
  { running, timing }: SimulationWatchOptions
): SimulationWatchState {
  const queryClient = useQueryClient();
  const history = useSessionTurnsSuspense(sessionId, { awaitRegistration: running });
  const [transcript, dispatch] = useReducer(reduceTranscript, history, fromHistory);
  const [reconnecting, setReconnecting] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [live] = useState(running && !history.completed);

  useEffect(() => {
    dispatch({ type: 'history', turns: history.turns, completed: history.completed });
  }, [history]);

  const cursorRef = useRef(lastCompletedIndex(transcript));
  useEffect(() => {
    cursorRef.current = lastCompletedIndex(transcript);
  }, [transcript]);

  const subscribed = live && transcript.terminal === null;

  useEffect(() => {
    if (!subscribed) return;
    const controller = new AbortController();

    void watchTurnStream({
      sessionId,
      afterTurnIndex: cursorRef.current,
      onEvent: (event) => {
        dispatch({ type: 'event', event, receivedAt: new Date().toISOString() });
      },
      onConnectionChange: (connection) => {
        setReconnecting(connection === 'reconnecting');
      },
      signal: controller.signal,
      ...(timing !== undefined && { timing }),
    }).then((outcome) => {
      if (outcome === 'forbidden') setForbidden(true);
      if (outcome === 'ended') {
        void queryClient.invalidateQueries({ queryKey: matchRequestKeys.sessions() });
        void queryClient.invalidateQueries({ queryKey: simulationKeys.turns(sessionId) });
      }
    });

    return () => {
      controller.abort();
    };
  }, [subscribed, sessionId, timing, queryClient]);

  if (forbidden) throw new ApiError(403, `Simulation ${sessionId} stream forbidden`);

  return { transcript, live, reconnecting: reconnecting && subscribed };
}
