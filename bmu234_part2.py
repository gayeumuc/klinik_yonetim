# -*- coding: utf-8 -*-
"""BMU234 - Soru 4, 5, 6 cozumleri"""
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


def soru4(s):
    e = []
    e.append(Paragraph("SORU 4 - MIPS Komut Formatlari (R, I, J Tipi)  [15 Puan]", s["QH"]))
    e.append(Paragraph(
        "Soru: R-Tipi, I-Tipi, J-tipi komut formatlarini gosteriniz ve bolumlerini aciklayiniz.",
        s["B"]))
    e.append(Paragraph(
        "MIPS mimarisinde tum komutlar 32 bit uzunlugundadir. Uc temel format vardir:",
        s["B"]))
    e.append(tbl([
        ["Format","Tam Ad","Kullanim","Ornek Komutlar"],
        ["R-Tipi","Register Type","Register-register islemler","add, sub, and, or, slt, jr"],
        ["I-Tipi","Immediate Type","Anlik deger, bellek, branch","addi, lw, sw, beq, bne"],
        ["J-Tipi","Jump Type","Kosulsuz atlama","j, jal"],
    ], cw=[2*cm, 3.5*cm, 5*cm, 5*cm]))
    e.append(Spacer(1,8))

    # R-Tipi
    e.append(Paragraph("1) R-Tipi (Register Type) - Aritmetik ve Mantik Islemler:", s["SC"]))
    e.append(Paragraph(
        "Register'lar arasinda aritmetik/mantik islem yapar. "
        "op alani daima 000000'dir. funct alani hangi islemi yapacagini belirtir.",
        s["B"]))
    e.append(tbl([
        ["op (6 bit)","rs (5 bit)","rt (5 bit)","rd (5 bit)","shamt (5 bit)","funct (6 bit)"],
        ["000000","kaynak reg 1","kaynak reg 2","hedef reg","kayma miktari","islem kodu"],
    ], cw=[2.5*cm]*6, hbg=colors.HexColor("#1b5e20")))
    e.append(Spacer(1,3))
    e.append(tbl([
        ["Alan","Bit","Aciklama"],
        ["op","6","Opcode - R-tipi icin daima 000000"],
        ["rs","5","Kaynak register 1 (source register 1)"],
        ["rt","5","Kaynak register 2 (source register 2)"],
        ["rd","5","Hedef register (destination register - sonuc buraya yazilir)"],
        ["shamt","5","Shift amount - bit kaydirma miktari (kaydirma yoksa 00000)"],
        ["funct","6","Function code - hangi ALU islemi yapilacagini belirtir"],
    ], cw=[2*cm, 1.5*cm, 12*cm], hbg=colors.HexColor("#2e7d32")))
    e.append(Paragraph(
        "Ornek: add $t0, $t1, $t2  =>  "
        "op=000000 | rs=01001($t1) | rt=01010($t2) | rd=01000($t0) | shamt=00000 | funct=100000",
        s["N"]))
    e.append(Spacer(1,8))

    # I-Tipi
    e.append(Paragraph("2) I-Tipi (Immediate Type) - Anlik Degerli Komutlar:", s["SC"]))
    e.append(Paragraph(
        "Bir register ve 16-bit anlik (immediate) sabit deger kullanir. "
        "Bellek erisimi (lw/sw) ve dallanma (beq/bne) komutlari bu formattadir.",
        s["B"]))
    e.append(tbl([
        ["op (6 bit)","rs (5 bit)","rt (5 bit)","immediate (16 bit)"],
        ["opcode","taban/kaynak reg","hedef reg","sabit deger / ofset / branch adresi"],
    ], cw=[3*cm, 3*cm, 3*cm, 6.5*cm], hbg=colors.HexColor("#0d47a1")))
    e.append(Spacer(1,3))
    e.append(tbl([
        ["Alan","Bit","Aciklama"],
        ["op","6","Opcode - her I-tipi komutun kendine ozgu kodu vardir"],
        ["rs","5","Kaynak/taban register (bellek erisiminde taban adres)"],
        ["rt","5","Hedef register (sonucun yazilacagi yer)"],
        ["imm","16","16-bit anlik deger, ofset veya branch adresi (isaret genisletilir)"],
    ], cw=[2*cm, 1.5*cm, 12*cm]))
    e.append(Paragraph(
        "Ornek lw: lw $t0, 10($t1)  =>  "
        "op=100011 | rs=$t1 | rt=$t0 | imm=0000000000001010 (10)",
        s["N"]))
    e.append(Paragraph(
        "Ornek beq: beq $t0, $t1, L  =>  "
        "op=000100 | rs=$t0 | rt=$t1 | imm=PC-relative ofset degeri",
        s["N"]))
    e.append(Spacer(1,8))

    # J-Tipi
    e.append(Paragraph("3) J-Tipi (Jump Type) - Atlama Komutlari:", s["SC"]))
    e.append(Paragraph(
        "Kosulsuz atlama komutlari icin kullanilir. "
        "Sadece opcode ve 26-bit adres alani vardir.",
        s["B"]))
    e.append(tbl([
        ["op (6 bit)","address (26 bit)"],
        ["opcode","hedef adresin 26-bit kismi"],
    ], cw=[4*cm, 11.5*cm], hbg=colors.HexColor("#4a148c")))
    e.append(Spacer(1,3))
    e.append(tbl([
        ["Alan","Bit","Aciklama"],
        ["op","6","Opcode: j icin 000010, jal icin 000011"],
        ["address","26","Hedef adresin 26-bit kismi (PC[31:28] + 26bit + 00 = 32bit adres)"],
    ], cw=[2*cm, 1.5*cm, 12*cm], hbg=colors.HexColor("#6a1b9a")))
    e.append(Paragraph(
        "Ornek: j 1000  =>  op=000010 | address=00 0000 0000 0000 0011 1110 1000",
        s["N"]))
    e.append(Spacer(1,6))

    e.append(Paragraph("Karsilastirma Ozeti:", s["SC"]))
    e.append(tbl([
        ["Ozellik","R-Tipi","I-Tipi","J-Tipi"],
        ["Toplam bit","32","32","32"],
        ["op alani","6 bit (000000)","6 bit","6 bit"],
        ["Anlik deger","Yok","16 bit","26 bit adres"],
        ["Hedef reg","rd (5 bit)","rt (5 bit)","Yok"],
        ["funct alani","6 bit","Yok","Yok"],
        ["Kullanim","add,sub,and,or","lw,sw,addi,beq","j,jal"],
    ], cw=[4*cm, 4*cm, 4*cm, 3.5*cm]))
    e.append(Paragraph(
        "SONUC: R-tipi register-register islemler icin (6 alan, 32 bit); "
        "I-tipi anlik deger/bellek/branch icin (4 alan, 16-bit imm); "
        "J-tipi kosulsuz atlama icin (2 alan, 26-bit adres).",
        s["A"]))
    e.append(PageBreak())
    return e


