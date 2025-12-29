import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './App.css'; // Stil dosyan

// 1. Supabase Ayarları (.env dosyasından okuması en doğrusudur ama şimdilik böyle kalsın)
const supabaseUrl = "https://pdnepnrwxzkcsalzmsem.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkbmVwbnJ3eHprY3NhbHptc2VtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk0MjIxNSwiZXhwIjoyMDgyNTE4MjE1fQ.Eaelg6jaJ7YhCRKa5DG0BISwDHR2vnt_5pBHnMFMRd4";
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // Sayfa yükleniyor mu?

  // Form verileri için State'ler
  const [patientName, setPatientName] = useState('');
  const [tc, setTc] = useState('');
  const [patientId, setPatientId] = useState('');
  const [procedure, setProcedure] = useState('');
  const [room, setRoom] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [anesthesia, setAnesthesia] = useState(false);
  const [duration, setDuration] = useState(30);
  const [checklist, setChecklist] = useState({
    onamFormu: false,
    kanTahlili: false,
    aclikDurumu: false
  });

  // ============================================================
  // KRİTİK BÖLÜM: SAYFA YENİLENİNCE OTURUMU HATIRLAMA KODU
  // ============================================================
  useEffect(() => {
    // 1. Sayfa ilk açıldığında: Mevcut bir oturum var mı kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Yükleme bitti
    });

    // 2. Dinleyici: Kullanıcı giriş/çıkış yaparsa durumu güncelle
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ============================================================

  // Form Gönderme Fonksiyonu (Render.com adresini buraya yazacağız)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // BURAYA DİKKAT: Yayına aldığımızda burayı değiştireceğiz.
    // Şimdilik test için localhost kalabilir veya Render linkini yapıştırabilirsin.
    const API_URL = 'https://radyoloji-server.onrender.com/api/create-appointment';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName, tc, patientId, procedure, room, date, notes, anesthesia, duration, checklist
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert('✅ Randevu başarıyla oluşturuldu!');
      } else {
        alert('❌ Hata: ' + data.error);
      }
    } catch (error) {
      alert('❌ Sunucuya bağlanılamadı!');
      console.error(error);
    }
  };

  const handleChecklistChange = (e) => {
    setChecklist({ ...checklist, [e.target.name]: e.target.checked });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- EKRAN YÖNETİMİ ---

  // 1. Eğer hala kontrol ediyorsa "Yükleniyor..." göster (Giriş ekranı göz kırpmasın diye)
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>;
  }

  // 2. Eğer oturum YOKSA -> Giriş Ekranını Göster
  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="w-full max-w-md p-8 bg-white rounded shadow-lg">
          <h2 className="mb-4 text-2xl font-bold text-center text-blue-600">Radyoloji Giriş</h2>
          <Auth 
            supabaseClient={supabase} 
            appearance={{ theme: ThemeSupa }} 
            providers={[]} // Sadece email şifre olsun
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-posta Adresi',
                  password_label: 'Şifre',
                  button_label: 'Giriş Yap',
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

  // 3. Eğer oturum VARSA -> Ana Uygulamayı (Formu) Göster
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Girişimsel Radyoloji Randevu</h1>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700 text-sm font-semibold">
            Çıkış Yap
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form Elemanları - Senin mevcut form kodların buraya gelecek */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Hasta Adı Soyadı" className="border p-2 rounded" value={patientName} onChange={e => setPatientName(e.target.value)} required />
                <input type="text" placeholder="TC Kimlik No" className="border p-2 rounded" value={tc} onChange={e => setTc(e.target.value)} required />
                <input type="text" placeholder="Protokol No" className="border p-2 rounded" value={patientId} onChange={e => setPatientId(e.target.value)} required />
                <input type="text" placeholder="Yapılacak İşlem" className="border p-2 rounded" value={procedure} onChange={e => setProcedure(e.target.value)} required />
                
                <select className="border p-2 rounded" value={room} onChange={e => setRoom(e.target.value)} required>
                    <option value="">Oda Seçin</option>
                    <option value="Anjiyo 1">Anjiyo 1</option>
                    <option value="Anjiyo 2">Anjiyo 2</option>
                    <option value="Tomografi">Tomografi</option>
                    <option value="USG">Ultrason</option>
                </select>

                <input type="date" className="border p-2 rounded" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div className="flex items-center gap-4 py-2">
                <label className="flex items-center gap-2">
                    <input type="checkbox" checked={anesthesia} onChange={e => setAnesthesia(e.target.checked)} />
                    <span className="font-medium">Anestezi İsteniyor mu?</span>
                </label>
                
                <div className="flex items-center gap-2 ml-4">
                    <span>Süre (dk):</span>
                    <input type="number" className="border p-1 rounded w-20" value={duration} onChange={e => setDuration(e.target.value)} />
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded border border-blue-100">
                <h3 className="font-semibold mb-2">Checklist</h3>
                <div className="flex gap-4">
                    <label><input type="checkbox" name="onamFormu" checked={checklist.onamFormu} onChange={handleChecklistChange} /> Onam Formu</label>
                    <label><input type="checkbox" name="kanTahlili" checked={checklist.kanTahlili} onChange={handleChecklistChange} /> Kan Tahlili</label>
                    <label><input type="checkbox" name="aclikDurumu" checked={checklist.aclikDurumu} onChange={handleChecklistChange} /> Açlık Durumu</label>
                </div>
            </div>

            <textarea placeholder="Ek Notlar (İlaç alerjisi vb.)" className="border p-2 rounded w-full h-24" value={notes} onChange={e => setNotes(e.target.value)}></textarea>

            <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition">
                RANDEVUYU OLUŞTUR
            </button>
        </form>
      </div>
    </div>
  );
}

export default App;