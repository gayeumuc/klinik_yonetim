# -*- coding: utf-8 -*-
"""
BMU234 - Bilgisayar Organizasyonu ve Tasarimi
Final Sinavi Cozumleri PDF Olusturucu
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
import os

# ── Font kaydi ──────────────────────────────────────────────────────────────
FONT_DIR = "C:/Windows/Fonts"

def register_fonts():
    fonts = {
        "DejaVu":        "DejaVuSans.ttf",
        "DejaVu-Bold":   "DejaVuSans-Bold.ttf",
        "DejaVu-Italic": "DejaVuSans-Oblique.ttf",
    }
    registered = []
    for name, fname in fonts.items():
        path = os.path.join(FONT_DIR, fname)
        if os.path.exists(path):
            pdfmetrics.registerFont(TTFont(name, path))
            registered.append(name)
    return "DejaVu" if "DejaVu" in registered else "Helvetica"

BASE_FONT = register_fonts()
BOLD_FONT = "DejaVu-Bold" if BASE_FONT == "DejaVu" else "Helvetica-Bold"

# ── Stil tanimlari ───────────────────────────────────────────────────────────
def make_styles():
    s = {}
    s["title"] = ParagraphStyle(
        "title", fontName=BOLD_FONT, fontSize=16,
        textColor=colors.HexColor("#1a237e"),
        alignment=TA_CENTER, spaceAfter=4
    )
    s["subtitle"] = ParagraphStyle(
        "subtitle", fontName=BASE_FONT, fontSize=11,
        textColor=colors.HexColor("#283593"),
        alignment=TA_CENTER, spaceAfter=2
    )
    s["meta"] = ParagraphStyle(
        "meta", fontName=BASE_FONT, fontSize=9,
        textColor=colors.grey,
        alignment=TA_CENTER, spaceAfter=12
    )
    s["q_header"] = ParagraphStyle(
        "q_header", fontName=BOLD_FONT, fontSize=12,
        textColor=colors.white,
        backColor=colors.HexColor("#1565c0"),
        borderPad=6, spaceAfter=8, spaceBefore=14,
        leftIndent=6
    )
    s["section"] = ParagraphStyle(
        "section", fontName=BOLD_FONT, fontSize=11,
        textColor=colors.HexColor("#0d47a1"),
        spaceAfter=4, spaceBefore=8
    )
    s["body"] = ParagraphStyle(
        "body", fontName=BASE_FONT, fontSize=10,
        leading=15, spaceAfter=5,
        alignment=TA_JUSTIFY
    )
    s["body_bold"] = ParagraphStyle(
        "body_bold", fontName=BOLD_FONT, fontSize=10,
        leading=15, spaceAfter=4
    )
    s["code"] = ParagraphStyle(
        "code", fontName="Courier", fontSize=9,
        backColor=colors.HexColor("#f5f5f5"),
        borderPad=6, leading=13, spaceAfter=6
    )
    s["formula"] = ParagraphStyle(
        "formula", fontName=BOLD_FONT, fontSize=11,
        textColor=colors.HexColor("#b71c1c"),
        alignment=TA_CENTER, spaceAfter=6, spaceBefore=4
    )
    s["answer_box"] = ParagraphStyle(
        "answer_box", fontName=BOLD_FONT, fontSize=10,
        textColor=colors.HexColor("#1b5e20"),
        backColor=colors.HexColor("#e8f5e9"),
        borderPad=6, spaceAfter=8
    )
    s["note"] = ParagraphStyle(
        "note", fontName=BASE_FONT, fontSize=9,
        textColor=colors.HexColor("#4a148c"),
        backColor=colors.HexColor("#f3e5f5"),
        borderPad=4, spaceAfter=6, leading=13
    )
    return s


# ── Yardimci: tablo olustur ──────────────────────────────────────────────────
def make_table(data, col_widths=None,
               header_bg=None, header_fg=colors.white,
               row_bg1=colors.white, row_bg2=None):
    if header_bg is None:
        header_bg = colors.HexColor("#1565c0")
    if row_bg2 is None:
        row_bg2 = colors.HexColor("#e3f2fd")

    t = Table(data, colWidths=col_widths)
    style = [
        ("BACKGROUND",    (0, 0), (-1, 0),  header_bg),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  header_fg),
        ("FONTNAME",      (0, 0), (-1, 0),  BOLD_FONT),
        ("FONTSIZE",      (0, 0), (-1, 0),  9),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#90caf9")),
        ("FONTNAME",      (0, 1), (-1, -1), BASE_FONT),
        ("FONTSIZE",      (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [row_bg1, row_bg2]),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    t.setStyle(TableStyle(style))
    return t


# ── Baslik ───────────────────────────────────────────────────────────────────
def build_header(S):
    elems = []
    elems.append(Paragraph("MUNZUR UNIVERSITESI", S["title"]))
    elems.append(Paragraph("BMU234 - Bilgisayar Organizasyonu ve Tasarimi", S["subtitle"]))
    elems.append(Paragraph("Final Sinavi Cozumleri  |  Bahar 2024", S["meta"]))
    elems.append(HRFlowable(width="100%", thickness=2,
                             color=colors.HexColor("#1565c0"), spaceAfter=10))
    return elems


# ────────────────────────────────────────────────────────────────────────────
# SORU 1 – Pipeline Diyagrami (20p)
# ────────────────────────────────────────────────────────────────────────────
def soru1(S):
    elems = []
    elems.append(Paragraph("SORU 1 - Pipeline (Boru Hatti) Diyagrami  [20 Puan]", S["q_header"]))

    elems.append(Paragraph("Soru Metni:", S["section"]))
    elems.append(Paragraph(
        "Bir pipeline kullanilarak gerceklesen program 4 kesimli bir boru hattina ve "
        "6 komuta sahiptir. 2. komutta dallanma komutu bulunan bu pipeline diyagramini ciziniz.",
        S["body"]
    ))

    elems.append(Paragraph("Temel Kavramlar:", S["section"]))
    elems.append(Paragraph(
        "Pipeline (Boru Hatti): Bir islemi birden fazla asama (kesim/stage) halinde "
        "paralel yurutme teknigi. Her asama farkli bir komutun farkli bir islem adimini "
        "ayni anda gerceklestirir. Bu sayede islemci verimi (throughput) artar.",
        S["body"]
    ))

    stage_data = [
        ["Asama No", "Ad",              "Kisaltma", "Aciklama"],
        ["1",        "Komut Getirme",   "IF",       "Komut bellekten getirilir (Instruction Fetch)"],
        ["2",        "Komut Cozme",     "ID",       "Komut cozulur, registerlar okunur (Instruction Decode)"],
        ["3",        "Yurutme",         "EX",       "ALU islemi yapilir (Execute)"],
        ["4",        "Geri Yazma",      "WB",       "Sonuc registera yazilir (Write Back)"],
    ]
    elems.append(make_table(stage_data, col_widths=[1.5*cm, 3.5*cm, 2*cm, 8.5*cm]))
    elems.append(Spacer(1, 8))

    elems.append(Paragraph("Dallanma Komutu (Branch) Etkisi:", S["section"]))
    elems.append(Paragraph(
        "2. komut bir dallanma (branch) komutudur. Dallanma komutu ID asamasinda "
        "cozulur ve hedef adres belirlenir. Bu noktada pipeline'a girmis olan sonraki komut "
        "henuz dogru komut olup olmadigi bilinmemektedir. Bu durumda 1 cycle'lik bekleme "
        "(stall / bubble) eklenir.",
        S["body"]
    ))

    elems.append(Paragraph("Pipeline Diyagrami (Zaman-Uzay Diyagrami):", S["section"]))
    elems.append(Paragraph(
        "Her satirda bir komut, her sutunda bir saat dongusu (clock cycle) gosterilmektedir. "
        "B = Bubble (bos/stall dongusu).",
        S["body"]
    ))

    hdr = ["Komut \\ Cycle", "C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10"]
    rows = [
        ["K1",             "IF", "ID", "EX", "WB", "",   "",   "",   "",   "",   ""],
        ["K2 (Branch)",    "",   "IF", "ID", "EX", "WB", "",   "",   "",   "",   ""],
        ["--- Bubble ---", "",   "",   "",   "B",  "B",  "B",  "B",  "",   "",   ""],
        ["K3 (hedef)",     "",   "",   "",   "IF", "ID", "EX", "WB", "",   "",   ""],
        ["K4",             "",   "",   "",   "",   "IF", "ID", "EX", "WB", "",   ""],
        ["K5",             "",   "",   "",   "",   "",   "IF", "ID", "EX", "WB", ""],
        ["K6",             "",   "",   "",   "",   "",   "",   "IF", "ID", "EX", "WB"],
    ]

    tbl_data = [hdr] + rows
    col_w = [3.0*cm] + [1.25*cm]*10
    t = Table(tbl_data, colWidths=col_w)

    stage_colors = {
        "IF": colors.HexColor("#bbdefb"),
        "ID": colors.HexColor("#c8e6c9"),
        "EX": colors.HexColor("#ffe0b2"),
        "WB": colors.HexColor("#e1bee7"),
        "B":  colors.HexColor("#ffcdd2"),
    }

    cell_style = [
        ("BACKGROUND",    (0, 0), (-1, 0),  colors.HexColor("#1565c0")),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  colors.white),
        ("FONTNAME",      (0, 0), (-1, 0),  BOLD_FONT),
        ("FONTSIZE",      (0, 0), (-1, -1), 8),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("GRID",          (0, 0), (-1, -1), 0.5, colors.HexColor("#90caf9")),
        ("FONTNAME",      (0, 1), (-1, -1), BASE_FONT),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        # K2 satiri (index 2) sari vurgu
        ("BACKGROUND",    (0, 2), (0, 2),   colors.HexColor("#fff9c4")),
        ("FONTNAME",      (0, 2), (0, 2),   BOLD_FONT),
        # Bubble satiri (index 3) kirmizi
        ("BACKGROUND",    (0, 3), (-1, 3),  colors.HexColor("#ffcdd2")),
        ("TEXTCOLOR",     (0, 3), (-1, 3),  colors.HexColor("#b71c1c")),
        ("FONTNAME",      (0, 3), (-1, 3),  BOLD_FONT),
    ]

    for r_idx, row in enumerate(rows, start=1):
        for c_idx, cell in enumerate(row[1:], start=1):
            if cell in stage_colors and r_idx != 3:
                cell_style.append(
                    ("BACKGROUND", (c_idx, r_idx), (c_idx, r_idx), stage_colors[cell])
                )

    t.setStyle(TableStyle(cell_style))
    elems.append(t)
    elems.append(Spacer(1, 8))

    elems.append(Paragraph("Hesaplama ve Karsilastirma:", S["section"]))
    hesap_data = [
        ["Durum",                    "Formul",                    "Sonuc"],
        ["Pipeline olmadan (seri)",  "6 komut x 4 asama",         "24 cycle"],
        ["Pipeline ile (ideal)",     "4 + (6-1) = 4+5",           "9 cycle"],
        ["Pipeline + 1 bubble",      "4 + (6-1) + 1",             "10 cycle"],
        ["Hizlanma (Speedup)",       "24 / 10",                   "2.4x"],
    ]
    elems.append(make_table(hesap_data, col_widths=[5.5*cm, 5.5*cm, 4.5*cm]))

    elems.append(Paragraph(
        "SONUC: 4 kesimli pipeline ile 6 komut, 1 bubble (stall) dahil 10 clock cycle'da "
        "tamamlanir. Dallanma komutu ID asamasinda cozuldugu icin bir sonraki komut 1 cycle "
        "beklemeye alinir (pipeline stall). Bu durum olmadan 24 cycle surerdi; pipeline 2.4x hizlanma saglar.",
        S["answer_box"]
    ))
    return elems


# ────────────────────────────────────────────────────────────────────────────
# SORU 2 – Ana Bellek ve Yardimci Bellek (10p)
# ────────────────────────────────────────────────────────────────────────────
def soru2(S):
    elems = []
    elems.append(Paragraph("SORU 2 - Ana Bellek ve Yardimci Bellek  [10 Puan]", S["q_header"]))

    elems.append(Paragraph("Soru Metni:", S["section"]))
    elems.append(Paragraph(
        "Ana Bellek ve Yardimci Bellek kavramlari nedir? Ornek vererek aciklayiniz.",
        S["body"]
    ))

    elems.append(Paragraph("Ana Bellek (Primary / Main Memory):", S["section"]))
    elems.append(Paragraph(
        "Ana bellek, islemcinin (CPU) dogrudan erisebilecegi, calisma zamaninda "
        "program ve verilerin tutuldugu bellektir. Ucucu (volatile) yapidadir; "
        "yani guc kesildiginde icerik kaybolur. CPU ile dogrudan veri yolu (bus) "
        "uzerinden iletisim kurar.",
        S["body"]
    ))

    ana_data = [
        ["Ozellik",    "Aciklama"],
        ["Tur",        "RAM (Random Access Memory) - DRAM, SRAM"],
        ["Hiz",        "Cok hizli (nanosaniye mertebesinde erisim)"],
        ["Kapasite",   "Genellikle 4 GB - 128 GB"],
        ["Ucuculuk",   "Ucucu (Volatile) - guc kesilince veri kaybolur"],
        ["Maliyet",    "Yuksek (GB basina)"],
        ["CPU Erisimi","Dogrudan (adres yolu uzerinden)"],
        ["Ornek",      "DDR4 RAM, DDR5 RAM, SRAM (Cache bellegi)"],
    ]
    elems.append(make_table(ana_data, col_widths=[4.5*cm, 11*cm],
                            header_bg=colors.HexColor("#1565c0")))
    elems.append(Spacer(1, 6))

    elems.append(Paragraph("Yardimci Bellek (Secondary / Auxiliary Memory):", S["section"]))
    elems.append(Paragraph(
        "Yardimci bellek, kalici (non-volatile) veri depolama birimidir. CPU dogrudan "
        "erisemez; veriler once ana bellege aktarilir, sonra islemci kullanir. "
        "Guc kesilse bile veri korunur. Isletim sistemi dosya sistemi araciligiyla yonetir.",
        S["body"]
    ))

    yrd_data = [
        ["Ozellik",    "Aciklama"],
        ["Tur",        "HDD, SSD, USB Flash, CD/DVD, SD Kart"],
        ["Hiz",        "Yavas (milisaniye - mikrosaniye mertebesinde)"],
        ["Kapasite",   "Cok buyuk (500 GB - birden fazla TB)"],
        ["Ucuculuk",   "Ucucu degil (Non-Volatile) - veri kalici"],
        ["Maliyet",    "Dusuk (GB basina)"],
        ["CPU Erisimi","Dolayli (OS ve I/O kontroloru araciligiyla)"],
        ["Ornek",      "NVMe SSD, SATA HDD, USB Flash Bellek"],
    ]
    elems.append(make_table(yrd_data, col_widths=[4.5*cm, 11*cm],
                            header_bg=colors.HexColor("#0d47a1")))
    elems.append(Spacer(1, 6))

    elems.append(Paragraph("Karsilastirma Tablosu:", S["section"]))
    karsi_data = [
        ["Kriter",       "Ana Bellek",          "Yardimci Bellek"],
        ["Hiz",          "Cok Hizli (~ns)",      "Yavas (~ms)"],
        ["Kapasite",     "Kucuk-Orta (GB)",      "Cok Buyuk (TB)"],
        ["Ucuculuk",     "Ucucu",                "Kalici"],
        ["CPU Erisimi",  "Dogrudan",             "Dolayli"],
        ["Maliyet/GB",   "Yuksek",               "Dusuk"],
        ["Kullanim",     "Aktif program/veri",   "Kalici depolama"],
        ["Ornek",        "DDR5 RAM",             "NVMe SSD, HDD"],
    ]
    elems.append(make_table(karsi_data, col_widths=[4*cm, 5.5*cm, 6*cm]))
    elems.append(Spacer(1, 6))

    elems.append(Paragraph("Bellek Hiyerarsisi (Hizlidan Yavasa):", S["section"]))
    hiyerarsi = [
        ["Seviye", "Tur",              "Hiz",       "Kapasite",    "Tur Sinifi"],
        ["L1",     "Cache (SRAM)",     "~1 ns",     "32-64 KB",    "Ana Bellek"],
        ["L2",     "Cache (SRAM)",     "~5 ns",     "256KB-1MB",   "Ana Bellek"],
        ["L3",     "Cache (SRAM)",     "~20 ns",    "4-64 MB",     "Ana Bellek"],
        ["RAM",    "DRAM",             "~100 ns",   "4-128 GB",    "Ana Bellek"],
        ["SSD",    "Flash Bellek",     "~100 us",   "256GB-4TB",   "Yardimci"],
        ["HDD",    "Manyetik Disk",    "~10 ms",    "500GB-10TB",  "Yardimci"],
    ]
    elems.append(make_table(hiyerarsi,
                            col_widths=[1.5*cm, 3.5*cm, 2.5*cm, 3*cm, 3*cm]))

    elems.append(Paragraph(
        "SONUC: Ana bellek hizli ama kucuk ve ucucu; yardimci bellek yavas ama buyuk ve "
        "kalicidir. Ikisi birlikte calisarak hem yuksek performans hem de kalici depolama saglar. "
        "Ornek: Bir Word belgesi HDD'de saklanir, acildiginda RAM'e yuklenir, CPU RAM'den okur.",
        S["answer_box"]
    ))
    return elems


# ────────────────────────────────────────────────────────────────────────────
# SORU 3 – CPU Yurutme Zamani (20p)
# ────────────────────────────────────────────────────────────────────────────
def soru3(S):
    elems = []
    elems.append(Paragraph("SORU 3 - CPU Yurutme Zamani Hesabi  [20 Puan]", S["q_header"]))

    elems.append(Paragraph("Soru Metni:", S["section"]))
    elems.append(Paragraph(
        "Komut basina dusen ortalama clock cycle CPI=2 olan 10 satirlik komut blogunun "
        "clock cycle periyodu 4 MHz ise CPU Yurutme zamani ne kadardir?",
        S["body"]
    ))

    elems.append(Paragraph("Verilen Bilgiler:", S["section"]))
    veri_data = [
        ["Sembol", "Aciklama",                           "Deger"],
        ["IC",     "Komut Sayisi (Instruction Count)",   "10 komut"],
        ["CPI",    "Komut Basina Ortalama Cycle",        "2"],
        ["f",      "Saat Frekansi (Clock Frequency)",    "4 MHz = 4 x 10^6 Hz"],
        ["T",      "Saat Periyodu (Clock Period)",       "T = 1 / f"],
    ]
    elems.append(make_table(veri_data, col_widths=[2*cm, 7.5*cm, 6*cm]))
    elems.append(Spacer(1, 8))

    elems.append(Paragraph("Temel Formul:", S["section"]))
    elems.append(Paragraph(
        "CPU Yurutme Zamani = IC x CPI x T  =  IC x CPI / f",
        S["formula"]
    ))

    elems.append(Paragraph("Adim Adim Cozum:", S["section"]))
    adim_data = [
        ["Adim", "Islem",                                    "Hesaplama",                    "Sonuc"],
        ["1",    "Saat Periyodunu Bul",                      "T = 1 / f = 1 / 4.000.000",   "T = 0,25 us"],
        ["2",    "Toplam Cycle Sayisini Bul",                "IC x CPI = 10 x 2",            "20 cycle"],
        ["3",    "CPU Zamanini Hesapla",                     "20 cycle x 0,25 us/cycle",     "5 us"],
        ["4",    "Sonuc",                                    "CPU Yurutme Zamani",            "5 mikrosaniye"],
    ]
    elems.append(make_table(adim_data, col_widths=[1.2*cm, 4.5*cm, 5.5*cm, 4.3*cm]))
    elems.append(Spacer(1, 8))

    elems.append(Paragraph("Detayli Hesaplama:", S["section"]))
    elems.append(Paragraph(
        "Adim 1: Saat Periyodu",
        S["body_bold"]
    ))
    elems.append(Paragraph(
        "f = 4 MHz = 4.000.000 Hz",
        S["body"]
    ))
    elems.append(Paragraph(
        "T = 1 / f = 1 / 4.000.000 = 0,00000025 saniye = 0,25 mikrosaniye (us)",
        S["body"]
    ))
    elems.append(Paragraph(
        "Adim 2: Toplam Cycle Sayisi",
        S["body_bold"]
    ))
    elems.append(Paragraph(
        "Toplam Cycle = IC x CPI = 10 x 2 = 20 cycle",
        S["body"]
    ))
    elems.append(Paragraph(
        "Adim 3: CPU Yurutme Zamani",
        S["body_bold"]
    ))
    elems.append(Paragraph(
        "CPU Suresi = Toplam Cycle x T = 20 x 0,25 us = 5 us",
        S["body"]
    ))
    elems.append(Paragraph(
        "Alternatif: CPU Suresi = IC x CPI / f = (10 x 2) / 4.000.000 = 20 / 4.000.000 = 0,000005 s = 5 us",
        S["body"]
    ))

    elems.append(Paragraph(
        "SONUC: CPU Yurutme Zamani = 5 mikrosaniye (5 us = 0,000005 saniye)",
        S["answer_box"]
    ))

    elems.append(Paragraph("Performans Formulleri Ozeti:", S["section"]))
    form_data = [
        ["Formul",                                    "Aciklama"],
        ["CPU Suresi = IC x CPI x T",                "Temel formul"],
        ["CPU Suresi = IC x CPI / f",                "Frekans ile"],
        ["CPI = Toplam Cycle / IC",                  "Ortalama CPI hesabi"],
        ["Speedup = T_eski / T_yeni",                "Hizlanma orani"],
        ["MIPS = f / (CPI x 10^6)",                  "Milyon komut/saniye"],
    ]
    elems.append(make_table(form_data, col_widths=[8*cm, 7.5*cm]))

    elems.append(Paragraph(
        "Not: CPI dusukse program daha hizli; f yuksekse islemci daha hizli; "
        "IC azsa kod daha verimlidir.",
        S["note"]
    ))
    return elems


# ────────────────────────────────────────────────────────────────────────────
# SORU 4 – R-Tipi, I-Tipi, J-tipi Komut Formatlari (15p)
# ────────────────────────────────────────────────────────────────────────────
def soru4(S):
    elems = []
    elems.append(Paragraph("SORU 4 - MIPS Komut Formatlari (R, I, J Tipi)  [15 Puan]", S["q_header"]))

    elems.append(Paragraph("Soru Metni:", S["section"]))
    elems.append(Paragraph(
        "R-Tipi, I-Tipi, J-tipi komut formatlarini gosteriniz ve bolumlerini aciklayiniz.",
        S["body"]
    ))
    elems.append(Paragraph(
        "MIPS mimarisinde tum komutlar 32 bit uzunlugundadir. Uc temel format vardir:",
        S["body"]
    ))

    genel_data = [
        ["Format",  "Tam Ad",          "Kullanim Alani",                    "Ornek Komutlar"],
        ["R-Tipi",  "Register Type",   "Register-register aritmetik/mantik","add, sub, and, or, slt, jr"],
        ["I-Tipi",  "Immediate Type",  "Anlik deger, bellek, dallanma",     "addi, lw, sw, beq, bne"],
        ["J-Tipi",  "Jump Type",       "Kosulsuz atlama",                   "j, jal"],
    ]
    elems.append(make_table(genel_data, col_widths=[2*cm, 3*cm, 5.5*cm, 5*cm]))
    elems.append(Spacer(1, 8))

    # ── R-Tipi ──
    elems.append(Paragraph("1) R-Tipi (Register Type) - A