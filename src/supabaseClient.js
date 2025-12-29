// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// .env dosyasındaki REACT_APP_ ile başlayan değişkenleri alıyoruz
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Eğer veriler okunamazsa konsola hata basarak nedenini görelim
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase Çevre Değişkenleri Bulunamadı!");
  console.error("URL:", supabaseUrl);
  console.error("KEY:", supabaseAnonKey ? "Var (Gizli)" : "Yok");
  throw new Error('Supabase URL required. Lütfen .env dosyasını kontrol edip sunucuyu yeniden başlatın.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);