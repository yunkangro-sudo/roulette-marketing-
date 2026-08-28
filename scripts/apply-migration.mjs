/**
 * docs/migrations/*.sql 파일을 Supabase Postgres에 직접 적용하는 스크립트.
 *
 * 사용법: node scripts/apply-migration.mjs docs/migrations/045_xxx.sql
 *
 * Supabase Dashboard SQL Editor를 열 필요 없이, .env.local의 DATABASE_URL로
 * 바로 실행한다. 여러 statement가 세미콜론으로 이어져 있어도 pg는
 * client.query()에 전체 텍스트를 한 번에 넘기면 순서대로 실행해준다.
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const envPath = resolve(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

const file = process.argv[2]
if (!file) {
  console.error('❌ 사용법: node scripts/apply-migration.mjs <sql파일경로>')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL이 없습니다. .env.local을 확인하세요.')
  process.exit(1)
}

const sqlPath = resolve(root, file)
const sql = readFileSync(sqlPath, 'utf8')

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  console.log('✅ DB 연결 성공:', sqlPath)
  await client.query(sql)
  console.log('✅ 마이그레이션 적용 완료')
  await client.end()
}

main().catch((e) => {
  console.error('❌ 마이그레이션 실패:', e.message)
  process.exit(1)
})
