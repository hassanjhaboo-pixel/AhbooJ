import sys
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, white

OUT = sys.argv[1]
F = "/usr/share/fonts/truetype/"
pdfmetrics.registerFont(TTFont("Head", F + "dejavu/DejaVuSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("Body", F + "liberation/LiberationSans-Regular.ttf"))
pdfmetrics.registerFont(TTFont("BodyB", F + "liberation/LiberationSans-Bold.ttf"))
pdfmetrics.registerFont(TTFont("BodyI", F + "liberation/LiberationSans-Italic.ttf"))

# name, spanish, french, band colour, header text colour, body text colour
DAYS = [
    ("MONDAY",    "LUNES",     "LUNDI",    "#0096D6", "#FFFFFF", "#0083BD"),
    ("TUESDAY",   "MARTES",    "MARDI",    "#FFEE58", "#4A4A4A", "#5A5A5A"),
    ("WEDNESDAY", "MIÉRCOLES", "MERCREDI", "#F28B8B", "#FFFFFF", "#D85C5C"),
    ("THURSDAY",  "JUEVES",    "JEUDI",    "#C4A98A", "#FFFFFF", "#9C7F5E"),
    ("FRIDAY",    "VIERNES",   "VENDREDI", "#6CC79A", "#FFFFFF", "#3FA572"),
    ("SATURDAY",  "SÁBADO",    "SAMEDI",   "#FBB56F", "#FFFFFF", "#E08A33"),
    ("SUNDAY",    "DOMINGO",   "DIMANCHE", "#7A7A7A", "#FFFFFF", "#555555"),
]

# Avery 22806 / 94103-compatible: 2"x2" square, 12 per US Letter sheet (3 x 4)
SIZE = 2 * inch
COLS, ROWS = 3, 4
LEFT, TOP = 0.625 * inch, 0.625 * inch
PITCH_X, PITCH_Y = 2.625 * inch, (11 - 1.25 - 8) / 3 * inch + SIZE
BLEED = 0.0625 * inch
RADIUS = 0.125 * inch
HEAD_H, FOOT_H, SIDE = 0.46 * inch, 0.19 * inch, 0.055 * inch


def fit_text(c, text, font, size, max_w, x, y, color, center=False):
    """Draw text, horizontally squeezing it (condensed look) to fit max_w."""
    w = pdfmetrics.stringWidth(text, font, size)
    scale = min(100, 100 * max_w / w)
    c.saveState()
    c.setFillColor(color)
    t = c.beginText()
    t.setFont(font, size)
    t.setHorizScale(scale)
    real_w = w * scale / 100
    t.setTextOrigin(x - real_w / 2 if center else x, y)
    t.textOut(text)
    c.drawText(t)
    c.restoreState()


def label(c, x, y, day):
    name, es, fr, band, htxt, btxt = day
    band, htxt, btxt = HexColor(band), HexColor(htxt), HexColor(btxt)
    # coloured frame, extended past the cut line so slight misalignment never shows white
    c.setFillColor(band)
    c.roundRect(x - BLEED, y - BLEED, SIZE + 2 * BLEED, SIZE + 2 * BLEED,
                RADIUS + BLEED, stroke=0, fill=1)
    # white writing area
    c.setFillColor(white)
    c.roundRect(x + SIDE, y + FOOT_H, SIZE - 2 * SIDE, SIZE - HEAD_H - FOOT_H,
                0.04 * inch, stroke=0, fill=1)

    # ---- header ----
    split = x + 1.32 * inch
    hy = y + SIZE - HEAD_H
    fit_text(c, name, "Head", 22, split - x - 0.14 * inch, x + 0.09 * inch,
             hy + 0.09 * inch, htxt)
    c.setStrokeColor(htxt)
    c.setLineWidth(1.2)
    c.line(split, hy + 0.05 * inch, split, y + SIZE - 0.04 * inch)
    rw = x + SIZE - split - 0.12 * inch
    fit_text(c, es, "Head", 8.5, rw, split + 0.07 * inch, hy + 0.255 * inch, htxt)
    fit_text(c, fr, "Head", 8.5, rw, split + 0.07 * inch, hy + 0.105 * inch, htxt)

    # ---- footer ----
    fit_text(c, "FIRST IN • FIRST OUT", "BodyB", 6.5, SIZE - 0.3 * inch,
             x + SIZE / 2, y + 0.06 * inch, htxt, center=True)

    # ---- body ----
    lx = x + 0.1 * inch
    rx = x + SIZE - 0.1 * inch
    c.setStrokeColor(btxt)
    c.setLineWidth(0.6)

    def field(top, en, sp):
        c.setFillColor(btxt)
        c.setFont("Body", 7.5)
        c.drawString(lx, top, en)
        c.setFont("BodyI", 4.6)
        c.drawString(lx, top - 0.085 * inch, f"({sp})")
        return lx + pdfmetrics.stringWidth(en, "Body", 7.5) + 0.03 * inch

    def checks(top):
        bx = rx - 0.235 * inch
        for i, txt in enumerate(("AM", "PM")):
            yy = top + 0.055 * inch - i * 0.085 * inch
            c.rect(bx, yy, 0.045 * inch, 0.045 * inch, stroke=1, fill=0)
            c.setFont("Body", 4.8)
            c.drawString(bx + 0.06 * inch, yy, txt)
        return bx - 0.03 * inch

    body_top = y + SIZE - HEAD_H
    rows = [body_top - 0.2 * inch, body_top - 0.48 * inch,
            body_top - 0.79 * inch, body_top - 1.06 * inch]

    s = field(rows[0], "Product", "Producto")
    c.line(s, rows[0] - 0.01 * inch, rx, rows[0] - 0.01 * inch)
    s = field(rows[1], "Employee", "Empleado")
    c.line(s, rows[1] - 0.01 * inch, rx, rows[1] - 0.01 * inch)

    for top, en, sp in ((rows[2], "Prep Date", "Fecha"), (rows[3], "Use By", "Vencimiento")):
        s = field(top, en, sp)
        end = checks(top)
        tw = pdfmetrics.stringWidth("Time", "Body", 7.5)
        tx = s + (end - s) * 0.52
        c.line(s, top - 0.01 * inch, tx - 0.02 * inch, top - 0.01 * inch)
        c.setFont("Body", 7.5)
        c.drawString(tx, top, "Time")
        c.line(tx + tw + 0.02 * inch, top - 0.01 * inch, end, top - 0.01 * inch)


def sheet(c, day, cut_marks):
    for r in range(ROWS):
        for col in range(COLS):
            x = LEFT + col * PITCH_X
            y = letter[1] - TOP - SIZE - r * PITCH_Y
            label(c, x, y, day)
            if cut_marks:
                c.setStrokeColor(HexColor("#999999"))
                c.setLineWidth(0.3)
                o, l = 0.12 * inch, 0.12 * inch
                for cx in (x, x + SIZE):
                    for cy in (y, y + SIZE):
                        sy = -1 if cy == y else 1
                        sx = -1 if cx == x else 1
                        c.line(cx, cy + sy * o, cx, cy + sy * (o + l))
                        c.line(cx + sx * o, cy, cx + sx * (o + l), cy)
    c.setFont("Body", 6)
    c.setFillColor(HexColor("#999999"))
    c.drawCentredString(letter[0] / 2, 0.3 * inch,
                        f"{day[0].title()} — 2\" x 2\" labels, 12/sheet (Avery 22806 layout). "
                        "Print at 100% / Actual Size.")
    c.showPage()


for cut in (False, True):
    sub = "cut-yourself" if cut else "avery-22806"
    allc = canvas.Canvas(f"{OUT}/{sub}/ALL-DAYS-{sub}.pdf", pagesize=letter)
    allc.setTitle("Day-of-week food labels 2x2")
    for i, day in enumerate(DAYS, 1):
        c = canvas.Canvas(f"{OUT}/{sub}/{i}-{day[0].title()}-{sub}.pdf", pagesize=letter)
        c.setTitle(f"{day[0].title()} food label 2x2")
        sheet(c, day, cut)
        c.save()
        sheet(allc, day, cut)
    allc.save()

# single-label preview / proof (one 2x2 label per page, with bleed)
pc = canvas.Canvas(f"{OUT}/single-label-2x2-with-bleed.pdf",
                   pagesize=(SIZE + 2 * BLEED, SIZE + 2 * BLEED))
for day in DAYS:
    label(pc, BLEED, BLEED, day)
    pc.showPage()
pc.save()
