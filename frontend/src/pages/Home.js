import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import config from "../config";
import { psychologistAPI } from "../services/api";

/* ══════════════════════════════════════════════════════════
   SABİT İÇERİK — config.js'den okunur
   Klinik bilgilerini değiştirmek için: frontend/src/config.js
══════════════════════════════════════════════════════════ */
const PSIKOLOG = {
  ad:          config.PSIKOLOG_ADI,
  unvan:       config.PSIKOLOG_UNVAN,
  sirket:      config.KLINIK_ADI,
  slogan:      config.KLINIK_SLOGAN,
  bio:         "İstanbul Üniversitesi Psikoloji bölümünden mezun olduktan sonra Hacettepe Üniversitesi'nde Klinik Psikoloji alanında yüksek lisans ve doktora eğitimimi tamamladım. 10 yılı aşkın klinik deneyimimle bireylerin psikolojik iyilik hallerini desteklemek için bilimsel temelli, kişiselleştirilmiş terapi yaklaşımları sunuyorum.",
  uzmanlik:    "Bilişsel Davranışçı Terapi (BDT)",
  lisans:      config.PSIKOLOG_LISANS,
  telefon:     config.TELEFON,
  email:       config.EMAIL,
  adres:       config.ADRES,
  deneyim:     "10+ Yıl",
  seans:       "2.500+",
  danisan:     "400+",
  memnuniyet:  "%97",
};

const EGITIM = [
  { yil: "2014 – 2018", kurum: "Hacettepe Üniversitesi", bolum: "Klinik Psikoloji — Doktora (Ph.D.)", ikon: "🎓" },
  { yil: "2012 – 2014", kurum: "Hacettepe Üniversitesi", bolum: "Klinik Psikoloji — Yüksek Lisans (M.Sc.)", ikon: "📚" },
  { yil: "2008 – 2012", kurum: "İstanbul Üniversitesi",  bolum: "Psikoloji — Lisans (B.Sc.)", ikon: "🏛️" },
];

const SERTIFIKALAR = [
  "Bilişsel Davranışçı Terapi (BDT) — Beck Institute, Philadelphia",
  "EMDR Travma Terapisi — EMDR Europe Sertifikası",
  "Mindfulness Tabanlı Stres Azaltma (MBSR) — Oxford Mindfulness Centre",
  "Çift ve Aile Terapisi — Türk Psikoloji Derneği",
  "Psikolojik İlk Yardım — Dünya Sağlık Örgütü (WHO)",
];

const UZMANLIK_ALANLARI = [
  { ikon: "😰", baslik: "Kaygı & Panik Bozukluğu",   renk: "#0ea5e9" },
  { ikon: "😔", baslik: "Depresyon & Duygu Düzenleme", renk: "#8b5cf6" },
  { ikon: "💔", baslik: "İlişki & Çift Sorunları",    renk: "#ec4899" },
  { ikon: "🧠", baslik: "Travma & TSSB",              renk: "#f59e0b" },
  { ikon: "😴", baslik: "Uyku Bozuklukları",          renk: "#10b981" },
  { ikon: "🎯", baslik: "Kişisel Gelişim & Koçluk",   renk: "#06b6d4" },
  { ikon: "👨‍👩‍👧", baslik: "Aile & Ebeveynlik",         renk: "#84cc16" },
  { ikon: "💼", baslik: "İş Stresi & Tükenmişlik",    renk: "#ef4444" },
];

const HIZMETLER = [
  { ikon: "🧠", baslik: "Bireysel Terapi",         sure: "50 dk",  fiyat: "₺800",  renk: "#0ea5e9", aciklama: "BDT, EMDR ve mindfulness teknikleri ile kişiselleştirilmiş bireysel terapi seansları." },
  { ikon: "💑", baslik: "Çift Terapisi",           sure: "75 dk",  fiyat: "₺1.200", renk: "#ec4899", aciklama: "İlişki sorunları, iletişim güçlükleri ve çatışma çözümü için çift danışmanlığı." },
  { ikon: "👨‍👩‍👧", baslik: "Aile Terapisi",          sure: "90 dk",  fiyat: "₺1.500", renk: "#10b981", aciklama: "Aile dinamiklerini güçlendirmek ve sağlıklı iletişim örüntüleri oluşturmak için." },
  { ikon: "📊", baslik: "Psikolojik Değerlendirme", sure: "2 seans", fiyat: "₺2.000", renk: "#8b5cf6", aciklama: "Kapsamlı psikolojik test bataryası ile değerlendirme ve detaylı rapor." },
  { ikon: "📱", baslik: "Online Seans",            sure: "50 dk",  fiyat: "₺700",  renk: "#f59e0b", aciklama: "Güvenli video platformu üzerinden istediğiniz yerden terapi imkânı." },
  { ikon: "🏢", baslik: "Kurumsal Danışmanlık",    sure: "Özel",   fiyat: "Teklif", renk: "#06b6d4", aciklama: "Şirketlere yönelik çalışan psikolojisi, stres yönetimi ve verimlilik programları." },
];

const YORUMLAR = config.REFERANSLAR;

/* ══════════════════════════════════════════════════════════
   YARDIMCI BİLEŞENLER
══════════════════════════════════════════════════════════ */
const StarRating = ({ puan }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= puan ? "#f59e0b" : "#e2e8f0", fontSize: "0.9rem" }}>★</span>
    ))}
  </div>
);

const WaveTop = ({ from, to }) => (
  <div style={{ overflow: "hidden", lineHeight: 0, background: from }}>
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: 50 }}>
      <path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill={to} />
    </svg>
  </div>
);

