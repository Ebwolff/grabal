import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ekinalignakvuogtdwwt.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVraW5hbGlnbmFrdnVvZ3Rkd3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDgzMjAsImV4cCI6MjA5Mjk4NDMyMH0.Q9fZdJYdAfFg8q9wJdvsGgdzSQvns1UvO_zn3JuypTI'
  )
}
