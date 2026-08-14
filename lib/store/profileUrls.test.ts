import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeHttpUrl } from './profileUrls.ts'

test('빈 값과 javascript: 는 차단한다', () => {
  assert.equal(safeHttpUrl(''), null)
  assert.equal(safeHttpUrl(null), null)
  assert.equal(safeHttpUrl('javascript:alert(1)'), null)
  assert.equal(safeHttpUrl('#'), null)
})

test('http/https만 통과한다', () => {
  assert.equal(
    safeHttpUrl('https://www.daangn.com/kr/local-profile/y6ixoqfzj4tw/?referrer=share'),
    'https://www.daangn.com/kr/local-profile/y6ixoqfzj4tw/?referrer=share',
  )
  assert.equal(safeHttpUrl('https://pf.kakao.com/_xcuxobX'), 'https://pf.kakao.com/_xcuxobX')
})
