// Ambient typing for the chatbot's CSS module. Astro provides `*.module.css`
// types via `astro/client`, but tsc --noEmit (run directly, not through Astro)
// doesn't load that reference, so this keeps the standalone typecheck green.
declare const styles: { readonly [key: string]: string };
export default styles;
