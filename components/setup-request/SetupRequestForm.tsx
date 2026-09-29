'use client'

import { useState } from 'react'
import ManualNav from '@/components/sales-manual/ManualNav'
import { SETUP_PRODUCTS, type SetupProductId } from '@/lib/setup-request/types'

type PrizeRow = { content: string; monthlyQty: string }
type RewardRow = { name: string; visits: string; monthlyQty: string }

const inputClass =
  'w-full border border-[#222222]/15 bg-white px-4 py-3 text-[16px] font-semibold text-[#222222] outline-none focus:border-[#00C7A7]'

function emptyPrize(): PrizeRow {
  return { content: '', monthlyQty: '' }
}
function emptyReward(): RewardRow {
  return { name: '', visits: '', monthlyQty: '' }
}

export default function SetupRequestForm() {
  const [products, setProducts] = useState<SetupProductId[]>(['dangolting'])
  const [hqCall, setHqCall] = useState(false)
  const [prizes, setPrizes] = useState<PrizeRow[]>([emptyPrize()])
  const [rewards, setRewards] = useState<RewardRow[]>([emptyReward(), emptyReward()])
  const [photoViaKakao, setPhotoViaKakao] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const wantsDangolting = products.includes('dangolting')

  function toggleProduct(id: SetupProductId) {
    setProducts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    setLoading(true)
    try {
      const res = await fetch('/api/setup-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: form.get('storeName'),
          address: form.get('address'),
          phone: form.get('phone'),
          salespersonName: form.get('salespersonName'),
          salespersonPhone: form.get('salespersonPhone'),
          products,
          hqCall,
          prizes,
          rewards,
          daangnUrl: form.get('daangnUrl'),
          naverReviewUrl: form.get('naverReviewUrl'),
          googleReviewUrl: form.get('googleReviewUrl'),
          naverPlaceUrl: form.get('naverPlaceUrl'),
          intro: form.get('intro'),
          businessHours: form.get('businessHours'),
          openDate: form.get('openDate'),
          photoViaKakao,
          memo: form.get('memo'),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? '접수에 실패했습니다.')
        return
      }
      setDone(true)
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#FAF7F0] text-[#222222]">
        <ManualNav current="setup" />
        <main className="mx-auto max-w-3xl px-5 py-16">
          <h1 className="text-[32px] font-extrabold leading-snug">접수가 완료되었습니다.</h1>
          <p className="mt-4 text-[18px] font-semibold leading-relaxed text-[#222222]/75">
            본사가 내용을 확인하고 세팅합니다. 사진을 보내기로 했다면 카카오톡으로 이어서 보내 주세요.
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#222222]">
      <ManualNav current="setup" />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        <p className="text-[14px] font-bold text-[#019c87]">가입과 입금이 끝난 매장</p>
        <h1 className="mt-3 text-[32px] font-extrabold leading-snug tracking-tight">세팅 접수</h1>
        <div className="mt-5 grid gap-3 text-[17px] font-semibold leading-relaxed text-[#222222]/80">
          <p>광고주 또는 영업담당자가 입력합니다.</p>
          <p>경품 내용은 참여율과 단골 추가, 후기에 큰 영향을 줍니다. 푸짐하게 구성할수록 좋습니다.</p>
          <p>꽝은 포인트 적립으로 표시되며, 기본 100포인트가 적립됩니다. 경품에 당첨된 분에게도 100포인트가 함께 적립됩니다.</p>
          <p>
            세팅이 어려우면 전화해 주세요.{' '}
            <a href="tel:010-8729-9661" className="font-extrabold text-[#019c87]">
              010-8729-9661
            </a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 grid gap-10">
          <section className="grid gap-4">
            <h2 className="text-[22px] font-extrabold">매장</h2>
            <label className="grid gap-2 text-[15px] font-bold">
              매장명
              <input name="storeName" required className={inputClass} style={{ borderRadius: 12 }} placeholder="가입할 때 적은 이름" />
            </label>
            <label className="grid gap-2 text-[15px] font-bold">
              주소
              <input name="address" required className={inputClass} style={{ borderRadius: 12 }} placeholder="매장 주소" />
            </label>
            <label className="grid gap-2 text-[15px] font-bold">
              광고주 연락처
              <input name="phone" required inputMode="tel" className={inputClass} style={{ borderRadius: 12 }} placeholder="010-0000-0000" />
            </label>
            <label className="grid gap-2 text-[15px] font-bold">
              영업담당자 이름
              <input name="salespersonName" required className={inputClass} style={{ borderRadius: 12 }} placeholder="영업담당자 이름" />
            </label>
            <label className="grid gap-2 text-[15px] font-bold">
              영업담당자 연락처
              <input name="salespersonPhone" required inputMode="tel" className={inputClass} style={{ borderRadius: 12 }} placeholder="010-0000-0000" />
            </label>
          </section>

          <section>
            <h2 className="text-[22px] font-extrabold">신청 상품</h2>
            <p className="mt-2 text-[15px] font-semibold text-[#222222]/60">여러 개를 골라도 됩니다.</p>
            <div className="mt-4 grid gap-2">
              {SETUP_PRODUCTS.map((product) => {
                const on = products.includes(product.id)
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`flex h-14 items-center justify-between px-5 text-left text-[17px] font-extrabold ${
                      on ? 'bg-[#00C7A7] text-[#222222]' : 'bg-white text-[#222222]/70'
                    }`}
                    style={{ borderRadius: 14 }}
                  >
                    {product.label}
                    <span>{on ? '선택됨' : '선택'}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {wantsDangolting && (
            <>
              <section className="grid gap-4">
                <div>
                  <h2 className="text-[22px] font-extrabold">게임 경품</h2>
                  <p className="mt-2 text-[15px] font-semibold leading-relaxed text-[#222222]/65">
                    뽑기에서 바로 주는 것입니다. 모아서 주는 메뉴는 아래 리워드에 적습니다.
                  </p>
                </div>
                {prizes.map((row, i) => (
                  <div key={i} className="grid gap-3 bg-white p-4" style={{ borderRadius: 16 }}>
                    <label className="grid gap-2 text-[15px] font-bold">
                      경품 내용
                      <input
                        value={row.content}
                        onChange={(e) =>
                          setPrizes((prev) => prev.map((p, idx) => (idx === i ? { ...p, content: e.target.value } : p)))
                        }
                        className={inputClass}
                        style={{ borderRadius: 12 }}
                        placeholder="예: 5,000원 할인"
                      />
                    </label>
                    <label className="grid gap-2 text-[15px] font-bold">
                      한 달 수량
                      <input
                        value={row.monthlyQty}
                        onChange={(e) =>
                          setPrizes((prev) => prev.map((p, idx) => (idx === i ? { ...p, monthlyQty: e.target.value } : p)))
                        }
                        inputMode="numeric"
                        className={inputClass}
                        style={{ borderRadius: 12 }}
                        placeholder="예: 30"
                      />
                    </label>
                    {prizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPrizes((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-left text-[14px] font-bold text-[#222222]/45"
                      >
                        이 경품 빼기
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPrizes((prev) => [...prev, emptyPrize()])}
                  className="h-12 bg-white text-[16px] font-extrabold"
                  style={{ borderRadius: 12 }}
                >
                  경품 추가
                </button>
                <label className="flex items-start gap-3 bg-[#FFF3DE] p-4 text-[16px] font-bold leading-relaxed" style={{ borderRadius: 14 }}>
                  <input type="checkbox" checked={hqCall} onChange={(e) => setHqCall(e.target.checked)} className="mt-1 h-5 w-5" />
                  경품 상담이 어렵습니다. 본사가 광고주에게 전화해 주세요.
                </label>
              </section>

              <section className="grid gap-4">
                <div>
                  <h2 className="text-[22px] font-extrabold">방문하면 주는 메뉴</h2>
                  <p className="mt-2 text-[15px] font-semibold leading-relaxed text-[#222222]/65">
                    몇 번 오면 무엇을 주는지만 적습니다. 본사가 방문 1회를 100포인트로 넣습니다. 3번이면 300포인트입니다.
                  </p>
                </div>
                {rewards.map((row, i) => (
                  <div key={i} className="grid gap-3 bg-white p-4" style={{ borderRadius: 16 }}>
                    <label className="grid gap-2 text-[15px] font-bold">
                      주는 메뉴
                      <input
                        value={row.name}
                        onChange={(e) =>
                          setRewards((prev) => prev.map((p, idx) => (idx === i ? { ...p, name: e.target.value } : p)))
                        }
                        className={inputClass}
                        style={{ borderRadius: 12 }}
                        placeholder="예: 탕수육"
                      />
                    </label>
                    <label className="grid gap-2 text-[15px] font-bold">
                      방문 횟수
                      <input
                        value={row.visits}
                        onChange={(e) =>
                          setRewards((prev) => prev.map((p, idx) => (idx === i ? { ...p, visits: e.target.value } : p)))
                        }
                        inputMode="numeric"
                        className={inputClass}
                        style={{ borderRadius: 12 }}
                        placeholder="예: 5"
                      />
                    </label>
                    <label className="grid gap-2 text-[15px] font-bold">
                      한 달 수량
                      <span className="text-[13px] font-semibold text-[#222222]/45">비싼 메뉴만. 비워도 됩니다.</span>
                      <input
                        value={row.monthlyQty}
                        onChange={(e) =>
                          setRewards((prev) => prev.map((p, idx) => (idx === i ? { ...p, monthlyQty: e.target.value } : p)))
                        }
                        inputMode="numeric"
                        className={inputClass}
                        style={{ borderRadius: 12 }}
                        placeholder="제한 없음"
                      />
                    </label>
                    {rewards.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setRewards((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-left text-[14px] font-bold text-[#222222]/45"
                      >
                        이 메뉴 빼기
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRewards((prev) => [...prev, emptyReward()])}
                  className="h-12 bg-white text-[16px] font-extrabold"
                  style={{ borderRadius: 12 }}
                >
                  메뉴 추가
                </button>
              </section>

              <section className="grid gap-4">
                <h2 className="text-[22px] font-extrabold">연결 주소</h2>
                <label className="grid gap-2 text-[15px] font-bold">
                  당근 단골 주소
                  <input name="daangnUrl" className={inputClass} style={{ borderRadius: 12 }} placeholder="https://" />
                </label>
                <label className="grid gap-2 text-[15px] font-bold">
                  네이버 후기 주소
                  <span className="text-[13px] font-semibold text-[#222222]/45">쓰는 매장만</span>
                  <input name="naverReviewUrl" className={inputClass} style={{ borderRadius: 12 }} placeholder="https://" />
                </label>
                <label className="grid gap-2 text-[15px] font-bold">
                  구글 후기 주소
                  <span className="text-[13px] font-semibold text-[#222222]/45">쓰는 매장만</span>
                  <input name="googleReviewUrl" className={inputClass} style={{ borderRadius: 12 }} placeholder="https://" />
                </label>
              </section>

              <section className="grid gap-4">
                <div>
                  <h2 className="text-[22px] font-extrabold">매장 홈페이지</h2>
                  <p className="mt-2 text-[15px] font-semibold leading-relaxed text-[#222222]/65">
                    네이버 플레이스 주소만 있으면 본사가 나머지를 채웁니다. 없어도 접수는 됩니다.
                  </p>
                </div>
                <label className="grid gap-2 text-[15px] font-bold">
                  네이버 플레이스 주소
                  <input name="naverPlaceUrl" className={inputClass} style={{ borderRadius: 12 }} placeholder="https://" />
                </label>
                <label className="grid gap-2 text-[15px] font-bold">
                  한 줄 소개
                  <span className="text-[13px] font-semibold text-[#222222]/45">다르게 적고 싶을 때만</span>
                  <input name="intro" className={inputClass} style={{ borderRadius: 12 }} />
                </label>
                <label className="grid gap-2 text-[15px] font-bold">
                  영업시간
                  <input name="businessHours" className={inputClass} style={{ borderRadius: 12 }} placeholder="예: 매일 11:00~21:00" />
                </label>
                <label className="grid gap-2 text-[15px] font-bold">
                  오픈 희망일
                  <span className="text-[13px] font-semibold text-[#222222]/45">비우면 세팅이 끝나는 날 엽니다.</span>
                  <input name="openDate" type="date" className={inputClass} style={{ borderRadius: 12 }} />
                </label>
              </section>
            </>
          )}

          <section className="grid gap-4">
            <h2 className="text-[22px] font-extrabold">사진과 메모</h2>
            <label className="flex items-start gap-3 bg-white p-4 text-[16px] font-bold leading-relaxed" style={{ borderRadius: 14 }}>
              <input
                type="checkbox"
                checked={photoViaKakao}
                onChange={(e) => setPhotoViaKakao(e.target.checked)}
                className="mt-1 h-5 w-5"
              />
              로고나 매장 사진을 카카오톡으로 보내겠습니다. 없으면 본사가 채웁니다.
            </label>
            <label className="grid gap-2 text-[15px] font-bold">
              메모
              <textarea name="memo" rows={4} className={inputClass} style={{ borderRadius: 12 }} placeholder="본사가 알아야 할 말" />
            </label>
          </section>

          {error && <p className="text-[16px] font-bold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || products.length === 0}
            className="h-14 bg-[#00C7A7] text-[17px] font-extrabold text-[#222222] disabled:opacity-50"
            style={{ borderRadius: 12 }}
          >
            {loading ? '보내는 중' : '접수하기'}
          </button>
        </form>
      </main>
    </div>
  )
}
