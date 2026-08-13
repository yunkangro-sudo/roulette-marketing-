const { Client } = require('pg')

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('DB 연결 성공 (postgres superuser)')

  // DELETE 권한 영구 추가
  await client.query('GRANT DELETE ON reward_catalog TO service_role')
  await client.query('GRANT DELETE ON rewards_issued TO service_role')
  console.log('✅ GRANT DELETE 적용 완료 (service_role)')

  // 테스트 데이터 조회
  const { rows: cats } = await client.query(
    `SELECT id, name FROM reward_catalog
     WHERE store_id = 'chj-001'
       AND (name LIKE '[TEST%' OR name LIKE '[테스트%' OR name LIKE '[A]%'
         OR name LIKE '[B]%' OR name LIKE '[C]%' OR name LIKE '[D]%')`
  )
  console.log('\n삭제 대상:', cats.length, '개')
  cats.forEach(c => console.log(' -', c.name))

  if (cats.length > 0) {
    const ids = cats.map(c => c.id)
    const { rowCount: ri } = await client.query(
      'DELETE FROM rewards_issued WHERE reward_catalog_id = ANY($1)', [ids]
    )
    const { rowCount: rc } = await client.query(
      'DELETE FROM reward_catalog WHERE id = ANY($1)', [ids]
    )
    console.log(`rewards_issued ${ri}건, reward_catalog ${rc}건 삭제 완료`)
  }

  // 최종 확인
  const { rows: left } = await client.query(
    "SELECT name FROM reward_catalog WHERE store_id = 'chj-001' ORDER BY name"
  )
  console.log('\n최종 남은 리워드:')
  left.forEach(r => console.log(' -', r.name))

  await client.end()
}

run().catch(e => { console.error('오류:', e.message); process.exit(1) })
