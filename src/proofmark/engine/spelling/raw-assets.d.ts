// Vite `?raw` imports bundle file contents as strings at build time.
// Needed because `dictionary-en`'s default loader uses `fs.readFile`,
// which doesn't exist inside the Word task pane (a browser environment).
declare module "*.aff?raw" {
  const content: string;
  export default content;
}
declare module "*.dic?raw" {
  const content: string;
  export default content;
}
