// Babel is only used by Jest (Vite has its own build). It turns the app's
// modern JavaScript + JSX into code that Jest can run.

// Vite-only syntax like  import.meta.env.DEV  is not understood by Jest, so in
// tests `import.meta` is replaced with an empty `{ env: {} }` object.
const importMetaForJest = ({ types: t }) => ({
  name: "import-meta-for-jest",
  visitor: {
    MetaProperty(path) {
      if (path.node.meta.name === "import" && path.node.property.name === "meta") {
        path.replaceWith(t.objectExpression([t.objectProperty(t.identifier("env"), t.objectExpression([]))]));
      }
    },
  },
});

module.exports = (api) => {
  const isTest = api.env("test");
  return {
    presets: [
      ["@babel/preset-env", { targets: { node: "current" } }],
      ["@babel/preset-react", { runtime: "automatic" }],
    ],
    plugins: isTest ? [importMetaForJest] : [],
  };
};
