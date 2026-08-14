/** store_settings.points_enabled가 false일 때만 적립을 끈다. 없거나 true면 켠다. */
export function isPointsEnabled(value: boolean | null | undefined): boolean {
  return value !== false
}

/** 게스트 추첨 응답에 당첨액이 새면 안 된다. */
export function isLockedPlayResponse(body: Record<string, unknown>): boolean {
  return body.locked === true && !('amount' in body) && !('label' in body) && !('tierId' in body)
}
