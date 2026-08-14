import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getKakaoAuthUrl } from './kakao.ts'

test('로그인 URL scope에 friends가 없고 talk_message는 있다', () => {
  process.env.NEXT_PUBLIC_KAKAO_JS_KEY = 'test-key'
  const url = getKakaoAuthUrl({
    redirectUri: 'https://example.com/callback',
    state: 'storeId:test',
    requestPhone: true,
    requestTalkMsg: true,
    requestFriends: false,
  })
  const scope = new URL(url).searchParams.get('scope') ?? ''
  const parts = scope.split(',')
  assert.ok(parts.includes('profile_nickname'))
  assert.ok(parts.includes('phone_number'))
  assert.ok(parts.includes('talk_message'))
  assert.ok(!parts.includes('friends'), `friends가 포함되면 안 됨: ${scope}`)
})
