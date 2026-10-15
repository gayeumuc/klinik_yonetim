# -*- coding: utf-8 -*-
"""BMU234 Final - Ana PDF olusturucu"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, HRFlowable
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
import os, sys

# ── Font kaydi ──────────────────────────────────────────────────────────────
def reg_fonts():
    ok = True
    for name, fname in [("DV","DejaVuSans.ttf"),("DVB","DejaVuSans-Bold.ttf")]:
        p = os.path.join("C:/Windows/Fonts", fname)
        if os.path.exists(p):
            pdfmetrics.registerFont(TTFont(name, p))
        else:
            ok = False
    return ok

has_dv = reg_fonts()
BF = "DV"  if has_dv else "Helvetica"
BB = "DVB" if has_dv else "Helvetica-Bold"

# Part modulleri icin BF/BB'yi guncelle
import bmu234_part1 as p1
import bmu234_part2 as p2
p1.BF = BF; p1.BB = BB
p2.BF = BF; p2.BB = BB

# ── Stiller ─────────────────────────────────────────────────────────────────
def make_styles():
    s = {}
    s["T"]  = ParagraphStyle("T",  fontName=BB, fontSize=15,
                              textColor=colors.HexColor("#1a237e"),
                              alignment=TA_CENTER, spaceAfter=3)
    s["ST"] = ParagraphStyle("ST", fontName=BF, fontSize=10,
                              textColor=colors.HexColor("#283593"),
                              alignment=TA_CENTER, spaceAfter=10)
    s["QH"] = ParagraphStyle("QH", fontName=BB, fontSize=12,
                              textColor=colors.white,
                              backColor=colors.HexColor("#1565c0"),
                              borderPad=5, spaceAfter=7, spaceBefore=12,
                              leftIndent=4)
    s["SC"] = ParagraphStyle("SC", fontName=BB, fontSize=10,
                              textColor=colors.HexColor("#0d47a1"),
                              spaceAfter=3, spaceBefore=7)
    s["B"]  = ParagraphStyle("B",  fontName=BF, fontSize=9,
                              leading=14, spaceAfter=4, alignment=TA_JUSTIFY)
    s["BB"] = ParagraphStyle("BB", fontName=BB, fontSize=9,
                              leading=14, spaceAfter=3)
    s["F"]  = ParagraphStyle("F",  fontName=BB, fontSize=11,
                              textColor=colors.HexColor("#b71c1c"),
                              alignment=TA_CENTER, spaceAfter=5, spaceBefore=3)
    s["A"]  = ParagraphStyle("A",  fontName=BB, fontSize=9,
                              textColor=colors.HexColor("#1b5e20"),
                              backColor=colors.HexColor("#e8f5e9"),
                              borderPad=5, spaceAfter=7)
    s["N"]  = ParagraphStyle("N",  fontName=BF, fontSize=8,
                              textColor=colors.HexColor("#4a148c"),
                              backColor=colors.HexColor("#f3e5f5"),
                              borderPad=3, spaceAfter=5, leading=12)
    return s

# ── PDF olustur ──────────────────────────────────────────────────────────────
def create_pdf(out="BMU234_Final_Cozumleri.pdf"):
    doc = SimpleDocTemplate(
        out,
        pagesize=A4,
        leftMargin=1.8*cm, rightMargin=1.8*cm,
        topMargin=1.5*cm,  bottomMargin=1.5*cm,
        title="BMU234 Final Cozumleri",
        author="Bilgisayar Organizasyonu ve Tasarimi"
    )

    s = make_styles()
    elems = []

    # Baslik
    elems.append(Paragraph("MUNZUR UNIVERSITESI", s["T"]))
    elems.append(Paragraph(
        "BMU234 - Bilgisayar Organizasyonu ve Tasarimi  |  Final Sinavi Cozumleri  |  Bahar 2024",
        s["ST"]))
    elems.append(HRFlowable(width="100%", thickness=2,
                             color=colors.HexColor("#1565c0"), spaceAfter=8))

    # Sorular
    elems += p1.soru1(s)
    elems += p1.soru2(s)
    elems += p1.soru3(s)
    elems += p2.soru4(s)
    elems += p2.soru5(s)
    elems += p2.soru6(s)

    doc.build(elems)
    print("PDF olusturuldu:", os.path.abspath(out))

if __name__ == "__main__":
    create_pdf()