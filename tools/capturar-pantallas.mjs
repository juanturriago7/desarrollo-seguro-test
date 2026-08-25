/**
 * Genera las capturas de docs/capturas/ que ilustran el README.
 *
 * Recorre la aplicación con Chrome en modo headless a través del protocolo
 * DevTools: responde un examen completo con una proporción fija de aciertos
 * para que el resultado sea reproducible y recorta cada zona de interés.
 *
 * Uso: npm run capturas   (requiere Google Chrome instalado)
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'docs', 'capturas');
const PERFIL = join(tmpdir(), `chrome-capturas-${process.pid}`);
const PUERTO = 9333;
const ANCHO = 900;

// Uno de cada siete fallos: suficiente para aprobar y para que el reporte de
// errores tenga contenido que enseñar.
const CADA_CUANTOS_FALLA = 7;

const CHROMES = [
  process.env.CHROME_BIN,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
].filter(Boolean);

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

function abrirChrome(url) {
  for (const binario of CHROMES) {
    const proceso = spawn(
      binario,
      [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--hide-scrollbars',
        `--window-size=${ANCHO},900`,
        `--user-data-dir=${PERFIL}`,
        `--remote-debugging-port=${PUERTO}`,
        url,
      ],
      { stdio: 'ignore', detached: true }
    );
    proceso.on('error', () => {});
    if (proceso.pid) return proceso;
  }
  throw new Error(`No se encontró Chrome. Probé: ${CHROMES.join(', ')}`);
}

async function conectar() {
  for (let i = 0; i < 100; i++) {
    try {
      const targets = await (await fetch(`http://localhost:${PUERTO}/json`)).json();
      const pagina = targets.find(
        (t) => t.type === 'page' && (t.url.startsWith('file://') || t.url.startsWith('http'))
      );
      if (pagina) return pagina.webSocketDebuggerUrl;
    } catch {}
    await dormir(250);
  }
  throw new Error('Chrome no expuso ninguna pestaña depurable');
}

function crearCliente(ws) {
  const pendientes = new Map();
  let id = 0;
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pendientes.has(m.id)) {
      pendientes.get(m.id)(m);
      pendientes.delete(m.id);
    }
  });
  return (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id;
      pendientes.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
}

const chrome = abrirChrome(pathToFileURL(join(RAIZ, 'dist', 'simulador-standalone.html')).href);

try {
  const ws = new WebSocket(await conectar());
  await new Promise((r) => ws.addEventListener('open', r));
  const enviar = crearCliente(ws);

  const evaluar = async (expression, awaitPromise = false) => {
    const r = await enviar('Runtime.evaluate', { expression, awaitPromise, returnByValue: true });
    if (r.result?.exceptionDetails) {
      throw new Error(r.result.exceptionDetails.exception?.description ?? 'error en la página');
    }
    return r.result?.result?.value;
  };

  mkdirSync(DESTINO, { recursive: true });

  /** Recorta la zona que ocupan uno o varios selectores, con margen por lado. */
  async function capturar(nombre, selectores, { arriba = 24, abajo = 24 } = {}) {
    const caja = await evaluar(`(() => {
      const nodos = ${JSON.stringify(selectores)}.map((s) => document.querySelector(s)).filter(Boolean);
      if (!nodos.length) return null;
      const cajas = nodos.map((n) => n.getBoundingClientRect());
      const top = Math.min(...cajas.map((c) => c.top)) + window.scrollY;
      const bottom = Math.max(...cajas.map((c) => c.bottom)) + window.scrollY;
      return JSON.stringify({ top, bottom });
    })()`);

    if (!caja) throw new Error(`No se encontró ninguno de: ${selectores.join(', ')}`);
    const { top, bottom } = JSON.parse(caja);

    const shot = await enviar('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: {
        x: 40,
        y: Math.max(0, Math.round(top - arriba)),
        width: ANCHO - 80,
        height: Math.round(bottom - top + arriba + abajo),
        scale: 1,
      },
    });

    const ruta = join(DESTINO, nombre);
    writeFileSync(ruta, Buffer.from(shot.result.data, 'base64'));
    const kb = (Buffer.byteLength(shot.result.data, 'base64') / 1024).toFixed(0);
    console.log(`  ${nombre.padEnd(28)} ${kb} KB`);
  }

  // Se espera desde Node: la pestaña puede seguir en about:blank al conectar.
  async function esperar(condicion, descripcion) {
    for (let i = 0; i < 120; i++) {
      if (await evaluar(`Boolean(${condicion})`)) return;
      await dormir(250);
    }
    throw new Error(`Tiempo agotado esperando: ${descripcion}`);
  }

  await esperar(`document.readyState === 'complete'`, 'que la página cargue');
  await esperar(
    `document.getElementById('start-btn') && !document.getElementById('start-btn').disabled`,
    'que la aplicación habilite el botón de inicio'
  );

  console.log('Capturando pantallas:');
  await capturar('01-bienvenida.png', ['#welcome-screen']);
  await capturar('07-recomendaciones-boton.png', ['#recs-open-btn', '#start-btn'], {
    arriba: 16,
    abajo: 16,
  });

  await evaluar(`document.getElementById('recs-open-btn').click(); true`);
  await dormir(400);
  await capturar('08-recomendaciones-modal.png', ['#recs-dialog'], { arriba: 8, abajo: 8 });
  await evaluar(`document.getElementById('recs-dialog').close(); true`);
  await dormir(200);

  // El banco se inyecta en la página para poder responder de forma determinista.
  const banco = readFileSync(join(RAIZ, 'data', 'preguntas.json'), 'utf8');
  await evaluar(`window.__banco = ${banco}; true`);

  await evaluar(
    `(async () => {
      const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
      document.getElementById('start-btn').click();
      await dormir(150);
      const op = [...document.querySelectorAll('#options-container button')];
      op[1].click();
      await dormir(150);
    })()`,
    true
  );
  await capturar('02-pregunta.png', ['#quiz-screen']);

  const marcador = await evaluar(
    `(async () => {
      const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
      const $ = (s) => document.querySelector(s);

      const indiceCorrecto = (opciones) => {
        const texto = $('#question-text').textContent.trim();
        const p = window.__banco.find((q) => q.pregunta.trim() === texto);
        if (!p) return 0;
        const correcta = p.opciones[p.respuestaCorrecta].trim();
        const i = opciones.findIndex((b) => b.textContent.trim().endsWith(correcta));
        return i < 0 ? 0 : i;
      };

      for (let n = 0; n < 50; n++) {
        const opciones = [...document.querySelectorAll('#options-container button')];
        const buena = indiceCorrecto(opciones);
        const fallar = n % ${CADA_CUANTOS_FALLA} === 0;
        opciones[fallar ? (buena + 1) % opciones.length : buena].click();
        await dormir(5);
        $('#next-btn').click();
        await dormir(5);
      }

      await dormir(1900);
      const guia = $('#review-container details');
      if (guia) guia.open = true;
      await dormir(250);

      return JSON.stringify({
        nota: $('#score-number').textContent,
        estado: $('#result-status').textContent,
        errores: document.querySelectorAll('#review-container > div').length,
      });
    })()`,
    true
  );

  const resumen = JSON.parse(marcador);
  console.log(`  (examen simulado: ${resumen.estado} con ${resumen.nota}/100 y ${resumen.errores} errores)`);

  await capturar('03-resultados.png', ['#result-banner', '#correct-count'], { abajo: 72 });
  await capturar('04-temas-reforzar.png', ['#weak-topics'], { abajo: 40 });
  await capturar(
    '05-reporte-errores.png',
    ['#review-section h2', '#review-container > div:first-child'],
    { arriba: 16, abajo: 10 }
  );

  // El aviso que aparece al abrir index.html sin servidor, para la guía de
  // solución de problemas del README.
  await enviar('Page.navigate', { url: pathToFileURL(join(RAIZ, 'index.html')).href });
  await dormir(1000);
  await esperar(
    `document.getElementById('load-error') && !document.getElementById('load-error').classList.contains('hidden')`,
    'que aparezca el aviso de carga'
  );
  await capturar('06-aviso-sin-servidor.png', ['#load-error', '#start-btn'], { abajo: 16 });

  ws.close();
} finally {
  try {
    process.kill(-chrome.pid);
  } catch {}
  try {
    process.kill(chrome.pid);
  } catch {}
  try {
    rmSync(PERFIL, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {
    // En Windows Chrome a veces deja bloqueado CrashpadMetrics-active.pma.
    // El perfil es temporal y el sistema lo limpia; no vale la pena fallar por eso.
  }
}

console.log(`\nCapturas guardadas en docs/capturas/`);
