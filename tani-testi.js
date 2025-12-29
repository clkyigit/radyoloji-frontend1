const { google } = require('googleapis');

// Senin paylaştığın ham anahtar
const RAW_KEY = "-----BEGIN PRIVATE KEY-----\\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDmgtUvqOC3lRFK\\nNOOMgHKPb8wkzevhzeuyI4udTgtAQUUstclGqKrGJNwwZep1H8ZzTYSxqYP0z7q+\\n1/pjI/qAatWnwieHpGqyrrwDBswuQK+mU6G+WnNcYpQLyb+QgsL20hP8cfMcP5y+\\nnaeKdRhIo04PJS9bRHBuc3UfW8lIYE5/DMDRsGgGg16WUvShZfqxl78Zvy08qYJz\\npWw26y4YtEAC33qIyYwwIsNb8QW6gsWvbdv58bJgiNRnnnPk7JQpYqBqvSwSkgSe\\nFf4HLvtzwIIfly5xaI+ZlAb3Bm7qWRoLGDHTn5Byae54bv8eHglkRvQVUESe6qdA\\n8r4xAGXVAgMBAAECgf9qR5MDgARgXC/pZM6Wm29HkOZkM+K4ubjHlDWPOA6zqyAg\\nMFtQHy/zK6UmzZJl1I2AiwF4pFH3MBQUx7MINg50JxIoLVP7cg7zD0gX2N/TyN0z\\nqDmNCnx7RrP7qlYoqMw7eEtpZlOoQ6wbA7eZjewTTVpBTA5v/Z4dTskxko8y+WVV\\nb6TmQjULteGjjwp+brrcaFjOmNR0N5Ixx5VDaWFiCqFY6rVtTvkDfqHY+WpqJ4fE\\nKDcjVHX5VHy5VWJon4tnhhOKCeiU+eZ5+HxrWYq6QfPoSqVxvsoJss4DySXBKtfT\\nWKyuD++hbjtcuayGwtUrffx0dK20ZSSxLS5GBzECgYEA+8zruy9n0KEskuA4FYZG\\n6dWb662nQL/KH+1Rw2P6Ac+t43R27nCMQ2gH1JI49QtZFpPQwdecxN01q48K0s4J\\nj0Q0YpAeK1bADKnNKZj/jEep9sEu3yJvVFsOP6fJE8IwlC9jOrnEys5ghln9oiIb\\n709Zub8NBVPMWOsltXXek7kCgYEA6lsD70omF36tM+1lhkjeq7s5ei1j06brVOh3\\nkSmQax9DNL7RHDrneDtqbl7+/rTd5H1ilQxBaQ7yuozD+iOFpFH7iBwpM5XTYXbp\\n/JOOlmfgugDVJLh4wtXv44xsNqHfXVDG5PhNQRDFGJvlm+oTQJ7ixJwCeEaxeAFj\\nd/VPqP0CgYBDHycfqM1lwfEd3gNVSYwRvU1pD8tr6TQ6Oor3KOl2HiReY6dofDwH\\no+2ibrAcMkA3UoPtiEpT+Bvcda8O7rmBpU7Jj11bdC6RsZntIsnMXTYjfu+9r3I5\\n7GPp+BIT4EoO1mr/NpIM9eKpLcf8tlb3/hEPAKy55NKuSVCuBJOmkQKBgFm90Jvp\\nQPzuPVUNKzto3BvW7gOjLf72hFdXTbIAwJTEu++OwnSU+d5IolDxf6P5jp7YhM+e\\nic25M6nMDZ/TynFKE4/jeMOQNAm2h5N4zbk6vgt8FiKhoVy6n8n7E9U311jcfc1g\\nZ/Tqfw8VY694yzaLoTq4oxl7uKnDnltpTL/hAoGBAOyERkEyKNjh1MOZuQlTsw3f\\nWo83Ospx+g7Ho1FuFVxsZzOC+a3nWnFhMJtQKgNzXGLsHDMvEyCWOmVDPufFJfGo\\nBvuu8fcsA/UlK60RmC2JKZj0dptU0naayHUPeY6/aB0ge3EPcOZ1W3AiKXinkqQ3\\nHX2k4WwCcgxp4bDQwBwq\\n-----END PRIVATE KEY-----";

console.log("---------------------------------------------------");
console.log("🔍 TANI TESTİ BAŞLIYOR...");
console.log("---------------------------------------------------");

// 1. Değişken Tipi Kontrolü
console.log("1. RAW_KEY Tipi:", typeof RAW_KEY);

// 2. Format Düzeltme Denemesi
const formattedKey = RAW_KEY.split(String.raw`\n`).join('\n');
console.log("2. Formatlanan Key Uzunluğu:", formattedKey.length);

// 3. İçerik Kontrolü (Başlangıcı doğru mu?)
const baslangicDogruMu = formattedKey.startsWith("-----BEGIN PRIVATE KEY-----");
console.log("3. Başlangıç Doğru mu?:", baslangicDogruMu ? "✅ EVET" : "❌ HAYIR");

// 4. İçerik Kontrolü (Bitişi doğru mu?)
// Not: Sondaki boşlukları temizleyip kontrol ediyoruz
const temizKey = formattedKey.trim();
const bitisDogruMu = temizKey.endsWith("-----END PRIVATE KEY-----");
console.log("4. Bitiş Doğru mu?:", bitisDogruMu ? "✅ EVET" : "❌ HAYIR");

console.log("---------------------------------------------------");
console.log("🔑 GOOGLE KÜTÜPHANESİNE GÖNDERİLİYOR...");

try {
    const auth = new google.auth.JWT(
        "randevu-bot@girisimselrad.iam.gserviceaccount.com",
        null,
        formattedKey, // Düzelttiğimiz anahtarı veriyoruz
        ['https://www.googleapis.com/auth/calendar']
    );

    console.log("✅ JWT Nesnesi Oluşturuldu.");
    console.log("Key ID (Varsa):", auth.keyId);
    console.log("Key Var mı?:", auth.key ? "✅ EVET (Dolu)" : "❌ HAYIR (Boş - Sorun Burada!)");

    // Yetki Testi
    auth.authorize().then(() => {
        console.log("🎉 SONUÇ: BAŞARILI! Bu anahtar çalışıyor.");
    }).catch(err => {
        console.error("💥 SONUÇ: YETKİ HATASI!");
        console.error("Hata Kodu:", err.code);
        console.error("Hata Detayı:", err.message);
    });

} catch (error) {
    console.error("💥 KRİTİK HATA:", error.message);
}