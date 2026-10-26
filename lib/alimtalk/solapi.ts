/**
 * 솔라피 알림톡 발송.
 * 인증: HMAC-SHA256 (API Key + API Secret)
 * 발송: POST /messages/v4/send-many/detail  type=ATA
 *
 * 템플릿 변수 이름은 솔라피에 등록한 문구와 글자까지 같아야 한다.
 *   #{쿠폰명} #{금액} #{만료일} #{쿠폰코드}
 */

import { createHmac, randomBytes } from 'crypto'

const SEND_URL = 'https://api.solapi.com/messages/v4/send-many/detail'

export interface SolapiAlimtalkInput {
  to: string
  variables: Record<string, string>
}

function authHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString()
  const salt = randomBytes(16).toString('hex')
  const signature = createHmac('sha256', apiSecret).update(date + salt).digest('hex')
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
}

/** 01012345678 형태로 정리. 실패하면 null */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('82')) digits = `0${digits.slice(2)}`
  if (!/^01[016789]\d{7,8}$/.test(digits)) return null
  return digits
}

export async function sendSolapiAlimtalk(input: SolapiAlimtalkInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.SOLAPI_API_KEY
  const apiSecret = process.env.SOLAPI_API_SECRET
  const pfId = process.env.SOLAPI_PF_ID
  const templateId = process.env.SOLAPI_TEMPLATE_ID
  if (!apiKey || !apiSecret || !pfId || !templateId) {
    return { ok: false, error: '솔라피 환경변수 없음' }
  }

  const to = normalizePhone(input.to)
  if (!to) return { ok: false, error: '수신 전화번호 형식 오류' }

  const res = await fetch(SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: authHeader(apiKey, apiSecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        {
          to,
          type: 'ATA',
          kakaoOptions: {
            pfId,
            templateId,
            disableSms: true,
            variables: input.variables,
          },
        },
      ],
    }),
  })

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = body?.errorMessage || body?.message || `솔라피 오류 (${res.status})`
    return { ok: false, error: String(message).slice(0, 300) }
  }

  const failed = body?.failedMessageList?.[0]
  if (failed) {
    const message = failed.reason || failed.statusMessage || '솔라피가 발송을 거절했습니다'
    return { ok: false, error: String(message).slice(0, 300) }
  }

  return { ok: true }
}
