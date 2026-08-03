import { TOTAL_PREGUNTAS_EXAMEN, PUNTOS_POR_PREGUNTA, NOTA_APROBACION } from './config.js';
import { barajar } from './utils.js';

// Estado del intento en curso. No se persiste: recargar la página lo reinicia.
const estado = {
  preguntas: [],
  respuestas: [],
  indice: 0,
};

/**
 * Prepara un examen nuevo tomando una muestra aleatoria del banco.
 * Las opciones de cada pregunta también se barajan, así que la posición de la
 * respuesta correcta en el JSON no revela nada al usuario.
 */
export function generarExamen(banco) {
  const seleccionadas = barajar(banco).slice(0, TOTAL_PREGUNTAS_EXAMEN);

  estado.preguntas = seleccionadas.map((p) => {
    const textoCorrecto = p.opciones[p.respuestaCorrecta];
    const opciones = barajar(p.opciones);
    return {
      pregunta: p.pregunta,
      tema: p.tema,
      opciones,
      indiceCorrecto: opciones.indexOf(textoCorrecto),
    };
  });

  estado.respuestas = new Array(estado.preguntas.length).fill(null);
  estado.indice = 0;
}

export const totalPreguntas = () => estado.preguntas.length;
export const indiceActual = () => estado.indice;
export const preguntaActual = () => estado.preguntas[estado.indice];
export const respuestaActual = () => estado.respuestas[estado.indice];
export const totalRespondidas = () => estado.respuestas.filter((r) => r !== null).length;
export const esPrimera = () => estado.indice === 0;
export const esUltima = () => estado.indice === estado.preguntas.length - 1;

export function responder(indiceOpcion) {
  estado.respuestas[estado.indice] = indiceOpcion;
}

// Devuelve true si hubo desplazamiento; false cuando ya se está en el extremo.
export function avanzar() {
  if (esUltima()) return false;
  estado.indice++;
  return true;
}

export function retroceder() {
  if (esPrimera()) return false;
  estado.indice--;
  return true;
}

export function calcularResultado() {
  const errores = [];
  let correctas = 0;

  estado.preguntas.forEach((pregunta, i) => {
    const seleccion = estado.respuestas[i];
    if (seleccion === pregunta.indiceCorrecto) {
      correctas++;
    } else {
      errores.push({
        numero: i + 1,
        tema: pregunta.tema,
        enunciado: pregunta.pregunta,
        textoSeleccionado: seleccion === null ? 'Sin responder' : pregunta.opciones[seleccion],
        textoCorrecto: pregunta.opciones[pregunta.indiceCorrecto],
      });
    }
  });

  const nota = correctas * PUNTOS_POR_PREGUNTA;

  return {
    correctas,
    incorrectas: estado.preguntas.length - correctas,
    total: estado.preguntas.length,
    nota,
    aprobado: nota >= NOTA_APROBACION,
    errores,
    temasDebiles: resumirTemasDebiles(errores),
  };
}

/**
 * Agrupa los fallos por tema para señalar qué áreas conviene reforzar.
 * Ordena por número de fallos y, a igualdad, por la proporción fallada.
 */
function resumirTemasDebiles(errores) {
  const preguntasPorTema = new Map();
  estado.preguntas.forEach((p) => {
    preguntasPorTema.set(p.tema, (preguntasPorTema.get(p.tema) ?? 0) + 1);
  });

  const fallosPorTema = new Map();
  errores.forEach((e) => {
    fallosPorTema.set(e.tema, (fallosPorTema.get(e.tema) ?? 0) + 1);
  });

  return [...fallosPorTema.entries()]
    .map(([tema, fallos]) => ({
      tema,
      fallos,
      total: preguntasPorTema.get(tema) ?? fallos,
    }))
    .sort((a, b) => b.fallos - a.fallos || b.fallos / b.total - a.fallos / a.total);
}
