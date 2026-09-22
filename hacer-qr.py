# -*- coding: utf-8 -*-
"""Genera qr-visor.png con la URL publica del visor AR.

Uso:  python hacer-qr.py [URL]
Si el repositorio remoto acaba llamandose de otra forma, basta con volver a
ejecutarlo pasando la URL buena y regenerar los PDF de las plantillas.
"""
import sys
import qrcode

URL = sys.argv[1] if len(sys.argv) > 1 else "https://angelortiz90.github.io/cubo-ar-corazon/"

qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=2)
qr.add_data(URL)
qr.make(fit=True)
qr.make_image(fill_color="black", back_color="white").save("qr-visor.png")
print("qr-visor.png ->", URL)
