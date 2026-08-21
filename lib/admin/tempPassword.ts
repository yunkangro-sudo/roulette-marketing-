/**
 * 광고주 계정 임시 비밀번호 생성 규칙
 *
 * 규칙: 이메일 아이디(@ 앞부분) + "1234"
 * 예) ykrcool@naver.com → ykrcool1234
 *
 * 장점: 사장님이 비밀번호를 잊어버려도 "이메일 아이디 + 1234"만 기억하면 되고,
 *       관리자도 매번 재발급할 필요 없이 이메일만 보면 비밀번호를 바로 알 수 있다.
 * 주의: 이메일을 아는 사람이면 비밀번호도 유추 가능하므로, 이 계정으로는
 *       결제·개인정보 같은 민감 데이터에 접근할 수 없도록 관리자 권한 범위를 유지해야 한다.
 */
export function generateTempPassword(email: string): string {
  const localPart = email.split('@')[0]?.trim().toLowerCase()
  return `${localPart || 'user'}1234`
}
