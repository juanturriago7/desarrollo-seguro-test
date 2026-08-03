/**
 * Genera una versión del simulador en un único archivo HTML.
 *
 * Motivo: los navegadores bloquean los módulos ES y las peticiones fetch cuando
 * la página se abre con file://, así que index.html necesita un servidor. Este
 * script aplana los módulos, incrusta los datos y los estilos, y produce un
 * archivo que se puede abrir con doble clic o enviar por correo.
 *
 * Uso: npm run standalone
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const SALIDA = join(RAIZ, 'dist', 'simulador-standalone.html');

// banco.js queda fuera a propósito: su trabajo es descargar los JSON, y aquí
// los datos van incrustados. Se sustituye por un cargarDatos() equivalente.
const MODULOS = ['config.js', 'utils.js', 'quiz.js', 'ui.js', 'main.js'];

const leer = (...partes) => readFileSync(join(RAIZ, ...partes), 'utf8');

/** Quita los import y los export de un módulo y devuelve sus nombres exportados. */
function aplanar(codigo) {
  const exportados = [];

  const sinImports = codigo.replace(/^import\s.*?;[ \t]*\r?\n/gm, '');

  const sinExports = sinImports.replace(
    /^export\s+(async\s+function|function|const|let|class)\s+([A-Za-z0-9_$]+)/gm,
    (_, declaracion, nombre) => {
      exportados.push(nombre);
      return `${declaracion} ${nombre}`;
    }
  );

  const restos = sinExports.match(/^export\s/gm);
  if (restos) {
    throw new Error(`Hay ${restos.length} export(s) con una forma que este script no sabe aplanar`);
  }

  return { codigo: sinExports.trim(), exportados };
}

const preguntas = JSON.parse(leer('data', 'preguntas.json'));
const temas = JSON.parse(leer('data', 'temas.json'));

const piezas = [];
const espaciosDeNombres = [];

for (const nombreArchivo of MODULOS) {
  const { codigo, exportados } = aplanar(leer('src', 'js', nombreArchivo));
  const modulo = nombreArchivo.replace('.js', '');

  // Antes de ui.js hacen falta los espacios de nombres que usa (quiz), y antes
  // de main.js los suyos (quiz y ui), porque el código los invoca por prefijo.
  if (modulo === 'ui') piezas.push(...espaciosDeNombres.filter((n) => n.startsWith('const quiz')));
  if (modulo === 'main') {
    piezas.push(...espaciosDeNombres.filter((n) => n.startsWith('const ui')));
    piezas.push(
      'async function cargarDatos() {\n' +
        '  return { banco: BANCO_INCRUSTADO, temas: TEMAS_INCRUSTADOS };\n' +
        '}'
    );
  }

  piezas.push(`/* ===== ${nombreArchivo} ===== */\n${codigo}`);

  if (exportados.length) {
    espaciosDeNombres.push(`const ${modulo} = { ${exportados.join(', ')} };`);
  }
}

const script = [
  `const BANCO_INCRUSTADO = ${JSON.stringify(preguntas)};`,
  `const TEMAS_INCRUSTADOS = ${JSON.stringify(temas)};`,
  ...piezas,
].join('\n\n');

const html = leer('index.html')
  .replace(
    /<script src="src\/js\/tailwind\.config\.js"><\/script>/,
    `<script>\n${leer('src', 'js', 'tailwind.config.js').trim()}\n  </script>`
  )
  .replace(
    /<link rel="stylesheet" href="src\/css\/styles\.css" \/>/,
    `<style>\n${leer('src', 'css', 'styles.css').trim()}\n  </style>`
  )
  .replace(
    /<script type="module" src="src\/js\/main\.js"><\/script>/,
    `<script type="module">\n${script}\n  </script>`
  );

const pendientes = html.match(/(src|href)="src\/[^"]+"/g);
if (pendientes) {
  throw new Error(`Quedaron referencias externas sin incrustar: ${pendientes.join(', ')}`);
}

mkdirSync(dirname(SALIDA), { recursive: true });
writeFileSync(SALIDA, html, 'utf8');

const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`Generado: dist/simulador-standalone.html (${kb} KB)`);
console.log(`Preguntas incrustadas: ${preguntas.length}`);
console.log(`Temas incrustados: ${Object.keys(temas).length}`);
console.log('Se puede abrir con doble clic; necesita internet solo para los estilos.');
