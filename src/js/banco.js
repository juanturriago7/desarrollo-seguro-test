import { RUTA_BANCO, RUTA_TEMAS } from './config.js';

/**
 * Descarga el banco de preguntas y el catálogo de temas.
 * Las preguntas malformadas se descartan en lugar de abortar, para que un error
 * de edición en una sola entrada no deje el simulador inservible.
 */
export async function cargarDatos() {
  const [banco, temas] = await Promise.all([
    descargarJSON(RUTA_BANCO, 'banco de preguntas'),
    descargarJSON(RUTA_TEMAS, 'catálogo de temas'),
  ]);

  if (!Array.isArray(banco)) {
    throw new Error('El banco de preguntas debe ser un array');
  }

  const validas = banco.filter(esPreguntaValida);
  const descartadas = banco.length - validas.length;

  if (descartadas > 0) {
    console.warn(`Se descartaron ${descartadas} preguntas con formato inválido.`);
  }

  if (validas.length === 0) {
    throw new Error('El banco no contiene ninguna pregunta válida');
  }

  const huerfanas = [...new Set(validas.map((p) => p.tema))].filter((tema) => !temas[tema]);
  if (huerfanas.length > 0) {
    console.warn(`Temas sin guía de repaso: ${huerfanas.join(', ')}`);
  }

  return { banco: validas, temas };
}

async function descargarJSON(ruta, descripcion) {
  const respuesta = await fetch(ruta);

  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar el ${descripcion} (HTTP ${respuesta.status})`);
  }

  return respuesta.json();
}

function esPreguntaValida(pregunta) {
  return (
    pregunta !== null &&
    typeof pregunta === 'object' &&
    typeof pregunta.pregunta === 'string' &&
    pregunta.pregunta.trim() !== '' &&
    Array.isArray(pregunta.opciones) &&
    pregunta.opciones.length >= 2 &&
    pregunta.opciones.every((o) => typeof o === 'string' && o.trim() !== '') &&
    Number.isInteger(pregunta.respuestaCorrecta) &&
    pregunta.respuestaCorrecta >= 0 &&
    pregunta.respuestaCorrecta < pregunta.opciones.length
  );
}