def soru5(s):
    e = []
    e.append(Paragraph("SORU 5 - Bu Ders Sayesinde Ogrenilenler  [10 Puan]", s["QH"]))
    e.append(Paragraph(
        "Soru: Bu ders sayesinde ogrendiginiz bilgileri kisaca yaziniz.",
        s["B"]))
    e.append(Paragraph(
        "Bu soru acik uclu olup ogrencinin kendi perspektifini yansitmasi beklenir. "
        "Asagida dersin temel konulari ve kazanimlari ozetlenmistir:",
        s["B"]))

    e.append(Paragraph("Dersin Ana Konulari ve Kazanimlar:", s["SC"]))
    e.append(tbl([
        ["Konu Basligi","Ogrenilen Temel Kavramlar"],
        ["Bilgisayar Organizasyonu",
         "CPU, bellek ve I/O birimlerinin birlikte nasil calistigini ogrendim"],
        ["MIPS Mimarisi",
         "32-bit RISC mimarisini, 32 adet register ve komut setini ogrendim"],
        ["Komut Formatlari",
         "R/I/J tiplerini ve 32-bit makine koduna donusumu ogrendim"],
        ["Pipeline",
         "Boru hatti ile paralel komut yurutmeyi, stall ve hazard kavramlarini ogrendim"],
        ["Bellek Hiyerarsisi",
         "Cache, RAM ve disk arasindaki hiz/kapasite dengesini ogrendim"],
        ["CPU Performansi",
         "IC, CPI, frekans ile CPU yurutme zamani hesaplamalarini ogrendim"],
        ["Makine Kodu",
         "Assembly komutlarinin ikili (binary) makine koduna nasil cevrildigini ogrendim"],
    ], cw=[4.5*cm, 11*cm]))
    e.append(Spacer(1,6))

    e.append(Paragraph("Ornek Cevap Metni:", s["SC"]))
    e.append(Paragraph(
        "Bu ders sayesinde bilgisayarin en temel duzeyinde nasil calistigini ogrendim. "
        "MIPS assembly dili ile program yazmayi, komutlarin R/I/J formatlarinda nasil "
        "kodlandigini ve pipeline teknigi ile islemcinin nasil hizlandirildigini ogrendim. "
        "Bellek hiyerarsisini (Cache, RAM, HDD) ve CPU performans metriklerini (CPI, IC, frekans) "
        "anlayarak donanim-yazilim iliskisini daha iyi kavradim.",
        s["B"]))

    e.append(Paragraph("Dersin Onemi:", s["SC"]))
    e.append(tbl([
        ["Neden Onemli?","Aciklama"],
        ["Donanim Anlayisi","Yazilim gelistirirken donanimin nasil calistigini bilmek performansi arttirir"],
        ["Dusuk Seviye Programlama","Assembly ve makine kodu anlayisi sistem programlamada kritiktir"],
        ["Performans Optimizasyonu","CPI ve pipeline bilgisi ile verimli kod yazilabilir"],
        ["Temel Bilgisayar Bilimi","Mimarinin anlasilmasi OS, derleyici tasariminda temel olusturur"],
    ], cw=[4.5*cm, 11*cm]))
    e.append(Paragraph(
        "SONUC: Bilgisayar Organizasyonu ve Tasarimi dersi, donanim ile yazilim arasindaki "
        "kopruyu anlamamizi saglar. Bu bilgiler sistem programlama, gomulu sistemler ve "
        "yuksek performansli hesaplama alanlarinda temel olusturur.",
        s["A"]))
    e.append(PageBreak())
    return e


