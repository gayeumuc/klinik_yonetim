# 📋 ANKA Danışmanlık — Kullanım Kılavuzu

> Bu kılavuz sistemi ilk kez açmak ve kullanmak için gereken her şeyi adım adım anlatır.

---

## 🚀 Sistemi Başlatma

Her kullanımdan önce **iki ayrı program** açılmalıdır: Backend (Django) ve Frontend (React).

### Terminal Nasıl Açılır?

**VS Code kullanıyorsanız (önerilen):**
- VS Code'da üst menüden **Terminal → New Terminal** seçin
- Açılan terminalde komutları yazın

**Veya:**
1. Klavyede **Windows tuşu + R** basın → `cmd` yazın → Enter

---

### 1. Adım — Backend'i Başlat

1. Terminal/CMD açın ve şu komutu yazın:

```
cd C:\Users\ÇİLEK\Desktop\klinik_yonetim
.venv\Scripts\python.exe manage.py runserver
```

2. Ekranda `Starting development server at http://127.0.0.1:8000/` yazısını görünce backend hazır demektir.
3. **Bu pencereyi kapatmayın.**

---

### 2. Adım — Frontend'i Başlat

1. **Yeni bir terminal** açın (1. terminali kapatmayın)
2. Şu komutları sırayla yazın:

```
cd C:\Users\ÇİLEK\Desktop\klinik_yonetim\frontend
npm start
```

3. Birkaç saniye sonra tarayıcı otomatik açılır ve sistem görünür.
4. **Bu pencereyi de kapatmayın.**

---

### 3. Adım — Sisteme Giriş

Sistem açıldığında iki farklı giriş sayfası vardır:

| Giriş Sayfası | Adres | Kimler İçin |
|---|---|---|
| **Psikolog Girişi** | http://localhost:3000/admin-giris | Psikolog ve yöneticiler |
| **Danışan Girişi** | http://localhost:3000/login | Yalnızca danışanlar |

> ⚠️ Psikolog hesabıyla danışan giriş sayfasına girilirse sistem uyarı verir ve doğru sayfaya yönlendirir.

---

## 📧 E-posta Ayarı (Danışanlara Otomatik Mail Gönderimi)

Yeni danışan eklendiğinde sisteme giriş bilgileri otomatik olarak danışanın e-postasına gönderilir. Bunun çalışması için Gmail uygulama şifresi gereklidir.

### Gmail Uygulama Şifresi Nasıl Alınır?

1. **https://myaccount.google.com/security** adresine gidin
2. **"2 Adımlı Doğrulama"** açık olmalıdır (açık değilse önce açın)
3. **https://myaccount.google.com/apppasswords** adresine gidin
4. **"Uygulama seçin"** → **Posta** seçin
5. **"Cihaz seçin"** → **Windows Bilgisayar** seçin
6. **"Oluştur"** butonuna tıklayın
7. Ekranda **16 haneli sarı bir şifre** görünecek (örn: `abcd efgh ijkl mnop`)

### Şifreyi Sisteme Girin

1. `klinik_yonetim` klasöründe `.env` dosyasını **Not Defteri** ile açın
2. Şu satırı bulun:
   ```
   EMAIL_HOST_PASSWORD=
   ```
3. Şifreyi **boşluksuz** olarak yapıştırın:
   ```
   EMAIL_HOST_PASSWORD=abcdefghijklmnop
   ```
4. Dosyayı kaydedin (Ctrl+S)
5. Backend penceresini kapatıp yeniden başlatın (1. Adım'ı tekrarlayın)

> ✅ Artık yeni danışan eklediğinizde e-posta otomatik gönderilir.
>
> ⚠️ Şifre girilmezse sistem çalışmaya devam eder, ancak e-posta gönderilmez.

---

## 👥 Danışan Yönetimi

### Yeni Danışan Ekleme

1. Sol menüden **"Danışanlar"** seçin
2. Sağ üstteki **"+ Yeni Danışan Ekle"** butonuna tıklayın
3. Formu doldurun (e-posta zorunludur, şifre boş bırakılırsa otomatik oluşturulur)
4. **"Kaydet"** butonuna tıklayın
5. Danışana giriş bilgileri e-posta ile gönderilir

### Danışan Silme

Danışan listesinde her danışanın yanında iki silme seçeneği vardır:

| Buton | Ne Yapar |
|---|---|
| **⏸ Pasife Al** (turuncu) | Danışan sisteme giremez, verileri korunur. Geri alınabilir. |
| **🗑 Sil** (kırmızı) | Danışan ve tüm verileri **kalıcı olarak** silinir. Geri alınamaz! |

> 💡 Genellikle **Pasife Al** kullanmanız önerilir. Kalıcı silme yalnızca gerçekten gerektiğinde kullanın.

---

## 🔑 Şifre İşlemleri

### Psikolog Olarak Danışan Şifresini Sıfırlama

Danışan şifresini unutursa psikolog sıfırlayabilir:

1. Danışan listesinden danışanı seçin
2. Danışan detay sayfasında **"Şifre Sıfırla"** butonuna tıklayın
3. Yeni şifre otomatik oluşturulur ve danışanın e-postasına gönderilir

### Danışan Olarak Kendi Şifresini Değiştirme

Danışanlar kendi şifrelerini değiştirebilir:

1. Danışan paneline giriş yapın (http://localhost:3000/login)
2. Sol menüden **"🔑 Şifre Değiştir"** seçin
3. Mevcut şifreyi ve yeni şifreyi girin
4. **"Şifreyi Güncelle"** butonuna tıklayın

---

## 🆕 Son Güncellemeler (v2)

### Mesajlaşma
- Psikolog panelinde artık **pasif danışanlarla** olan mesajlar da görünür
- Mesaj listesi aktif/arşiv olarak filtrelenebilir

### Randevu Yönetimi
- **Yeni Randevu** formunda hızlı tarih seçenekleri eklendi (Bugün 09:00, Yarın 10:00 vb.)
- Başlangıç saati seçilince bitiş saati otomatik 1 saat sonraya ayarlanır
- **Tamamlanan randevulara** da klinik not eklenebilir (randevu detayından)
- Not türleri: Genel Not, Klinik Gözlem, Ödev/Görev, Takip Notu, Risk Değerlendirmesi

### Seans Notları
- Yeni not oluştururken **tarih otomatik bugüne** ayarlanır
- Hızlı tarih seçenekleri: Bugün, Dün, 2 Gün Önce, 3 Gün Önce

### Ödev Yönetimi
- Ödevler artık **düzenlenebilir** (✏️ Düzenle butonu)
- Son tarih için hızlı seçenekler: +3 Gün, +1 Hafta, +2 Hafta, +1 Ay
- Danışan panelinde ödev tamamlarken **tamamlama notu** eklenebilir

---

## ❓ Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
|---|---|
| Sayfa açılmıyor | Backend ve frontend pencerelerinin açık olduğunu kontrol edin |
| "Bağlantı hatası" | Backend penceresinde hata var mı kontrol edin |
| E-posta gitmiyor | `.env` dosyasında `EMAIL_HOST_PASSWORD` dolu mu kontrol edin |
| Şifre unutuldu (psikolog) | Backend penceresinde `python manage.py changepassword email@adres.com` yazın |
| Danışan giriş yapamıyor | Danışanın "Aktif" durumda olduğunu kontrol edin |

---

## 📞 Teknik Destek

Çözülemeyen bir sorunla karşılaşırsanız backend penceresindeki hata mesajını not alın ve geliştiricinize iletin.