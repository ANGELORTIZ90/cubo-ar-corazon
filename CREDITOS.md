# Créditos y licencias — Cubo AR Corazón

## Modelo 3D de origen

**Human Heart 3d Model**

| | |
|---|---|
| Fuente | NIH 3D (National Institutes of Health) — entrada `3DPX-022787` |
| Enlace | https://3d.nih.gov/entries/3DPX-022787 |
| Autor / remitente | Sourav Pan |
| Proveedor | Biology Notes Online — https://biologynotesonline.com/ |
| Fecha de publicación | 11-07-2025 |
| **Licencia** | **Dominio público — Creative Commons Zero (CC0 1.0)** |
| Atribución obligatoria | No (CC0). Se cita por cortesía y trazabilidad. |
| Fichero descargado | `heart.glb`, 3 986 136 bytes |
| Copia íntegra sin modificar | `variantes/corazon_original_NIH3D_3DPX-022787.glb` |

Al ser CC0 no hay ninguna restricción para publicar el cubo AR en la web, ni
obligación de citar. La cita se mantiene por honestidad académica.

### Nota técnica sobre el origen del modelo

Los nombres internos de la malla y del material del fichero original
(`tripo_node_…`, `tripo_mat_…`) indican que la geometría se generó con la
herramienta de IA **Tripo 3D** y después se depositó en NIH 3D. La anatomía de
superficie se ha revisado visualmente y es correcta (aurículas y ventrículos,
surco coronario y surco interventricular anterior con grasa epicárdica y vasos
coronarios en relieve, aorta con cayado y sus tres troncos supraaórticos,
tronco y arterias pulmonares, venas cavas superior e inferior y venas
pulmonares). Aun así, **no procede de una segmentación de imagen médica real**,
así que conviene no usarlo como referencia métrica ni para detalles finos.

## Trabajo realizado sobre el modelo

Todo lo siguiente es obra propia hecha en Blender 5.1 y se cede junto al
proyecto, sin licencia adicional que lo limite:

- Reorientación (cara anterior hacia el observador), escala real y centrado.
- Reducción de malla de 149 992 a 67 496 triángulos.
- Regraduado completo de la textura de color base y del mapa de rugosidad.
- Animación del ciclo cardíaco (clip `latido`) con dos formas clave.

La animación **no venía con el modelo**: el original es estático.

### Paleta v2 — colores de tejido, no código de esquema

Los tonos se asignan por téxel combinando el color pintado en la textura
original con una **máscara de regiones horneada a UV** (músculo cardíaco frente
a grandes vasos), obtenida con un atributo de color por vértice y un *bake* de
emisión en Cycles.

| Región | sRGB | Criterio |
|---|---|---|
| Miocardio | `#663A2D` | pardo rojizo oscuro, más marrón que rojo |
| Grasa epicárdica | `#84705C` | crema parduzca desaturada, cercana al miocardio |
| Aorta y tronco pulmonar | `#CFC0BA` | blanquecino nacarado con rosado tenue |
| Cavas y venas pulmonares | `#6F7C92` | azul grisáceo apagado |
| Arteria coronaria | `#6B3028` | rojizo oscuro |
| Vena cardíaca | `#4A5263` | azulado apagado |

**Criterio de reparto arterial/venoso.** La textura del modelo original codifica
el color según la **sangre que transporta cada vaso** (aorta y venas pulmonares
en rojo; cavas y arterias pulmonares en azul), no según el tipo de pared. Se ha
respetado ese reparto porque es el que se explica en clase: lo nacarado lleva
sangre oxigenada y lo azul grisáceo no. Si se prefiriera el criterio de realismo
de pared —todas las arterias pálidas y todas las venas azuladas, con el tronco
pulmonar nacarado y las venas pulmonares azuladas— habría que invertir el par
pulmonar.

> Nota para quien retome el script: en una imagen de 8 bits con espacio sRGB,
> `image.pixels` de Blender devuelve y acepta valores **ya codificados en sRGB**,
> no lineales. Y el exportador glTF reempaqueta el fichero de imagen original tal
> cual, así que los cambios de píxeles solo viajan al GLB si se sustituye el
> datablock por una imagen nueva.

## Herramientas

- Blender 5.1.2 (GNU GPL) — modelado, texturizado, animación y exportación glTF.
