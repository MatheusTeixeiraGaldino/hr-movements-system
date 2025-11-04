import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://npvemrhimzlspgutwpje.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdmVtcmhpbXpsc3BndXR3cGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NzQ0NzAsImV4cCI6MjA3NzU1MDQ3MH0.V9ho9YvZa7Wnqf3_oemI4U_NvBdl8e8DsUCJG0Kan6c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
