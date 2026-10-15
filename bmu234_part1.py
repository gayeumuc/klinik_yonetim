# -*- coding: utf-8 -*-
"""BMU234 - Soru 1, 2, 3 cozumleri"""
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, PageBreak

BF = "DV"
BB = "DVB"

def tbl(data, cw=None, hbg=None):
    hbg = hbg or colors.HexColor("#1565c0")
    t = Table(data, colWidths=cw)
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),hbg),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("FONTNAME",(0,0),(-1,0),BB),
        ("FONTSIZE",(0,0),(-1,-1),8),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#90caf9")),
        ("FONTNAME",(0,1),(-1,-1),BF),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#e3f2fd")]),
        ("TOPPADDING",(0,0),(-1,-1),4),
        ("BOTTOMPADDING",(0,0),(-1,-1),4),
    ]))
    return t

def soru1(s):
    e = []
    e.append(Paragraph("SORU 1 - Pipeline (Boru Hatti) Diyagrami  [20 Puan]", s["QH"]))
    e.append(Paragraph(
        "Soru: 4 kesimli boru hattina ve 6 komuta sahip, 2. komutunda dallanma olan "
        "pipeline diyagramini ciziniz.", s["B"]))

    e.append(Paragraph("Pipeline Nedir?", s["SC"]))
    e.append(Paragraph(
        "Pipeline, bir islemi birden fazla asama (stage) halinde paralel yurutme teknigi. "
        "Her asama farkli bir komutun farkli adimini ayni anda isler, boylece verim artar.", s["B"]))

    e.append(Paragraph("4 Kesimli Pipeline Asamalari:", s["SC"]))
    e.append(tbl([
        ["Asama","Kisaltma","Aciklama"],
        ["1 - Komut Getirme (IF)","IF","Komut bellekten getirilir"],
        ["2 - Komut Cozme (ID)","ID","Komut cozulur, registerlar okunur"],
        ["3 - Yurutme (EX)","EX","ALU islemi gerceklestirilir"],
        ["4 - Geri Yazma (WB)","WB","Sonuc registera yazilir"],
    ], cw=[5.5*cm, 2*cm, 8*cm]))
    e.append(Spacer(1,5))

    e.append(Paragraph("Dallanma (Branch) Etkisi:", s["SC"]))
    e.append(Paragraph(
        "2. komut branch komutudur. Branch hedefi ID asamasinda belirlenir. "
        "Bu sirada pipeline'a giren 3. komutun dogru olup olmadigi bilinmez. "
        "Sonuc: 1 cycle STALL (bubble) eklenir.", s["B"]))

    e.append(Paragraph("Pipeline Zaman-Uzay Diyagrami:", s["SC"]))
    e.append(Paragraph("IF=mavi | ID=yesil | EX=turuncu | WB=mor | B=kirmizi(bubble)", s["N"]))

    hdr = ["Komut","C1","C2","C3","C4","C5","C6","C7","C8","C9","C10"]
    rows = [
        ["K1",          "IF","ID","EX","WB","",  "",  "",  "",  "",  ""],
        ["K2 (Branch)", "",  "IF","ID","EX","WB","",  "",  "",  "",  ""],
        ["** BUBBLE **", "", "",  "",  "B", "B", "B", "B", "",  "",  ""],
        ["K3 (hedef)",  "",  "",  "",  "IF","ID","EX","WB","",  "",  ""],
        ["K4",          "",  "",  "",  "",  "IF","ID","EX","WB","",  ""],
        ["K5",          "",  "",  "",  "",  "",  "IF","ID","EX","WB",""],
        ["K6",          "",  "",  "",  "",  "",  "",  "IF","ID","EX","WB"],
    ]
    sc = {
        "IF": colors.HexColor("#bbdefb"),
        "ID": colors.HexColor("#c8e6c9"),
        "EX": colors.HexColor("#ffe0b2"),
        "WB": colors.HexColor("#e1bee7"),
        "B":  colors.HexColor("#ffcdd2"),
    }
    cw_p = [3.0*cm]+[1.25*cm]*10
    pt = Table([hdr]+rows, colWidths=cw_p)
    cs = [
        ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#1565c0")),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("FONTNAME",(0,0),(-1,0),BB),
        ("FONTSIZE",(0,0),(-1,-1),7),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#90caf9")),
        ("FONTNAME",(0,1),(-1,-1),BF),
        ("TOPPADDING",(0,0),(-1,-1),3),
        ("BOTTOMPADDING",(0,0),(-1,-1),3),
        ("BACKGROUND",(0,3),(-1,3),colors.HexColor("#ffcdd2")),
        ("TEXTCOLOR",(0,3),(-1,3),colors.HexColor("#b71c1c")),
        ("FONTNAME",(0,3),(-1,3),BB),
    ]
    for ri, row in enumerate(rows, 1):
        for ci, cell in enumerate(row[1:], 1):
            if cell in sc and ri != 3:
                cs.append(("BACKGROUND",(ci,ri),(ci,ri),sc[cell]))
    pt.setStyle(TableStyle(cs))
    e.append(pt)
    e.append(Spacer(1,5))

    e.append(tbl([
        ["Durum","Formul","Sonuc"],
        ["Pipeline olmadan","6 x 4 asama","24 cycle"],
        ["Pipeline (ideal)","4 + (6-1)","9 cycle"],
        ["Pipeline + bubble","4 + (6-1) + 1","10 cycle"],
        ["Hizlanma","24 / 10","2.4x"],
    ], cw=[5.5*cm, 5.5*cm, 4.5*cm]))
    e.append(Paragraph(
        "SONUC: 4 kesimli pipeline + 1 bubble ile 6 komut 10 cycle'da tamamlanir. "
        "Dallanma komutu ID'de cozulur, 1 stall eklenir. Pipeline 2.4x hizlanma saglar.",
        s["A"]))
    e.append(PageBreak())
    return e


