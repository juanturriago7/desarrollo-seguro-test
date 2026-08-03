import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { barajar } from '../src/js/utils.js';
import { TOTAL_PREGUNTAS_EXAMEN, NOTA_APROBACION } from '../src/js/config.js';
import * as quiz from '../src/js/quiz.js';

const banco = JSON.parse(readFileSync(new URL('../data/preguntas.json', import.meta.url), 'utf8'));
const temas = JSON.parse(readFileSync(new URL('../data/temas.json', import.meta.url), 'utf8'));

function responderTodo(elegirIndice) {
  for (let i = 0; i < quiz.totalPreguntas(); i++) {
    quiz.responder(elegirIndice(quiz.preguntaActual()));
    quiz.avanzar();
  }
}

test('el banco de preguntas tiene un formato válido', () => {
  assert.ok(Array.isArray(banco) && banco.length > 0);

  const ids = new Set();
  for (const p of banco) {
    assert.equal(typeof p.pregunta, 'string', `enunciado inválido en id ${p.id}`);
    assert.ok(p.pregunta.trim().length > 0, `enunciado vacío en id ${p.id}`);
    assert.ok(p.opciones.length >= 2, `faltan opciones en id ${p.id}`);
    assert.equal(new Set(p.opciones).size, p.opciones.length, `opciones repetidas en id ${p.id}`);
    assert.ok(
      p.respuestaCorrecta >= 0 && p.respuestaCorrecta < p.opciones.length,
      `respuestaCorrecta fuera de rango en id ${p.id}`
    );
    assert.ok(!ids.has(p.id), `id duplicado: ${p.id}`);
    ids.add(p.id);
  }
});

test('el banco tiene suficientes preguntas para un examen completo', () => {
  assert.ok(banco.length >= TOTAL_PREGUNTAS_EXAMEN);
});

test('barajar devuelve una permutación sin mutar el original', () => {
  const original = [1, 2, 3, 4, 5];
  const copia = barajar(original);

  assert.deepEqual(original, [1, 2, 3, 4, 5]);
  assert.deepEqual([...copia].sort(), [...original].sort());
});

test('el examen toma la cantidad configurada de preguntas sin repetirlas', () => {
  quiz.generarExamen(banco);

  assert.equal(quiz.totalPreguntas(), TOTAL_PREGUNTAS_EXAMEN);

  const enunciados = new Set();
  for (let i = 0; i < quiz.totalPreguntas(); i++) {
    enunciados.add(quiz.preguntaActual().pregunta);
    quiz.avanzar();
  }
  assert.equal(enunciados.size, TOTAL_PREGUNTAS_EXAMEN);
});

test('el índice correcto sigue a su texto después de barajar las opciones', () => {
  const textosCorrectos = new Set(banco.map((p) => p.opciones[p.respuestaCorrecta]));

  quiz.generarExamen(banco);

  for (let i = 0; i < quiz.totalPreguntas(); i++) {
    const pregunta = quiz.preguntaActual();
    assert.ok(
      textosCorrectos.has(pregunta.opciones[pregunta.indiceCorrecto]),
      `el índice correcto no apunta a la respuesta esperada: ${pregunta.pregunta}`
    );
    quiz.avanzar();
  }
});

test('acertar todas las preguntas da la nota máxima', () => {
  quiz.generarExamen(banco);
  responderTodo((pregunta) => pregunta.indiceCorrecto);

  const resultado = quiz.calcularResultado();

  assert.equal(resultado.nota, 100);
  assert.equal(resultado.correctas, TOTAL_PREGUNTAS_EXAMEN);
  assert.equal(resultado.incorrectas, 0);
  assert.equal(resultado.errores.length, 0);
  assert.equal(resultado.aprobado, true);
});

test('fallar todas las preguntas da cero y registra todos los errores', () => {
  quiz.generarExamen(banco);
  responderTodo((pregunta) => (pregunta.indiceCorrecto + 1) % pregunta.opciones.length);

  const resultado = quiz.calcularResultado();

  assert.equal(resultado.nota, 0);
  assert.equal(resultado.correctas, 0);
  assert.equal(resultado.errores.length, TOTAL_PREGUNTAS_EXAMEN);
  assert.equal(resultado.aprobado, false);

  const primerError = resultado.errores[0];
  assert.notEqual(primerError.textoSeleccionado, primerError.textoCorrecto);
});

