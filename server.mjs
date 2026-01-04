import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const app = express();

// CORS ve JSON ayarları
app.use(cors());
app.use(express.json());

// --- AYARLAR ---
const PORT = 5001; // Render'da bu port process.env.PORT ile otomatik değişir, aşağıda ayarladık.
const SUPABASE_URL = 'https://pdnepnrwxzkcsalzmsem.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbmVwbnJ3eHprY3NhbHptc2VtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk0MjIxNSwiZXhwIjoyMDgyNTE4MjE1fQ.Eaelg6jaJ7YhCRKa5DG0BISwDHR2vnt_5pBHnMFMRd4';

// Google Key - Formatlama
const GOOGLE_KEY_RAW = `-----BEGIN PRIVATE KEY-----
MIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDmgtUvqOC3lRFK
NOOMgHKPb8wkzevhzeuyI4udTgtAQUUstclGqKrGJNwwZep1H8ZzTYSxqYP0z7q+
1/pjI/qAatWnwieHpGqyrrwDBswuQK+mU6G+WnNcYpQLyb+QgsL20hP8cfMcP5y+
naeKdRhIo04PJS9bRHBuc3UfW8lIYE5/DMDRsGgGg16WUvShZfqxl78Zvy08qYJz
pWw26y4YtEAC33qIyYwwIsNb8QW6gsWvbdv58bJgiNRnnnPk7JQpYqBqvSwSkgSe
Ff4HLvtzwIIfly5xaI+ZlAb3Bm7qWRoLGDHTn5Byae54bv8eHglkRvQVUESe6qdA
8r4xAGXVAgMBAAECgf9qR5MDgARgXC/pZM6Wm29HkOZkM+K4ubjHlDWPOA6zqyAg
MFtQHy/zK6UmzZJl1I2AiwF4pFH3MBQUx7MINg50JxIoLVP7cg7zD0gX2N/TyN0z
qDmNCnx7RrP7qlYoqMw7eEtpZlOoQ6wbA7eZjewTTVpBTA5v/Z4dTskxko8y+WVV
b6TmQjULteGjjwp+brrcaFjOmNR0N5Ixx5VDaWFiCqFY6rVtTvkDfqHY+WpqJ4fE
KDcjVHX5VHy5VWJon4tnhhOKCeiU+eZ5+HxrWYq6QfPoSqVxvsoJss4DySXBKtfT
WKyuD++hbjtcuayGwtUrffx0dK20ZSSxLS5GBzECgYEA+8zruy9n0KEskuA4FYZG
6dWb662nQL/KH+1Rw2P6Ac+t43R27nCMQ2gH1JI49QtZFpPQwdecxN01q48K0s4J
j0Q0YpAeK1bADKnNKZj/jEep9sEu3yJvVFsOP6fJE8IwlC9jOrnEys5ghln9oiIb
709Zub8NBVPMWOsltXXek7kCgYEA6lsD70omF36tM+1lhkjeq7s5ei1j06brVOh3
kSmQax9DNL7RHDrneDtqbl7+/rTd5H1ilQxBaQ7yuozD+iOFpFH7iBwpM5XTYXbp
/JOOlmfgugDVJLh4wtXv44xsNqHfXVDG5PhNQRDFGJvlm+oTQJ7ixJwCeEaxeAFj
d/VPqP0CgYBDHycfqM1lwfEd3gNVSYwRvU1pD8tr6TQ6Oor3KOl2HiReY6dofDwH
o+2ibrAcMkA3UoPtiEpT+Bvcda8O7rmBpU7Jj11bdC6RsZntIsnMXTYjfu+9r3I5
7GPp+BIT4EoO1mr/NpIM9eKpLcf8tlb3/hEPAKy55NKuSVCuBJOmkQKBgFm90Jvp
QPzuPVUNKzto3BvW7gOjLf72hFdXTbIAwJTEu++OwnSU+d5IolDxf6P5jp7YhM+e
ic25M6nMDZ/TynFKE4/jeMOQNAm2h5N4zbk6vgt8FiKhoVy6n8n7E9U311jcfc1g
Z/Tqfw8VY694yzaLoTq4oxl7uKnDnltpTL/hAoGBAOyERkEyKNjh1MOZuQlTsw3f
Wo83Ospx+g7Ho1FuFVxsZzOC+a3nWnFhMJtQKgNzXGLsHDMvEyCWOmVDPufFJfGo
Bvuu8fcsA/UlK60RmC2JKZj0dptU0naayHUPeY6/aB0ge3EPcOZ1W3AiKXinkqQ3
HX2k4WwCcgxp4bDQwBwq
-----END PRIVATE KEY-----`;

const GOOGLE_KEY = GOOGLE_KEY_RAW.replace(/\\n/g, '\n');
const GOOGLE_MAIL = "randevu-bot@girisimselrad.iam.gserviceaccount.com";
const CALENDAR_ID = "ishgirisimselrad@gmail.com";

// --- API ENDPOINT ---
app.post('/api/randevu-olustur', async (req, res) => {
  try {
    console.log("📩 Yeni İstek Geldi:", req.body);

    const { 
      patientName, tc, patientId, procedure, 
      room, date, notes, anesthesia, checklist 
    } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Tarih bilgisi zorunludur." });
    }

    // 1. Google Takvim (Tam Gün Etkinliği)
    const startYMD = date; 
    const nextDayDate = new Date(date);
    nextDayDate.setDate(nextDayDate.getDate() + 1);
    const endYMD = nextDayDate.toISOString().split('T')[0];

    // --- KRİTİK DÜZELTME: GoogleAuth Kullanımı ---
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_MAIL,
        private_key: GOOGLE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const calendarResponse = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: `${patientName} - ${procedure}`,
        location: room,
        description: `TC: ${tc || '-'}\nNot: ${notes || ''}\nAnestezi: ${anesthesia ? 'Evet' : 'Hayır'}`,
        start: { date: startYMD },
        end:   { date: endYMD },
        colorId: anesthesia ? '11' : '10',
        transparency: 'transparent'
      },
    });

    // 2. Supabase Kayıt
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        "patientName": patientName,
        "tc": tc,
        "patientId": patientId,
        "procedure": procedure,
        "room": room,
        "date": date,
        "notes": notes,
        "anesthesia": anesthesia,
        "checklist": checklist,
        "duration": 0,
        "status": 'Bekliyor',
        "google_event_id": calendarResponse.data.id
      }])
      .select();

    if (error) throw error;

    console.log("✅ İşlem Başarılı. Takvim ID:", calendarResponse.data.id);
    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('❌ Sunucu Hatası Detayı:', error);
    // Hata mesajını frontend'e daha açık gönderelim
    return res.status(500).json({ error: error.message || "Google API Hatası" });
  }
});

// --- SUNUCUYU BAŞLAT ---
// Render için process.env.PORT şarttır
const ACTIVE_PORT = process.env.PORT || PORT;

app.listen(ACTIVE_PORT, () => {
  console.log(`🚀 Sunucu Çalışıyor: http://localhost:${ACTIVE_PORT}`);
});