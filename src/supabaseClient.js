import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bxzrydybnnlzrgzdqnob.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4enJ5ZHlibm5senJnemRxbm9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NTQ2MzksImV4cCI6MjA4NDEzMDYzOX0.6Ikj5At5UKhKZr6y_lhmOQ-FUDxdnJOS1ZUSf6dTgEI' 
// নোট: আপনার আগের ফাইলে supabaseKey খালি ছিল। 
// সুপাবেজ ড্যাশবোর্ড থেকে Project Settings > API > anon public key কপি করে উপরের কোটেশনের '' ভেতর বসান।

export const supabase = createClient(supabaseUrl, supabaseKey)
