/**
 * Supabase Postgres 데이터 백업 스크립트 (Pro 업그레이드 전 임시 안전장치)
 *
 * 사용법: node scripts/backup-db.mjs
 * 결과물: backups/YYYY-MM-DD_HHmm.sql  (INSERT 문 형태의 데이터 덤프)
 *
 * ── 이 스크립트가 하는 일 / 하지 않는 일 ──────────────────────────
 * - public 스키마의 모든 테이블을 자동으로 찾아서 전체 행을 INSERT문으로 저장한다.
 * - pg_dump 바이너리가 설치되어 있지 않아도(이 프로젝트 환경 포함) 동작하도록
 *   Node의 `pg` 라이브러리(이미 devDependencies에 있음)만으로 구현했다.
 * - 테이블 "구조"(컬럼/제약조건/인덱스/RPC 함수 등)는 덤프하지 않는다 — 그건
 *   docs/migrations/001~038*.sql 이 이미 순서대로 기록하고 있는 단일 진실
 *   소스이므로 중복으로 관리하지 않는다. 스키마가 궁금하면 그 폴더를 본다.
 * - FK 순서를 신경쓰지 않고 그대로 INSERT할 수 있도록 파일 안에서
 *   session_replication_role = replica 로 제약조건 검사를 잠시 끈다.
 *
 * 진짜 정기 백업이 필요하면 이 스크립트는 임시방편이고, Supabase Pro 업그레이드로
 * 자동 일일 백업(PITR)을 받는 게 정답이다.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ── .env.local 로드 (프로젝트 내 다른 scripts/*.mjs와 동일한 방식) ──
const envPath = resolve(root, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m || process.env[m[1]]) continue
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
  }
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL이 없습니다. .env.local에 Supabase Postgres 연결 문자열을 채워주세요.')
  process.exit(1)
}

// 백업에서 제외할 테이블 (Supabase 내부/확장 테이블, 대용량 로그성 테이블은 필요시 여기 추가)
const EXCLUDE_TABLES = new Set([])

function sqlEscapeIdent(name) {
  return `"${name.replace(/"/g, '""')}"`
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL'
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  if (value instanceof Date) return `'${value.toISOString()}'`
  if (Buffer.isBuffer(value)) return `'\\x${value.toString('hex')}'`
  if (typeof value === 'object') {
    // jsonb/json/array 컬럼 — pg 드라이버가 이미 JS 객체/배열로 파싱해준 경우
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`
  }
  return `'${String(value).replace(/'/g, "''")}'`
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  console.log('✅ DB 연결 성공')

  const { rows: tables } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)

  const targetTables = tables.map((t) => t.table_name).filter((t) => !EXCLUDE_TABLES.has(t))
  console.log(`대상 테이블 ${targetTables.length}개:`, targetTables.join(', '))

  const chunks = []
  chunks.push(`-- 단골팅(dang2026) 데이터 백업 — ${new Date().toISOString()}`)
  chunks.push(`-- 생성: scripts/backup-db.mjs (pg_dump 미설치 환경용 대체 스크립트)`)
  chunks.push(`-- 주의: 테이블 구조는 이 파일에 없다. docs/migrations/*.sql 참고.`)
  chunks.push('')
  chunks.push('SET session_replication_role = replica;') // FK/트리거 순서 무시하고 복원 가능하게
  chunks.push('')

  let totalRows = 0
  for (const table of targetTables) {
    const ident = sqlEscapeIdent(table)
    const { rows } = await client.query(`SELECT * FROM ${ident}`)
    if (rows.length === 0) {
      chunks.push(`-- ${table}: 0건 (스킵)`)
      continue
    }
    const columns = Object.keys(rows[0])
    const colList = columns.map(sqlEscapeIdent).join(', ')
    chunks.push(`-- ${table}: ${rows.length}건`)
    chunks.push(`DELETE FROM ${ident};`)
    for (const row of rows) {
      const values = columns.map((c) => sqlLiteral(row[c])).join(', ')
      chunks.push(`INSERT INTO ${ident} (${colList}) VALUES (${values});`)
    }
    chunks.push('')
    totalRows += rows.length
  }

  chunks.push('SET session_replication_role = DEFAULT;')

  const backupsDir = resolve(root, 'backups')
  mkdirSync(backupsDir, { recursive: true })

  const now = new Date()
  const stamp = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '')
  const outPath = resolve(backupsDir, `${stamp}.sql`)
  writeFileSync(outPath, chunks.join('\n'), 'utf8')

  console.log(`\n✅ 백업 완료: ${outPath}`)
  console.log(`   테이블 ${targetTables.length}개, 총 ${totalRows}행`)

  await client.end()
}

main().catch((e) => {
  console.error('❌ 백업 실패:', e.message)
  process.exit(1)
})
