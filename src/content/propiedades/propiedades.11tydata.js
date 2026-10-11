module.exports = {
  layout: "layouts/property.njk",
  tags: ["propiedad"],
  eleventyComputed: {
    permalink: (data) => `propiedades/${data.slug}.html`,
  },
};
