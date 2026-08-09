import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeTierProbabilities, normalizeProbabilities, computeExpectedParticipants } from './probability.ts'

test('computeExpectedParticipants: 하루 참여자 수 × 기간(일)', () => {
  assert.equal(computeExpectedParticipants(20, 30), 600)
})

test('computeTierProbabilities: 실제 시드 값(300/150/100, 예상참여자 600)의 합계는 정확히 100', () => {
  const result = computeTierProbabilities([300, 150, 100], 600)
  const sum = result.reduce((a, b) => a + b, 0)
  assert.ok(Math.abs(sum - 100) < 0.01, `합계가 100이어야 하는데 ${sum}이 나왔습니다`)
})

test('normalizeProbabilities: 합계가 100이 아닌 원시값(50, 25, 16.667)도 정규화 후 합계가 100', () => {
  const result = normalizeProbabilities([50, 25, 16.667])
  const sum = result.reduce((a, b) => a + b, 0)
  assert.ok(Math.abs(sum - 100) < 0.01, `합계가 100이어야 하는데 ${sum}이 나왔습니다`)
})

test('computeTierProbabilities: 재고가 예상 참여자 수보다 훨씨 적어도(콜드스타트) 합계는 100', () => {
  const result = computeTierProbabilities([5, 3, 2], 600)
  const sum = result.reduce((a, b) => a + b, 0)
  assert.ok(Math.abs(sum - 100) < 0.01, `합계가 100이어야 하는데 ${sum}이 나왔습니다`)
})

test('normalizeProbabilities: 모든 값이 0이면 0으로 안전하게 반환 (0으로 나누기 방지)', () => {
  const result = normalizeProbabilities([0, 0, 0])
  assert.deepEqual(result, [0, 0, 0])
})
