import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bxzrydybnnlzrgzdqnob.supabase.co'
const supabaseKey = 'আপনার_সুপাবেজ_ANON_KEY_এখানে_বসাবেন' 
// নোট: আপনার আগের ফাইলে supabaseKey খালি ছিল। 
// সুপাবেজ ড্যাশবোর্ড থেকে Project Settings > API > anon public key কপি করে উপরের কোটেশনের '' ভেতর বসান।

export const supabase = createClient(supabaseUrl, supabaseKey)
