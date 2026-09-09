import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/admin/session'
import { createServerClient } from '@/lib/supabase/server'
import LeadsListClient, { type LeadItem } from './LeadsListClient'

export default async function SuperLeadsPage() {
  const account = await requireAdminAuth()
  if (!['agency', 'super_admin'].includes(account.role)) redirect('/admin/events')

  const supabase = createServerClient()
  const { data } = await supabase
    .from('signup_inquiries')
    .select('id, store_name, owner_name, phone, email, business_type, message, source, status, created_at')
    .order('created_at', { ascending: false })

  const items: LeadItem[] = (data ?? []).map((row) => ({
    id: row.id,
    storeName: row.store_name,
    ownerName: row.owner_name,
    phone: row.phone,
    email: row.email,
    businessType: row.business_type,
    message: row.message,
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
  }))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">신청 · 문의 리스트</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          랜딩페이지의 단골마케팅 신청, 상담하기, 요금제 계산기, 회원가입 등에서 들어온 리드를 한 곳에서 확인하세요.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-lg">아직 들어온 신청/문의가 없습니다</p>
        </div>
      ) : (
        <LeadsListClient items={items} />
      )}
    </div>
  )
}
