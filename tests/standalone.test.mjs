import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const RAIZ = new URL('..', import.meta.url);
const SALIDA = new URL('dist/simulador-standalone.html', RAIZ);

const banco = JSON.parse(readFileSync(new URL('data/preguntas.json', RAIZ), 'utf8'));
const temas = JSON.parse(readFileSync(new URL('data/temas.json', RAIZ), 'utf8'));

// El generador se ejecuta una sola vez para todas las comprobaciones.
execFileSync('node', ['tools/construir-standalone.mjs'], { cwd: RAIZ, stdio: 'pipe' });
const html = readFileSync(SALIDA, 'utf8');

test('el archivo autocontenido no deja referencias externas al proyecto', () => {
  assert.equal(html.match(/(src|href)="src\/[^"]+"/g), null);
  assert.equal(html.match(/(src|href)="data\/[^"]+"/g), null);
});

test('no quedan sentencias import ni export que romperían el script en línea', () => {
  const script = html.slice(html.indexOf('<script type="module">'));
  assert.equal(script.match(/^\s*import\s+[{*]/gm), null);
  assert.equal(script.match(/^\s*export\s+/gm), null);
});

test('los datos quedan incrustados por completo', () => {
  assert.ok(html.includes('BANCO_INCRUSTADO'), 'falta la constante del banco');
  assert.ok(html.includes('TEMAS_INCRUSTADOS'), 'falta la constante de temas');

  for (const slug of Object.keys(temas)) {
    assert.ok(html.includes(`"${slug}"`), `el tema "${slug}" no quedó incrustado`);
  }

  const primera = JSON.stringify(banco[0].pregunta).slice(1, -1);
  assert.ok(html.includes(primera), 'la primera pregunta no aparece en el archivo');
});

test('se definen los espacios de nombres que el código usa por prefijo', () => {
  assert.match(html, /const quiz = \{[^}]*generarExamen[^}]*\}/);
  assert.match(html, /const ui = \{[^}]*renderResultados[^}]*\}/);
});

test('cargarDatos se sustituye por la versión que lee los datos incrustados', () => {
  assert.match(html, /async function cargarDatos\(\)\s*\{\s*return \{ banco: BANCO_INCRUSTADO/);
});
