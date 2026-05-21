import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jgisttgzfbsmlcvupgsr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnaXN0dGd6ZmJzbWxjdnVwZ3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNzAzODUsImV4cCI6MjA5NDk0NjM4NX0.Eh4a6Us4DhMkFmP9pfePaCvjON_piiibES3600tyONg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);