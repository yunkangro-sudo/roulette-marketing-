import { createClient } from '@supabase/supabase-js'

// 서버(Server Component / Route Handler) 전용 — service role key 사용
// RLS를 우회해야 하는 서버 측 관리 쿼리에만 사용할 것
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