def soru2(s):
    e = []
    e.append(Paragraph("SORU 2 - Ana Bellek ve Yardimci Bellek  [10 Puan]", s["QH"]))
    e.append(Paragraph(
        "Soru: Ana Bellek ve Yardimci Bellek kavramlari nedir? Ornek vererek aciklayiniz.",
        s["B"]))

    e.append(Paragraph("Ana Bellek (Primary / Main Memory):", s["SC"]))
    e.append(Paragraph(
        "CPU'nun dogrudan erisebilecegi, calisma zamaninda program ve verilerin tutuldugu "
        "bellektir. Ucucu (volatile) yapidadir - guc kesilince veri kaybolur.", s["B"]))
    e.append(tbl([
        ["Ozellik","Aciklama"],
        ["Tur","RAM - DRAM (ana bellek), SRAM (cache)"],
        ["Hiz","Cok hizli (~nanosaniye)"],
        ["Kapasite","4 GB - 128 GB"],
        ["Ucuculuk","Ucucu (Volatile) - guc kesilince kaybolur"],
        ["CPU Erisimi","Dogrudan (adres/veri yolu)"],
        ["Ornek","DDR4 RAM, DDR5 RAM, L1/L2/L3 Cache"],
    ], cw=[4.5*cm, 11*cm]))
    e.append(Spacer(1,5))

    e.append(Paragraph("Yardimci Bellek (Secondary / Auxiliary Memory):", s["SC"]))
    e.append(Paragraph(
        "Kalici (non-volatile) veri depolama birimidir. CPU dogrudan erisemez; "
        "veriler once RAM'e aktarilir. Guc kesilse bile veri korunur.", s["B"]))
    e.append(tbl([
        ["Ozellik","Aciklama"],
        ["Tur","HDD, SSD, USB Flash, CD/DVD, SD Kart"],
        ["Hiz","Yavas (~milisaniye / mikrosaniye)"],
        ["Kapasite","500 GB - 10+ TB"],
        ["Ucuculuk","Kalici (Non-Volatile) - veri korunur"],
        ["CPU Erisimi","Dolayli (OS + I/O kontroloru)"],
        ["Ornek","NVMe SSD, SATA HDD, USB Flash Bellek"],
    ], cw=[4.5*cm, 11*cm], hbg=colors.HexColor("#0d47a1")))
    e.append(Spacer(1,5))

    e.append(Paragraph("Karsilastirma Tablosu:", s["SC"]))
    e.append(tbl([
        ["Kriter","Ana Bellek","Yardimci Bellek"],
        ["Hiz","Cok Hizli (~ns)","Yavas (~ms)"],
        ["Kapasite","Kucuk-Orta (GB)","Cok Buyuk (TB)"],
        ["Ucuculuk","Ucucu","Kalici"],
        ["CPU Erisimi","Dogrudan","Dolayli"],
        ["Maliyet/GB","Yuksek","Dusuk"],
        ["Ornek","DDR5 RAM","NVMe SSD, HDD"],
    ], cw=[4*cm, 5.5*cm, 6*cm]))
    e.append(Spacer(1,5))

    e.append(Paragraph("Bellek Hiyerarsisi (Hizlidan Yavasa):", s["SC"]))
    e.append(tbl([
        ["Seviye","Tur","Hiz","Kapasite","Sinif"],
        ["L1 Cache","SRAM","~1 ns","32-64 KB","Ana Bellek"],
        ["L2 Cache","SRAM","~5 ns","256KB-1MB","Ana Bellek"],
        ["L3 Cache","SRAM","~20 ns","4-64 MB","Ana Bellek"],
        ["RAM","DRAM","~100 ns","4-128 GB","Ana Bellek"],
        ["SSD","Flash","~100 us","256GB-4TB","Yardimci"],
        ["HDD","Manyetik","~10 ms","500GB-10TB","Yardimci"],
    ], cw=[2.5*cm, 3*cm, 2.5*cm, 3*cm, 2.5*cm]))
    e.append(Paragraph(
        "SONUC: Ana bellek hizli/ucucu/kucuk; yardimci bellek yavas/kalici/buyuktur. "
        "Ornek: Word belgesi HDD'de saklanir, acilinca RAM'e yuklenir, CPU RAM'den okur.",
        s["A"]))
    e.append(PageBreak())
    return e


