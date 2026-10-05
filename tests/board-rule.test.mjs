import test from 'node:test'
import assert from 'node:assert/strict'
import { isOnBoard } from '../src/lib/format.js'

const T = Date.parse('2026-10-05T20:00:00+07:00')
const MIN = 60000
const H = 60 * MIN
const party = (status) => ({ status, datetime: new Date(T).toISOString() })

test('PLANNING: shown until datetime + 1h, hidden after', () => {
  const p = party('PLANNING')
  assert.equal(isOnBoard(p, T - H), true)        // before the time
  assert.equal(isOnBoard(p, T), true)            // at the time
  assert.equal(isOnBoard(p, T + 59 * MIN), true) // +59 min
  assert.equal(isOnBoard(p, T + H), true)        // exactly +1h (rule is "now > +1h")
  assert.equal(isOnBoard(p, T + H + 1), false)   // just past +1h
})

test('PLAYING: shown until datetime + 12h, hidden after', () => {
  const p = party('PLAYING')
  assert.equal(isOnBoard(p, T + 11 * H), true)
  assert.equal(isOnBoard(p, T + 12 * H), true)
  assert.equal(isOnBoard(p, T + 12 * H + 1), false)
})

test('CANCELLED: never shown', () => {
  assert.equal(isOnBoard(party('CANCELLED'), T), false)
})
