const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ==================================================================
// 1. AYARLAR
// ==================================================================
const SUPABASE_URL = "https://pdnepnrwxzkcsalzmsem.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbmVwbnJ3eHprY3NhbHptc2VtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk0MjIxNSwiZXhwIjoyMDgyNTE4MjE1fQ.Eaelg6jaJ7YhCRKa5DG0BISwDHR2vnt_5pBHnMFMRd4";
const CALENDAR_ID = "ishgirisimselrad@gmail.com";
const CLIENT_EMAIL = "randevu-bot@girisimselrad.iam.gserviceaccount.com";

// Temiz Anahtar (Satır satır)
const PRIVATE_KEY_TEXT = `-----BEGIN PRIVATE KEY-----
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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================================================================
// 2. OTOMATİK DOSYA OLUŞTURMA SİSTEMİ
// ==================================================================

// Geçici JSON dosyasının adı
const TEMP_FILE_NAME = 'gecici-google-anahtari.json';
const TEMP_FILE_PATH = path.join('/tmp', TEMP_FILE_NAME);

// Dosyayı oluşturacak fonksiyon
function createCredentialsFile() {
    try {
        const credentialsData = {
            "type": "service_account",
            "project_id": "girisimselrad",
            "private_key_id": "9d70e2e9dbdad22beb7f0c43f762fe09b0aebef3",
            "private_key": PRIVATE_KEY_TEXT, // Temiz anahtarı buraya gömüyoruz
            "client_email": CLIENT_EMAIL,
            "client_id": "110999461912660895186",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/randevu-bot%40girisimselrad.iam.gserviceaccount.com"
        };
        
        // Dosyayı diske yaz (Bu işlem format hatasını imkansız kılar)
        fs.writeFileSync(TEMP_FILE_PATH, JSON.stringify(credentialsData, null, 2));
        console.log(`✅ Geçici yetki dosyası oluşturuldu: ${TEMP_FILE_NAME}`);
        return true;
    } catch (err) {
        console.error("❌ Dosya oluşturma hatası:", err);
        return false;
    }
}

// Sunucu başlarken dosyayı oluştur
createCredentialsFile();

// ==================================================================

app.post('/api/create-appointment', async (req, res) => {
    try {
        console.log("------------------------------------------");
        console.log("📥 İSTEK ALINDI...");

        // Dosya kontrolü
        if (!fs.existsSync(TEMP_FILE_PATH)) {
            console.log("⚠️ Dosya bulunamadı, yeniden oluşturuluyor...");
            createCredentialsFile();
        }

        console.log("🔑 Google'a dosya yolu veriliyor...");

        // 3. EN GARANTİ YÖNTEM: KEYFILE
        // Google'a diyoruz ki: "Al bu dosyanın adresi, içini kendin oku."
        // Artık formatlama, \n, boşluk derdi yok. Hepsini Google halledecek.
        const auth = new google.auth.GoogleAuth({
            keyFile: TEMP_FILE_PATH, // <-- Dosya yolunu veriyoruz
            scopes: ['https://www.googleapis.com/auth/calendar'],
        });

        // Client oluştur
        const client = await auth.getClient();
        console.log("✅ İstemci oluşturuldu!");

        const calendar = google.calendar({ version: 'v3', auth: client });

        // Verileri Al
        const { 
            patientName, tc, patientId, procedure, 
            room, date, notes, anesthesia, duration, checklist 
        } = req.body;

        const startDateTime = new Date(`${date}T09:00:00`); 
        const endDateTime = new Date(startDateTime.getTime() + (duration || 30) * 60000);

        console.log("📅 Takvime (Tüm Gün) olarak gönderiliyor...");
        const calendarResponse = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: {
                summary: `${patientName} - ${procedure}`,
                location: room,
                description: `TC: ${tc}\nNot: ${notes}`,
                // dateTime yerine 'date' kullanınca "Tüm Gün" olur
                start: { date: date }, 
                end: { date: date },   
                colorId: anesthesia ? '11' : '10'
            },
        });
        
        console.log("🗄️ Supabase'e yazılıyor...");
        const { error } = await supabase
            .from('appointments')
            .insert([{
                patientName, tc, patientId, procedure, room, date, notes, anesthesia, duration, checklist,
                status: 'Bekliyor',
                google_event_id: calendarResponse.data.id,
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;

        console.log("🎉 İŞLEM TAMAMLANDI!");
        res.status(200).json({ success: true });

    } catch (error) {
        console.error("❌ HATA:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Port 5001
const PORT = 5001; 
app.listen(PORT, () => console.log(`🚀 Sunucu Çalışıyor (Port: ${PORT})`));