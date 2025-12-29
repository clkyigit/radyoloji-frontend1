import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

export default async function handler(req, res) {
  // CORS İzinleri
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    console.log("API Başlatılıyor...");

    // -----------------------------------------------------------------------
    // 1. SUPABASE BAĞLANTISI (Doğrudan Yazıyoruz)
    // -----------------------------------------------------------------------
    
    // Senin verdiğin URL'yi buraya sabitledim:
    const supabase = createClient(
        'https://pdnepnrwxzkcsalzmsem.supabase.co', 
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbmVwbnJ3eHprY3NhbHptc2VtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk0MjIxNSwiZXhwIjoyMDgyNTE4MjE1fQ.Eaelg6jaJ7YhCRKa5DG0BISwDHR2vnt_5pBHnMFMRd4' // <-- Tırnakların içine Secret Key'i yapıştır
    );

    // -----------------------------------------------------------------------
    // 2. GOOGLE KEY FORMATI (Sorduğun Soru)
    // Kesme işareti (backtick `) kullanıyoruz ki alt alta sığsın.
    // Başındaki ve sonundaki ----- kısımları MUTLAKA OLMALI.
    // -----------------------------------------------------------------------
    const GOOGLE_KEY = `-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDmgtUvqOC3lRFK\nNOOMgHKPb8wkzevhzeuyI4udTgtAQUUstclGqKrGJNwwZep1H8ZzTYSxqYP0z7q+\n1/pjI/qAatWnwieHpGqyrrwDBswuQK+mU6G+WnNcYpQLyb+QgsL20hP8cfMcP5y+\nnaeKdRhIo04PJS9bRHBuc3UfW8lIYE5/DMDRsGgGg16WUvShZfqxl78Zvy08qYJz\npWw26y4YtEAC33qIyYwwIsNb8QW6gsWvbdv58bJgiNRnnnPk7JQpYqBqvSwSkgSe\nFf4HLvtzwIIfly5xaI+ZlAb3Bm7qWRoLGDHTn5Byae54bv8eHglkRvQVUESe6qdA\n8r4xAGXVAgMBAAECgf9qR5MDgARgXC/pZM6Wm29HkOZkM+K4ubjHlDWPOA6zqyAg\nMFtQHy/zK6UmzZJl1I2AiwF4pFH3MBQUx7MINg50JxIoLVP7cg7zD0gX2N/TyN0z\nqDmNCnx7RrP7qlYoqMw7eEtpZlOoQ6wbA7eZjewTTVpBTA5v/Z4dTskxko8y+WVV\nb6TmQjULteGjjwp+brrcaFjOmNR0N5Ixx5VDaWFiCqFY6rVtTvkDfqHY+WpqJ4fE\nKDcjVHX5VHy5VWJon4tnhhOKCeiU+eZ5+HxrWYq6QfPoSqVxvsoJss4DySXBKtfT\nWKyuD++hbjtcuayGwtUrffx0dK20ZSSxLS5GBzECgYEA+8zruy9n0KEskuA4FYZG\n6dWb662nQL/KH+1Rw2P6Ac+t43R27nCMQ2gH1JI49QtZFpPQwdecxN01q48K0s4J\nj0Q0YpAeK1bADKnNKZj/jEep9sEu3yJvVFsOP6fJE8IwlC9jOrnEys5ghln9oiIb\n709Zub8NBVPMWOsltXXek7kCgYEA6lsD70omF36tM+1lhkjeq7s5ei1j06brVOh3\nkSmQax9DNL7RHDrneDtqbl7+/rTd5H1ilQxBaQ7yuozD+iOFpFH7iBwpM5XTYXbp\n/JOOlmfgugDVJLh4wtXv44xsNqHfXVDG5PhNQRDFGJvlm+oTQJ7ixJwCeEaxeAFj\nd/VPqP0CgYBDHycfqM1lwfEd3gNVSYwRvU1pD8tr6TQ6Oor3KOl2HiReY6dofDwH\no+2ibrAcMkA3UoPtiEpT+Bvcda8O7rmBpU7Jj11bdC6RsZntIsnMXTYjfu+9r3I5\n7GPp+BIT4EoO1mr/NpIM9eKpLcf8tlb3/hEPAKy55NKuSVCuBJOmkQKBgFm90Jvp\nQPzuPVUNKzto3BvW7gOjLf72hFdXTbIAwJTEu++OwnSU+d5IolDxf6P5jp7YhM+e\nic25M6nMDZ/TynFKE4/jeMOQNAm2h5N4zbk6vgt8FiKhoVy6n8n7E9U311jcfc1g\nZ/Tqfw8VY694yzaLoTq4oxl7uKnDnltpTL/hAoGBAOyERkEyKNjh1MOZuQlTsw3f\nWo83Ospx+g7Ho1FuFVxsZzOC+a3nWnFhMJtQKgNzXGLsHDMvEyCWOmVDPufFJfGo\nBvuu8fcsA/UlK60RmC2JKZj0dptU0naayHUPeY6/aB0ge3EPcOZ1W3AiKXinkqQ3\nHX2k4WwCcgxp4bDQwBwq\n-----END PRIVATE KEY-----\n`;

    const GOOGLE_MAIL = "randevu-bot@girisimselrad.iam.gserviceaccount.com"; // Senin service mailin
    const CALENDAR_ID = "ishgirisimselrad@gmail.com"; // Senin gmailin

    // -----------------------------------------------------------------------

    // Frontend Verilerini Al
    const { 
      patientName, tc, patientId, procedure, 
      room, date, notes, anesthesia, checklist, duration 
    } = req.body;

    // Google Yetkilendirme
    const auth = new google.auth.JWT(
      GOOGLE_MAIL, 
      null, 
      GOOGLE_KEY, 
      ['https://www.googleapis.com/auth/calendar']
    );
    
    const calendar = google.calendar({ version: 'v3', auth });

    // Tarih Ayarı
    const startDateTime = new Date(`${date}T09:00:00`); 
    const endDateTime = new Date(startDateTime.getTime() + (duration || 30) * 60000);

    // Google Takvime Ekle
    const calendarResponse = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: `${patientName} - ${procedure}`,
        location: room,
        description: `TC: ${tc}\nNot: ${notes}`,
        start: { dateTime: startDateTime.toISOString(), timeZone: 'Europe/Istanbul' },
        end: { dateTime: endDateTime.toISOString(), timeZone: 'Europe/Istanbul' },
        colorId: anesthesia ? '11' : '10'
      },
    });

    // Supabase'e Ekle
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        patientName, tc, patientId, procedure, room, date, notes, anesthesia, checklist, duration,
        status: 'Bekliyor',
        google_event_id: calendarResponse.data.id,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('API HATASI:', error);
    return res.status(500).json({ error: error.message });
  }
}