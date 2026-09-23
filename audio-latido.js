/* ---------------------------------------------------------------------------
   audio-latido.js — sonido de auscultacion sincronizado con el latido.

   Lo usan los dos visores del proyecto:
     - index.html        (AR.js + A-Frame, clip 'latido' del GLB)
     - vista-previa.html (model-viewer, la misma animacion)

   Por que no basta con <audio loop>:
   un MP3 lleva relleno (encoder delay + padding) al principio y al final, asi
   que el bucle nativo NO dura exactamente el ciclo del corazon: cada vuelta se
   pierden unas decenas de milisegundos y al cabo de un minuto el sonido va por
   libre respecto a la animacion. Por eso:

   1. Ruta principal (Web Audio): se descarga el fichero, se descodifica y se
      reproduce con un AudioBufferSourceNode cuyo bucle se recorta al multiplo
      exacto del ciclo (loopEnd = n x 0,8333 s). Bucle sin costuras y sin
      relleno.
   2. Ruta de respaldo (<audio loop>): si falla lo anterior (fetch bloqueado,
      sin AudioContext...), se usa un elemento <audio> normal.
   3. En las dos rutas, vigilar() compara cada pocos segundos la fase del audio
      con el tiempo real de la animacion y corrige si la deriva pasa del umbral.
   4. El navegador exige un gesto del usuario para sonar. No se intenta
      esquivar: arrancar() se llama desde el click del boton de sonido.
   5. Si el audio no esta disponible, disponible = false y el visor sigue
      funcionando igual; solo se deshabilita el boton.
   --------------------------------------------------------------------------- */
