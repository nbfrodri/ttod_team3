// Astro checks component paths and props; this declaration supports plain tsc imports.
declare module '*.astro' {
  const component: import('astro/runtime/server/index.js').AstroComponentFactory;
  export default component;
}
