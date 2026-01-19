import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://pyulsnstxoxvofjokdks.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5dWxzbnN0eG94dm9mam9rZGtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMjAyMjgsImV4cCI6MjA3NDY5NjIyOH0.81mwYql0RFc5nItQcy5R0YRh1wrScR9bZR9iBOE0DXk"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
