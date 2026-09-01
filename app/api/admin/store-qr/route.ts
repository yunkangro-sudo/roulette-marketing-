import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { requireAdminAuth } from '@/lib/admin/session'
import { buildPlayUrl } from '@/lib/store/playUrl'

/**
 * GET /api/admin/store-qr?format=png|svg&download=1&store_id=xxx
 *
 * 매장 고정 QR코드를 즉석에서 생성해 반환한다. DB에는 아무것도 저장하지 않는다 —
 * URL이 storeId 하나로 완전히 결정되는 순수 값이라, 저장해두면 오히려 도메인이
 * 바뀔 때 저장된 값과 실제 값이 어긋나는 사고(예: roulette-marketing.vercel.app 노출 사고)가
 * 재발할 수 있다. 요청마다 NEXT_PUBLIC_APP_URL 기준으로 새로 생성하는 것이 더 안전하다.
 *
 * 권한: advertiser는 본인 storeId로 고정, staff는 접근 불가(계산대 전용 역할이라 QR 관리 대상 아님),
 * super_admin/agency는 대리접속 중이거나 store_id 쿼리로 조회(이벤트 관리 화면과 동일 패턴).
 */

function resolveStoreId(account: { role: string; storeId: string | null }, provided: string | null): string | null {
  if (account.role === 'advertiser') return account.storeId
  return provided
}

export async function GET(req: Request) {
  const account = await requireAdminAuth()
  if (account.role === 'staff') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const storeId = resolveStoreId(account, searchParams.get('store_id'))
  if (!storeId) {
    return NextResponse.json({ error: 'store_id가 필요합니다' }, { status: 400 })
  }

  const format = searchParams.get('format') === 'svg' ? 'svg' : 'png'
  const download = searchParams.get('download') === '1'
  const playUrl = buildPlayUrl(storeId)

  // 코팅지 반사광·테이블 위 지저분함 등 인쇄 환경 대비 최고 단계(H) 에러정정 사용
  const qrOptions = {
    errorCorrectionLevel: 'H' as const,
    margin: 2,
    width: 960, // 인쇄용 800~1000px 권장 범위
  }

  try {
    if (format === 'svg') {
      const svg = await QRCode.toString(playUrl, { ...qrOptions, type: 'svg' })
      const headers: Record<string, string> = { 'Content-Type': 'image/svg+xml; charset=utf-8' }
      if (download) headers['Content-Disposition'] = `attachment; filename="store-qr-${storeId}.svg"`
      return new NextResponse(svg, { headers })
    }

    const buffer = await QRCode.toBuffer(playUrl, { ...qrOptions, type: 'png' })
    const headers: Record<string, string> = { 'Content-Type': 'image/png' }
    if (download) headers['Content-Disposition'] = `attachment; filename="store-qr-${storeId}.png"`
    return new NextResponse(new Uint8Array(buffer), { headers })
  } catch (err) {
    console.error('[store-qr] QR 생성 실패:', err)
    return NextResponse.json({ error: 'QR코드 생성에 실패했습니다' }, { status: 500 })
  }
}
