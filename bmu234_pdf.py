# -*- coding: utf-8 -*-
"""BMU234 Final Sinavi - Tam Cozum PDF"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import os

# Font
def reg_fonts():
    for name, f in [("DV","DejaVuSans.ttf"),("DVB","DejaVuSans-Bold.ttf")]:
        p = os.path.join("C:/Windows/Fonts", f)
        if os.path.exists(p):
            pdfmetrics.registerFont(TTFont(name, p))
    return ("DV","DVB") if os.path.exists("C:/Windows/Fonts/DejaVuSans.ttf") else ("Helvetica","Helvetica-Bold")

BF, BB = reg_fonts()

# Stiller
def S():
    d = {}
    d["T"]  = ParagraphStyle("T",  fontName=BB, fontSize=15, textColor=colors.HexColor("#1a237e"), alignment=TA_CENTER, spaceAfter=3)
    d["ST"] = ParagraphStyle("ST", fontName=BF, fontSize=10, textColor=colors.HexColor("#283593"), alignment=TA_CENTER, spaceAfter=10)
    d["QH"] = ParagraphStyle("QH", fontName=BB, fontSize=12, textColor=colors.white, backColor=colors.HexColor("#1565c0"), borderPad=5, spaceAfter=7, spaceBefore=12, leftIndent=4)
    d["SC"] = ParagraphStyle("SC", fontName=BB, fontSize=10, textColor=colors.HexColor("#0d47a1"), spaceAfter=3, spaceBefore=7)
    d["B"]  = ParagraphStyle("B",  fontName=BF, fontSize=9,  leading=14, spaceAfter=4, alignment=TA_JUSTIFY)
    d["BB"] = ParagraphStyle("BB", fontName=BB, fontSize=9,  leading=14, spaceAfter=3)
    d["F"]  = ParagraphStyle("F",  fontName=BB, fontSize=11, textColor=colors.HexColor("#b71c1c"), alignment=TA_CENTER, spaceAfter=5, spaceBefore=3)
    d["A"]  = ParagraphStyle("A",  fontName=BB, fontSize=9,  textColor=colors.HexColor("#1b5e20"), backColor=colors.HexColor("#e8f5e9"), borderPad=5, spaceAfter=7)
    d["N"]  = ParagraphStyle("N",  fontName=BF, fontSize=8,  textColor=colors.HexColor("#4a148c"), backColor=colors.HexColor("#f3e5f5"), borderPad=3, spaceAfter=5, leading=12)
    return d

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

def build():
    s = S()
    W = 15.5*cm  # kullanilabilir genislik

    elems = []

    # ── BASLIK ──
    elems.append(Paragraph("MUNZUR UNIVERSITESI", s["T"]))
    elems.append(Paragraph("BMU234 - Bilgisayar Organizasyonu ve Tasarimi | Final Cozumleri | Bahar 2024", s["ST"]))
    elems.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1565c0"), spaceAfter=8))

    # ════════════════════════════════════════════════════════
    # SORU 1 - Pipeline
    # ════════════════════════════════════════════════════════
    elems.append(Paragraph("SORU 1 - Pipeline (Boru Hatti) Diyagrami  [20 Puan]", s["QH"]))
    elems.append(Paragraph("Soru: 4 kesimli boru hattina ve 6 komuta sahip, 2. komutunda dallanma olan pipeline diyagramini ciziniz.", s["B"]))

    elems.append(Paragraph("Pipeline Nedir?", s["SC"]))
    elems.append(Paragraph(
        "Pipeline, bir islemi birden fazla asama (stage) halinde paralel yurutme teknigi. "
        "Her asama farkli bir komutun farkli adimini ayni anda isler, boylece verim artar.", s["B"]))

    elems.append(Paragraph("4 Kesimli Pipeline Asamalari:", s["SC"]))
    elems.append(tbl([
        ["Asama","Kisaltma","Aciklama"],
        ["1 - Komut Getirme","IF","Komut bellekten getirilir (Instruction Fetch)"],
        ["2 - Komut Cozme","ID","Komut cozulur, registerlar okunur (Instruction Decode)"],
        ["3 - Yurutme","EX","ALU islemi gerceklestirilir (Execute)"],
        ["4 - Geri Yazma","WB","Sonuc registera yazilir (Write Back)"],
    ], cw=[5*cm, 2*cm, 8.5*cm]))
    elems.append(Spacer(1,6))

    elems.append(Paragraph("Dallanma (Branch) Etkisi:", s["SC"]))
    elems.append(Paragraph(
        "2. komut branch komutudur. Branch hedefi ID asamasinda belirlenir. "
        "Bu sirada pipeline'a giren 3. komutun dogru olup olmadigi bilinmez. "
        "Sonuc: 1 cycle STALL (bubble) eklenir.", s["B"]))

    elems.append(Paragraph("Pipeline Zaman-Uzay Diyagrami:", s["SC"]))
    elems.append(Paragraph("IF=mavi, ID=yesil, EX=turuncu, WB=mor, B=kirmizi(bubble)", s["N"]))

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
    sc = {"IF":colors.HexColor("#bbdefb"),"ID":colors.HexColor("#c8e6c9"),
          "EX":colors.HexColor("#ffe0b2"),"WB":colors.HexColor("#e1bee7"),
          "B":colors.HexColor("#ffcdd2")}
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
    elems.append(pt)
    elems.append(Spacer(1,6))

    elems.append(tbl([
        ["Durum","Formul","Sonuc"],
        ["Pipeline olmadan","6 x 4 asama","24 cycle"],
        ["Pipeline (ideal)","4 + (6-1)","9 cycle"],
        ["Pipeline + bubble","4 + (6-1) + 1","10 cycle"],
        ["Hizlanma","24 / 10","2.4x"],
    ], cw=[5.5*cm, 5.5*cm, 4.5*cm]))
    elems.append(Paragraph(
        "SONUC: 4 kesimli pipeline + 1 bubble ile 6 komut 10 cycle'da tamamlanir. "
        "Dallanma komutu ID'de cozulur, 1 stall eklenir. Pipeline 2.4x hizlanma saglar.",
        s["A"]))

    elems.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # SORU 2 - Ana Bellek / Yardimci Bellek
    # ════════════════════════════════════════════════════════
    elems.append(Paragraph("SORU 2 - Ana Bellek ve Yardimci Bellek  [10 Puan]", s["QH"]))
    elems.append(Paragraph("Soru: Ana Bellek ve Yardimci Bellek kavramlari nedir? Ornek vererek aciklayiniz.", s["B"]))

    elems.append(Paragraph("Ana Bellek (Primary / Main Memory):", s["SC"]))
    elems.append(Paragraph(
        "CPU'nun dogrudan erisebilecegi, calisma zamaninda program ve verilerin tutuldugu bellektir. "
        "Ucucu (volatile) yapidadir - guc kesilince veri kaybolur.", s["B"]))
    elems.append(tbl([
        ["Ozellik","Aciklama"],
        ["Tur","RAM - DRAM (ana bellek), SRAM (cache)"],
        ["Hiz","Cok hizli (~nanosaniye)"],
        ["Kapasite","4 GB - 128 GB"],
        ["Ucuculuk","Ucucu (Volatile) - guc kesilince kaybolur"],
        ["CPU Erisimi","Dogrudan (adres/veri yolu)"],
        ["Ornek","DDR4 RAM, DDR5 RAM, L1/L2/L3 Cache"],
    ], cw=[4.5*cm, 11*cm]))
    elems.append(Spacer(1,5))

    elems.append(Paragraph("Yardimci Bellek (Secondary / Auxiliary Memory):", s["SC"]))
    elems.append(Paragraph(
        "Kalici (non-volatile) veri depolama birimidir. CPU dogrudan erisemez; "
        "veriler once RAM'e aktarilir. Guc kesilse bile veri korunur.", s["B"]))
    elems.append(tbl([
        ["Ozellik","Aciklama"],
        ["Tur","HDD, SSD, USB Flash, CD/DVD, SD Kart"],
        ["Hiz","Yavas (~milisaniye / mikrosaniye)"],
        ["Kapasite","500 GB - 10+ TB"],
        ["Ucuculuk","Kalici (Non-Volatile) - veri korunur"],
        ["CPU Erisimi","Dolayli (OS + I/O kontroloru)"],
        ["Ornek","NVMe SSD, SATA HDD, USB Flash Bellek"],
    ], cw=[4.5*cm, 11*cm], hbg=colors.HexColor("#0d47a1")))
    elems.append(Spacer(1,5))

    elems.append(Paragraph("Karsilastirma:", s["SC"]))
    elems.append(tbl([
        ["Kriter","Ana Bellek","Yardimci Bellek"],
        ["Hiz","Cok Hizli (~ns)","Yavas (~ms)"],
        ["Kapasite","Kucuk-Orta (GB)","Cok Buyuk (TB)"],
        ["Ucuculuk","Ucucu","Kalici"],
        ["CPU Erisimi","Dogrudan","Dolayli"],
        ["Maliyet/GB","Yuksek","Dusuk"],
        ["Ornek","DDR5 RAM","NVMe SSD, HDD"],
    ], cw=[4*cm, 5.5*cm, 6*cm]))
    elems.append(Spacer(1,5))

    elems.append(Paragraph("Bellek Hiyerarsisi:", s["SC"]))
    elems.append(tbl([
        ["Seviye","Tur","Hiz","Kapasite","Sinif"],
        ["L1 Cache","SRAM","~1 ns","32-64 KB","Ana"],
        ["L2 Cache","SRAM","~5 ns","256KB-1MB","Ana"],
        ["L3 Cache","SRAM","~20 ns","4-64 MB","Ana"],
        ["RAM","DRAM","~100 ns","4-128 GB","Ana"],
        ["SSD","Flash","~100 us","256GB-4TB","Yardimci"],
        ["HDD","Manyetik","~10 ms","500GB-10TB","Yardimci"],
    ], cw=[2*cm, 3*cm, 2.5*cm, 3*cm, 2.5*cm]))
    elems.append(Paragraph(
        "SONUC: Ana bellek hizli/ucucu/kucuk; yardimci bellek yavas/kalici/buyuktur. "
        "Ornek: Word belgesi HDD'de saklanir, acilinca RAM'e yuklenir, CPU RAM'den okur.",
        s["A"]))

    elems.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # SORU 3 - CPU Yurutme Zamani
    # ════════════════════════════════════════════════════════
    elems.append(Paragraph("SORU 3 - CPU Yurutme Zamani Hesabi  [20 Puan]", s["QH"]))
    elems.append(Paragraph(
        "Soru: CPI=2 olan 10 satirlik komut blogu, 4 MHz saat frekansiyla calisiyorsa "
        "CPU Yurutme zamani ne kadardir?", s["B"]))

    elems.append(Paragraph("Verilen Bilgiler:", s["SC"]))
    elems.append(tbl([
        ["Sembol","Aciklama","Deger"],
        ["IC","Komut Sayisi (Instruction Count)","10 komut"],
        ["CPI","Komut Basina Ortalama Cycle","2"],
        ["f","Saat Frekansi","4 MHz = 4.000.000 Hz"],
        ["T","Saat Periyodu","T = 1 / f"],
    ], cw=[2*cm, 7.5*cm, 6*cm]))
    elems.append(Spacer(1,6))

    elems.append(Paragraph("Temel Formul:", s["SC"]))
    elems.append(Paragraph("CPU Yurutme Zamani = IC x CPI x T = IC x CPI / f", s["F"]))

    elems.append(Paragraph("Adim Adim Cozum:", s["SC"]))
    elems.append(tbl([
        ["Adim","Islem","Hesaplama","Sonuc"],
        ["1","Saat Periyodu","T = 1 / 4.000.000","T = 0,25 us"],
        ["2","Toplam Cycle","IC x CPI = 10 x 2","20 cycle"],
        ["3","CPU Zamani","20 x 0,25 us","5 us"],
        ["4","Sonuc","CPU Yurutme Zamani","5 mikrosaniye"],
    ], cw=[1.2*cm, 4.5*cm, 5.5*cm, 4.3*cm]))
    elems.append(Spacer(1,6))

    elems.append(Paragraph("Detayli Hesaplama:", s["SC"]))
    elems.append(Paragraph("Adim 1 - Saat Periyodu:", s["BB"]))
    elems.append(Paragraph("f = 4 MHz = 4.000.000 Hz", s["B"]))
    elems.append(Paragraph("T = 1 / 4.000.000 = 0,00000025 s = 0,25 us (mikrosaniye)", s["B"]))
    elems.append(Paragraph("Adim 2 - Toplam Cycle:", s["BB"]))
    elems.append(Paragraph("Toplam Cycle = IC x CPI = 10 x 2 = 20 cycle", s["B"]))
    elems.append(Paragraph("Adim 3 - CPU Zamani:", s["BB"]))
    elems.append(Paragraph("CPU Suresi = 20 cycle x 0,25 us/cycle = 5 us", s["B"]))
    elems.append(Paragraph("Kontrol: (10 x 2) / 4.000.000 = 20 / 4.000.000 = 0,000005 s = 5 us", s["B"]))
    elems.append(Paragraph("SONUC: CPU Yurutme Zamani = 5 mikrosaniye (5 us)", s["A"]))

    elems.append(Paragraph("Performans Formulleri:", s["SC"]))
    elems.append(tbl([
        ["Formul","Aciklama"],
        ["CPU Suresi = IC x CPI / f","Temel CPU performans formulu"],
        ["CPI = Toplam Cycle / IC","Ortalama CPI hesabi"],
        ["Speedup = T_eski / T_yeni","Hizlanma orani"],
        ["MIPS = f / (CPI x 10^6)","Milyon komut/saniye"],
    ], cw=[8*cm, 7.5*cm]))
    elems.append(Paragraph(
        "Not: CPI dusukse program hizli; f yuksekse islemci hizli; IC azsa kod verimli.",
        s["N"]))

    elems.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # SORU 4 - R/I/J Tipi Komut Formatlari
    # ════════════════════════════════════════════════════════
    elems.append(Paragraph("SORU 4 - MIPS Komut Formatlari (R, I, J Tipi)  [15 Puan]", s["QH"]))
    elems.append(Paragraph("Soru: R-Tipi, I-Tipi, J-tipi komut formatlarini gosteriniz ve bolumlerini aciklayiniz.", s["B"]))
    elems.append(Paragraph("MIPS mimarisinde tum komutlar 32 bit uzunlugundadir. Uc temel format:", s["B"]))
    elems.append(tbl([
        ["Format","Tam Ad","Kullanim","Ornek Komutlar"],
        ["R-Tipi","Register Type","Register-register islemler","add, sub, and, or, slt, jr"],
        ["I-Tipi","Immediate Type","Anlik deger, bellek, branch","addi, lw, sw, beq, bne"],
        ["J-Tipi","Jump Type","Kosulsuz atlama","j, jal"],
    ], cw=[2*cm, 3.5*cm, 5*cm, 5*cm]))
    elems.append(Spacer(1,8))

    # R-Tipi
    elems.append(Paragraph("1) R-Tipi (Register Type):", s["SC"]))
    elems.append(Paragraph("Register'lar arasinda aritmetik/mantik islem yapar. op alani daima 000000'dir.", s["B"]))
    elems.append(tbl([
        ["op (6 bit)","rs (5 bit)","rt (5 bit)","rd (5 bit)","shamt (5 bit)","funct (6 bit)"],
        ["000000","kaynak reg 1","kaynak reg 2","hedef reg","kayma miktari","islem kodu"],
    ], cw=[2.5*cm]*6, hbg=colors.HexColor("#1b5e20")))
    elems.append(Spacer(1,3))
    elems.append(tbl([
        ["Alan","Bit","Aciklama"],
        ["op","6","Opcode - R-tipi icin daima 000000"],
        ["rs","5","Kaynak register 1 (source 1)"],
        ["rt","5","Kaynak register 2 (source 2)"],
        ["rd","5","Hedef register (destination)"],
        ["shamt","5","Shift amount - kaydirma miktari (kaydirma yoksa 00000)"],
        ["funct","6","Function code - hangi ALU islemi yapilacagi"],
    ], cw=[2*cm, 1.5*cm, 12*cm], hbg=colors.HexColor("#2e7d32")))
    elems.append(Paragraph(
        "Ornek: add $t0, $t1, $t2  =>  op=000000 | rs=01001($t1) | rt=01010($t2) | rd=01000($t0) | shamt=00000 | funct=100000",
        s["N"]))
    elems.append(Spacer(1,8))

    # I-Tipi
    elems.append(Paragraph("2) I-Tipi (Immediate Type):", s["SC"]))
    elems.append(Paragraph("Bir register ve 16-bit anlik deger kullanir. Bellek erisimi ve dallanma icin.", s["B"]))
    elems.append(tbl([
        ["op (6 bit)","rs (5 bit)","rt (5 bit)","immediate (16 bit)"],
        ["opcode","taban/kaynak reg","hedef reg","sabit deger / ofset"],
    ], cw=[3*cm, 3*cm, 3*cm, 6.5*cm], hbg=colors.HexColor("#0d47a1")))
    elems.append(Spacer(1,3))
    elems.append(tbl([
        ["Alan","Bit","Aciklama"],
        ["op","6","Opcode - her I-tipi komutun kendine ozgu kodu"],
        ["rs","5","Kaynak/taban register (bellek erisiminde taban adres)"],
        ["rt","5","Hedef register (sonucun yazilacagi yer)"],
        ["imm","16","16-bit anlik deger, ofset veya branch adresi (isaret genisletilir)"],
    ], cw=[2*cm, 1.5*cm, 12*cm]))
    elems.append(Paragraph(
        "Ornek lw: lw $t0, 10($t1)  =>  op=100011 | rs=$t1 | rt=$t0 | imm=0000000000001010",
        s["N"]))
    elems.append(Paragraph(
        "Ornek beq: beq $t0, $t1, L  =>  op=000100 | rs=$t0 | rt=$t1 | imm=PC-relative ofset",
        s["N"]))
    elems.append(Spacer(1,8))

    # J-Tipi
    elems.append(Paragraph("3) J-Tipi (Jump Type):", s["SC"]))
    elems.append(Paragraph("Kosulsuz atlama komutlari icin. Sadece opcode ve 26-bit adres alani vardir.", s["B"]))
    elems.append(tbl([
        ["op (6 bit)","address (26 bit)"],
        ["opcode","hedef adresin 26-bit kismi"],
    ], cw=[4*cm, 11.5*cm], hbg=colors.HexColor("#4a148c")))
    elems.append(Spacer(1,3))
    elems.append(tbl([
        ["Alan","Bit","Aciklama"],
        ["op","6","Opcode: j=000010, jal=000011"],
        ["address","26","Hedef adresin 26-bit kismi (PC[31:28] + 26bit + 00 = 32bit adres)"],
    ], cw=[2*cm, 1.5*cm, 12*cm], hbg=colors.HexColor("#6a1b9a")))
    elems.append(Paragraph(
        "Ornek: j 1000  =>  op=000010 | address=00 0000 0000 0000 0011 1110 1000",
        s["N"]))
    elems.append(Spacer(1,6))

    elems.append(Paragraph("Karsilastirma Ozeti:", s["SC"]))
    elems.append(tbl([
        ["Ozellik","R-Tipi","I-Tipi","J-Tipi"],
        ["Toplam bit","32","32","32"],
        ["op alani","6 bit (000000)","6 bit","6 bit"],
        ["Anlik deger","Yok","16 bit","26 bit adres"],
        ["Hedef reg","rd (5 bit)","rt (5 bit)","Yok"],
        ["funct alani","6 bit","Yok","Yok"],
        ["Kullanim","add,sub,and,or","lw,sw,addi,beq","j,jal"],
    ], cw=[4*cm, 4*cm, 4*cm, 3.5*cm]))
    elems.append(Paragraph(
        "SONUC: R-tipi register-register islemler icin (6 alan); I-tipi anlik deger/bellek/branch icin "
        "(4 alan, 16-bit imm); J-tipi kosulsuz atlama icin (2 alan, 26-bit adres).",
        s["A"]))

    elems.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # SORU 5 - Dersten Ogrenilen Bilgiler
    # ════════════════════════════════════════════════════════
    elems.append(Paragraph("SORU 5 - Bu Ders Sayesinde Ogrenilenler  [10 Puan]", s["QH"]))
    elems.append(Paragraph("Soru: Bu ders sayesinde ogrendiginiz bilgileri kisaca yaziniz.", s["B"]))
    elems.append(Paragraph(
        "Bu soru acik uclu olup ogrencinin kendi perspektifini yansitmasi beklenir. "
        "Asagida dersin temel konulari ve kazanimlari ozetlenmistir:", s["B"]))

    elems.append(Paragraph("Dersin Ana Konulari:", s["SC"]))
    elems.append(tbl([
        ["Konu","Kazanim"],
        ["Bilgisayar Organizasyonu","CPU, bellek, I/O birimlerinin birlikte nasil calistigini ogrendim"],
        ["MIPS Mimarisi","32-bit RISC mimarisini, register yapisi ve komut setini ogrendim"],
        ["Komut Formatlari","R, I, J tiplerini ve 32-bit makine koduna donusumu ogrendim"],
        ["Pipeline","Boru hatti ile paralel komut yurutmeyi ve stall/hazard kavramlarini ogrendim"],
        ["Bellek Hiyerars