'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  companyId: string
  storeName: string
}

/**
 * 슈퍼관리자 전용 "업체 완전 삭제" 위험 구역.
 *
 * 되돌릴 수 없는 작업이라 2단계 확인을 강제한다:
 *   1) 빨간 경고 문구가 있는 모달을 열어야 함
 *   2) 모달 안에서 업체명을 정확히 그대로 입력해야 삭제 버튼이 활성화됨
 * 서버(app/api/admin/companies/[id]/route.ts DELETE)에서도 업체명 일치를 다시 검증한다.
 */
export default function DeleteCompanyDangerZone({ companyId, storeName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const canDelete = confirmText === storeName

  function closeModal() {
    if (deleting) return
    setOpen(false)
    setConfirmText('')
    setError('')
  }

  async function handleDelete() {
    if (!canDelete) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_store_name: storeName }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? '삭제 실패'); return }
      router.push('/admin/companies')
      router.refresh()
    } catch {
      setError('네트워크 오류가 발생했습니다')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="rounded-xl border-2 border-red-200 bg-red-50 p-5">
        <h2 className="text-sm font-bold text-red-700">⚠️ 위험 구역</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-red-600">
          이 업체와 연결된 모든 데이터(게임 이벤트, 쿠폰, 포인트, 회원, 결제 이력 등)를
          영구적으로 삭제합니다. <strong>이 작업은 되돌릴 수 없습니다.</strong>
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
        >
          업체 정보 완전 삭제
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">업체 완전 삭제</h3>

            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-bold text-red-700">
                이 버튼을 누르시면 영구 삭제됩니다. 완전 삭제하시나요?
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-red-600">
                <strong>{storeName}</strong>의 모든 이벤트/쿠폰/포인트/회원/결제 이력이 즉시 사라지며
                복구할 수 없습니다.
              </p>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-xs text-gray-500">
                계속하려면 업체명 <strong className="text-gray-900">{storeName}</strong>을 정확히 입력하세요
              </label>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={storeName}
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:outline-none"
              />
            </div>

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={deleting}
                className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-40"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete || deleting}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? '삭제 중...' : '완전 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