(function (global) {
  'use strict';

  function crearAudioLatido(opciones) {
    var cfg = Object.assign({
      base: 'audio/latido-normal',                        // ruta sin extension
      formatos: [['mp3', 'audio/mpeg'], ['ogg', 'audio/ogg']],
      version: '1',                                       // cache-busting ?v=N
      ciclo: 0.8333333,                                   // 72 lpm = 0,8333 s
      volumen: 0.9,
      umbral: 0.045,                                      // deriva tolerada (s)
      cadaMs: 2000,                                       // periodo de vigilancia
      espera: 12000,                                      // ms hasta darlo por perdido
      modo: 'auto'                                        // auto | webaudio | simple
    }, opciones || {});

    var api = {
      disponible: false,
      sonando: false,
      modo: null,
      dur: 0,            // duracion del bucle util (multiplo exacto del ciclo)
      ciclos: 0,
      deriva: 0,
      correcciones: 0,
      motivoFallo: null
    };

    var resolver, cerrado = false;
    api.listo = new Promise(function (res) { resolver = res; });

    function ok(modo, dur) {
      if (cerrado) { return; }
      cerrado = true;
      api.modo = modo;
      api.dur = dur;
      api.ciclos = Math.round(dur / cfg.ciclo);
      api.disponible = true;
      console.log('[audio-latido] listo (' + modo + '). Bucle de ' +
                  dur.toFixed(4) + ' s = ' + api.ciclos + ' ciclo(s).');
      resolver(true);
    }
    function fallo(motivo) {
      if (cerrado) { return; }
      cerrado = true;
      api.disponible = false;
      api.motivoFallo = motivo;
      console.warn('[audio-latido] no disponible:', motivo);
      resolver(false);
    }
    setTimeout(function () { fallo('tiempo de espera agotado'); }, cfg.espera);

    // Elige la extension segun lo que sepa reproducir el navegador.
    var sonda = document.createElement('audio');
    function elegirUrl(lista) {
      var e = null;
      lista.some(function (f) {
        if (sonda.canPlayType(f[1])) { e = f; return true; }
        return false;
      });
      if (!e) { e = lista[0]; }
      return cfg.base + '.' + e[0] + '?v=' + cfg.version;
    }
    var url = elegirUrl(cfg.formatos);
    // Para la ruta de respaldo se prefiere OGG: su duracion es exacta, mientras
    // que el MP3 arrastra el relleno del codificador y el bucle nativo se
    // desfasa (medido: ~85 ms por segundo).
    var urlSimple = elegirUrl(cfg.formatos.slice().sort(function (a, b) {
      return (a[0] === 'ogg' ? -1 : 0) - (b[0] === 'ogg' ? -1 : 0);
    }));

    var velocidadActual = 1;

    /* --- ruta 1: Web Audio ------------------------------------------------ */
    var ctx = null, buffer = null, fuente = null, ganancia = null;
    var anclaCtx = 0, anclaFase = 0;

    function faseWeb() {
      if (!api.dur) { return 0; }
      var t = anclaFase + (ctx.currentTime - anclaCtx) * velocidadActual;
      return ((t % api.dur) + api.dur) % api.dur;
    }

    function lanzarFuente(fase) {
      pararFuente();
      fuente = ctx.createBufferSource();
      fuente.buffer = buffer;
      fuente.loop = true;
      fuente.loopStart = 0;
      fuente.loopEnd = api.dur;          // recorte exacto: mata el relleno del MP3
      fuente.playbackRate.value = velocidadActual;
      fuente.connect(ganancia);
      fuente.start(0, fase);
      anclaCtx = ctx.currentTime;
      anclaFase = fase;
    }
    function pararFuente() {
      if (!fuente) { return; }
      try { fuente.stop(0); } catch (e) { /* ya parada */ }
      fuente.disconnect();
      fuente = null;
    }

    function intentarWebAudio() {
      var Ctx = global.AudioContext || global.webkitAudioContext;
      if (!Ctx || !global.fetch) { return Promise.reject(new Error('sin Web Audio')); }
      return fetch(url)
        .then(function (r) {
          if (!r.ok) { throw new Error('HTTP ' + r.status); }
          return r.arrayBuffer();
        })
        .then(function (datos) {
          ctx = new Ctx();
          ganancia = ctx.createGain();
          ganancia.gain.value = cfg.volumen;
          ganancia.connect(ctx.destination);
          return ctx.decodeAudioData(datos);
        })
        .then(function (b) {
          buffer = b;
          // El fichero dura un ciclo exacto o un multiplo; se redondea a ese
          // multiplo para descartar el relleno del codificador.
          var n = Math.max(1, Math.round(b.duration / cfg.ciclo));
          var dur = n * cfg.ciclo;
          if (dur > b.duration) { dur = b.duration; }   // por si viene justo
          if (Math.abs(b.duration - n * cfg.ciclo) > 0.12) {
            console.warn('[audio-latido] el fichero dura', b.duration.toFixed(3),
                         's, que no es multiplo limpio de', cfg.ciclo,
                         's: la sincronia puede notarse.');
          }
          ok('webaudio', dur);
        });
    }

    /* --- ruta 2: elemento <audio> ---------------------------------------- */
    var el = null;

    function intentarSimple() {
      return new Promise(function (res, rej) {
        el = document.createElement('audio');
        el.loop = true;
        el.preload = 'auto';
        el.setAttribute('playsinline', '');
        el.style.display = 'none';
        el.volume = cfg.volumen;
        el.src = urlSimple;
        el.addEventListener('loadedmetadata', function () {
          var d = el.duration;
          if (!d || !isFinite(d)) { rej(new Error('duracion desconocida')); return; }
          var n = Math.max(1, Math.round(d / cfg.ciclo));
          ok('simple', n * cfg.ciclo);   // se sincroniza contra el ciclo teorico
          res();
        });
        el.addEventListener('error', function () { rej(new Error('no se pudo cargar ' + url)); });
        document.body.appendChild(el);
        el.load();
      });
    }

    function faseSimple() {
      if (!api.dur) { return 0; }
      return ((el.currentTime % api.dur) + api.dur) % api.dur;
    }

    /* --- arranque de la carga -------------------------------------------- */
    if (cfg.modo === 'simple') {
      intentarSimple().catch(function (e) { fallo(e.message); });
    } else {
      intentarWebAudio().catch(function (e) {
        console.warn('[audio-latido] Web Audio no ha podido:', e && e.message,
                     '- se prueba con <audio>');
        if (cfg.modo === 'webaudio') { fallo(e.message); return; }
        intentarSimple().catch(function (e2) { fallo(e2.message); });
      });
    }

    /* --- API publica ------------------------------------------------------ */
    api.fase = function () {
      return api.modo === 'webaudio' ? faseWeb() : (el ? faseSimple() : 0);
    };

    api.faseAnimacion = function (tAnim) {
      if (!api.dur || typeof tAnim !== 'number' || !isFinite(tAnim)) { return 0; }
      return ((tAnim % api.dur) + api.dur) % api.dur;
    };

    // 'tAnim' puede ser un numero o —mejor— una funcion que devuelva el tiempo
    // de la animacion. Con la funcion se recalcula la fase DESPUES de que el
    // navegador haya desbloqueado el audio: ese desbloqueo tarda su tiempo
    // (medido: hasta 250 ms) y, si se usa la fase de antes, el latido entra
    // desfasado de forma permanente.
    api.arrancar = function (tAnim) {
      if (!api.disponible) { return Promise.resolve(false); }
      var dame = (typeof tAnim === 'function') ? tAnim : function () { return tAnim; };
      if (api.modo === 'webaudio') {
        return ctx.resume().then(function () {
          lanzarFuente(api.faseAnimacion(dame()));
          api.sonando = true;
          // Repaso inmediato: absorbe la latencia del desbloqueo sin esperar
          // al primer ciclo de vigilar().
          setTimeout(function () { if (api.sonando) { api.sincronizar(dame()); } }, 250);
          return true;
        }).catch(function (e) {
          console.warn('[audio-latido] bloqueado:', e && e.message);
          return false;
        });
      }
      el.currentTime = api.faseAnimacion(dame());
      return el.play().then(function () {
        api.sonando = true;
        el.currentTime = api.faseAnimacion(dame());   // ajuste tras el arranque
        return true;
      }).catch(function (e) {
        console.warn('[audio-latido] bloqueado:', e && e.message);
        api.sonando = false;
        return false;
      });
    };

    api.parar = function () {
      if (!api.disponible) { return; }
      if (api.modo === 'webaudio') { pararFuente(); }
      else { el.pause(); }
      api.sonando = false;
    };

    api.velocidad = function (v) {
      velocidadActual = v;
      if (api.modo === 'webaudio') {
        if (fuente) {
          anclaFase = faseWeb();          // re-anclar antes de cambiar el ritmo
          anclaCtx = ctx.currentTime;
          fuente.playbackRate.value = v;
        }
      } else if (el) {
        // Sin conservar el tono: ralentizado suena como una grabacion lenta de
        // verdad, no como una lata.
        el.preservesPitch = false;
        el.mozPreservesPitch = false;
        el.webkitPreservesPitch = false;
        el.playbackRate = v;
      }
    };

    // Compara la fase del audio con la de la animacion y corrige si hace falta.
    // Devuelve la deriva medida en segundos (positiva: el audio va por delante).
    api.sincronizar = function (tAnim, forzar) {
      if (!api.disponible || !api.sonando || !api.dur) { return 0; }
      var objetivo = api.faseAnimacion(tAnim);
      var d = api.fase() - objetivo;
      if (d > api.dur / 2) { d -= api.dur; }
      if (d < -api.dur / 2) { d += api.dur; }
      api.deriva = d;
      if (forzar || Math.abs(d) > cfg.umbral) {
        if (api.modo === 'webaudio') { lanzarFuente(objetivo); }
        else { el.currentTime = objetivo; }
        api.correcciones++;
      }
      return d;
    };

    // Vigilancia periodica. 'dameTiempo' devuelve el tiempo de la animacion (s).
    api.vigilar = function (dameTiempo) {
      if (api.temporizador) { clearInterval(api.temporizador); }
      // La ruta de respaldo (<audio loop>) se desfasa deprisa por el relleno
      // del MP3: medido, unos 80 ms por segundo. Alli se vigila mas a menudo.
      var periodo = (api.modo === 'simple') ? Math.min(cfg.cadaMs, 600) : cfg.cadaMs;
      api.temporizador = setInterval(function () {
        if (!api.sonando) { return; }
        var t = dameTiempo();
        if (typeof t !== 'number' || !isFinite(t)) { return; }
        var antes = api.correcciones;
        var d = api.sincronizar(t);
        if (api.correcciones > antes) {
          console.log('[audio-latido] deriva corregida:', (d * 1000).toFixed(0), 'ms');
        }
      }, periodo);
    };

    return api;
  }

  global.crearAudioLatido = crearAudioLatido;
})(window);
