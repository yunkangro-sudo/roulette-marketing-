/**
 * 전화번호 암호화/해시 유틸리티
 *
 * - encrypt: AES-256-CBC (PHONE_ENCRYPTION_KEY) — 복호화 가능, DB 저장용
 * - hash:    HMAC-SHA256 (PHONE_HASH_SALT)      — 단방향, 중복체크/검색용
 *
 * 환경변수 미설정 시 서버 시작 에러 대신 null 반환으로 안전 처리
 * (비즈앱 심사 전 전화번호 미수집 시나리오 대비)
 */

import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'

const ALGO = 'aes-256-cbc'
const IV_LENGTH = 16

function getKey(): Buffer | null {
  const raw = process.env.PHONE_ENCRYPTION_KEY
  if (!raw || raw.length < 32) return null
  // 32바이트로 맞춤 (패딩 또는 자름)
  return Buffer.from(raw.slice(0, 64), 'hex').slice(0, 32)
}

function getSalt(): string | null {
  return process.env.PHONE_HASH_SALT ?? null
}

/**
 * 전화번호 암호화
 * @returns "iv:encrypted" 형식의 hex 문자열 | null (키 미설정 시)
 */
export function encryptPhone(phone: string): string | null {
  const key = getKey()
  if (!key) return null

  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

/**
 * 전화번호 복호화
 * @param stored "iv:encrypted" 형식의 hex 문자열
 */
export function decryptPhone(stored: string): string | null {
  const key = getKey()
  if (!key || !stored) return null

  const [ivHex, encHex] = stored.split(':')
  if (!ivHex || !encHex) return null

  try {
    const iv = Buffer.from(ivHex, 'hex')
    const encrypted = Buffer.from(encHex, 'hex')
    const decipher = createDecipheriv(ALGO, key, iv)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

/**
 * 전화번호 단방향 해시 (HMAC-SHA256)
 * 동일 번호는 항상 동일 해시 → 중복 체크, 검색에 사용
 * @returns hex 문자열 | null (SALT 미설정 시)
 */
export function hashPhone(phone: string): string | null {
  const salt = getSalt()
  if (!salt) return null

  // 전화번호 정규화 (숫자만, 국가코드 통일)
  const normalized = phone.replace(/\D/g, '').replace(/^82/, '0')
  return createHmac('sha256', salt).update(normalized).digest('hex')
}