def soru3(s):
    e = []
    e.append(Paragraph("SORU 3 - CPU Yurutme Zamani Hesabi  [20 Puan]", s["QH"]))
    e.append(Paragraph(
        "Soru: CPI=2 olan 10 satirlik komut blogu, 4 MHz saat frekansiyla calisiyorsa "
        "CPU Yurutme zamani ne kadardir?", s["B"]))

    e.append(Paragraph("Verilen Bilgiler:", s["SC"]))
    e.append(tbl([
        ["Sembol","Aciklama","Deger"],
        ["IC","Komut Sayisi (Instruction Count)","10 komut"],
        ["CPI","Komut Basina Ortalama Cycle","2"],
        ["f","Saat Frekansi (Clock Frequency)","4 MHz = 4.000.000 Hz"],
        ["T","Saat Periyodu (Clock Period)","T = 1 / f"],
    ], cw=[2*cm, 7.5*cm, 6*cm]))
    e.append(Spacer(1,6))

    e.append(Paragraph("Temel Formul:", s["SC"]))
    e.append(Paragraph("CPU Yurutme Zamani = IC x CPI x T = IC x CPI / f", s["F"]))

    e.append(Paragraph("Adim Adim Cozum:", s["SC"]))
    e.append(tbl([
        ["Adim","Islem","Hesaplama","Sonuc"],
        ["1","Saat Periyodu","T = 1 / 4.000.000","T = 0,25 us"],
        ["2","Toplam Cycle","IC x CPI = 10 x 2","20 cycle"],
        ["3","CPU Zamani","20 x 0,25 us","5 us"],
        ["4","Sonuc","CPU Yurutme Zamani","5 mikrosaniye"],
    ], cw=[1.2*cm, 4.5*cm, 5.5*cm, 4.3*cm]))
    e.append(Spacer(1,6))

    e.append(Paragraph("Detayli Hesaplama:", s["SC"]))
    e.append(Paragraph("Adim 1 - Saat Periyodu:", s["BB"]))
    e.append(Paragraph("f = 4 MHz = 4.000.000 Hz", s["B"]))
    e.append(Paragraph("T = 1 / 4.000.000 = 0,00000025 s = 0,25 us (mikrosaniye)", s["B"]))
    e.append(Paragraph("Adim 2 - Toplam Cycle:", s["BB"]))
    e.append(Paragraph("Toplam Cycle = IC x CPI = 10 x 2 = 20 cycle", s["B"]))
    e.append(Paragraph("Adim 3 - CPU Zamani:", s["BB"]))
    e.append(Paragraph("CPU Suresi = 20 cycle x 0,25 us/cycle = 5 us", s["B"]))
    e.append(Paragraph(
        "Kontrol: IC x CPI / f = (10 x 2) / 4.000.000 = 20 / 4.000.000 = 0,000005 s = 5 us",
        s["B"]))
    e.append(Paragraph("SONUC: CPU Yurutme Zamani = 5 mikrosaniye (5 us)", s["A"]))

    e.append(Paragraph("Performans Formulleri Ozeti:", s["SC"]))
    e.append(tbl([
        ["Formul","Aciklama"],
        ["CPU Suresi = IC x CPI / f","Temel CPU performans formulu"],
        ["CPI = Toplam Cycle / IC","Ortalama CPI hesabi"],
        ["Speedup = T_eski / T_yeni","Hizlanma orani"],
        ["MIPS = f / (CPI x 10^6)","Milyon komut/saniye"],
    ], cw=[8*cm, 7.5*cm]))
    e.append(Paragraph(
        "Not: CPI dusukse program hizli; f yuksekse islemci hizli; IC azsa kod verimli.",
        s["N"]))
    e.append(PageBreak())
    return e