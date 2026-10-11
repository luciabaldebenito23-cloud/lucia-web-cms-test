const isPublished = require("./isPublished.js");

module.exports = function (eleventyConfig) {
  // Copy static assets straight through to the output folder. These live at
  // the repo root (not under src/) so there's a single copy of every image,
  // font, and the css/js files shared with the rest of the project.
  eleventyConfig.addPassthroughCopy({ css: "css" });
  eleventyConfig.addPassthroughCopy({ js: "js" });
  eleventyConfig.addPassthroughCopy({ fonts: "fonts" });
  eleventyConfig.addPassthroughCopy({ img: "img" });
  eleventyConfig.addPassthroughCopy({ admin: "admin" });

  // Sort helper: newest-first isn't needed yet (dates aren't tracked per
  // property/post), so collections are ordered by the "orden" front-matter
  // field when present, otherwise by filename.
  function byOrden(a, b) {
    return (a.data.orden ?? 999) - (b.data.orden ?? 999);
  }

  // Descarta cualquier archivo de prueba/placeholder que haya quedado en el
  // repo (identificado por slug: "placeholder"), para que nunca se mezcle
  // con el contenido real del sitio.
  function notPlaceholder(item) {
    return item.data.slug !== "placeholder";
  }

  eleventyConfig.addCollection("propiedades", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/content/propiedades/*.md").filter(notPlaceholder).sort(byOrden);
  });

  // Excluye también las notas programadas para una fecha futura: no
  // aparecen en el blog ni en "Seguí leyendo" hasta que llega el día. Como
  // su permalink además se desactiva (ver blog.11tydata.js), tampoco se
  // genera la página individual, así que ni por el link directo son
  // visibles antes de tiempo.
  function isPublishedNow(item) {
    return isPublished(item.data.fecha_publicacion);
  }

  eleventyConfig.addCollection("blogposts", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/content/blog/*.md")
      .filter(notPlaceholder)
      .filter(isPublishedNow)
      .sort(byOrden);
  });

  eleventyConfig.addFilter("whereTrue", function (arr, key) {
    return (arr || []).filter((item) => item.data && item.data[key]);
  });

  eleventyConfig.addFilter("whereEq", function (arr, key, value) {
    return (arr || []).filter((item) => item.data && item.data[key] === value);
  });

  // Para el bloque "Seguí leyendo" de cada post: excluye el post actual
  // (por slug) y devuelve como máximo "limit" resultados, respetando el
  // orden de la colección (campo "orden").
  eleventyConfig.addFilter("relatedPosts", function (posts, currentSlug, limit) {
    limit = limit || 3;
    return (posts || [])
      .filter((item) => item.data && item.data.slug !== currentSlug)
      .slice(0, limit);
  });

  eleventyConfig.addFilter("urlencode", function (str) {
    return encodeURIComponent(str);
  });

  eleventyConfig.addFilter("formatNumero", function (precio) {
    if (precio === undefined || precio === null || precio === "") return "";
    var n = Number(precio);
    if (Number.isNaN(n)) return precio;
    return n.toLocaleString("es-AR");
  });

  // Serializa un objeto/array JS como JSON para incrustarlo en un
  // <script type="application/ld+json">. No usar | dump (formato distinto,
  // pensado para debug) — este filtro genera JSON válido de verdad.
  eleventyConfig.addFilter("jsonify", function (obj) {
    return JSON.stringify(obj);
  });

  // Convierte la lista de preguntas frecuentes (src/_data/faq.json) al
  // formato mainEntity que pide el schema FAQPage — una sola fuente de
  // datos para lo que se ve en pantalla y para el JSON-LD, así nunca
  // pueden quedar desincronizados.
  eleventyConfig.addFilter("faqToSchema", function (items) {
    return (items || []).map(function (item) {
      return {
        "@type": "Question",
        name: item.pregunta,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.respuesta,
        },
      };
    });
  });

  // URL absoluta del sitio en producción — usada para canonical/OG/JSON-LD.
  // Si el dominio cambiara alguna vez, se actualiza en un solo lugar.
  eleventyConfig.addGlobalData("siteUrl", "https://luciabaldebenito.com.ar");

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
