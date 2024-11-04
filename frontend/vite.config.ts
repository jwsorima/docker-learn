/// <reference types="vitest" />
import { defineConfig, loadEnv, UserConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default (async ({ mode }: { mode: string }): Promise<UserConfig> => {
  const env = loadEnv(mode, process.cwd());

  const usePolling = env.VITE_USE_POLLING === 'true';

  return defineConfig({
    optimizeDeps: {
      include: [
        '@emotion/react', 
        '@emotion/styled', 
        '@mui/material/Tooltip'
      ],
    },
    plugins: [
      {
        name: 'move-scripts-to-body',
        transformIndexHtml(html: string): string {
          // Extract all <script> tags from the <head>
          const scriptTags: string[] = [];
          const updatedHtml = html.replace(/<head>([\s\S]*?)<\/head>/, (_match, headContent) => {
            // Capture <script> tags and remove them from the head content
            const cleanedHeadContent = headContent.replace(/<script[\s\S]*?<\/script>/g, (scriptTag: string) => {
              scriptTags.push(scriptTag);
              return '';
            });
            return `<head>${cleanedHeadContent}</head>`;
          });
  
          // Insert the <script> tags before the closing </body> tag
          const finalHtml = updatedHtml.replace('</body>', `${scriptTags.join('\n')}</body>`);
          return finalHtml;
        }
      },
      react()
    ],
    build: {
      cssCodeSplit: true,
      minify: true,
      rollupOptions: {
          output:{
              manualChunks(id) {
                  if (id.indexOf('node_modules') !== -1) {
                      return id.toString().split('node_modules/')[1].split('/')[0].toString();
                  }
              }
          }
      }
    },
    server: {
      host: true, // Allow external access
      port: 5173,      // Set the port to match the Docker setup
      watch: {
        usePolling    // Enable polling if the environment variable is set
      },
      hmr: {
        host: 'localhost', // Set HMR host to localhost for Docker compatibility
        port: 5173         // Set the HMR port to match the dev server
      }
    },
    test: {
      globals: true,
      environment: "jsdom",
    },
  })
})