/* ══════════════════════════════════════════════════════════
   ANA BİLEŞEN
══════════════════════════════════════════════════════════ */
// ── Hazır Testler (statik, düzenlenebilir) ──────────────────────────────────
const HAZIR_TESTLER = [
  {
    id: 1,
    baslik: "Beck Depresyon Ölçeği (BDI)",
    aciklama: "Depresyon belirtilerinin şiddetini ölçen 21 soruluk standart bir ölçektir. Klinik değerlendirme ve tedavi takibinde yaygın olarak kullanılır.",
    sure: "10-15 dk",
    sorular: 21,
    kategori: "Depresyon",
    renk: "#6366f1",
    ikon: "😔",
  },
  {
    id: 2,
    baslik: "Beck Anksiyete Ölçeği (BAI)",
    aciklama: "Anksiyete belirtilerinin sıklığını ve şiddetini değerlendiren 21 maddelik bir ölçektir. Kaygı bozukluklarının tanı ve takibinde kullanılır.",
    sure: "10 dk",
    sorular: 21,
    kategori: "Anksiyete",
    renk: "#f59e0b",
    ikon: "😰",
  },
  {
    id: 3,
    baslik: "Rosenberg Benlik Saygısı Ölçeği",
    aciklama: "Bireyin genel benlik saygısını ölçen 10 maddelik kısa bir ölçektir. Kişisel gelişim ve terapi süreçlerinde sıklıkla kullanılır.",
    sure: "5 dk",
    sorular: 10,
    kategori: "Benlik",
    renk: "#10b981",
    ikon: "🌟",
  },
  {
    id: 4,
    baslik: "Pittsburgh Uyku Kalitesi İndeksi",
    aciklama: "Son bir aydaki uyku kalitesini ve bozukluklarını değerlendiren kapsamlı bir ölçektir. Uyku sorunlarının tanı ve takibinde kullanılır.",
    sure: "10 dk",
    sorular: 19,
    kategori: "Uyku",
    renk: "#3b82f6",
    ikon: "😴",
  },
  {
    id: 5,
    baslik: "Stres Algı Ölçeği (SAÖ)",
    aciklama: "Bireyin yaşamındaki durumları ne ölçüde stresli algıladığını değerlendiren 14 maddelik bir ölçektir.",
    sure: "8 dk",
    sorular: 14,
    kategori: "Stres",
    renk: "#ef4444",
    ikon: "🧠",
  },
  {
    id: 6,
    baslik: "Mindfulness Farkındalık Ölçeği",
    aciklama: "Bireyin günlük yaşamda bilinçli farkındalık düzeyini ölçen 15 maddelik bir ölçektir. Mindfulness temelli terapilerde kullanılır.",
    sure: "8 dk",
    sorular: 15,
    kategori: "Farkındalık",
    renk: "#06b6d4",
    ikon: "🧘",
  },
];

