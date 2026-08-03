// Baraja un array con Fisher-Yates y devuelve una copia, sin mutar el original.
export function barajar(array) {
  const copia = array.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Interpola un número entero entre dos valores durante la duración indicada.
export function animarNumero(elemento, desde, hasta, duracion) {
  const inicio = performance.now();

  function paso(ahora) {
    const progreso = Math.min((ahora - inicio) / duracion, 1);
    elemento.textContent = Math.round(desde + (hasta - desde) * progreso);
    if (progreso < 1) requestAnimationFrame(paso);
  }

  requestAnimationFrame(paso);
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// Crea un icono SVG de trazo a partir del atributo "d" de su path.
export function crearIcono(d, clases) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('class', clases);

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  svg.appendChild(path);

  return svg;
}
