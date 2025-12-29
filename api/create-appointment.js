import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Frontend'den gelen veriyi alıyoruz
  const { 
    patientName, tc, patientId, procedure, 
    room, date, notes, anesthesia, checklist, duration 
  } = req.body;

  try {
    // 1. AYARLAR: Supabase ve Google Bağlantısı (Sunucu Tarafı)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Yazma yetkisi olan gizli anahtar
    );

    // Vercel'de satır sonu karakteri sorunu için düzeltme
    const privateKey = process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    const auth = new google.auth.JWT(
      process.env.GOOGLE_CLIENT_EMAIL,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar']
    );

    const calendar = google.calendar({ version: 'v3', auth });

    // 2. TARİH HESAPLAMA (Başlangıç ve Bitiş)
    // Frontend'den sadece tarih geliyor (YYYY-MM-DD), saati varsayılan 09:00 alıp süreyi ekliyoruz.
    // Eğer saat seçimi de eklediyseniz burayı güncelleyebiliriz.
    const startDateTime = new Date(`${date}T09:00:00`); 
    const endDateTime = new Date(startDateTime.getTime() + (duration || 30) * 60000);

    // 3. GOOGLE TAKVİM'E EKLEME
    const event = {
      summary: `${patientName} - ${procedure}`,
      location: room,
      description: `TC: ${tc}\nProtokol: ${patientId || '-'}\nAnestezi: ${anesthesia ? 'VAR' : 'Yok'}\nNot: ${notes}\nKontroller: ${checklist.join(', ')}`,
      start: { dateTime: startDateTime.toISOString(), timeZone: 'Europe/Istanbul' },
      end: { dateTime: endDateTime.toISOString(), timeZone: 'Europe/Istanbul' },
      colorId: anesthesia ? '11' : '10' // Anestezi varsa Kırmızı, yoksa Yeşil
    };

    const calendarResponse = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event,
    });

    const googleEventId = calendarResponse.data.id;

    // 4. SUPABASE'E KAYIT
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        patientName,
        tc,
        patientId,
        procedure,
        room,
        date,
        notes,
        anesthesia,
        checklist, // Supabase'de column type 'jsonb' veya 'text[]' olmalı
        duration,
        status: 'Bekliyor',
        google_event_id: googleEventId,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('API Hatası:', error);
    return res.status(500).json({ error: error.message });
  }
}