import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPointsEnabled, isLockedPlayResponse } from './guestPlayPolicy.ts'

test('points_enabled가 false면 적립을 끈다', () => {
  assert.equal(isPointsEnabled(false), false)
})

test('points_enabled가 true이거나 없으면 적립을 켠다', () => {
  assert.equal(isPointsEnabled(true), true)
  assert.equal(isPointsEnabled(undefined), true)
  assert.equal(isPointsEnabled(null), true)
})

test('게스트 play 응답은 locked만 있고 당첨액을 포함하지 않는다', () => {
  assert.equal(isLockedPlayResponse({ locked: true }), true)
  assert.equal(isLockedPlayResponse({ locked: true, amount: 10000 }), false)
  assert.equal(isLockedPlayResponse({ locked: true, label: '당첨' }), false)
})
