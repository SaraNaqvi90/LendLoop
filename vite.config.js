import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // The shared root .env sets NODE_ENV=development for Express. Keep Vite's
  // production build optimized even when that value is present in the shell.
  define: {
    'process.env.NODE_ENV': JSON.stringify(command === 'build' ? 'production' : 'development')
  }
}));
