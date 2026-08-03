// Configuración del CDN de Tailwind. Se carga después del script del CDN y se
// omite en silencio si este no está disponible (por ejemplo, sin conexión).
//
// La paleta reproduce la identidad corporativa de Babel: naranja como color
// principal, negro de fondo y la escala de grises de la marca.
if (typeof tailwind !== 'undefined') {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          babel: {
            orange: '#F39433',
            'orange-soft': '#F6AF67',
            ember: '#E7512B',
            'ember-soft': '#F06B45',
            sun: '#FFED00',
            navy: '#383A6F',
            ink: '#070707',
            carbon: '#111213',
            line: '#232627',
            steel: '#5F6567',
            muted: '#7C8283',
            ash: '#A8AEAF',
            mist: '#E2E6E8',
            fog: '#F5F5F5',
          },
        },
        fontFamily: {
          sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
          display: ['Inter Tight', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        },
      },
    },
  };
}