test('la nota mínima de aprobación se aplica en el límite exacto', () => {
  const aciertosNecesarios = NOTA_APROBACION / 2;
  quiz.generarExamen(banco);

  let respondidas = 0;
  responderTodo((pregunta) => {
    const acertar = respondidas < aciertosNecesarios;
    respondidas++;
    return acertar
      ? pregunta.indiceCorrecto
      : (pregunta.indiceCorrecto + 1) % pregunta.opciones.length;
  });

  const resultado = quiz.calcularResultado();

  assert.equal(resultado.nota, NOTA_APROBACION);
  assert.equal(resultado.aprobado, true);
});

test('las preguntas sin responder cuentan como error', () => {
  quiz.generarExamen(banco);

  const resultado = quiz.calcularResultado();

  assert.equal(resultado.correctas, 0);
  assert.equal(resultado.errores[0].textoSeleccionado, 'Sin responder');
});

test('todas las preguntas tienen un tema con guía de repaso', () => {
  for (const p of banco) {
    assert.equal(typeof p.tema, 'string', `la pregunta ${p.id} no tiene tema`);
    assert.ok(temas[p.tema], `el tema "${p.tema}" de la pregunta ${p.id} no está en temas.json`);
  }
});

test('cada guía de repaso está completa y sin temas huérfanos', () => {
  const usados = new Set(banco.map((p) => p.tema));

  for (const [slug, info] of Object.entries(temas)) {
    assert.ok(usados.has(slug), `el tema "${slug}" no lo usa ninguna pregunta`);
    assert.ok(info.nombre?.trim(), `falta el nombre del tema "${slug}"`);
    assert.ok(info.resumen?.trim(), `falta el resumen del tema "${slug}"`);
    assert.ok(Array.isArray(info.repasar) && info.repasar.length >= 3, `"${slug}" necesita al menos 3 puntos de repaso`);
    assert.ok(Array.isArray(info.recursos), `"${slug}" debe declarar un array de recursos`);

    for (const recurso of info.recursos) {
      assert.ok(recurso.titulo?.trim(), `recurso sin título en "${slug}"`);
      assert.match(recurso.url, /^https:\/\//, `recurso sin URL https en "${slug}"`);
    }
  }
});

test('los errores arrastran el tema de su pregunta', () => {
  quiz.generarExamen(banco);
  responderTodo((pregunta) => (pregunta.indiceCorrecto + 1) % pregunta.opciones.length);

  const { errores } = quiz.calcularResultado();

  for (const error of errores) {
    assert.ok(temas[error.tema], `error sin tema resoluble: ${error.enunciado}`);
  }
});

test('el resumen de temas débiles cuadra con los errores cometidos', () => {
  quiz.generarExamen(banco);
  responderTodo((pregunta) => (pregunta.indiceCorrecto + 1) % pregunta.opciones.length);

  const { errores, temasDebiles } = quiz.calcularResultado();

  const sumaFallos = temasDebiles.reduce((acc, t) => acc + t.fallos, 0);
  assert.equal(sumaFallos, errores.length);

  for (const { fallos, total } of temasDebiles) {
    assert.ok(fallos <= total, 'no puede haber más fallos que preguntas de ese tema');
  }

  const ordenados = temasDebiles.every((t, i, arr) => i === 0 || arr[i - 1].fallos >= t.fallos);
  assert.ok(ordenados, 'los temas débiles deben venir ordenados de más a menos fallos');
});

test('sin errores no hay temas que reforzar', () => {
  quiz.generarExamen(banco);
  responderTodo((pregunta) => pregunta.indiceCorrecto);

  assert.deepEqual(quiz.calcularResultado().temasDebiles, []);
});

test('la navegación se detiene en los extremos del examen', () => {
  quiz.generarExamen(banco);

  assert.equal(quiz.esPrimera(), true);
  assert.equal(quiz.retroceder(), false);
  assert.equal(quiz.indiceActual(), 0);

  while (quiz.avanzar()) {
    // avanzar hasta la última pregunta
  }

  assert.equal(quiz.esUltima(), true);
  assert.equal(quiz.avanzar(), false);
  assert.equal(quiz.indiceActual(), TOTAL_PREGUNTAS_EXAMEN - 1);
});
