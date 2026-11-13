import { useSyncExternalStore } from 'react'
import type { RoomId } from '@/data/site'

export type Mode = 'loading' | 'hero' | 'transition' | 'dollhouse' | 'room' | 'rooftop'
export type Panel = null | 'discover' | 'amenities' | 'contact' | 'lobby'

export interface State {
  mode: Mode
  /** hero hover: 'f01'..'f10' | 'rooftop' | 'ground' */
  hover: string | null
  floor: number // selected residence level (1..10)
  room: RoomId | null
  panel: Panel
  /** progress of a sequence the visitor is waiting on, 0..1, null = not waiting */
  waiting: number | null
  loadProgress: number
  caption: string | null
}

let state: State = {
  mode: 'loading',
  hover: null,
  floor: 7,
  room: null,
  panel: null,
  waiting: null,
  loadProgress: 0,
  caption: null,
}
const subs = new Set<() => void>()

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch }
    subs.forEach((s) => s())
  },
  subscribe(fn: () => void) {
    subs.add(fn)
    return () => subs.delete(fn)
  },
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => sel(state), () => sel(state))
}
