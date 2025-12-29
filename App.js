import React, { useState, useEffect } from 'react';
import { 
  Calendar, User, Activity, Search, Plus, X, 
  Check, Trash2, LayoutDashboard, CalendarDays, Users, 
  Settings, Shield, MonitorPlay, AlertCircle, LogOut,
  ChevronLeft, ChevronRight, Clock, ClipboardList, MinusCircle, Syringe, Lock, Key,
  ToggleLeft, ToggleRight, ListPlus, Cloud, UserCog, Database, Wifi, WifiOff
} from 'lucide-react';

// --- ENTEGRASYON KÜTÜPHANELERİ ---
import { supabase } from './supabaseClient'; 
import { gapi } from 'gapi-script';

// --- AYARLAR ---
const APP_CONFIG = {
  useSupabase: true, // Supabase Veritabanı
  useGoogleCalendar: true // Google Takvim
};

// --- GOOGLE CALENDAR AYARLARI ---
const CALENDAR_CONFIG = {
  clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
  apiKey: process.env.REACT_APP_GOOGLE_API_KEY,
  scope: "https://www.googleapis.com/auth/calendar.events",
  discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
};

// --- YARDIMCI FONKSİYONLAR ---
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
};

// --- GOOGLE CALENDAR İŞLEVİ ---
const addEventToGoogleCalendar = async (appointment) => {
  if (!gapi.client) return false;
  
  const event = {
    summary: `${appointment.patientName} - ${appointment.procedure}`,
    location: appointment.room,
    description: `TC: ${appointment.tc}\nProtokol: ${appointment.patientId || '-'}\nNot: ${appointment.notes || ''}\nAnestezi: ${appointment.anesthesia ? 'VAR' : 'Yok'}`,
    start: { dateTime: `${appointment.date}T09:00:00`, timeZone: 'Europe/Istanbul' }, 
    end: { dateTime: `${appointment.date}T10:00:00`, timeZone: 'Europe/Istanbul' }
  };

  try {
    await gapi.client.calendar.events.insert({ 'calendarId': 'primary', 'resource': event });
    console.log("✅ Google Takvim senkronizasyonu başarılı.");
    return true;
  } catch (error) {
    console.error("❌ Google Takvim Hatası:", error);
    return false;
  }
};

// --- BAŞLANGIÇ VERİLERİ ---
const initialProcedures = {
  "I. Tanısal Girişimsel Radyoloji": [
    { name: "Diagnostik anjiyografi", duration: 45 },
    { name: "Serebral DSA", duration: 60 },
    { name: "Periferik arteriyografi", duration: 45 },
    { name: "Venografi", duration: 45 },
    { name: "Pulmoner anjiyografi", duration: 60 },
    { name: "Böbrek biyopsisi", duration: 30 },
    { name: "Karaciğer biyopsisi", duration: 30 },
    { name: "Akciğer biyopsisi", duration: 45 },
    { name: "Tiroid biyopsisi", duration: 20 },
    { name: "Meme biyopsisi", duration: 30 },
    { name: "Diagnostik ponksiyonlar", duration: 30 }
  ],
  "II. Tedavisel Girişimsel Radyoloji": [
    { name: "Mekanik trombektomi", duration: 120 },
    { name: "Anevrizma embolizasyonu", duration: 180 },
    { name: "AVM / AVF embolizasyonu", duration: 180 },
    { name: "Karotis arter stentleme", duration: 90 },
    { name: "Periferik arter stentleme", duration: 90 },
    { name: "TACE", duration: 90 },
    { name: "TARE", duration: 120 },
    { name: "Radyofrekans ablasyon", duration: 60 },
    { name: "Mikrodalga ablasyon", duration: 60 },
    { name: "Vertebroplasti / Kifoplasti", duration: 60 },
    { name: "Abse / Asit / Plevral drenaj", duration: 45 },
    { name: "Perkütan safra drenajı", duration: 60 },
    { name: "Nefrostomi", duration: 45 },
    { name: "Kalıcı port / PICC line", duration: 30 },
    { name: "Perkütan gastrostomi (PEG)", duration: 45 }
  ]
};

const defaultUsers = [
  { id: 1, name: "Dr. Ümit Belet", username: "umit.belet", password: "ub5337693672", role: "Girişimsel Radyolog", short: "DR" },
  { id: 2, name: "Hem. Ayşe Demir", username: "hemsire", password: "123", role: "Anjiyo Hemşiresi", short: "HE" },
  { id: 3, name: "Tek. Mehmet Can", username: "tek", password: "123", role: "Radyoloji Teknisyeni", short: "TE" }
];

const defaultSettings = {
  showProtocolNo: true,
  showAnesthesia: true,
  showChecklist: true,
  checklistItems: [
    "Onam Formu İmzalandı mı?",
    "Açlık Durumu Uygun mu?",
    "Kreatinin / Böbrek Fonk. Kontrolü",
    "INR / Kan Sulandırıcı Kontrolü",
    "Kontrast Alerjisi Sorgulandı mı?",
    "Eski Görüntüler İncelendi mi?"
  ]
};

// --- BİLEŞENLER ---
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-center justify-between hover:shadow-lg transition-shadow duration-300">
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-extrabold text-gray-800">{value}</h3>
    </div>
    <div className={`p-4 rounded-xl ${color} text-white shadow-sm ring-4 ring-opacity-20 ring-gray-100`}><Icon size={28} /></div>
  </div>
);

