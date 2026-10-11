module.exports = {
  layout: "layouts/blog-post.njk",
  tags: ["blogpost"],
  eleventyComputed: {
    permalink: (data) => `blog/${data.slug}.html`,
  },
};
