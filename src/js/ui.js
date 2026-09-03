import { LETRAS, NOTA_APROBACION } from './config.js';
import { animarNumero, crearIcono } from './utils.js';
import * as quiz from './quiz.js';

const RADIO_ANILLO = 52;
const CIRCUNFERENCIA_ANILLO = 2 * Math.PI * RADIO_ANILLO;

// Las clases se escriben completas y nunca por interpolación, para que sigan
// siendo detectables si algún día se compila Tailwind en lugar de usar el CDN.
const ESTILOS_RESULTADO = {
  aprobado: {
    banner: 'rounded-2xl border p-8 text-center mb-6 border-emerald-500/30 bg-emerald-500/5',
    estado: 'font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-emerald-400',
    anillo: 'text-emerald-500',
    texto: 'APROBADO',
  },
  reprobado: {
    banner: 'rounded-2xl border p-8 text-center mb-6 border-babel-ember/30 bg-babel-ember/5',
    estado: 'font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-babel-ember-soft',
    anillo: 'text-babel-ember',
    texto: 'REPROBADO',
  },
};

// Requisitos del examen oficial supervisado. El usuario debe marcarlos uno a uno
// antes de poder iniciar el simulador: es la lista por la que más pruebas se anulan.
const REQUISITOS = [
  {
    titulo: 'Vídeo 360° del lugar',
    detalle:
      'Antes del examen te harán grabar un vídeo 360 grados del lugar donde estarás presentando el examen. Ese vídeo debe cumplir con los estándares mencionados.',
    icono:
      'M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z',
  },
  {
    titulo: 'Solo en la habitación',
    detalle:
      'Debes estar completamente solo en la habitación y sin ruidos de fondo. La IA detecta voces y rostros de terceros, aunque solo pasen por detrás.',
    icono:
      'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
  },
  {
    titulo: 'Sin gorra, capucha, audífonos ni lentes oscuros',
    detalle:
      'Nada puede cubrir tu cabeza, tus oídos ni tus ojos. Quítate la gorra, baja la capucha, retira los audífonos y no uses lentes oscuros.',
    icono:
      'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  },
  {
    titulo: 'Monitores adicionales (incluso apagados)',
    detalle:
      'Retira físicamente cualquier pantalla o monitor extra de tu escritorio. Aunque estén apagados, si llegas a mirar hacia esa pantalla un solo segundo, el sistema lo detectará y te cancelará la prueba.',
    icono:
      'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25',
  },
  {
    titulo: 'Cámara y mirada',
    detalle:
      'Mantén tu rostro siempre dentro del encuadre, bien iluminado y sin mirar hacia los lados o hacia abajo.',
    icono: [
      'M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z',
      'M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z',
    ],
  },
  {
    titulo: 'Permanencia',
    detalle: 'No te levantes ni te alejes de la pantalla hasta terminar.',
    icono: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    titulo: 'Navegación',
    detalle:
      'Utiliza únicamente la pestaña del examen. No abras otras páginas, aplicaciones ni ventanas.',
    icono:
      'M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 12h.008v.008H5.25V12z',
  },
  {
    titulo: 'Restricciones de teclado',
    detalle: 'No uses atajos para copiar, pegar ni hacer capturas de pantalla.',
    icono:
      'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75',
  },
  {
    titulo: 'Notificaciones',
    detalle: 'Desactiva alertas emergentes (WhatsApp, correo, Slack).',
    icono:
      'M9.143 17.082a24.248 24.248 0 003.844.148m-3.844-.148a23.852 23.852 0 01-5.455-1.31 8.964 8.964 0 002.3-5.542m3.155 6.852a3 3 0 005.667 1.97m1.965-2.277L21 21m-4.225-4.225a23.81 23.81 0 003.536-1.003A8.967 8.967 0 0018 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 01-5.667 1.97',
  },
  {
    titulo: 'Dispositivos',
    detalle: 'Guarda tu celular, tableta y reloj inteligente.',
    icono:
      'M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3',
  },
  {
    titulo: 'Escritorio limpio',
    detalle: 'Retira cualquier apunte, libro o material de tu lugar de trabajo.',
    icono:
      'M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 6v3.776',
  },
];

const ESTILOS_RESPUESTA = {
  incorrecta: {
    etiqueta: 'Tu respuesta',
    fila: 'flex items-start gap-2 rounded-lg border border-babel-ember/30 bg-babel-ember/10 p-3',
    icono: 'h-5 w-5 flex-none text-babel-ember-soft mt-0.5',
    titulo: 'text-xs font-medium text-babel-ember-soft',
    path: 'M6 18L18 6M6 6l12 12',
  },
  correcta: {
    etiqueta: 'Respuesta correcta',
    fila: 'flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3',
    icono: 'h-5 w-5 flex-none text-emerald-400 mt-0.5',
    titulo: 'text-xs font-medium text-emerald-400',
    path: 'M4.5 12.75l6 6 9-13.5',
  },
};

const el = {
  pantallas: {
    bienvenida: document.getElementById('welcome-screen'),
    examen: document.getElementById('quiz-screen'),
    resultados: document.getElementById('results-screen'),
  },
  bankCounts: document.querySelectorAll('[data-bank-count]'),
  startBtn: document.getElementById('start-btn'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  nextBtnText: document.getElementById('next-btn-text'),
  restartBtn: document.getElementById('restart-btn'),
  questionCard: document.getElementById('question-card'),
  questionText: document.getElementById('question-text'),
  optionsContainer: document.getElementById('options-container'),
  progressLabel: document.getElementById('progress-label'),
  answeredLabel: document.getElementById('answered-label'),
  progressBar: document.getElementById('progress-bar'),
  resultBanner: document.getElementById('result-banner'),
  resultStatus: document.getElementById('result-status'),
  resultDetail: document.getElementById('result-detail'),
  scoreRing: document.getElementById('score-ring'),
  scoreNumber: document.getElementById('score-number'),
  correctCount: document.getElementById('correct-count'),
  wrongCount: document.getElementById('wrong-count'),
  reviewSection: document.getElementById('review-section'),
  reviewContainer: document.getElementById('review-container'),
  weakTopics: document.getElementById('weak-topics'),
  weakTopicsList: document.getElementById('weak-topics-list'),
  loadError: document.getElementById('load-error'),
  recsDialog: document.getElementById('recs-dialog'),
  recsOpenBtn: document.getElementById('recs-open-btn'),
  recsCloseBtn: document.getElementById('recs-close-btn'),
  recsDoneBtn: document.getElementById('recs-done-btn'),
  recsList: document.getElementById('recs-list'),
  recsProgress: document.getElementById('recs-progress'),
  recsProgressBar: document.getElementById('recs-progress-bar'),
  recsBadge: document.getElementById('recs-badge'),
  recsOpenHint: document.getElementById('recs-open-hint'),
  startHint: document.getElementById('start-hint'),
};

// Catálogo de guías de repaso, indexado por identificador de tema.
let catalogoTemas = {};

export function establecerTemas(temas) {
  catalogoTemas = temas ?? {};
}

export const botones = {
  iniciar: el.startBtn,
  anterior: el.prevBtn,
  siguiente: el.nextBtn,
  reiniciar: el.restartBtn,
};

// El total del banco aparece en varios sitios de la bienvenida, así que se
// rellenan todos los elementos marcados en lugar de uno concreto.
export function mostrarTamanoBanco(total) {
  el.bankCounts.forEach((nodo) => {
    nodo.textContent = total;
  });
}

// El botón de inicio depende de dos condiciones independientes: que el banco
// haya cargado y que el usuario haya confirmado los requisitos del examen.
let datosListos = false;
let requisitosConfirmados = false;

function actualizarInicio() {
  el.startBtn.disabled = !(datosListos && requisitosConfirmados);
  el.startHint.classList.toggle('hidden', requisitosConfirmados);
}

export function habilitarInicio(habilitado) {
  datosListos = habilitado;
  actualizarInicio();
}

export function mostrarErrorDeCarga(mensaje) {
  el.loadError.textContent = mensaje;
  el.loadError.classList.remove('hidden');
  datosListos = false;
  actualizarInicio();
}

// Checklist de requisitos del examen oficial. Usa <dialog> nativo, así que el
// foco atrapado y el cierre con Escape los aporta el navegador. Se conecta antes
// de cargar los datos, porque su contenido es útil aunque el banco falle.
export function conectarRecomendaciones() {
  const dialogo = el.recsDialog;

  // Sin <dialog> no hay forma de mostrar la lista, y dejar el simulador
  // bloqueado para siempre sería peor que no exigir la confirmación.
  if (!dialogo || typeof dialogo.showModal !== 'function') {
    el.recsOpenBtn?.classList.add('hidden');
    requisitosConfirmados = true;
    actualizarInicio();
    return;
  }

  const casillas = REQUISITOS.map(crearRequisito);
  el.recsList.replaceChildren(...casillas.map((c) => c.closest('li')));

  const refrescarProgreso = () => {
    const marcados = casillas.filter((c) => c.checked).length;
    const total = casillas.length;

    el.recsProgress.textContent = `${marcados}/${total}`;
    el.recsProgressBar.style.width = `${(marcados / total) * 100}%`;
    el.recsDoneBtn.disabled = marcados < total;
  };

  casillas.forEach((casilla) => casilla.addEventListener('change', refrescarProgreso));
  refrescarProgreso();

  const abrir = () => {
    if (dialogo.open) return;
    document.body.classList.add('overflow-hidden');
    dialogo.showModal();
  };
  const cerrar = () => {
    if (dialogo.open) dialogo.close();
  };

  el.recsOpenBtn.addEventListener('click', abrir);
  el.recsCloseBtn.addEventListener('click', cerrar);

  el.recsDoneBtn.addEventListener('click', () => {
    requisitosConfirmados = true;
    marcarBotonConfirmado();
    actualizarInicio();
    cerrar();
  });

  // Clic fuera de la tarjeta: el evento apunta al propio <dialog>, que ocupa
  // solo la caja del modal, así que basta comparar con sus límites.
  dialogo.addEventListener('click', (evento) => {
    if (evento.target !== dialogo) return;

    const caja = dialogo.getBoundingClientRect();
    const dentro =
      evento.clientY >= caja.top &&
      evento.clientY <= caja.bottom &&
      evento.clientX >= caja.left &&
      evento.clientX <= caja.right;

    if (!dentro) cerrar();
  });

  // Evita que el fondo se desplace mientras el modal está abierto.
  dialogo.addEventListener('close', () => {
    document.body.classList.remove('overflow-hidden');
    el.recsOpenBtn.focus();
  });
}

function marcarBotonConfirmado() {
  el.recsBadge.className =
    'flex-none rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400';
  el.recsBadge.textContent = 'Confirmado';
  el.recsOpenHint.textContent = 'Puedes volver a consultarlos cuando quieras';
}

/** Construye una fila del checklist y devuelve su casilla. */
function crearRequisito({ titulo, detalle, icono }) {
  const item = document.createElement('li');

  const etiqueta = document.createElement('label');
  etiqueta.className =
    'flex cursor-pointer gap-3 rounded-xl border border-babel-line bg-babel-carbon/40 p-3 transition-colors hover:border-babel-steel has-[:checked]:border-babel-orange/45 has-[:checked]:bg-babel-orange/[0.07]';

  const casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.className = 'peer sr-only';

  const marca = document.createElement('span');
  marca.className =
    'mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md border-2 border-babel-steel text-transparent transition-colors peer-checked:border-babel-orange peer-checked:bg-babel-orange peer-checked:text-babel-ink peer-focus-visible:ring-2 peer-focus-visible:ring-babel-orange peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-babel-carbon';
  marca.append(crearIcono('M4.5 12.75l6 6 9-13.5', 'h-4 w-4'));

  const marco = document.createElement('span');
  marco.className =
    'mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-babel-orange/10 text-babel-orange';
  marco.append(crearIcono(icono, 'h-4 w-4'));

  const texto = document.createElement('span');
  texto.className = 'min-w-0 flex-1';

  const nombre = document.createElement('span');
  nombre.className = 'block text-sm font-semibold text-white';
  nombre.textContent = titulo;

  const descripcion = document.createElement('span');
  descripcion.className = 'mt-1 block text-sm leading-relaxed text-babel-ash';
  descripcion.textContent = detalle;

  texto.append(nombre, descripcion);
  etiqueta.append(casilla, marca, marco, texto);
  item.append(etiqueta);

  return casilla;
}

export function mostrarPantalla(nombre) {
  Object.values(el.pantallas).forEach((pantalla) => pantalla.classList.add('hidden'));
  el.pantallas[nombre].classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function renderPregunta(alSeleccionar) {
  const pregunta = quiz.preguntaActual();
  const numero = quiz.indiceActual() + 1;
  const total = quiz.totalPreguntas();

  reiniciarAnimacion(el.questionCard);

  el.questionText.textContent = pregunta.pregunta;
  el.progressLabel.textContent = `Pregunta ${numero} de ${total}`;
  el.answeredLabel.textContent = `${quiz.totalRespondidas()} respondidas`;
  el.progressBar.style.width = `${(numero / total) * 100}%`;

  el.optionsContainer.replaceChildren(
    ...pregunta.opciones.map((opcion, i) =>
      crearBotonOpcion(opcion, i, quiz.respuestaActual() === i, alSeleccionar)
    )
  );

  el.prevBtn.disabled = quiz.esPrimera();
  el.nextBtnText.textContent = quiz.esUltima() ? 'Finalizar' : 'Siguiente';
  el.nextBtn.disabled = quiz.respuestaActual() === null;
}

function crearBotonOpcion(opcion, indice, seleccionada, alSeleccionar) {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className =
    'group flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ' +
    (seleccionada
      ? 'border-babel-orange bg-babel-orange/10 ring-1 ring-babel-orange/50'
      : 'border-babel-line bg-babel-carbon/50 hover:border-babel-steel hover:bg-babel-line/60');
  boton.setAttribute('aria-pressed', String(seleccionada));

  const badge = document.createElement('span');
  badge.className =
    'flex h-7 w-7 flex-none items-center justify-center rounded-lg text-sm font-bold transition-colors ' +
    (seleccionada
      ? 'bg-babel-orange text-babel-ink'
      : 'bg-babel-line text-babel-ash group-hover:bg-babel-steel group-hover:text-white');
  badge.textContent = LETRAS[indice];

  const texto = document.createElement('span');
  texto.className = 'pt-0.5 text-sm sm:text-base text-babel-mist';
  texto.textContent = opcion;

  boton.append(badge, texto);
  boton.addEventListener('click', () => alSeleccionar(indice));

  return boton;
}

export function renderResultados(resultado) {
  const { correctas, total, nota, aprobado, incorrectas, errores } = resultado;
  const estilos = aprobado ? ESTILOS_RESULTADO.aprobado : ESTILOS_RESULTADO.reprobado;

  el.resultBanner.className = estilos.banner;
  el.resultStatus.textContent = estilos.texto;
  el.resultStatus.className = estilos.estado;
  el.scoreRing.classList.remove('text-emerald-500', 'text-babel-ember');
  el.scoreRing.classList.add(estilos.anillo);

  el.resultDetail.textContent =
    `Obtuviste ${correctas} de ${total} respuestas correctas. ` +
    `Nota mínima para aprobar: ${NOTA_APROBACION}.`;

  el.correctCount.textContent = correctas;
  el.wrongCount.textContent = incorrectas;

  animarPuntuacion(nota);
  renderTemasDebiles(resultado.temasDebiles);
  renderReporteErrores(errores);
  mostrarPantalla('resultados');
}

function renderTemasDebiles(temasDebiles) {
  if (!temasDebiles || temasDebiles.length === 0) {
    el.weakTopics.classList.add('hidden');
    return;
  }

  el.weakTopics.classList.remove('hidden');
  el.weakTopicsList.replaceChildren(...temasDebiles.map(crearFilaTemaDebil));
}

function crearFilaTemaDebil({ tema, fallos, total }) {
  const fila = document.createElement('div');
  fila.className = 'rounded-xl border border-babel-line bg-babel-carbon/80 p-4';

  const cabecera = document.createElement('div');
  cabecera.className = 'flex items-baseline justify-between gap-3 mb-2';

  const nombre = document.createElement('p');
  nombre.className = 'text-sm font-semibold text-white';
  nombre.textContent = catalogoTemas[tema]?.nombre ?? tema;

  const proporcion = document.createElement('p');
  proporcion.className = 'flex-none text-xs font-medium text-babel-ash';
  proporcion.textContent = `${fallos} de ${total}`;

  const carril = document.createElement('div');
  carril.className = 'h-1.5 w-full overflow-hidden rounded-full bg-babel-line';

  const barra = document.createElement('div');
  barra.className = 'h-full rounded-full bg-gradient-to-r from-babel-sun to-babel-ember';
  barra.style.width = `${(fallos / total) * 100}%`;

  carril.appendChild(barra);
  cabecera.append(nombre, proporcion);
  fila.append(cabecera, carril);
  return fila;
}

function animarPuntuacion(nota) {
  el.scoreNumber.textContent = '0';
  el.scoreRing.style.strokeDasharray = CIRCUNFERENCIA_ANILLO;
  el.scoreRing.style.strokeDashoffset = CIRCUNFERENCIA_ANILLO;

  setTimeout(() => {
    el.scoreRing.style.strokeDashoffset = CIRCUNFERENCIA_ANILLO - (nota / 100) * CIRCUNFERENCIA_ANILLO;
    animarNumero(el.scoreNumber, 0, nota, 900);
  }, 100);
}

function renderReporteErrores(errores) {
  if (errores.length === 0) {
    el.reviewContainer.replaceChildren(crearTarjetaSinErrores());
    return;
  }

  el.reviewContainer.replaceChildren(
    ...errores.map((error, i) => crearTarjetaError(error, i + 1))
  );
}

function crearTarjetaSinErrores() {
  const caja = document.createElement('div');
  caja.className = 'rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center';

  const titulo = document.createElement('p');
  titulo.className = 'font-display text-lg font-bold text-emerald-400';
  titulo.textContent = '¡Examen perfecto!';

  const detalle = document.createElement('p');
  detalle.className = 'mt-1 text-sm text-babel-ash';
  detalle.textContent = 'No cometiste ningún error. Excelente dominio del tema.';

  caja.append(titulo, detalle);
  return caja;
}

function crearTarjetaError(error, posicion) {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'rounded-xl border border-babel-line bg-babel-carbon/80 p-5';

  const cabecera = document.createElement('p');
  cabecera.className = 'text-xs font-semibold uppercase tracking-wider text-babel-muted mb-2';
  cabecera.textContent = `Error ${posicion} · Pregunta ${error.numero}`;

  const enunciado = document.createElement('p');
  enunciado.className = 'font-display text-sm sm:text-base font-semibold text-white mb-4';
  enunciado.textContent = error.enunciado;

  const respuestas = document.createElement('div');
  respuestas.className = 'space-y-2';
  respuestas.append(
    crearFilaRespuesta(ESTILOS_RESPUESTA.incorrecta, error.textoSeleccionado),
    crearFilaRespuesta(ESTILOS_RESPUESTA.correcta, error.textoCorrecto)
  );

  tarjeta.append(cabecera, enunciado, respuestas);

  const guia = crearGuiaDeRepaso(error.tema);
  if (guia) tarjeta.append(guia);

  return tarjeta;
}

// Bloque plegable con la recomendación de estudio del tema de la pregunta.
function crearGuiaDeRepaso(tema) {
  const info = catalogoTemas[tema];
  if (!info) return null;

  const detalle = document.createElement('details');
  detalle.className = 'mt-4 rounded-lg border border-babel-orange/20 bg-babel-orange/5';

  const resumen = document.createElement('summary');
  resumen.className =
    'flex cursor-pointer select-none items-center gap-2 px-3 py-2.5 text-xs font-semibold text-babel-orange hover:text-babel-orange-soft';
  resumen.append(
    crearIcono('M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', 'h-4 w-4 flex-none'),
    document.createTextNode(`Qué repasar · ${info.nombre}`),
    crearIcono('M19.5 8.25l-7.5 7.5-7.5-7.5', 'guia-chevron ml-auto h-4 w-4 flex-none transition-transform duration-200')
  );

  const cuerpo = document.createElement('div');
  cuerpo.className = 'space-y-3 border-t border-babel-orange/20 px-3 py-3';

  if (info.resumen) {
    const texto = document.createElement('p');
    texto.className = 'text-sm leading-relaxed text-babel-mist';
    texto.textContent = info.resumen;
    cuerpo.append(texto);
  }

  if (info.repasar?.length) {
    const lista = document.createElement('ul');
    lista.className = 'space-y-1.5';
    lista.append(...info.repasar.map(crearPuntoDeRepaso));
    cuerpo.append(lista);
  }

  if (info.recursos?.length) {
    const enlaces = document.createElement('div');
    enlaces.className = 'flex flex-wrap gap-2 pt-1';
    enlaces.append(...info.recursos.map(crearEnlaceRecurso));
    cuerpo.append(enlaces);
  }

  detalle.append(resumen, cuerpo);
  return detalle;
}

function crearPuntoDeRepaso(punto) {
  const item = document.createElement('li');
  item.className = 'flex gap-2 text-sm leading-relaxed text-babel-ash';

  const vinyeta = document.createElement('span');
  vinyeta.className = 'flex-none text-babel-orange';
  vinyeta.textContent = '•';

  const texto = document.createElement('span');
  texto.textContent = punto;

  item.append(vinyeta, texto);
  return item;
}

function crearEnlaceRecurso({ titulo, url }) {
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.target = '_blank';
  enlace.rel = 'noopener noreferrer';
  enlace.className =
    'inline-flex items-center gap-1.5 rounded-lg border border-babel-orange/30 bg-babel-orange/10 px-2.5 py-1.5 text-xs font-medium text-babel-orange transition-colors hover:border-babel-orange/60 hover:bg-babel-orange/20 hover:text-babel-orange-soft';
  enlace.append(
    document.createTextNode(titulo),
    crearIcono('M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25', 'h-3 w-3 flex-none')
  );
  return enlace;
}

function crearFilaRespuesta(estilos, contenido) {
  const fila = document.createElement('div');
  fila.className = estilos.fila;

  const icono = crearIcono(estilos.path, estilos.icono);

  const bloque = document.createElement('div');

  const titulo = document.createElement('p');
  titulo.className = estilos.titulo;
  titulo.textContent = estilos.etiqueta;

  const texto = document.createElement('p');
  texto.className = 'text-sm text-babel-mist';
  texto.textContent = contenido;

  bloque.append(titulo, texto);
  fila.append(icono, bloque);
  return fila;
}

// Fuerza un reflow para poder relanzar la animación de entrada.
function reiniciarAnimacion(elemento) {
  elemento.classList.remove('animate-fadeIn');
  void elemento.offsetWidth;
  elemento.classList.add('animate-fadeIn');
}
