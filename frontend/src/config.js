/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║          MERKEZİ KLİNİK YAPILANDIRMA DOSYASI               ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  Bu uygulamayı farklı bir klinik için özelleştirmek         ║
 * ║  istiyorsanız YALNIZCA bu dosyayı düzenleyin.               ║
 * ║                                                              ║
 * ║  Değiştirmeniz gereken alanlar:                             ║
 * ║    - KLINIK_ADI        → Klinik/firma adı                  ║
 * ║    - KLINIK_SLOGAN     → Kısa tanıtım cümlesi              ║
 * ║    - PSIKOLOG_ADI      → Psikolog tam adı                  ║
 * ║    - PSIKOLOG_UNVAN    → Psikolog unvanı                   ║
 * ║    - PSIKOLOG_LISANS   → Lisans/diploma numarası           ║
 * ║    - TELEFON           → İletişim telefonu                 ║
 * ║    - EMAIL             → İletişim e-postası                ║
 * ║    - ADRES             → Klinik adresi                     ║
 * ║    - LOGO_RENK_1/2     → Marka renkleri (hex)             ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * ⚠️  Değişiklik sonrası: cd frontend && npm run build
 */

const config = {
  // ── Klinik / Firma Bilgileri ──────────────────────────────────────────────
  KLINIK_ADI:     "ANKA Danışmanlık",
  KLINIK_SLOGAN:  "Zihinsel sağlığınız için güvenilir bir yol arkadaşı",
  KLINIK_SIRKET:  "ANKA Danışmanlık",

  // ── Psikolog Bilgileri ────────────────────────────────────────────────────
  PSIKOLOG_ADI:    "Gaye Umuç",
  PSIKOLOG_UNVAN:  "Klinik Psikolog & Psikoterapist",
  PSIKOLOG_LISANS: "T.C. Sağlık Bakanlığı — PSK-2024-08741",

  // ── İletişim Bilgileri ────────────────────────────────────────────────────
  TELEFON: "+90 506 054 00 93",
  EMAIL:   "gayeumuc@gmail.com",
  ADRES:   "Nişantaşı, Şişli / İstanbul",

  // ── Marka Renkleri ────────────────────────────────────────────────────────
  // Psikolog paneli rengi
  PSIKOLOG_RENK:     "#6366f1",
  PSIKOLOG_GRADIENT: "135deg,#6366f1,#8b5cf6",
  // Danışan paneli rengi
  DANISAN_RENK:      "#0ea5e9",
  DANISAN_GRADIENT:  "135deg,#0ea5e9,#10b981",

  // ── Hakkında / Biyografi ──────────────────────────────────────────────────
  PSIKOLOG_BIO_KISA: (
    "Klinik psikolog ve psikoterapist olarak 8 yılı aşkın deneyimle " +
    "bireylerin psikolojik iyilik hallerini destekliyorum."
  ),
  PSIKOLOG_BIO_UZUN: (
    "ANKA Danışmanlık bünyesinde bireysel, çift ve aile terapisi hizmetleri sunmaktayım. " +
    "Danışanlarımın psikolojik iyilik hallerini desteklemek için Bilişsel Davranışçı Terapi (BDT), " +
    "EMDR ve Şema Terapi yöntemlerini kullanmaktayım."
  ),

  // ── Referanslar / Yorumlar ────────────────────────────────────────────────
  // Home.js'deki referans kartları — isteğe göre güncelleyin
  REFERANSLAR: [
    { isim: "M.T.", meslek: "Mühendis",    yorum: "Profesyonel yaklaşımı ve samimi ilgisi ile gerçekten fark yaratan bir terapist. Kesinlikle tavsiye ederim.", puan: 5 },
    { isim: "S.Ö.", meslek: "Girişimci",   yorum: "İş stresi ve tükenmişlik sendromuyla mücadele ederken ANKA Danışmanlık'ı buldum. Çok şükür ki buldum!", puan: 5 },
    { isim: "E.Y.", meslek: "Akademisyen", yorum: "Bilimsel temelli yaklaşımı ve empatiyle dinlemesi sayesinde kendimi çok daha iyi anlıyorum.", puan: 5 },
  ],

  // ── Telif Hakkı ───────────────────────────────────────────────────────────
  get TELIF() {
    return `© ${new Date().getFullYear()} ${this.KLINIK_ADI} · ${this.PSIKOLOG_ADI}`;
  },
};

export default config;
