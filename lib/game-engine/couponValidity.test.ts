import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeValidUntil } from './couponValidity.ts'

test('relative_days: 발급일로부터 정확히 14일 후 (지시문 예시: 08.10 → 08.24)', () => {
  const issuedAt = new Date('2026-08-10T09:00:00+09:00')
  const result = computeValidUntil(issuedAt, 'relative_days', '14')

  const diffDays = Math.round((result.getTime() - issuedAt.getTime()) / (1000 * 60 * 60 * 24))
  assert.equal(diffDays, 14, `14일 차이가 나야 하는데 ${diffDays}일 차이입니다`)
  assert.equal(result.toISOString().slice(0, 10), '2026-08-24')
})

test('relative_days: 시/분/초는 발급 시각과 동일하게 유지된다', () => {
  const issuedAt = new Date('2026-08-10T21:37:05+09:00')
  const result = computeValidUntil(issuedAt, 'relative_days', '14')
  assert.equal(result.getHours(), issuedAt.getHours())
  assert.equal(result.getMinutes(), issuedAt.getMinutes())
})

test('relative_days: 월을 넘어가는 경우에도 정확히 336시간(14일) 후다', () => {
  const issuedAt = new Date('2026-08-25T00:00:00+09:00')
  const result = computeValidUntil(issuedAt, 'relative_days', '14')
  const diffHours = (result.getTime() - issuedAt.getTime()) / (1000 * 60 * 60)
  assert.equal(diffHours, 336, `336시간(14일) 차이여야 하는데 ${diffHours}시간 차이입니다`)
})

test('relative_days: 숫자가 아닌 값이 들어오면 에러', () => {
  assert.throws(() => computeValidUntil(new Date(), 'relative_days', 'abc'))
})

test('fixed_date: 지정한 날짜의 23:59:59로 고정된다', () => {
  const result = computeValidUntil(new Date('2026-01-01'), 'fixed_date', '2026-12-31')
  assert.equal(result.getFullYear(), 2026)
  assert.equal(result.getMonth(), 11)
  assert.equal(result.getDate(), 31)
})

test('fixed_date: "시작일~종료일" 범위 문자열이면 종료일만 사용한다 (이벤트 등록 폼 저장 형식)', () => {
  const result = computeValidUntil(new Date('2026-08-24'), 'fixed_date', '2026-08-18~2026-10-30')
  assert.equal(result.getFullYear(), 2026)
  assert.equal(result.getMonth(), 9)
  assert.equal(result.getDate(), 30)
  assert.equal(result.getHours(), 23)
  assert.equal(result.getMinutes(), 59)
})

test('fixed_date: 범위 문자열 앞뒤 공백이 있어도 정상 파싱된다', () => {
  const result = computeValidUntil(new Date('2026-08-24'), 'fixed_date', '2026-08-18 ~ 2026-10-30')
  assert.equal(result.getMonth(), 9)
  assert.equal(result.getDate(), 30)
})
