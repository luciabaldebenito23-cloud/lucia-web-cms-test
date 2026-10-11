// Determina si una nota de blog (o cualquier contenido con un campo
// "fecha_publicacion") ya debería estar visible en el sitio.
//
// - Sin fecha_publicacion => se considera publicado (compatibilidad con
//   contenido existente que no usa este campo).
// - Con fecha_publicacion => se compara contra el día de calendario actual
//   en Argentina (UTC-3, el país no usa horario de verano). El campo se
//   carga desde el panel como una fecha simple ("2026-10-12"), que YAML
//   interpreta como medianoche UTC de ese día — por eso se lee su año/mes/día
//   en UTC tal cual, sin aplicar ningún corrimiento horario, y solo se ajusta
//   "ahora" al huso de Argentina para saber en qué día de calendario está
//   parada la Argentina en el momento del build.
//
// El sitio se reconstruye automáticamente una vez por día (ver el workflow
// "Publicar sitio", trigger "schedule"), así que una nota programada para
// una fecha futura pasa a estar visible sola, sin que nadie tenga que volver
// a guardar nada.
function isPublished(fechaPublicacion, now) {
  if (!fechaPublicacion) return true;

  now = now || new Date();
  const ARG_OFFSET_MS = 3 * 60 * 60 * 1000;
  const argNow = new Date(now.getTime() - ARG_OFFSET_MS);
  const todayArg = Date.UTC(argNow.getUTCFullYear(), argNow.getUTCMonth(), argNow.getUTCDate());

  const pub = new Date(fechaPublicacion);
  const pubDay = Date.UTC(pub.getUTCFullYear(), pub.getUTCMonth(), pub.getUTCDate());

  return pubDay <= todayArg;
}

module.exports = isPublished;
