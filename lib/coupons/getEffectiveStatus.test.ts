import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getEffectiveStatus } from './getEffectiveStatus.ts'

const YESTERDAY = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
const TOMORROW = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

test('valid_until이 지나지 않았으면 DB status를 그대로 반환한다', () => {
  assert.equal(getEffectiveStatus({ status: 'issued', valid_until: TOMORROW }), 'issued')
  assert.equal(getEffectiveStatus({ status: 'pending_verify', valid_until: TOMORROW }), 'pending_verify')
  assert.equal(getEffectiveStatus({ status: 'unverified', valid_until: TOMORROW }), 'unverified')
})

test('valid_until이 지났으면 issued/pending_verify/unverified는 expired로 취급한다', () => {
  assert.equal(getEffectiveStatus({ status: 'issued', valid_until: YESTERDAY }), 'expired')
  assert.equal(getEffectiveStatus({ status: 'pending_verify', valid_until: YESTERDAY }), 'expired')
  assert.equal(getEffectiveStatus({ status: 'unverified', valid_until: YESTERDAY }), 'expired')
})

test('status가 이미 used면 valid_until과 무관하게 used를 유지한다', () => {
  assert.equal(getEffectiveStatus({ status: 'used', valid_until: YESTERDAY }), 'used')
  assert.equal(getEffectiveStatus({ status: 'used', valid_until: TOMORROW }), 'used')
})

test('status가 이미 expired면(향후 배치가 생기더라도) 그대로 expired를 유지한다', () => {
  assert.equal(getEffectiveStatus({ status: 'expired', valid_until: TOMORROW }), 'expired')
})
