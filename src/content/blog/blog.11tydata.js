const isPublished = require("../../../isPublished.js");

module.exports = {
  layout: "layouts/blog-post.njk",
  tags: ["blogpost"],
  eleventyComputed: {
    // Si la nota tiene una fecha_publicacion futura, el permalink se
    // desactiva (false) y Eleventy no genera el archivo HTML para esa nota
    // — queda completamente invisible, ni por el link directo, hasta que
    // pase el próximo build automático en o después de esa fecha.
    permalink: (data) => (isPublished(data.fecha_publicacion) ? `blog/${data.slug}.html` : false),
  },
};
