import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../database.types'

export const createClient = () => {
  return createClientComponentClient<Database>()
}

export const supabase = createClientComponentClient<Database>()
