// vite.config.js

//  importa helpers para trabalhar com caminhos de arquivos/URLs no Node
import { fileURLToPath, URL } from 'node:url'

//  importa a função defineConfig, que facilita a tipagem/config do Vite
import { defineConfig } from 'vite'

//  importa o plugin oficial do Vue 3 para o Vite
import vue from '@vitejs/plugin-vue'

//  exporta a configuração padrão do Vite
export default defineConfig({
  //  registra o plugin do Vue
  plugins: [vue()],

  //  configura aliases de import (ex.: '@/' apontando para 'src')
  resolve: {
    alias: {
      // Linha 18: '@' passa a apontar para a pasta ./src
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  //  configurações do servidor de desenvolvimento do Vite
  server: {
    //  porta onde o Vite vai rodar o front
    port: 5173,
    //  se a porta 5173 estiver ocupada, ele pode tentar outra
    strictPort: false,
    //  permite acesso externo (útil se acessar de outro dispositivo na rede)
    host: true,

    //  configuração de proxy para redirecionar chamadas /api para o backend
    proxy: {
      //  qualquer requisição que comece com /api...
      '/api': {
        // será repassada para o backend Node rodando em http://localhost:4000
        target: 'http://localhost:4000',
        //  ajusta o cabeçalho Host da requisição para bater com o servidor de destino
        changeOrigin: true,
        // não usamos rewrite aqui; o caminho /api/... chega igual no backend.
        // Isso é importante porque no server.js as rotas já estão montadas com prefixo /api.
      },
    },
  },
})