def soru6(s):
    e = []
    e.append(Paragraph("SORU 6 - MIPS Komutlari: Pipeline ve Makine Kodu  [25 Puan]", s["QH"]))
    e.append(Paragraph("Verilen MIPS Komutlari:", s["SC"]))
    e.append(tbl([
        ["No","Komut","Tur","Aciklama"],
        ["1","lw $t0, 10($t1)","I-Tipi","$t1+10 adresindeki bellekten $t0'a yukle"],
        ["2","sw $t3, 20($t4)","I-Tipi","$t3'u $t4+20 adresine bellege yaz"],
        ["3","add $t5, $t6, $t7","R-Tipi","$t6 + $t7 toplamini $t5'e yaz"],
        ["4","sub $t8, $t9, $t10","R-Tipi","$t9 - $t10 farkini $t8'e yaz"],
    ], cw=[1*cm, 4.5*cm, 2*cm, 8*cm]))
    e.append(Spacer(1,8))

    # 6a - Pipeline
    e.append(Paragraph("6a) Komutlarin 4 Kesimli Pipeline Gosterimi  [10 Puan]", s["SC"]))
    e.append(Paragraph(
        "4 kesimli pipeline: IF (Komut Getirme) -> ID (Komut Cozme) -> "
        "EX (Yurutme) -> WB (Geri Yazma)",
        s["B"]))
    e.append(Paragraph(
        "Veri Bagimliligina Dikkat: lw $t0 komutu WB'de biter; "
        "eger sonraki komut $t0'i kullaniyorsa stall gerekir. "
        "Bu ornekte komutlar birbirinden bagimsiz oldugu icin stall yoktur.",
        s["N"]))

    hdr6 = ["Komut","C1","C2","C3","C4","C5","C6","C7"]
    rows6 = [
        ["lw $t0,10($t1)",    "IF","ID","EX","WB","",  "",  ""],
        ["sw $t3,20($t4)",    "",  "IF","ID","EX","WB","",  ""],
        ["add $t5,$t6,$t7",   "",  "",  "IF","ID","EX","WB",""],
        ["sub $t8,$t9,$t10",  "",  "",  "",  "IF","ID","EX","WB"],
    ]
    sc6 = {
        "IF": colors.HexColor("#bbdefb"),
        "ID": colors.HexColor("#c8e6c9"),
        "EX": colors.HexColor("#ffe0b2"),
        "WB": colors.HexColor("#e1bee7"),
    }
    cw6 = [4.5*cm]+[1.6*cm]*7
    pt6 = Table([hdr6]+rows6, colWidths=cw6)
    cs6 = [
        ("BACKGROUND",(0,0),(-1,0),colors.HexColor("#1565c0")),
        ("TEXTCOLOR",(0,0),(-1,0),colors.white),
        ("FONTNAME",(0,0),(-1,0),BB),
        ("FONTSIZE",(0,0),(-1,-1),8),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("GRID",(0,0),(-1,-1),0.5,colors.HexColor("#90caf9")),
        ("FONTNAME",(0,1),(-1,-1),BF),
        ("TOPPADDING",(0,0),(-1,-1),4),
        ("BOTTOMPADDING",(0,0),(-1,-1),4),
    ]
    for ri, row in enumerate(rows6, 1):
        for ci, cell in enumerate(row[1:], 1):
            if cell in sc6:
                cs6.append(("BACKGROUND",(ci,ri),(ci,ri),sc6[cell]))
    pt6.setStyle(TableStyle(cs6))
    e.append(pt6)
    e.append(Spacer(1,5))
    e.append(Paragraph(
        "4 komut, 4 kesimli pipeline ile 4 + (4-1) = 7 cycle'da tamamlanir. "
        "Pipeline olmadan 4 x 4 = 16 cycle surerdi. Hizlanma: 16/7 = 2.28x",
        s["A"]))
    e.append(Spacer(1,10))

    # 6b - Makine Kodu
    e.append(Paragraph("6b) Komutlarin Makine Kodu Karsiliklari  [15 Puan]", s["SC"]))
    e.append(Paragraph("MIPS Register Tablosu (kullanilan registerlar):", s["SC"]))
    e.append(tbl([
        ["Register","No","5-bit Binary"],
        ["$t0","8","01000"],
        ["$t1","9","01001"],
        ["$t3","11","01011"],
        ["$t4","12","01100"],
        ["$t5","13","01101"],
        ["$t6","14","01110"],
        ["$t7","15","01111"],
        ["$t8","24","11000"],
        ["$t9","25","11001"],
        ["$t10","26","11010"],
    ], cw=[3*cm, 2*cm, 3.5*cm]))
    e.append(Spacer(1,8))

    e.append(Paragraph("Komut 1: lw $t0, 10($t1)  [I-Tipi]", s["SC"]))
    e.append(Paragraph(
        "Format: op(6) | rs(5) | rt(5) | immediate(16)",
        s["B"]))
    e.append(tbl([
        ["Alan","Deger","Binary"],
        ["op (lw)","35","100011"],
        ["rs ($t1)","9","01001"],
        ["rt ($t0)","8","01000"],
        ["imm (10)","10","0000000000001010"],
        ["32-bit Makine Kodu","","100011 01001 01000 0000000000001010"],
        ["Hex","","0x8D280000 + 10 = 0x8D28000A"],
    ], cw=[3.5*cm, 2.5*cm, 9.5*cm]))
    e.append(Spacer(1,6))

    e.append(Paragraph("Komut 2: sw $t3, 20($t4)  [I-Tipi]", s["SC"]))
    e.append(Paragraph(
        "Format: op(6) | rs(5) | rt(5) | immediate(16)",
        s["B"]))
    e.append(tbl([
        ["Alan","Deger","Binary"],
        ["op (sw)","43","101011"],
        ["rs ($t4)","12","01100"],
        ["rt ($t3)","11","01011"],
        ["imm (20)","20","0000000000010100"],
        ["32-bit Makine Kodu","","101011 01100 01011 0000000000010100"],
        ["Hex","","0xAD8B0014"],
    ], cw=[3.5*cm, 2.5*cm, 9.5*cm]))
    e.append(Spacer(1,6))

    e.append(Paragraph("Komut 3: add $t5, $t6, $t7  [R-Tipi]", s["SC"]))
    e.append(Paragraph(
        "Format: op(6) | rs(5) | rt(5) | rd(5) | shamt(5) | funct(6)",
        s["B"]))
    e.append(tbl([
        ["Alan","Deger","Binary"],
        ["op (R-tipi)","0","000000"],
        ["rs ($t6)","14","01110"],
        ["rt ($t7)","15","01111"],
        ["rd ($t5)","13","01101"],
        ["shamt","0","00000"],
        ["funct (add)","32","100000"],
        ["32-bit Makine Kodu","","000000 01110 01111 01101 00000 100000"],
        ["Hex","","0x01CF6820"],
    ], cw=[3.5*cm, 2.5*cm, 9.5*cm]))
    e.append(Spacer(1,6))

    e.append(Paragraph("Komut 4: sub $t8, $t9, $t10  [R-Tipi]", s["SC"]))
    e.append(Paragraph(
        "Format: op(6) | rs(5) | rt(5) | rd(5) | shamt(5) | funct(6)",
        s["B"]))
    e.append(tbl([
        ["Alan","Deger","Binary"],
        ["op (R-tipi)","0","000000"],
        ["rs ($t9)","25","11001"],
        ["rt ($t10)","26","11010"],
        ["rd ($t8)","24","11000"],
        ["shamt","0","00000"],
        ["funct (sub)","34","100010"],
        ["32-bit Makine Kodu","","000000 11001 11010 11000 00000 100010"],
        ["Hex","","0x033AC022"],
    ], cw=[3.5*cm, 2.5*cm, 9.5*cm]))
    e.append(Spacer(1,6))

    e.append(Paragraph("Tum Komutlarin Makine Kodu Ozeti:", s["SC"]))
    e.append(tbl([
        ["Komut","Tur","32-bit Binary (kisaltilmis)","Hex"],
        ["lw $t0,10($t1)","I","100011 01001 01000 0000000000001010","0x8D28000A"],
        ["sw $t3,20($t4)","I","101011 01100 01011 0000000000010100","0xAD8B0014"],
        ["add $t5,$t6,$t7","R","000000 01110 01111 01101 00000 100000","0x01CF6820"],
        ["sub $t8,$t9,$t10","R","000000 11001 11010 11000 00000 100010","0x033AC022"],
    ], cw=[4*cm, 1.5*cm, 7.5*cm, 2.5*cm]))
    e.append(Paragraph(
        "SONUC: lw ve sw I-tipi formati kullanir (op|rs|rt|imm). "
        "add ve sub R-tipi formati kullanir (op=000000, funct ile islem belirlenir). "
        "Tum komutlar 32 bit uzunlugundadir.",
        s["A"]))
    return e