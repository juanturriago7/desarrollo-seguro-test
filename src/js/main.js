import { cargarDatos } from './banco.js';
import * as quiz from './quiz.js';
import * as ui from './ui.js';

let banco = [];

function iniciarExamen() {
  quiz.generarExamen(banco);
  ui.mostrarPantalla('examen');
  ui.renderPregunta(seleccionarOpcion);
}

function seleccionarOpcion(indice) {
  quiz.responder(indice);
  ui.renderPregunta(seleccionarOpcion);
}

function irSiguiente() {
  if (quiz.respuestaActual() === null) return;

  if (quiz.avanzar()) {
    ui.renderPregunta(seleccionarOpcion);
  } else {
    ui.renderResultados(quiz.calcularResultado());
  }
}

function irAnterior() {
  if (quiz.retroceder()) {
    ui.renderPregunta(seleccionarOpcion);
  }
}

async function inicializar() {
  // Señal para el aviso de respaldo del HTML: si esto no se ejecuta, los módulos
  // no se cargaron y hay que explicárselo al usuario.
  window.__simuladorIniciado = true;
  ui.habilitarInicio(false);

  // Se conecta antes de cargar los datos: las recomendaciones del examen oficial
  // siguen siendo útiles aunque el banco de preguntas no llegue.
  ui.conectarRecomendaciones();

  try {
    const datos = await cargarDatos();
    banco = datos.banco;
    ui.establecerTemas(datos.temas);
  } catch (error) {
    console.error(error);
    ui.mostrarErrorDeCarga(
      'No se pudieron cargar los datos del examen. Comprueba que la página se está sirviendo ' +
        'por HTTP (por ejemplo con "python3 -m http.server") y no abriendo el archivo directamente.'
    );
    return;
  }

  ui.mostrarTamanoBanco(banco.length);
  ui.habilitarInicio(true);

  ui.botones.iniciar.addEventListener('click', iniciarExamen);
  ui.botones.reiniciar.addEventListener('click', iniciarExamen);
  ui.botones.siguiente.addEventListener('click', irSiguiente);
  ui.botones.anterior.addEventListener('click', irAnterior);
}

inicializar();