// ── Ödev Örnekleri (statik, düzenlenebilir) ──────────────────────────────────
const ODEV_ORNEKLERI = [
  {
    id: 1,
    baslik: "Duygu Günlüğü",
    aciklama: "Her gün 5-10 dakika ayırarak o gün yaşadığınız duyguları, tetikleyicileri ve bedensel tepkileri not edin.",
    sure: "Günlük · 5-10 dk",
    kategori: "Öz-Farkındalık",
    renk: "#8b5cf6",
    ikon: "📔",
    adimlar: ["Sabah veya akşam sabit bir zaman belirleyin", "O gün hissettiğiniz 3 duyguyu yazın", "Bu duyguları tetikleyen olayı not edin"],
  },
  {
    id: 2,
    baslik: "Nefes Egzersizi (4-7-8)",
    aciklama: "Kaygı ve stres anlarında sakinleşmek için 4-7-8 nefes tekniğini günde 2 kez uygulayın.",
    sure: "Günlük · 5 dk",
    kategori: "Kaygı Yönetimi",
    renk: "#0ea5e9",
    ikon: "🌬️",
    adimlar: ["4 saniye boyunca nefes alın", "7 saniye nefesi tutun", "8 saniyede yavaşça verin"],
  },
  {
    id: 3,
    baslik: "Olumsuz Düşünce Kaydı",
    aciklama: "Otomatik olumsuz düşünceleri fark edip alternatif bakış açıları geliştirmek için BDT tekniğini uygulayın.",
    sure: "Haftalık · 15-20 dk",
    kategori: "Bilişsel Yeniden Yapılandırma",
    renk: "#10b981",
    ikon: "🔄",
    adimlar: ["Olumsuz düşünceyi yazın", "Kanıtları listeleyin", "Dengeli bir alternatif oluşturun"],
  },
  {
    id: 4,
    baslik: "Minnettarlık Listesi",
    aciklama: "Her gün 3 şey için minnettarlık duyun ve bunları yazın. Olumlu duyguları güçlendirmeye yardımcı olur.",
    sure: "Günlük · 5 dk",
    kategori: "Pozitif Psikoloji",
    renk: "#f59e0b",
    ikon: "🙏",
    adimlar: ["Akşam yatmadan önce yapın", "Büyük veya küçük 3 şey seçin", "Neden minnettar olduğunuzu açıklayın"],
  },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [activeTab, setActiveTab] = useState("bireysel");
  const [psikologlar, setPsikologlar] = useState([]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    psychologistAPI.getPublicList()
      .then(res => {
        const list = res.data?.results || res.data || [];
        setPsikologlar(Array.isArray(list) ? list : []);
      })
      .catch(() => setPsikologlar([]));
  }, []);

  return (
    <div style={S.page}>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{ ...S.nav, ...(scrolled ? S.navScrolled : {}) }}>
        <div style={S.navInner}>
          {/* Logo */}
          <a href="#top" style={S.logoWrap}>
            <div style={S.logoBox}>
              <span style={S.logoLetter}>A</span>
            </div>
            <div>
              <div style={S.logoName}>{config.KLINIK_ADI.split(" ")[0]}</div>
              <div style={S.logoSub}>{config.KLINIK_ADI.split(" ").slice(1).join(" ") || "Danışmanlık"}</div>
            </div>
          </a>

          {/* Linkler */}
          <div style={S.navLinks}>
            {[["#hakkimda","Hakkımda"],["#uzmanlik","Uzmanlık"],["#hizmetler","Hizmetler"],["#ekibimiz","Ekibimiz"],["#testler","Testler"],["#odevler","Ödevler"],["#yorumlar","Yorumlar"],["#iletisim","İletişim"]].map(([href, label]) => (
              <a key={href} href={href} style={S.navLink}>{label}</a>
            ))}
          </div>

          {/* Sağ */}
          <div style={S.navRight}>
            <Link to="/admin-giris" style={S.navAdminBtn}>🔐 Admin Girişi</Link>
            <Link to="/login" style={S.navLoginBtn}>Danışan Girişi</Link>
            <a href="#randevu" style={S.navCta}>📅 Randevu Al</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={S.hero}>
        <div style={S.heroBlob1} />
        <div style={S.heroBlob2} />

        <div style={S.heroInner}>
          {/* Sol — metin */}
          <div style={S.heroLeft}>
            <div style={S.heroPill}>
              <span style={S.heroPillDot} />
              {PSIKOLOG.sirket} · {PSIKOLOG.unvan}
            </div>

            <h1 style={S.heroH1}>
              <span style={S.heroH1Sub}>Uzm. Psk.</span>
              <span style={S.heroH1Name}>{PSIKOLOG.ad}</span>
            </h1>

            <p style={S.heroDesc}>{PSIKOLOG.slogan}</p>
            <p style={S.heroBio}>{PSIKOLOG.bio}</p>

            <div style={S.heroCtas}>
              <a href="#randevu" style={S.btnPrimary}>📅 Randevu Al</a>
              <a href="#hakkimda" style={S.btnOutline}>Daha Fazla Bilgi</a>
            </div>

            {/* Güven rozetleri */}
            <div style={S.trustRow}>
              {["🔒 KVKK Uyumlu","🩺 Lisanslı Uzman","💬 Gizlilik Güvencesi","⭐ 10+ Yıl Deneyim"].map((t,i) => (
                <span key={i} style={S.trustBadge}>{t}</span>
              ))}
            </div>
          </div>

          {/* Sağ — profil kartı */}
          <div style={S.heroRight}>
            <div style={S.profileCard}>
              {/* Avatar */}
              <div style={S.profileAvatar}>
                <span style={S.profileAvatarText}>GU</span>
              </div>
              <div style={S.profileName}>{PSIKOLOG.ad}</div>
              <div style={S.profileTitle}>{PSIKOLOG.unvan}</div>
              <div style={S.profileCompany}>🏢 {PSIKOLOG.sirket}</div>

              <div style={S.profileDivider} />

              {/* İstatistikler */}
              <div style={S.profileStats}>
                {[
                  { val: PSIKOLOG.deneyim,    label: "Deneyim" },
                  { val: PSIKOLOG.seans,      label: "Seans" },
                  { val: PSIKOLOG.danisan,    label: "Danışan" },
                  { val: PSIKOLOG.memnuniyet, label: "Memnuniyet" },
                ].map((s,i) => (
                  <div key={i} style={S.profileStat}>
                    <div style={S.profileStatVal}>{s.val}</div>
                    <div style={S.profileStatLabel}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={S.profileDivider} />

              {/* İletişim */}
              <div style={S.profileContact}>
                <div style={S.profileContactRow}><span>📞</span> {PSIKOLOG.telefon}</div>
                <div style={S.profileContactRow}><span>📍</span> {PSIKOLOG.adres}</div>
                <div style={S.profileContactRow}><span>📋</span> {PSIKOLOG.lisans}</div>
              </div>

              <a href="#randevu" style={{ ...S.btnPrimary, display: "block", textAlign: "center", marginTop: "1.25rem" }}>
                Randevu Al →
              </a>
            </div>
          </div>
        </div>

        {/* İstatistik şeridi */}
        <div style={S.statsStrip}>
          {[
            { val: PSIKOLOG.seans,      label: "Tamamlanan Seans",   ikon: "🧠" },
            { val: PSIKOLOG.danisan,    label: "Mutlu Danışan",       ikon: "👥" },
            { val: PSIKOLOG.deneyim,    label: "Klinik Deneyim",      ikon: "⭐" },
            { val: PSIKOLOG.memnuniyet, label: "Danışan Memnuniyeti", ikon: "💙" },
          ].map((s,i) => (
            <div key={i} style={S.statItem}>
              <div style={S.statIcon}>{s.ikon}</div>
              <div style={S.statVal}>{s.val}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <WaveTop from="#f0f9ff" to="#fff" />

      {/* ── HAKKIMDA / CV ───────────────────────────────────────────────── */}
      <section id="hakkimda" style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.sectionHead}>
            <div style={S.chip}>👤 Hakkımda</div>
            <h2 style={S.h2}>{PSIKOLOG.ad}</h2>
            <p style={S.sectionDesc}>{PSIKOLOG.unvan} · {PSIKOLOG.sirket}</p>
          </div>

          <div style={S.cvGrid}>
            {/* Sol — Eğitim & Sertifikalar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

              {/* Eğitim */}
              <div style={S.cvCard}>
                <h3 style={S.cvCardTitle}>🎓 Eğitim</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {EGITIM.map((e, i) => (
                    <div key={i} style={S.cvItem}>
                      <div style={S.cvItemLeft}>
                        <div style={S.cvItemIcon}>{e.ikon}</div>
                        <div style={S.cvItemLine} />
                      </div>
                      <div style={S.cvItemRight}>
                        <div style={S.cvItemYil}>{e.yil}</div>
                        <div style={S.cvItemKurum}>{e.kurum}</div>
                        <div style={S.cvItemBolum}>{e.bolum}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sertifikalar */}
              <div style={S.cvCard}>
                <h3 style={S.cvCardTitle}>📜 Sertifikalar & Eğitimler</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {SERTIFIKALAR.map((s, i) => (
                    <div key={i} style={S.certItem}>
                      <span style={S.certDot}>✓</span>
                      <span style={S.certText}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sağ — Biyografi & Yaklaşım */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={S.cvCard}>
                <h3 style={S.cvCardTitle}>🧑‍⚕️ Biyografi</h3>
                <p style={S.bioText}>{PSIKOLOG.bio}</p>
                <p style={{ ...S.bioText, marginTop: "1rem" }}>
                  {config.PSIKOLOG_BIO_UZUN}
                </p>
                <p style={{ ...S.bioText, marginTop: "1rem" }}>
                  Türk Psikologlar Derneği ve Avrupa Psikoloji Federasyonu (EFPA) üyesiyim.
                  Ulusal ve uluslararası kongrelerde bildiriler sunmuş, hakemli dergilerde makaleler yayımlamış bir akademisyen-klinisyen olarak çalışmalarımı sürdürmekteyim.
                </p>
              </div>

              <div style={S.cvCard}>
                <h3 style={S.cvCardTitle}>💡 Terapi Yaklaşımım</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {[
                    { ikon: "🔬", baslik: "Bilimsel Temelli", aciklama: "Kanıta dayalı terapi yöntemleri kullanıyorum." },
                    { ikon: "🤝", baslik: "İşbirlikçi",       aciklama: "Danışanımla birlikte hedefler belirleriz." },
                    { ikon: "🎯", baslik: "Kişiselleştirilmiş", aciklama: "Her bireye özgü terapi planı oluştururum." },
                    { ikon: "📈", baslik: "Ölçülebilir",      aciklama: "İlerlemenizi testler ile takip ederiz." },
                  ].map((a, i) => (
                    <div key={i} style={S.approachItem}>
                      <div style={S.approachIcon}>{a.ikon}</div>
                      <div>
                        <div style={S.approachTitle}>{a.baslik}</div>
                        <div style={S.approachDesc}>{a.aciklama}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveTop from="#fff" to="#f0fdf4" />

      {/* ── UZMANLIK ALANLARI ────────────────────────────────────────────── */}
      <section id="uzmanlik" style={{ ...S.section, background: "#f0fdf4" }}>
        <div style={S.sectionInner}>
          <div style={S.sectionHead}>
            <div style={{ ...S.chip, background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" }}>🎯 Uzmanlık</div>
            <h2 style={S.h2}>Uzmanlık Alanlarım</h2>
            <p style={S.sectionDesc}>Hangi konularda yardım alabileceğinizi keşfedin.</p>
          </div>
          <div style={S.uzmanlikGrid}>
            {UZMANLIK_ALANLARI.map((u, i) => (
              <div key={i} style={{ ...S.uzmanlikCard, borderLeft: `4px solid ${u.renk}` }}>
                <div style={{ ...S.uzmanlikIcon, background: u.renk + "15", color: u.renk }}>{u.ikon}</div>
                <div style={S.uzmanlikBaslik}>{u.baslik}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveTop from="#f0fdf4" to="#fff" />

      {/* ── HİZMETLER ───────────────────────────────────────────────────── */}
      <section id="hizmetler" style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.sectionHead}>
            <div style={S.chip}>🌿 Hizmetler</div>
            <h2 style={S.h2}>Sunduğum Hizmetler</h2>
            <p style={S.sectionDesc}>İhtiyacınıza uygun terapi seçeneğini belirleyin.</p>
          </div>
          <div style={S.servGrid}>
            {HIZMETLER.map((h, i) => (
              <div key={i} style={{ ...S.servCard, borderTop: `3px solid ${h.renk}` }}>
                <div style={{ ...S.servIcon, background: h.renk + "15" }}>{h.ikon}</div>
                <h3 style={S.servTitle}>{h.baslik}</h3>
                <p style={S.servDesc}>{h.aciklama}</p>
                <div style={S.servMeta}>
                  <span style={S.servSure}>⏱ {h.sure}</span>
                  <span style={{ ...S.servFiyat, color: h.renk }}>{h.fiyat}</span>
                </div>
                <a href="#randevu" style={{ ...S.btnOutline, display: "block", textAlign: "center", marginTop: "1rem", fontSize: "0.82rem", padding: "0.5rem 1rem" }}>
                  Randevu Al
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EKİBİMİZ ────────────────────────────────────────────────────── */}
      <WaveTop from="#fff" to="#f0f9ff" />
      <section id="ekibimiz" style={{ ...S.section, background: "#f0f9ff" }}>
        <div style={S.sectionInner}>
          <div style={S.sectionHead}>
            <div style={{ ...S.chip, background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>👥 Ekibimiz</div>
            <h2 style={S.h2}>Uzman Psikolog Kadromuz</h2>
            <p style={S.sectionDesc}>Alanında uzman, deneyimli psikologlarımızla tanışın.</p>
          </div>
          {psikologlar.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", fontSize: "0.95rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
              <p>Psikolog bilgileri yükleniyor...</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {psikologlar.map((p) => {
                const initials = `${(p.first_name || "?")[0]}${(p.last_name || "?")[0]}`.toUpperCase();
                const gradients = [
                  "linear-gradient(135deg,#0ea5e9,#10b981)",
                  "linear-gradient(135deg,#8b5cf6,#ec4899)",
                  "linear-gradient(135deg,#f59e0b,#ef4444)",
                  "linear-gradient(135deg,#06b6d4,#6366f1)",
                ];
                const grad = gradients[p.id % gradients.length] || gradients[0];
                return (
                  <div key={p.id} style={{ background: "#fff", borderRadius: "1.25rem", border: "1px solid #e0f2fe", boxShadow: "0 4px 20px rgba(14,165,233,.1)", overflow: "hidden", transition: "transform .2s, box-shadow .2s" }}>
                    {/* Üst bant */}
                    <div style={{ height: 6, background: grad }} />
                    <div style={{ padding: "1.75rem" }}>
                      {/* Avatar + isim */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                        {p.photo_url ? (
                          <img src={p.photo_url} alt={`${p.first_name} ${p.last_name}`} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "3px solid #e0f2fe" }} />
                        ) : (
                          <div style={{ width: 64, height: 64, borderRadius: "50%", background: grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: "1.3rem", flexShrink: 0, boxShadow: "0 4px 12px rgba(14,165,233,.25)" }}>
                            {initials}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>
                            {p.first_name} {p.last_name}
                          </div>
                          {p.specialization && (
                            <div style={{ fontSize: "0.75rem", color: "#0ea5e9", fontWeight: 600, marginTop: "0.15rem" }}>
                              {p.specialization}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Bio */}
                      {p.bio && (
                        <p style={{ fontSize: "0.83rem", color: "#475569", lineHeight: 1.65, marginBottom: "1rem" }}>
                          {p.bio.length > 140 ? p.bio.slice(0, 140) + "…" : p.bio}
                        </p>
                      )}
                      {/* Rozetler */}
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {p.experience_years > 0 && (
                          <span style={{ fontSize: "0.72rem", background: "#dbeafe", color: "#1d4ed8", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 700 }}>
                            ⭐ {p.experience_years}+ Yıl Deneyim
                          </span>
                        )}
                        {p.license_number && (
                          <span style={{ fontSize: "0.72rem", background: "#d1fae5", color: "#065f46", padding: "0.2rem 0.6rem", borderRadius: "9999px", fontWeight: 700 }}>
                            📋 {p.license_number}
                          </span>
                        )}
                      </div>
                      {/* İletişim */}
                      {p.phone && (
                        <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9", fontSize: "0.78rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span>📞</span> {p.phone}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── HAZIR TESTLER ───────────────────────────────────────────────── */}
      <WaveTop from="#f0f9ff" to="#fff" />
      <section id="testler" style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.sectionHead}>
            <div style={{ ...S.chip, background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>🧪 Testler</div>
            <h2 style={S.h2}>Psikolojik Değerlendirme Testleri</h2>
            <p style={S.sectionDesc}>Psikologunuz tarafından size atanan testleri sisteme giriş yaparak tamamlayabilirsiniz.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
            {HAZIR_TESTLER.map((t) => (
              <div key={t.id} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderTop: `3px solid ${t.renk}`, transition: "transform .2s, box-shadow .2s" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem", marginBottom: "0.85rem" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "0.75rem", background: t.renk + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 }}>
                    {t.ikon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b", marginBottom: "0.2rem" }}>{t.baslik}</h3>
                    <span style={{ fontSize: "0.68rem", background: t.renk + "15", color: t.renk, padding: "0.15rem 0.5rem", borderRadius: "9999px", fontWeight: 700 }}>{t.kategori}</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6, marginBottom: "1rem" }}>{t.aciklama}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>⏱ {t.sure}</span>
                    <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>❓ {t.sorular} soru</span>
                  </div>
                  <Link to="/login" style={{ fontSize: "0.75rem", fontWeight: 700, color: t.renk, textDecoration: "none", background: t.renk + "10", padding: "0.25rem 0.65rem", borderRadius: "0.4rem", border: `1px solid ${t.renk}30` }}>
                    Testi Başlat →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              🔒 Testlere erişmek için danışan hesabınızla giriş yapmanız gerekmektedir.
              <Link to="/login" style={{ color: "#0ea5e9", fontWeight: 600, marginLeft: "0.4rem" }}>Giriş Yap →</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── ÖDEV ÖRNEKLERİ ──────────────────────────────────────────────── */}
      <WaveTop from="#fff" to="#f0fdf4" />
      <section id="odevler" style={{ ...S.section, background: "#f0fdf4" }}>
        <div style={S.sectionInner}>
          <div style={S.sectionHead}>
            <div style={{ ...S.chip, background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" }}>📋 Ödevler</div>
            <h2 style={S.h2}>Terapi Destekleyici Ödevler</h2>
            <p style={S.sectionDesc}>Psikologunuz seans aralarında size özel ödevler atayabilir. İşte bazı örnek ödevler:</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
            {ODEV_ORNEKLERI.map((o) => (
              <div key={o.id} style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", borderLeft: `4px solid ${o.renk}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "0.625rem", background: o.renk + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                    {o.ikon}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b", marginBottom: "0.15rem" }}>{o.baslik}</h3>
                    <span style={{ fontSize: "0.68rem", background: o.renk + "15", color: o.renk, padding: "0.1rem 0.45rem", borderRadius: "9999px", fontWeight: 700 }}>{o.kategori}</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.6, marginBottom: "0.85rem" }}>{o.aciklama}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginBottom: "0.85rem" }}>
                  {o.adimlar.map((adim, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.78rem", color: "#475569" }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: o.renk, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, flexShrink: 0, marginTop: "0.05rem" }}>{i + 1}</span>
                      {adim}
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: "0.75rem", borderTop: "1px solid #f1f5f9", fontSize: "0.72rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  ⏱ {o.sure}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Psikologunuz size özel ödevler atayacaktır.
              <Link to="/login" style={{ color: "#10b981", fontWeight: 600, marginLeft: "0.4rem" }}>Giriş yaparak ödevlerinizi görün →</Link>
            </p>
          </div>
        </div>
      </section>

      <WaveTop from="#f0fdf4" to="#0f172a" />

      {/* ── YORUMLAR ────────────────────────────────────────────────────── */}
      <section id="yorumlar" style={{ ...S.section, background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
        <div style={S.sectionInner}>
          <div style={S.sectionHead}>
            <div style={{ ...S.chip, background: "rgba(255,255,255,.1)", color: "#7dd3fc", border: "1px solid rgba(255,255,255,.15)" }}>⭐ Yorumlar</div>
            <h2 style={{ ...S.h2, color: "#fff" }}>Danışanlarım Ne Diyor?</h2>
          </div>
          <div style={S.yorumGrid}>
            {YORUMLAR.map((y, i) => (
              <div key={i} style={S.yorumCard}>
                <StarRating puan={y.puan} />
                <p style={S.yorumText}>"{y.yorum}"</p>
                <div style={S.yorumAlt}>
                  <div style={S.yorumAvatar}>{y.isim[0]}</div>
                  <div>
                    <div style={S.yorumIsim}>{y.isim}</div>
                    <div style={S.yorumMeslek}>{y.meslek}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RANDEVU ─────────────────────────────────────────────────────── */}
      <section id="randevu" style={S.ctaSection}>
        <div style={S.ctaBlob} />
        <div style={S.ctaInner}>
          <div style={S.ctaLeft}>
            <div style={{ ...S.chip, background: "rgba(255,255,255,.15)", color: "#bae6fd", border: "1px solid rgba(255,255,255,.2)", marginBottom: "1rem" }}>
              📅 Randevu
            </div>
            <h2 style={S.ctaH2}>İlk Adımı Atmaya Hazır mısınız?</h2>
            <p style={S.ctaDesc}>
              Sisteme giriş yaparak uygun randevu slotlarından birini seçebilir,
              ödevlerinizi takip edebilir ve psikolojik testlerinizi tamamlayabilirsiniz.
            </p>
            <div style={S.ctaBtns}>
              <Link to="/login" style={S.ctaBtnWhite}>👤 Danışan Girişi</Link>
              <Link to="/admin-giris" style={S.ctaBtnAdmin}>🔐 Admin Girişi</Link>
              <a href={`tel:${PSIKOLOG.telefon}`} style={S.ctaBtnOutline}>📞 Bizi Arayın</a>
            </div>
          </div>
          <div style={S.ctaRight}>
            {[
              { ikon: "📅", baslik: "Kolay Randevu",   aciklama: "Uygun slotlardan anında rezervasyon yapın" },
              { ikon: "🔒", baslik: "Tam Gizlilik",    aciklama: "KVKK uyumlu güvenli veri saklama" },
              { ikon: "📱", baslik: "Online Seans",    aciklama: "İstediğiniz yerden terapi imkânı" },
              { ikon: "📊", baslik: "İlerleme Takibi", aciklama: "Testler ve ödevlerle gelişiminizi görün" },
            ].map((c, i) => (
              <div key={i} style={S.ctaCard}>
                <span style={S.ctaCardIcon}>{c.ikon}</span>
                <div>
                  <div style={S.ctaCardTitle}>{c.baslik}</div>
                  <div style={S.ctaCardDesc}>{c.aciklama}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── İLETİŞİM ────────────────────────────────────────────────────── */}
      <section id="iletisim" style={{ ...S.section, background: "#f8fafc" }}>
        <div style={S.sectionInner}>
          <div style={S.sectionHead}>
            <div style={S.chip}>📬 İletişim</div>
            <h2 style={S.h2}>Bize Ulaşın</h2>
          </div>
          <div style={S.contactGrid}>
            {[
              { ikon: "📞", renk: "#0ea5e9", baslik: "Telefon",  deger: PSIKOLOG.telefon },
              { ikon: "✉️", renk: "#10b981", baslik: "E-posta",  deger: PSIKOLOG.email },
              { ikon: "📍", renk: "#8b5cf6", baslik: "Adres",    deger: PSIKOLOG.adres },
            ].map((c, i) => (
              <div key={i} style={S.contactCard}>
                <div style={{ ...S.contactIcon, background: c.renk + "15", color: c.renk }}>{c.ikon}</div>
                <div style={S.contactBaslik}>{c.baslik}</div>
                <div style={S.contactDeger}>{c.deger}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={S.footer}>
        <div style={S.footerInner}>
          <div style={S.footerLeft}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={S.logoBox}><span style={S.logoLetter}>A</span></div>
              <div>
                <div style={{ ...S.logoName, color: "#e2e8f0" }}>{config.KLINIK_ADI.split(" ")[0]}</div>
                <div style={{ ...S.logoSub, color: "#475569" }}>{config.KLINIK_ADI.split(" ").slice(1).join(" ") || "Danışmanlık"}</div>
              </div>
            </div>
            <p style={S.footerText}>{config.TELIF}. Tüm hakları saklıdır.</p>
          </div>
          <div style={S.footerLinks}>
            <Link to="/login" style={S.footerLink}>Danışan Girişi</Link>
            <Link to="/admin-giris" style={S.footerLink}>🔐 Admin Girişi</Link>
            <a href="http://127.0.0.1:8000/api/docs/" target="_blank" rel="noreferrer" style={S.footerLink}>API</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STİLLER
══════════════════════════════════════════════════════════ */
const S = {
  page: { minHeight: "100vh", background: "#fff", fontFamily: "'Inter', sans-serif" },

  /* Nav */
  nav: { position: "sticky", top: 0, zIndex: 200, padding: "0 1.5rem", transition: "all .3s" },
  navScrolled: { background: "rgba(255,255,255,.97)", backdropFilter: "blur(16px)", boxShadow: "0 2px 20px rgba(0,0,0,.08)", borderBottom: "1px solid #f1f5f9" },
  navInner: { maxWidth: "1200px", margin: "0 auto", height: "70px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" },
  logoWrap: { display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" },
  logoBox: { width: 44, height: 44, borderRadius: "12px", background: "linear-gradient(135deg, #0ea5e9, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoLetter: { color: "#fff", fontWeight: 900, fontSize: "1.3rem" },
  logoName: { fontWeight: 800, fontSize: "1rem", color: "#0f172a", lineHeight: 1.2 },
  logoSub: { fontSize: "0.68rem", color: "#64748b", fontWeight: 500 },
  navLinks: { display: "flex", gap: "0.15rem" },
  navLink: { padding: "0.45rem 0.85rem", borderRadius: "0.5rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, color: "#475569", transition: "all .15s" },
  navRight: { display: "flex", gap: "0.6rem", alignItems: "center" },
  navAdminBtn: { padding: "0.45rem 1rem", borderRadius: "0.5rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, color: "#7c3aed", border: "1.5px solid #ddd6fe", background: "#f5f3ff" },
  navRegisterBtn: { padding: "0.45rem 1rem", borderRadius: "0.5rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, color: "#10b981", border: "1.5px solid #a7f3d0", background: "#f0fdf4" },
  navLoginBtn: { padding: "0.45rem 1rem", borderRadius: "0.5rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600, color: "#0ea5e9", border: "1.5px solid #bae6fd", background: "#f0f9ff" },
  navCta: { padding: "0.5rem 1.1rem", borderRadius: "0.5rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #0ea5e9, #10b981)", boxShadow: "0 4px 14px rgba(14,165,233,.3)" },

  /* Hero */
  hero: { position: "relative", overflow: "hidden", background: "linear-gradient(160deg, #f0f9ff 0%, #f0fdf4 60%, #faf5ff 100%)", paddingBottom: 0 },
  heroBlob1: { position: "absolute", top: "-120px", left: "-80px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,.1) 0%, transparent 70%)", pointerEvents: "none" },
  heroBlob2: { position: "absolute", bottom: 0, right: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,.08) 0%, transparent 70%)", pointerEvents: "none" },
  heroInner: { maxWidth: "1200px", margin: "0 auto", padding: "4rem 1.5rem 2rem", display: "flex", alignItems: "flex-start", gap: "3rem" },
  heroLeft: { flex: 1, maxWidth: "580px" },
  heroPill: { display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "linear-gradient(135deg, #e0f2fe, #d1fae5)", color: "#0369a1", padding: "0.4rem 1rem", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "1.5rem", border: "1px solid #bae6fd" },
  heroPillDot: { width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" },
  heroH1: { marginBottom: "1rem" },
  heroH1Sub: { display: "block", fontSize: "1rem", fontWeight: 600, color: "#64748b", marginBottom: "0.25rem" },
  heroH1Name: { display: "block", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 900, background: "linear-gradient(135deg, #0ea5e9, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-.03em", lineHeight: 1.15 },
  heroDesc: { fontSize: "1.1rem", fontWeight: 600, color: "#0f172a", marginBottom: "0.75rem" },
  heroBio: { fontSize: "0.95rem", color: "#475569", lineHeight: 1.75, marginBottom: "2rem" },
  heroCtas: { display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.75rem" },
  trustRow: { display: "flex", gap: "0.6rem", flexWrap: "wrap" },
  trustBadge: { display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.7rem", borderRadius: "9999px", background: "rgba(255,255,255,.8)", border: "1px solid #e2e8f0", fontSize: "0.72rem", fontWeight: 600, color: "#475569" },
  heroRight: { flexShrink: 0, width: "300px" },

  /* Profil Kartı */
  profileCard: { background: "#fff", borderRadius: "1.5rem", boxShadow: "0 20px 60px rgba(14,165,233,.15)", border: "1px solid #e0f2fe", padding: "1.75rem", textAlign: "center" },
  profileAvatar: { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", boxShadow: "0 8px 24px rgba(14,165,233,.3)" },
  profileAvatarText: { color: "#fff", fontWeight: 900, fontSize: "1.5rem" },
  profileName: { fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", marginBottom: "0.2rem" },
  profileTitle: { fontSize: "0.78rem", color: "#0ea5e9", fontWeight: 600, marginBottom: "0.3rem" },
  profileCompany: { fontSize: "0.75rem", color: "#64748b", marginBottom: "1rem" },
  profileDivider: { height: "1px", background: "#f1f5f9", margin: "1rem 0" },
  profileStats: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.5rem" },
  profileStat: { background: "#f8fafc", borderRadius: "0.625rem", padding: "0.6rem 0.5rem", textAlign: "center" },
  profileStatVal: { fontWeight: 800, fontSize: "1rem", color: "#0f172a" },
  profileStatLabel: { fontSize: "0.65rem", color: "#94a3b8", marginTop: "0.1rem" },
  profileContact: { display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left" },
  profileContactRow: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#475569" },

  /* Stats şeridi */
  statsStrip: { maxWidth: "1200px", margin: "0 auto", padding: "1.5rem", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "1rem", borderTop: "1px solid rgba(14,165,233,.12)" },
  statItem: { textAlign: "center" },
  statIcon: { fontSize: "1.5rem", marginBottom: "0.25rem" },
  statVal: { fontSize: "1.6rem", fontWeight: 900, background: "linear-gradient(135deg, #0ea5e9, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  statLabel: { fontSize: "0.75rem", color: "#64748b", fontWeight: 500 },

  /* Butonlar */
  btnPrimary: { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.7rem 1.5rem", borderRadius: "0.625rem", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #0ea5e9, #10b981)", boxShadow: "0 6px 20px rgba(14,165,233,.3)", transition: "all .2s" },
  btnOutline: { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.7rem 1.5rem", borderRadius: "0.625rem", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, color: "#0ea5e9", border: "1.5px solid #bae6fd", background: "#f0f9ff", transition: "all .2s" },

  /* Section */
  section: { padding: "5rem 1.5rem" },
  sectionInner: { maxWidth: "1200px", margin: "0 auto" },
  sectionHead: { textAlign: "center", marginBottom: "3rem" },
  chip: { display: "inline-block", background: "linear-gradient(135deg, #e0f2fe, #d1fae5)", color: "#0369a1", padding: "0.3rem 0.9rem", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.75rem", border: "1px solid #bae6fd" },
  h2: { fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: "0.75rem", letterSpacing: "-.02em" },
  sectionDesc: { fontSize: "1rem", color: "#64748b", maxWidth: "480px", margin: "0 auto" },

  /* CV */
  cvGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" },
  cvCard: { background: "#fff", border: "1px solid #f1f5f9", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)" },
  cvCardTitle: { fontWeight: 700, fontSize: "0.95rem", color: "#0f172a", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottom: "2px solid #f0f9ff", display: "flex", alignItems: "center", gap: "0.5rem" },
  cvItem: { display: "flex", gap: "0.75rem" },
  cvItemLeft: { display: "flex", flexDirection: "column", alignItems: "center", width: "32px", flexShrink: 0 },
  cvItemIcon: { width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #e0f2fe, #d1fae5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 },
  cvItemLine: { flex: 1, width: "2px", background: "#f1f5f9", margin: "4px 0" },
  cvItemRight: { paddingBottom: "1rem" },
  cvItemYil: { fontSize: "0.72rem", color: "#0ea5e9", fontWeight: 700, marginBottom: "0.2rem" },
  cvItemKurum: { fontWeight: 700, fontSize: "0.9rem", color: "#0f172a", marginBottom: "0.15rem" },
  cvItemBolum: { fontSize: "0.82rem", color: "#64748b" },
  certItem: { display: "flex", alignItems: "flex-start", gap: "0.6rem" },
  certDot: { width: "20px", height: "20px", borderRadius: "50%", background: "#d1fae5", color: "#065f46", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0, marginTop: "0.1rem" },
  certText: { fontSize: "0.85rem", color: "#475569", lineHeight: 1.5 },
  bioText: { fontSize: "0.9rem", color: "#475569", lineHeight: 1.8 },
  approachItem: { display: "flex", alignItems: "flex-start", gap: "0.85rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "0.625rem" },
  approachIcon: { width: "36px", height: "36px", borderRadius: "0.5rem", background: "linear-gradient(135deg, #e0f2fe, #d1fae5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 },
  approachTitle: { fontWeight: 700, fontSize: "0.875rem", color: "#0f172a", marginBottom: "0.15rem" },
  approachDesc: { fontSize: "0.8rem", color: "#64748b" },

  /* Uzmanlık */
  uzmanlikGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" },
  uzmanlikCard: { display: "flex", alignItems: "center", gap: "0.85rem", background: "#fff", borderRadius: "0.875rem", padding: "1rem 1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", transition: "all .2s" },
  uzmanlikIcon: { width: "44px", height: "44px", borderRadius: "0.625rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0 },
  uzmanlikBaslik: { fontWeight: 600, fontSize: "0.875rem", color: "#1e293b" },

  /* Hizmetler */
  servGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" },
  servCard: { background: "#fff", borderRadius: "1rem", border: "1px solid #f1f5f9", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,.04)", transition: "all .2s" },
  servIcon: { width: "52px", height: "52px", borderRadius: "0.875rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: "1rem" },
  servTitle: { fontWeight: 700, fontSize: "0.95rem", color: "#1e293b", marginBottom: "0.5rem" },
  servDesc: { fontSize: "0.85rem", color: "#64748b", lineHeight: 1.6, marginBottom: "1rem" },
  servMeta: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  servSure: { fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500 },
  servFiyat: { fontWeight: 800, fontSize: "1rem" },

  /* Yorumlar */
  yorumGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.25rem" },
  yorumCard: { background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "1rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  yorumText: { fontSize: "0.875rem", color: "#cbd5e1", lineHeight: 1.7, flex: 1, fontStyle: "italic" },
  yorumAlt: { display: "flex", alignItems: "center", gap: "0.75rem" },
  yorumAvatar: { width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #0ea5e9, #10b981)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem", flexShrink: 0 },
  yorumIsim: { fontWeight: 700, fontSize: "0.875rem", color: "#e2e8f0" },
  yorumMeslek: { fontSize: "0.75rem", color: "#64748b" },

  /* CTA */
  ctaSection: { position: "relative", background: "linear-gradient(135deg, #0c4a6e 0%, #064e3b 100%)", padding: "5rem 1.5rem", overflow: "hidden" },
  ctaBlob: { position: "absolute", top: "-100px", right: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,.12) 0%, transparent 70%)", pointerEvents: "none" },
  ctaInner: { maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" },
  ctaLeft: {},
  ctaH2: { fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#fff", marginBottom: "1rem", letterSpacing: "-.02em" },
  ctaDesc: { fontSize: "1rem", color: "#94a3b8", lineHeight: 1.75, marginBottom: "2rem" },
  ctaBtns: { display: "flex", gap: "0.75rem", flexWrap: "wrap" },
  ctaBtnWhite: { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.75rem 1.5rem", borderRadius: "0.625rem", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700, color: "#0c4a6e", background: "#fff", boxShadow: "0 6px 20px rgba(0,0,0,.2)" },
  ctaBtnAdmin: { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.75rem 1.5rem", borderRadius: "0.625rem", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700, color: "#fff", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", boxShadow: "0 6px 20px rgba(99,102,241,.35)" },
  ctaBtnOutline: { display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.75rem 1.5rem", borderRadius: "0.625rem", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, color: "#7dd3fc", border: "1.5px solid rgba(125,211,252,.4)", background: "rgba(14,165,233,.1)" },
  ctaRight: { display: "flex", flexDirection: "column", gap: "0.85rem" },
  ctaCard: { display: "flex", alignItems: "center", gap: "1rem", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "0.875rem", padding: "1rem 1.25rem" },
  ctaCardIcon: { fontSize: "1.5rem", flexShrink: 0 },
  ctaCardTitle: { fontWeight: 700, fontSize: "0.875rem", color: "#e2e8f0", marginBottom: "0.15rem" },
  ctaCardDesc: { fontSize: "0.78rem", color: "#94a3b8" },

  /* İletişim */
  contactGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" },
  contactCard: { textAlign: "center", padding: "2rem 1.5rem", background: "#fff", borderRadius: "1.25rem", border: "1px solid #f1f5f9", boxShadow: "0 2px 12px rgba(0,0,0,.04)" },
  contactIcon: { width: "60px", height: "60px", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", margin: "0 auto 1rem" },
  contactBaslik: { fontWeight: 700, fontSize: "0.72rem", color: "#64748b", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: ".05em" },
  contactDeger: { fontWeight: 600, fontSize: "0.95rem", color: "#1e293b" },

  /* Footer */
  footer: { background: "#0f172a", padding: "2.5rem 1.5rem" },
  footerInner: { maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" },
  footerLeft: {},
  footerText: { fontSize: "0.78rem", color: "#475569", marginTop: "0.5rem" },
  footerLinks: { display: "flex", gap: "1.5rem" },
  footerLink: { fontSize: "0.82rem", color: "#64748b", textDecoration: "none", fontWeight: 500 },
};