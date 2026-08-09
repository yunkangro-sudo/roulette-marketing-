import { createClient as _createClient } from '@supabase/supabase-js'

// 브라우저(클라이언트) 전용 Supabase 클라이언트 — anon key 사용
let _instance: ReturnType<typeof _createClient> | null = null

export function createClient() {
  if (!_instance) {
    _instance = _createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _instance
}