const LoginScreen = ({ onLogin, error }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-600 opacity-10 rounded-b-[50%] transform scale-150 -translate-y-20"></div>
          <div className="relative z-10">
            <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl p-3">
               <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" onError={(e) => {e.target.onerror = null; e.target.src="https://via.placeholder.com/150?text=LOGO"}} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">İzmir Şehir Hastanesi</h1>
            <p className="text-blue-400 font-medium text-sm mt-2 tracking-wide uppercase">Girişimsel Radyoloji Birimi</p>
          </div>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(username, password); }} className="p-8 space-y-6">
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Kullanıcı Adı</label><div className="relative group"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} /><input type="text" required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all duration-200 text-gray-700 font-medium" placeholder="Kullanıcı adınız" value={username} onChange={(e) => setUsername(e.target.value)}/></div></div>
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2 tracking-wider">Şifre</label><div className="relative group"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} /><input type="password" required className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all duration-200" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}/></div></div>
          {error && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl flex items-center gap-3 border border-red-100 animate-pulse"><AlertCircle size={18} className="shrink-0" /> {error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-200 active:scale-[0.98]">Sisteme Giriş Yap</button>
        </form>
      </div>
    </div>
  );
};

const AppointmentModal = ({ isOpen, onClose, onSubmit, data, onChange, onChecklistChange, onToggleAnesthesia, rooms, proceduresData, settings, isSyncing }) => {
  if (!isOpen) return null;
  let estimatedDuration = 0;
  if (data.procedure) { Object.values(proceduresData).forEach(list => { const found = list.find(p => p.name === data.procedure); if (found) estimatedDuration = found.duration; }); }

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-800 p-5 flex justify-between items-center text-white shrink-0">
          <div><h3 className="font-bold text-lg flex items-center gap-2"><Plus size={20} className="text-blue-400"/> İşlem Planla</h3><p className="text-xs text-slate-400 mt-0.5">Yeni bir randevu kaydı oluşturun</p></div>
          <button onClick={onClose} className="hover:bg-slate-700 p-2 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {settings.showProtocolNo && (<div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Hasta Protokol No</label><input type="text" name="patientId" value={data.patientId || ""} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-mono text-sm transition-all" placeholder="123456" /></div>)}
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">TC Kimlik</label><input required type="text" maxLength="11" name="tc" value={data.tc} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" placeholder="11 haneli" /></div>
             <div className={`${settings.showProtocolNo ? '' : 'sm:col-span-2 lg:col-span-1'}`}><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Hasta Adı</label><input required type="text" name="patientName" value={data.patientName} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all" placeholder="Ad Soyad" /></div>
          </div>
          <div>
            <div className="flex justify-between items-end mb-1.5"><label className="block text-xs font-bold text-gray-500 uppercase">İşlem Türü</label>{estimatedDuration > 0 && <span className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full"><Clock size={12}/> Süre: {estimatedDuration} dk</span>}</div>
            <select name="procedure" value={data.procedure} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm transition-all cursor-pointer">
              <option value="" disabled>Lütfen bir işlem seçiniz</option>
              {Object.entries(proceduresData).map(([category, items]) => (<optgroup key={category} label={category} className="font-bold text-slate-800">{items.map((item, idx) => (<option key={idx} value={item.name} className="text-gray-600 font-normal">{item.name} ({item.duration} dk)</option>))}</optgroup>))}
            </select>
          </div>
          {settings.showAnesthesia && (
            <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-xl border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors" onClick={onToggleAnesthesia}>
              <div className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${data.anesthesia ? 'bg-purple-600' : 'bg-gray-300'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${data.anesthesia ? 'translate-x-5' : ''}`}></div></div>
              <div className="flex items-center gap-2"><Syringe size={18} className={data.anesthesia ? "text-purple-600" : "text-gray-400"} /><span className={`text-sm font-bold ${data.anesthesia ? "text-purple-700" : "text-gray-500"}`}>Anestezi Gerekli {data.anesthesia ? "(Evet)" : "(Hayır)"}</span></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-5">
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Cihaz / Oda</label><select name="room" value={data.room} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm transition-all">{rooms.map(room => (<option key={room.id} value={room.name} disabled={room.status !== 'Aktif'}>{room.name} {room.status !== 'Aktif' ? '(Kullanılamaz)' : ''}</option>))}</select></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tarih</label><input required type="date" name="date" value={data.date} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all" />{data.date && (<p className="text-xs text-blue-600 mt-1 font-bold text-right">{formatDate(data.date)}</p>)}</div>
          </div>
          {settings.showChecklist && (
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100"><h4 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2"><ClipboardList size={18}/> Güvenlik Kontrol Listesi</h4><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{settings.checklistItems.map((item, idx) => (<label key={idx} className="flex items-center gap-3 text-xs font-medium text-gray-700 cursor-pointer hover:bg-orange-100 p-2 rounded-lg transition-colors select-none"><input type="checkbox" checked={data.checklist.includes(item)} onChange={() => onChecklistChange(item)} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500 border-gray-300"/>{item}</label>))}</div></div>
          )}
          <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Klinik Notlar</label><textarea name="notes" value={data.notes} onChange={onChange} rows="3" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-slate-500 outline-none text-sm transition-all resize-none" placeholder="Hastanın klinik durumu, özel notlar..."></textarea></div>
          <button type="submit" disabled={isSyncing} className="w-full bg-slate-800 text-white py-3.5 rounded-xl hover:bg-slate-900 transition-all duration-200 font-bold shadow-lg shadow-slate-200 flex justify-center items-center gap-2 active:scale-[0.98]">{isSyncing ? "Kaydediliyor..." : "Randevuyu Onayla"}{APP_CONFIG.useGoogleCalendar && <Cloud size={16} className="opacity-70"/>}</button>
        </form>
      </div>
    </div>
  );
};

export default function GirisimselRadyolojiSistemi() {
  const [currentUser, setCurrentUser] = useState(null); 
  const [loginError, setLoginError] = useState("");
  const [gapiInited, setGapiInited] = useState(false);
  const [dbStatus, setDbStatus] = useState("Bağlanıyor...");

  // --- LOCAL STORAGE & STATE (KALICI AYARLAR) ---
  const [systemSettings, setSystemSettings] = useState(() => {
    if (typeof localStorage === 'undefined') return defaultSettings;
    const saved = localStorage.getItem('systemSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  const [usersList, setUsersList] = useState(() => {
    if (typeof localStorage === 'undefined') return defaultUsers;
    const saved = localStorage.getItem('usersList');
    return saved ? JSON.parse(saved) : defaultUsers;
  });
  const [proceduresData, setProceduresData] = useState(() => {
    if (typeof localStorage === 'undefined') return initialProcedures;
    const saved = localStorage.getItem('proceduresData');
    return saved ? JSON.parse(saved) : initialProcedures;
  });
  const [rooms, setRooms] = useState(() => {
    if (typeof localStorage === 'undefined') return [
      { id: 1, name: "Anjiyografi Odası 1 (Biplane)", status: "Aktif" },
      { id: 2, name: "Anjiyografi Odası 2 (Biplane)", status: "Aktif" }
    ];
    const saved = localStorage.getItem('rooms');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: "Anjiyografi Odası 1 (Biplane)", status: "Aktif" },
      { id: 2, name: "Anjiyografi Odası 2 (Biplane)", status: "Aktif" }
    ];
  });
  
  // Randevuları LocalStorage'dan yükle (Yedek)
  const [appointments, setAppointments] = useState(() => {
    if (typeof localStorage === 'undefined') return [];
    const saved = localStorage.getItem('appointments');
    return saved ? JSON.parse(saved) : [];
  });

  // Local Storage Kayıt
  useEffect(() => localStorage.setItem('systemSettings', JSON.stringify(systemSettings)), [systemSettings]);
  useEffect(() => localStorage.setItem('usersList', JSON.stringify(usersList)), [usersList]);
  useEffect(() => localStorage.setItem('proceduresData', JSON.stringify(proceduresData)), [proceduresData]);
  useEffect(() => localStorage.setItem('rooms', JSON.stringify(rooms)), [rooms]);
  useEffect(() => localStorage.setItem('appointments', JSON.stringify(appointments)), [appointments]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // --- GOOGLE CALENDAR INIT ---
  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        apiKey: CALENDAR_CONFIG.apiKey,
        clientId: CALENDAR_CONFIG.clientId,
        discoveryDocs: CALENDAR_CONFIG.discoveryDocs,
        scope: CALENDAR_CONFIG.scope,
      }).then(() => {
        setGapiInited(true);
      }, (error) => console.error("GAPI Init Error:", error));
    };
    gapi.load('client:auth2', initClient);
  }, []);

  // --- SUPABASE VERİ OKUMA VE REALTIME ---
  useEffect(() => {
    if (!APP_CONFIG.useSupabase) {
      setDbStatus("Yerel Mod");
      return;
    }

    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('created_at', { ascending: true }); // DÜZELTME: created_at sütunu kullanıldı
        
        if (error) {
            console.error("Supabase Veri Çekme Hatası:", error);
            setDbStatus("Veritabanı Hatası");
        } else {
            setAppointments(data || []);
            setDbStatus("Çevrimiçi");
        }
      } catch (error) {
        console.error("Beklenmeyen Hata:", error);
        setDbStatus("Bağlantı Hatası");
      }
    };
    
    fetchAppointments();

    const channel = supabase
      .channel('realtime appointments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        fetchAppointments(); 
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };

  }, []);

  const [showModal, setShowModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all"); 
  
  const [newProcedureName, setNewProcedureName] = useState("");
  const [newProcedureDuration, setNewProcedureDuration] = useState(30);
  const [targetCategory, setTargetCategory] = useState("I. Tanısal Girişimsel Radyoloji");
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "", role: "Radyoloji Teknisyeni" });
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [newAppointment, setNewAppointment] = useState({
    patientId: "", patientName: "", tc: "", procedure: "", room: rooms[0].name, date: "", notes: "", checklist: [], anesthesia: false
  });

  const handleLogin = (username, password) => {
    const user = usersList.find(u => u.username === username && u.password === password);
    if (user) { setCurrentUser(user); setLoginError(""); } else { setLoginError("Hatalı kullanıcı adı veya şifre!"); }
  };
  const handleLogout = () => { setCurrentUser(null); setLoginError(""); setActiveTab('dashboard'); };
  const googleLogin = async () => {
    if (gapiInited) {
        const auth = gapi.auth2.getAuthInstance();
        await auth.signIn();
        alert("Google ile giriş başarılı! Takvim senkronizasyonu aktif.");
    }
  };

  if (!currentUser) return <LoginScreen onLogin={handleLogin} error={loginError} />;
  
  const isDoctor = currentUser.role === "Girişimsel Radyolog";
  // --- ADMIN KONTROLÜ ---
  const isAdmin = currentUser.username === "umit.belet"; // Sadece Ümit Belet admin olabilir

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === "Tamamlandı").length,
    pending: appointments.filter(a => a.status === "Bekliyor").length,
    today: appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length
  };

  // Handlers
  const handleUpdatePassword = (e) => { e.preventDefault(); if (!newPassword) return; setUsersList(prev => prev.map(u => u.id === currentUser.id ? { ...u, password: newPassword } : u)); setCurrentUser(prev => ({ ...prev, password: newPassword })); alert("Şifreniz başarıyla güncellendi."); setNewPassword(""); };
  const toggleSetting = (key) => setSystemSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const addChecklistItem = (e) => { e.preventDefault(); if (!newChecklistItem.trim()) return; setSystemSettings(prev => ({ ...prev, checklistItems: [...prev.checklistItems, newChecklistItem] })); setNewChecklistItem(""); };
  const removeChecklistItem = (itemToRemove) => { setSystemSettings(prev => ({ ...prev, checklistItems: prev.checklistItems.filter(item => item !== itemToRemove) })); };
  const handleAddProcedure = (e) => { e.preventDefault(); if (!newProcedureName.trim()) return; const newProc = { name: newProcedureName, duration: parseInt(newProcedureDuration) || 30 }; setProceduresData(prev => ({ ...prev, [targetCategory]: [...prev[targetCategory], newProc] })); setNewProcedureName(""); setNewProcedureDuration(30); };
  const handleRemoveProcedure = (category, procName) => { if (window.confirm(`${procName} işlemini silmek istediğinize emin misiniz?`)) { setProceduresData(prev => ({ ...prev, [category]: prev[category].filter(p => p.name !== procName) })); } };
  const handleUpdateDuration = (category, procName, newDuration) => { setProceduresData(prev => ({ ...prev, [category]: prev[category].map(p => p.name === procName ? { ...p, duration: parseInt(newDuration) } : p) })); };
  
  // DÜZELTME: Sadece Hemşire ve Teknisyen eklenebilir, Radyolog eklenemez (Tek Admin)
  const handleAddUser = (e) => { 
      e.preventDefault(); 
      if(!newUser.name || !newUser.username || !newUser.password) return; 
      if(usersList.some(u => u.username === newUser.username)) { alert("Kullanıcı adı kullanımda!"); return; } 
      
      const shortCode = newUser.role === "Anjiyo Hemşiresi" ? "HE" : "TE"; 
      setUsersList([...usersList, { id: Date.now(), ...newUser, short: shortCode }]); 
      setNewUser({ name: "", username: "", password: "", role: "Radyoloji Teknisyeni" }); 
  };
  
  const handleInputChange = (e) => setNewAppointment(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleChecklistChange = (item) => { setNewAppointment(prev => { const exists = prev.checklist.includes(item); return { ...prev, checklist: exists ? prev.checklist.filter(i => i !== item) : [...prev.checklist, item] }; }); };
  const handleToggleAnesthesia = () => setNewAppointment(prev => ({ ...prev, anesthesia: !prev.anesthesia }));

  // --- SUBMIT HANDLER (SUPABASE) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSyncing(true);
    let duration = 30;
    if (newAppointment.procedure) { Object.values(proceduresData).forEach(list => { const found = list.find(p => p.name === newAppointment.procedure); if (found) duration = found.duration; }); }
    
    // DÜZELTME: created_at sütun ismini kullan
    const appointmentData = { 
        ...newAppointment, 
        duration, 
        status: "Bekliyor",
        created_at: new Date().toISOString()
    };
    
    if(APP_CONFIG.useSupabase) {
        try { 
            const { error } = await supabase.from('appointments').insert([appointmentData]);
            if (error) throw error;

            if (APP_CONFIG.useGoogleCalendar && gapiInited) {
                const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
                if (!isSignedIn) await gapi.auth2.getAuthInstance().signIn();
                await addEventToGoogleCalendar(appointmentData);
            }

            setShowModal(false);
            setNewAppointment({ patientId: "", patientName: "", tc: "", procedure: "", room: rooms[0].name, date: "", notes: "", checklist: [], anesthesia: false });

        } catch(err) { 
            console.error("Supabase Yazma Hatası:", err);
            alert("Kayıt sırasında hata oluştu: " + err.message);
        }
    } else {
       // Supabase kapalıysa local state
       setAppointments(prev => [...prev, {id: Date.now(), ...appointmentData}]);
       setShowModal(false);
    }
    setIsSyncing(false);
  };

  // --- DELETE HANDLER (SUPABASE) ---
  const handleDelete = async (id) => { 
      if (!isDoctor) return; // Doktorlar silebilir
      if (window.confirm("Silmek istediğinize emin misiniz?")) {
          if(APP_CONFIG.useSupabase) {
               try { 
                   const { error } = await supabase.from('appointments').delete().eq('id', id);
                   if (error) throw error;
               } catch(err) { console.error("Silme Hatası:", err); }
          } else {
               setAppointments(prev => prev.filter(a => a.id !== id));
          }
      }
  };

  // --- UPDATE HANDLER (SUPABASE) ---
  const handleStatusChange = async (id, newStatus) => { 
      if (!isDoctor) return; // Doktorlar güncelleyebilir
      if(APP_CONFIG.useSupabase) {
          try { 
              const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
              if (error) throw error;
          } catch(err) { console.error("Güncelleme Hatası:", err); }
      } else {
          setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      }
  };

  const toggleRoomStatus = (id) => { if (!isAdmin) return; setRooms(prev => prev.map(room => room.id === id ? { ...room, status: room.status === "Aktif" ? "Bakımda" : "Aktif" } : room)); };

  const filteredAppointments = appointments.filter(app => {
    const term = searchTerm.toLowerCase();
    const matchGeneral = app.patientName.toLowerCase().includes(term) || app.tc.includes(term) || (app.patientId && app.patientId.includes(term)) || app.procedure.toLowerCase().includes(term);
    if (searchType === 'patient') return app.patientName.toLowerCase().includes(term) || app.tc.includes(term) || (app.patientId && app.patientId.includes(term));
    if (searchType === 'procedure') return app.procedure.toLowerCase().includes(term);
    return matchGeneral;
  });

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => { const day = new Date(year, month, 1).getDay(); return day === 0 ? 6 : day - 1; };
  const changeMonth = (offset) => { const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset)); setCurrentDate(new Date(newDate)); };
  const formatDateString = (year, month, day) => { const m = month + 1 < 10 ? `0${month + 1}` : month + 1; const d = day < 10 ? `0${day}` : day; return `${year}-${m}-${d}`; };
  const getAppointmentsForDate = (dateStr) => appointments.filter(app => app.date === dateStr);

  const CalendarView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-10 bg-transparent"></div>);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateString(year, month, d);
      const dayApps = getAppointmentsForDate(dateStr);
      const isSelected = selectedDate === dateStr;
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const hasApps = dayApps.length > 0;
      const hasAnesthesia = dayApps.some(a => a.anesthesia);
      days.push(
        <div key={d} onClick={() => setSelectedDate(dateStr)} className={`h-10 w-10 flex flex-col items-center justify-center rounded-full cursor-pointer transition-all mx-auto ${isSelected ? 'bg-blue-600 text-white shadow-md scale-110' : 'hover:bg-gray-100 text-gray-700'} ${isToday && !isSelected ? 'border border-blue-600 font-bold text-blue-600' : ''}`}>
          <span className="text-sm font-medium leading-none">{d}</span>
          {hasApps && <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : hasAnesthesia ? 'bg-purple-500' : 'bg-orange-500'}`}></span>}
        </div>
      );
    }
    const selectedApps = getAppointmentsForDate(selectedDate);
    const prettyDate = new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });

    return (
      <div className="flex flex-col xl:flex-row gap-8 animate-fade-in h-auto min-h-[600px]">
        {/* SOL TAKVİM */}
        <div className="xl:w-80 flex-shrink-0 bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col h-fit">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20}/></button>
            <h2 className="text-base font-bold text-gray-800 capitalize">{currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20}/></button>
          </div>
          <div className="grid grid-cols-7 text-center mb-2">{['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pa'].map(day => <div key={day} className="text-xs font-bold text-gray-400 uppercase">{day}</div>)}</div>
          <div className="grid grid-cols-7 gap-y-2">{days}</div>
          <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
             <div className="flex items-center gap-2 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Anestezi Gerektiren</div>
             <div className="flex items-center gap-2 text-xs text-gray-500"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Standart İşlem</div>
             <button onClick={() => {setCurrentDate(new Date()); setSelectedDate(new Date().toISOString().split('T')[0])}} className="w-full py-2.5 text-sm text-blue-600 font-bold bg-blue-50 rounded-xl hover:bg-blue-100 transition mt-2">Bugüne Git</button>
          </div>
        </div>
        
        {/* SAĞ LİSTE */}
        <div className="flex-grow flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-200 p-6 flex justify-between items-center sticky top-0 z-10">
             <div><h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><Calendar size={28} className="text-blue-600"/> Günlük Ajanda</h3><p className="text-slate-500 font-medium mt-1">{prettyDate}</p></div>
             {/* DÜZELTME: isDoctor kullanıldı, sadece Ümit Bey değil diğer doktorlar da ekleyebilsin */}
             {isDoctor && <button onClick={() => {setNewAppointment(prev => ({...prev, date: selectedDate})); setShowModal(true)}} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-bold shadow-md shadow-blue-200"><Plus size={18}/> Randevu Ekle</button>}
          </div>
          <div className="flex-grow overflow-y-auto p-6 bg-slate-50/50">
            {selectedApps.length > 0 ? (
              <div className="space-y-4 max-w-4xl mx-auto">
                 {selectedApps.map((app, index) => (
                   <div key={app.id} className={`bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-all duration-300 group relative overflow-hidden ${app.anesthesia ? 'border-purple-200 bg-purple-50/30' : 'border-gray-100'}`}>
                     {app.anesthesia && <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10 flex items-center gap-1"><Syringe size={10} /> Anestezi</div>}
                     <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${app.status === 'Tamamlandı' ? 'bg-emerald-500' : app.status === 'İptal' ? 'bg-red-500' : 'bg-orange-500'}`}></div>
                     <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pl-3">
                       <div>
                         <div className="flex items-center gap-3 mb-1">
                           <span className="text-lg font-bold text-gray-800">{app.patientName}</span>
                           {app.patientId && <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded font-mono border border-blue-100">Prot: {app.patientId}</span>}
                           <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded font-mono">{app.tc}</span>
                         </div>
                         <p className="text-blue-700 font-medium mb-2">{app.procedure}</p>
                         <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                           <div className="flex items-center gap-1"><MonitorPlay size={14}/> {app.room}</div>
                           <div className="flex items-center gap-1"><Clock size={14}/> {app.duration || 30} dk</div>
                           <div className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${app.status === 'Tamamlandı' ? 'bg-emerald-500' : app.status === 'İptal' ? 'bg-red-500' : 'bg-orange-500'}`}></div> {app.status}</div>
                         </div>
                       </div>
                       <div className="flex flex-col items-end gap-2 pt-4 sm:pt-0">
                          {app.checklist && app.checklist.length > 0 && <div className="flex gap-1 mb-1">{app.checklist.length === systemSettings.checklistItems.length ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Tüm Kontroller Tamam</span> : <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">{app.checklist.length} Kontrol Yapıldı</span>}</div>}
                          {isDoctor && <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleDelete(app.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition" title="Sil"><Trash2 size={18}/></button></div>}
                       </div>
                     </div>
                     {app.notes && <div className="mt-3 pl-3 pt-3 border-t border-gray-50 text-sm text-gray-500 italic flex gap-2"><span className="font-bold not-italic text-gray-400">Not:</span> {app.notes}</div>}
                   </div>
                 ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-12">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4"><CalendarDays size={64} className="text-slate-200"/></div>
                <h4 className="text-xl font-bold text-gray-600 mb-2">Planlanmış İşlem Yok</h4>
                <p className="max-w-xs mx-auto text-sm">Seçili tarihte ({prettyDate}) herhangi bir girişimsel radyoloji işlemi bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // (UI Kodu aynı devam eder)
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-gray-800">
      <header className="bg-slate-900 shadow-xl border-b border-slate-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-xl h-10 w-10 flex items-center justify-center shadow-lg overflow-hidden">
              <img 
                src="/logo.png" 
                alt="İzmir Şehir Hastanesi Logo" 
                className="h-full w-full object-contain"
                onError={(e) => {e.target.onerror = null; e.target.src="https://via.placeholder.com/150?text=LOGO"}} 
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-tight">İzmir Şehir Hastanesi <br/><span className="text-blue-400 font-normal text-sm block -mt-0.5">Girişimsel Radyoloji</span></h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {/* VERİTABANI DURUM GÖSTERGESİ */}
             <div className="flex items-center gap-2 px-3 py-1 rounded bg-slate-800 border border-slate-700 hidden sm:flex">
               {dbStatus.includes("Çevrimiçi") ? <Database size={14} className="text-green-500" /> : <WifiOff size={14} className="text-red-500 animate-pulse" />}
               <span className={`text-xs ${dbStatus.includes("Çevrimiçi") ? "text-green-500" : "text-red-500"}`}>{dbStatus}</span>
             </div>
             <div className="flex flex-col items-end mr-2 hidden sm:flex"><span className="text-sm text-white font-bold">{currentUser.name}</span><span className="text-xs text-gray-400">{currentUser.role}</span></div>
            <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center text-blue-400 font-bold border border-slate-600 shadow-inner ring-2 ring-slate-700">{currentUser.short}</div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-full transition" title="Çıkış Yap"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* NAVIGASYON (Kısaltıldı, orijinal koddan aynen alınabilir) */}
        <div className="mb-8 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2 pb-1 min-w-max">
            {[ { id: 'dashboard', icon: LayoutDashboard, label: 'Genel Bakış' }, { id: 'calendar', icon: Calendar, label: 'Takvim & Ajanda' }, { id: 'appointments', icon: CalendarDays, label: 'Liste Görünümü' }, { id: 'settings', icon: UserCog, label: 'Ayarlar' }, ...(isAdmin ? [{ id: 'admin', icon: Settings, label: 'Yönetici Paneli' }] : []) ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-t-lg text-sm font-bold transition-all duration-200 ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'}`}><tab.icon size={18} /> {tab.label}</button>
            ))}
          </div>
        </div>
        
        {/* --- SETTINGS TAB (GOOGLE GİRİŞ BUTONU EKLENDİ) --- */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
             <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 flex flex-col sm:flex-row items-center gap-8">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 text-3xl font-bold shadow-inner border border-slate-200">{currentUser.short}</div>
                <div className="text-center sm:text-left"><h2 className="text-3xl font-bold text-slate-800">{currentUser.name}</h2><p className="text-slate-500 font-medium text-lg">{currentUser.role}</p><p className="text-sm text-slate-400 mt-2 bg-slate-50 inline-block px-3 py-1 rounded-full border border-slate-100">Kullanıcı Adı: <span className="font-mono text-slate-600">{currentUser.username}</span></p></div>
             </div>

             {/* GOOGLE TAKVİM ENTEGRASYON KARTI */}
             <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
               <h3 className="font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2"><Clock size={20} className="text-blue-600"/> Takvim Entegrasyonu</h3>
               <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex justify-between items-center">
                 <div>
                   <h4 className="font-bold text-blue-800 mb-1">Google Takvim Bağlantısı</h4>
                   <p className="text-sm text-blue-600">Randevuları kişisel takviminizle eşleştirmek için giriş yapın.</p>
                 </div>
                 <button onClick={googleLogin} className="bg-white text-blue-600 border border-blue-200 px-6 py-2 rounded-lg font-bold hover:bg-blue-100 transition shadow-sm flex items-center gap-2">
                   <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4"/> Google ile Bağlan
                 </button>
               </div>
             </div>

             <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
               <h3 className="font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2"><Lock size={20} className="text-red-600"/> Hesap Güvenliği</h3>
               <div className="bg-red-50 p-6 rounded-xl border border-red-100 max-w-xl"><h4 className="text-sm font-bold text-red-800 uppercase mb-4 tracking-wider">Şifremi Güncelle</h4><form onSubmit={handleUpdatePassword} className="space-y-4"><div><label className="block text-xs font-bold text-red-700 mb-2 ml-1">Yeni Şifre</label><div className="relative"><Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="password" placeholder="En az 6 karakter" required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all bg-white" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/></div></div><button type="submit" className="bg-red-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition-all shadow-md shadow-red-200 active:scale-[0.98]">Şifreyi Değiştir</button></form></div>
             </div>
          </div>
        )}

        {/* --- DİĞER SEKME İÇERİKLERİ --- */}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'appointments' && (/* Liste Kodu */ <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 animate-fade-in"><div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8"><h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3"><Users size={28} className="text-blue-600" /> Girişimsel İşlem Listesi</h2><div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto bg-gray-50 p-2 rounded-xl border border-gray-100"><div className="flex items-center gap-2 px-3 text-gray-400"><Search size={20} /></div><div className="flex rounded-lg bg-white shadow-sm overflow-hidden border border-gray-200"><button onClick={() => setSearchType('all')} className={`px-4 py-2 text-xs font-bold transition ${searchType === 'all' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>TÜMÜ</button><button onClick={() => setSearchType('patient')} className={`px-4 py-2 text-xs font-bold transition ${searchType === 'patient' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>HASTA</button><button onClick={() => setSearchType('procedure')} className={`px-4 py-2 text-xs font-bold transition ${searchType === 'procedure' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>İŞLEM</button></div><input type="text" placeholder={searchType === 'patient' ? "İsim, TC veya Hasta No..." : searchType === 'procedure' ? "İşlem adı..." : "Ara..."} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 text-sm"/>{isDoctor && <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap text-sm font-bold shadow-md active:scale-[0.98]"><Plus size={18} /> Yeni Kayıt</button>}</div></div><div className="overflow-x-auto rounded-xl border border-gray-200"><table className="w-full text-left border-collapse min-w-[800px]"><thead className="bg-gray-50 text-gray-600 text-xs font-bold uppercase tracking-wider border-b border-gray-200"><tr><th className="p-5">Hasta Bilgileri</th><th className="p-5">Yapılacak İşlem</th><th className="p-5">Oda</th><th className="p-5">Tarih</th><th className="p-5">Notlar</th><th className="p-5">Durum</th>{isDoctor && <th className="p-5 text-right">Aksiyon</th>}</tr></thead><tbody className="divide-y divide-gray-100 text-sm">{filteredAppointments.length > 0 ? (filteredAppointments.map(app => (<tr key={app.id} className={`hover:bg-blue-50/50 transition-colors group bg-white ${app.anesthesia ? 'bg-purple-50/30' : ''}`}><td className="p-5"><div className="font-bold text-gray-900 text-base">{app.patientName}</div>{app.patientId && <div className="text-xs text-blue-600 bg-blue-50 inline-block px-1.5 py-0.5 rounded border border-blue-100 mt-1 font-mono">Prot: {app.patientId}</div>}<div className="text-gray-400 text-xs mt-0.5">{app.tc}</div></td><td className="p-5"><span className={`px-3 py-1 rounded-lg text-xs font-bold border ${app.anesthesia ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>{app.procedure}</span>{app.anesthesia && <span className="block text-[10px] text-purple-600 mt-1.5 flex items-center gap-1 font-semibold"><Syringe size={12}/> Anestezi</span>}</td><td className="p-5 text-gray-600 text-xs font-medium"><div className="font-semibold text-gray-700">{app.room}</div><div className="flex items-center gap-1 mt-1 text-gray-500 bg-gray-50 px-2 py-0.5 rounded w-fit"><Clock size={12}/> {app.duration || 30} dk</div></td><td className="p-5 text-gray-600 font-medium"><div className="flex items-center gap-2"><Calendar size={16} className="text-gray-400" /> {formatDate(app.date)}</div></td><td className="p-5 text-gray-500 max-w-xs truncate italic" title={app.notes}>{app.notes || "-"}{app.checklist && app.checklist.length > 0 && <span className="block text-[10px] text-green-600 mt-1 flex items-center gap-1"><Check size={10}/> Güvenlik Kontrolü</span>}</td><td className="p-5"><select value={app.status} disabled={!isDoctor} onChange={(e) => handleStatusChange(app.id, e.target.value)} className={`border-none text-xs font-bold px-3 py-1.5 rounded-full outline-none focus:ring-2 focus:ring-offset-1 transition appearance-none cursor-pointer ${app.status === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-700 focus:ring-emerald-500' : app.status === 'İptal' ? 'bg-red-100 text-red-700 focus:ring-red-500' : 'bg-orange-100 text-orange-700 focus:ring-orange-500'}`}><option value="Bekliyor">Bekliyor</option><option value="Tamamlandı">Tamamlandı</option><option value="İptal">İptal</option></select></td>{isDoctor && <td className="p-5 text-right"><button onClick={() => handleDelete(app.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Sil"><Trash2 size={18} /></button></td>}</tr>))) : (<tr><td colSpan="7" className="p-12 text-center text-gray-400 italic bg-gray-50">Aradığınız kriterlere uygun kayıt bulunamadı.</td></tr>)}</tbody></table></div>
          </div>
        )}

        {/* --- ADMIN TAB --- */}
        {activeTab === 'admin' && isAdmin && (/* Admin içeriği aynı */ <div className="animate-fade-in space-y-8"><div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl flex items-center justify-between"><div><h2 className="text-2xl font-bold flex items-center gap-3"><Shield size={28}/> Yönetici Kontrol Paneli</h2><p className="text-slate-400 mt-2 text-sm max-w-lg">Sistem parametrelerini, kullanıcı yetkilerini, işlem listelerini ve cihaz durumlarını buradan yönetebilirsiniz.</p></div><Settings className="text-slate-700 opacity-50 hidden sm:block" size={80} /></div><div className="grid grid-cols-1 lg:grid-cols-3 gap-8"><div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 lg:col-span-3"><h3 className="font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2 text-lg"><ListPlus size={20} className="text-blue-600"/> Randevu Ekranı Konfigürasyonu</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="space-y-4"><h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Görünürlük Ayarları</h4><div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100 transition-colors hover:bg-gray-100"><span className="text-sm font-medium text-gray-700">Hasta Protokol No</span><button onClick={() => toggleSetting('showProtocolNo')} className={`p-1 rounded-full transition-colors ${systemSettings.showProtocolNo ? 'text-green-600 bg-green-100' : 'text-gray-400 bg-gray-200'}`}>{systemSettings.showProtocolNo ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}</button></div><div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100 transition-colors hover:bg-gray-100"><span className="text-sm font-medium text-gray-700">Anestezi Seçeneği</span><button onClick={() => toggleSetting('showAnesthesia')} className={`p-1 rounded-full transition-colors ${systemSettings.showAnesthesia ? 'text-green-600 bg-green-100' : 'text-gray-400 bg-gray-200'}`}>{systemSettings.showAnesthesia ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}</button></div><div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100 transition-colors hover:bg-gray-100"><span className="text-sm font-medium text-gray-700">Güvenlik Listesi</span><button onClick={() => toggleSetting('showChecklist')} className={`p-1 rounded-full transition-colors ${systemSettings.showChecklist ? 'text-green-600 bg-green-100' : 'text-gray-400 bg-gray-200'}`}>{systemSettings.showChecklist ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}</button></div></div><div className="md:col-span-2"><h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Checklist Düzenleyici</h4><div className="bg-gray-50 p-5 rounded-xl border border-gray-100 h-full"><form onSubmit={addChecklistItem} className="flex gap-3 mb-4"><input type="text" placeholder="Yeni kontrol maddesi ekle..." className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)}/><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">Ekle</button></form><div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">{systemSettings.checklistItems.map((item, idx) => (<div key={idx} className="flex justify-between items-center bg-white px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 group hover:border-gray-300 transition-colors"><span>{item}</span><button onClick={() => removeChecklistItem(item)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-50 rounded"><MinusCircle size={16}/></button></div>))}</div></div></div></div></div><div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:col-span-2"><h3 className="font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2 text-lg"><Activity size={20} className="text-blue-600"/> Girişimsel İşlem Listesi Yönetimi</h3><form onSubmit={handleAddProcedure} className="flex flex-col sm:flex-row gap-4 mb-6 bg-slate-50 p-5 rounded-xl border border-slate-100"><div className="flex-[2]"><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Yeni İşlem Adı</label><input type="text" required placeholder="Örn: Splenik arter embolizasyonu" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newProcedureName} onChange={(e) => setNewProcedureName(e.target.value)}/></div><div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Süre (dk)</label><input type="number" required min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={newProcedureDuration} onChange={(e) => setNewProcedureDuration(e.target.value)}/></div><div className="flex-1"><label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Kategori</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={targetCategory} onChange={(e) => setTargetCategory(e.target.value)}>{Object.keys(proceduresData).map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-bold flex items-center justify-center gap-2 mt-auto h-[42px] transition-colors shadow-sm"><Plus size={18}/> Ekle</button></form><div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Object.entries(proceduresData).map(([category, items]) => (<div key={category} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm"><div className="bg-slate-100 px-4 py-3 font-bold text-xs text-slate-700 uppercase border-b border-gray-200">{category}</div><div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">{items.map((proc, idx) => (<div key={idx} className="flex justify-between items-center hover:bg-slate-50 p-2.5 rounded-lg text-sm text-gray-700 border border-transparent hover:border-slate-200 transition-all group"><span className="flex-1 font-medium">{proc.name}</span><div className="flex items-center gap-3"><div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-gray-200 text-xs text-gray-500"><Clock size={12}/><input type="number" className="w-8 bg-transparent outline-none text-right font-bold text-gray-700" value={proc.duration} onChange={(e) => handleUpdateDuration(category, proc.name, e.target.value)}/> dk</div><button onClick={() => handleRemoveProcedure(category, proc.name)} className="text-gray-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg" title="Listeden Çıkar"><MinusCircle size={16}/></button></div></div>))}</div></div>))}</div></div><div className="flex flex-col gap-8"><div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"><h3 className="font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2 text-lg"><Users size={20} className="text-green-600"/> Personel Yönetimi</h3><form onSubmit={handleAddUser} className="mb-6 space-y-4 bg-green-50/50 p-5 rounded-xl border border-green-100"><h4 className="text-xs font-bold text-green-800 uppercase mb-2">Yeni Kullanıcı Oluştur</h4><div className="space-y-3"><div><input type="text" placeholder="Ad Soyad" required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})}/></div><div className="grid grid-cols-2 gap-3"><input type="text" placeholder="Kullanıcı Adı" required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white" value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})}/><input type="text" placeholder="Şifre" required className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}/></div><div className="flex gap-3"><select className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none bg-white" value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}><option value="Girişimsel Radyolog">Girişimsel Radyolog</option><option value="Anjiyo Hemşiresi">Anjiyo Hemşiresi</option><option value="Radyoloji Teknisyeni">Radyoloji Teknisyeni</option></select><button type="submit" className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 text-sm font-bold shadow-sm transition-colors">Oluştur</button></div></div></form><div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">{usersList.map((user) => (<div key={user.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"><div className="flex flex-col"><span className="font-bold text-gray-800 text-sm">{user.name}</span><span className="text-xs text-gray-500">{user.role}</span><span className="text-[10px] text-gray-400 mt-0.5 bg-gray-50 px-1 rounded w-fit">@{user.username}</span></div><div className="flex items-center gap-2"><span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold border border-slate-200">{user.short}</span></div></div>))}</div></div><div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"><h3 className="font-bold text-gray-800 mb-6 border-b pb-4 flex items-center gap-2 text-lg"><MonitorPlay size={20} className="text-orange-600"/> Cihaz Kontrolü</h3><div className="flex flex-col gap-4">{rooms.map(room => (<div key={room.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-white hover:shadow-sm transition-all"><div className="flex items-center gap-3"><div className={`p-2.5 rounded-full ${room.status === 'Aktif' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}><Activity size={20} /></div><div><p className="font-bold text-gray-800 text-sm">{room.name}</p><p className="text-xs text-gray-500 mt-0.5">Durum: <span className="font-semibold">{room.status}</span></p></div></div><button onClick={() => toggleRoomStatus(room.id)} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all shadow-sm ${room.status === 'Aktif' ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50' : 'bg-green-600 text-white hover:bg-green-700'}`}>{room.status === 'Aktif' ? 'Bakıma Al' : 'Aktifleştir'}</button></div>))}</div></div></div></div></div>)}
      </main>

      <AppointmentModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        data={newAppointment}
        onChange={handleInputChange}
        onChecklistChange={handleChecklistChange}
        onToggleAnesthesia={handleToggleAnesthesia}
        rooms={rooms}
        proceduresData={proceduresData}
        settings={systemSettings}
        isSyncing={isSyncing}
      />
    </div>
  );
}