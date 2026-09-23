# Licencia y procedencia del audio — `latido-normal`

Ficheros cubiertos: `audio/latido-normal.ogg` y `audio/latido-normal.mp3`.

## Fuente original

| Campo | Valor |
|---|---|
| Obra | *Athletic bradycardia wav.wav* |
| URL de la ficha | https://commons.wikimedia.org/wiki/File:Athletic_bradycardia_wav.wav |
| URL del fichero | https://upload.wikimedia.org/wikipedia/commons/5/59/Athletic_bradycardia_wav.wav |
| Autor | Athletearrhythmia (Wikimedia Commons), obra propia |
| Fecha | 19 de mayo de 2024 |
| Descripción original | «Resting heart rate recorded in an elite athlete demonstrating bradycardia at 42 bpm» |
| Licencia | **CC0 1.0 Universal — Dedicación al dominio público** |
| Texto de la licencia | https://creativecommons.org/publicdomain/zero/1.0/deed.es |
| Atribución | **No exigida.** Se cita aquí por buena práctica académica, no por obligación legal. |
| Original | WAV PCM 16 bits, mono, 48 kHz, 20,112 s, 1 930 796 bytes |

Al ser CC0, la obra derivada puede publicarse en GitHub Pages sin restricción, sin
cláusula de compartir-igual y sin obligación de atribución.

### Por qué esta fuente y no otra

Se revisaron las categorías *Heart beats* y *Audios of human heart* de Wikimedia Commons
(unos 50 ficheros). Casi todo el material de auscultación está en CC BY-SA (compartir-igual,
contaminante) o CC BY. Solo cinco ficheros eran CC0 o dominio público. De ellos:

- *Heartbeat mitral valve 150 bpm.ogg* (dominio público, pdsounds.org): taquicárdico,
  llevarlo a 72 lpm exigía un 0,55× de estiramiento temporal. Descartado.
- *Human heart rate.flac* (CC0, Wilfredor, 61 lpm): 3 733 muestras saturadas a fondo de escala,
  ruido de fondo continuo y S2 no siempre diferenciable. Descartado.
- *Human heart beating at 61 bpm* (CC BY 3.0, Benboncan): relación señal/ruido de 34 dB,
  pico a −0,1 dBFS y sin contenido por encima de 800 Hz (suena a efecto procesado). Descartado.
- **Athletic bradycardia (CC0): 14 ciclos consecutivos regulares, cero muestras saturadas,
  relación señal/ruido de 49 dB, diástole prácticamente muda y S1/S2 nítidos. Elegida.**

### Nota fisiológica honesta

La grabación procede de un deportista con **bradicardia sinusal de entrenamiento (42 lpm)**,
que es una variante fisiológica normal, no una patología: los ruidos S1 y S2 son de morfología
normal y no hay soplos. Lo que se ha llevado a 72 lpm es **el ritmo**, acortando únicamente la
pausa diastólica, que es justo lo que ocurre en la realidad cuando sube la frecuencia cardíaca
(la sístole apenas varía con la frecuencia; la diástole es la que se acorta). El resultado es
una auscultación normal a 72 lpm.

## Transformaciones aplicadas

1. Conversión a mono 44,1 kHz (el original ya era mono, a 48 kHz).
2. Eliminación de continua y filtro paso alto Butterworth de 2.º orden a 20 Hz, de fase cero,
   para quitar el retumbe subsónico del contacto del estetoscopio. No hay zumbido de red que
   filtrar: no se detectó línea discreta a 50/100 Hz.
3. Selección del mejor de los 14 ciclos (el que empieza en el segundo 9,001 del original):
   es el de diástole más silenciosa y S2 más audible.
4. Recorte de una ventana de **36 750 muestras exactas** (44 100 ÷ 1,2 = 36 750 = 0,833333 s)
   que arranca en un cruce por cero ascendente, 0,100 s antes del pico de S1. La ventana cae
   dentro de la diástole larga del original, así que **el corte se produce en zona muda y no
   hay ningún empalme dentro del ciclo**: es un fragmento continuo de la grabación real.
5. **No se ha usado `atempo` ni ningún estiramiento temporal.** S1 y S2 conservan su duración
   y su timbre originales; lo único que se ha acortado es el silencio diastólico. Así se evitan
   los artefactos del algoritmo WSOLA sobre transitorios percusivos.
6. Fundidos de entrada y salida de 3 ms sobre las colas mudas, para que el empalme del bucle
   no chasquee.
7. Normalización a pico −3,00 dBFS.
8. Codificación a Ogg Vorbis (calidad 5) y MP3 (LAME VBR −V2, con cabecera Xing/LAME para
   reproducción sin huecos).

## Resultado

| Parámetro | Valor |
|---|---|
| Duración | **0,833333 s** (36 750 muestras a 44 100 Hz) = un ciclo exacto a 72 lpm |
| Pico de S1 | 0,100 s (inicio audible en 0,070 s) |
| Pico de S2 | 0,405 s (inicio audible en 0,370 s) |
| Sístole (S1→S2) | 0,304 s |
| Diástole (S2→S1 del ciclo siguiente) | 0,529 s — más larga que la sístole, como debe ser |
| Pico | −3,00 dBFS · RMS −24,4 dBFS |
| Ruido de fondo en diástole | −50 dBFS |
| Discontinuidad en el empalme del bucle | −80,8 dBFS (41 dB por debajo del transitorio de S1: inaudible) |
| Formato | mono, 44 100 Hz |
| `latido-normal.ogg` | Ogg Vorbis q5 — 11 236 bytes |
| `latido-normal.mp3` | MP3 LAME −V2 — 8 856 bytes |

## Aviso sobre `ffprobe` y el fichero OGG

`ffprobe` muestra `duration=0.836236` para el OGG. **No es un error del audio.** Es el
`granulepos` del contenedor: el codificador libvorbis de ffmpeg descarta 128 muestras al
cerrar el flujo, así que se le entregaron 36 878 muestras para que el resultado decodificado
fuesen 36 750 exactas. Comprobado en los dos decodificadores que importan:

- ffmpeg: `ffmpeg -i latido-normal.ogg -f s16le -` → 36 750 muestras.
- Chrome (Web Audio, `decodeAudioData`), que es el entorno real de la app AR:
  `buffer.length = 36750`, `buffer.duration = 0.8333333333333334`.

El MP3 sí declara `duration=0.833333` y decodifica también 36 750 muestras.

## Recomendación de uso en el visor AR

Para que el bucle no se desfase nunca respecto a la animación del corazón, conviene fijar el
punto de bucle por tiempo en vez de confiar en la duración declarada del fichero:

```js
const fuente = ctx.createBufferSource();
fuente.buffer = buffer;
fuente.loop = true;
fuente.loopStart = 0;
fuente.loopEnd = 36750 / buffer.sampleRate;  // 0.8333333 s exactos
```

Si se usa la etiqueta `<audio loop>`, sírvase el OGG como primera opción y el MP3 solo como
reserva: `<source src="audio/latido-normal.ogg" type="audio/ogg">` seguido de
`<source src="audio/latido-normal.mp3" type="audio/mpeg">`.

## Resumen para los créditos del proyecto

> Sonido cardíaco: a partir de *Athletic bradycardia* de Athletearrhythmia
> (Wikimedia Commons, 2024), CC0 1.0 (dominio público). Ciclo aislado, filtrado,
> reajustado a 72 lpm acortando la diástole y normalizado para este proyecto.
