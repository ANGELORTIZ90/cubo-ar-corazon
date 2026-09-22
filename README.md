# Cubo AR — Corazón humano (FP sanitaria)

Cubo de papel estilo *Merge Cube* con marcador propio. Al enfocar con la cámara la cara
del marcador, el visor web muestra un **corazón humano en 3D latiendo** (72 lpm). Las
otras cinco caras llevan el QR del visor, la cara de título y **tres caras de teoría
impresa** de nivel sanitario: cámaras y válvulas, ciclo cardíaco y circulación mayor/menor
con valores de referencia.

Motor: **A-Frame 1.4.2 + AR.js 3.4.5** por CDN, marcadores *barcode* 3×3
(`detectionMode: mono_and_matrix; matrixCodeType: 3x3`).

## Contenido

| Archivo | Función |
|---|---|
| `index.html` | Visor AR web (un solo marcador, barcode 3×3 n.º 0) |
| `plantilla.html` | Plantilla imprimible, caras de **6 cm**, 1 página A4 vertical |
| `plantilla-8cm.html` | Plantilla imprimible, caras de **8 cm**, 2 páginas A4 apaisadas |
| `cubo-corazon-6cm.pdf` | PDF listo para imprimir (A4 vertical, 210 × 297 mm, 1 página) |
| `cubo-corazon-8cm.pdf` | PDF listo para imprimir (A4 horizontal, 297 × 210 mm, 2 páginas) |
| `marcadores/marker-0.png` | Marcador barcode 3×3 n.º 0 (colección oficial de AR.js, 226 × 226 px) |
| `modelos/corazon.glb` | Modelo 3D del corazón con el clip de animación `latido` |
| `fuentes/dejavu-es.json` + `.png` | Fuente MSDF propia (DejaVu Sans Bold) **con tildes y ñ** para los rótulos 3D |
| `qr-visor.png` | QR con la URL pública del visor |
| `hacer-qr.py` | Regenera el QR: `python hacer-qr.py https://…` |

## Las seis caras del cubo

| Cara | Contenido |
|---|---|
| Frente | **Marcador n.º 0** → corazón 3D latiendo en realidad aumentada |
| Arriba | QR que abre el visor AR |
| Abajo | Título del cubo |
| Izquierda | Teoría: las 4 cámaras y las 4 válvulas (presiones de cada ventrículo) |
| Derecha | Teoría: ciclo cardíaco — sístole, diástole, ruidos y sistema de conducción |
| Atrás | Teoría: circulación menor y mayor + valores normales (FC, VS, FE, gasto cardíaco, PA) |

## Cómo se imprime

1. Abrir el PDF (`cubo-corazon-6cm.pdf` o `cubo-corazon-8cm.pdf`).
2. Imprimir **al 100 %, sin «ajustar a página»**: si se escala, el marcador deja de medir
   lo que debe y la detección empeora.
3. Papel **mate** mejor que brillante (los reflejos dificultan la lectura del marcador).
   Gramaje recomendado: 160-200 g.
4. Recortar por el borde exterior **incluyendo las pestañas grises**, doblar por todas las
   líneas y pegar las pestañas por dentro.
5. La versión de 8 cm va en dos páginas: la pestaña rayada **UNIÓN** de la página 2 se pega
   por debajo del borde inferior de la cara CORAZÓN HUMANO de la página 1.

## Cómo se usa

### En el portátil (webcam)

```powershell
cd D:\Cubo-AR-Corazon
python -m http.server 8080
```

Abrir <http://localhost:8080>, permitir la cámara y mostrar la cara del marcador.
Para webcams de portátil conviene la versión de **8 cm**.

### En el móvil del alumnado

La cámara del móvil exige **HTTPS**, así que hay que publicar la carpeta (GitHub Pages:
Settings → Pages → Deploy from branch → `main`, raíz). El QR impreso apunta a
`https://angelortiz90.github.io/cubo-ar-corazon/`; **si el repositorio acaba con otro
nombre, regenerar el QR** con `python hacer-qr.py <URL buena>` y volver a generar los PDF.

### Regenerar los PDF

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu \
  --no-pdf-header-footer --print-to-pdf="D:\Cubo-AR-Corazon\cubo-corazon-6cm.pdf" \
  "file:///D:/Cubo-AR-Corazon/plantilla.html"
```

(igual para `plantilla-8cm.html` → `cubo-corazon-8cm.pdf`).

## Cache-busting: subir `?v=N` en cada publicación

En `index.html` el modelo se referencia así:

```html
<a-asset-item id="m-corazon" src="modelos/corazon.glb?v=1"></a-asset-item>
```

**Cada vez que se publique una versión nueva de `corazon.glb` hay que subir ese número**
(`?v=2`, `?v=3`, …). Sin ese cambio el navegador —sobre todo el del móvil y el de GitHub
Pages con su CDN— sigue sirviendo el GLB antiguo de la caché y parece que la
actualización «no ha llegado».

## Notas técnicas

- **Animación.** El GLB trae un único clip llamado `latido` (bucle, 72 lpm ≈ 0,833 s por
  ciclo). Lo reproduce `animation-mixer="clip: latido; loop: repeat"`, que viene del
  paquete **aframe-extras** (A-Frame por sí solo no reproduce clips de un GLB).
- **Iluminación.** Además de las luces (ambiental + hemisférica + direccional con sombra
  suave + relleno frío) la escena aplica un **mapa de entorno generado por código**
  (componente `entorno-estudio`, PMREMGenerator). Sin él, los materiales PBR del corazón
  se ven planos y apagados en AR.
- **Escala.** El componente `ajustar` normaliza el tamaño del GLB y lo apoya centrado
  sobre el marcador, sea cual sea la escala con que venga exportado.
- **Rótulos con tildes.** La fuente por defecto de A-Frame no dibuja los caracteres
  acentuados. Este proyecto incluye una fuente MSDF propia generada con
  `msdf-bmfont-xml` a partir de **DejaVu Sans Bold** (licencia libre) con el juego de
  caracteres español completo. Se usa así:

  ```html
  <a-text value="Aurícula izquierda" font="fuentes/dejavu-es.json"
          shader="msdf" negate="false"></a-text>
  ```

  Los tres atributos son necesarios: sin `shader="msdf"` y `negate="false"` el texto
  sale como bloques sólidos.
- **Diagnóstico.** Si el GLB no carga, o si el clip no se llama `latido`, el visor muestra
  un aviso rojo en la parte inferior y lo detalla en la consola del navegador.
- Requiere conexión a internet: A-Frame, AR.js y aframe-extras se cargan por CDN.

## Créditos

El modelo `modelos/corazon.glb` y su ficha de créditos (`CREDITOS.md`) los aporta el
flujo de trabajo de Blender del proyecto; ver ese archivo para origen, autor y licencia.
La fuente MSDF deriva de **DejaVu Sans** (licencia DejaVu Fonts, libre y redistribuible).
Los marcadores proceden de la colección oficial de AR.js
(`artoolkit-barcode-markers-collection`).
