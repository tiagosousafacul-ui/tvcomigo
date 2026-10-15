# 🍿 TV Comigo - Watch Party & Voz Sem Quedas

> Assista a filmes, streamings (Netflix, Disney+, Prime Video, Max, YouTube) sincronizados com amigos em tempo real, com bate-papo de voz HD sem quedas para iPhone (iOS), Android e PC/Desktop.

🌐 **Domínio de Produção Oficial**: [https://tvcomigo.vercel.app/](https://tvcomigo.vercel.app/)

---

## 🚀 Como subir para o GitHub e dar Deploy no Vercel

### 1. Criar repositório no GitHub

1. Vá em [github.com/new](https://github.com/new)
2. Crie um novo repositório (ex: `tvcomigo` ou `tv-comigo`)
3. No seu terminal ou máquina local, execute:

```bash
# Se ainda não configurou o remoto:
git remote add origin https://github.com/SEU_USUARIO/tvcomigo.git
git branch -M main
git push -u origin main
```

---

### 2. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"**
2. Selecione o repositório do GitHub que você acabou de criar (`tvcomigo`)
3. As configurações já estão pré-configuradas no `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Clique em **Deploy**

---

### 3. Conectar o Domínio `tvcomigo.vercel.app`

1. No painel do seu projeto no Vercel, acesse:
   **Settings** > **Domains**
2. Se o domínio já for o padrão gerado pelo Vercel, ele estará disponível diretamente em:
   `https://tvcomigo.vercel.app/`
3. Se for um subdomínio/domínio personalizado:
   - Digite `tvcomigo.vercel.app`
   - Salve e confirme!

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion
- **Sincronização & Tempo Real**: WebRTC Mesh + Adaptive Ping Heartbeat
- **Mídia & Streaming**: Suporte a HLS, MP4, WebM, Screen Share HD (60 FPS com áudio do sistema)
- **Hospedagem & Serverless**: Vite SPA + Vercel Serverless Functions (`/api/*`)
- **PWA & Mobile**: Totalmente responsivo para iPhone (iOS Safari PWA) e Android (Chrome PWA)

---

## 💻 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar servidor local completo
npm run dev

# Gerar build de produção
npm run build

# Testar tipagem
npm run lint
```
