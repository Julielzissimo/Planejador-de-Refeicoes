# 🍽️ Planejador de Refeições Inteligente (MealPlanner Pro v2.0)

> Organize sua rotina alimentar, gere listas de compras consolidadas automaticamente e utilize Inteligência Artificial para sugerir ingredientes.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech](https://img.shields.io/badge/built%20with-React%20%2B%20Gemini%20AI-blueviolet)

## 📖 Visão Geral

O **Planejador de Refeições** é uma Aplicação Web de Página Única (SPA) desenvolvida para facilitar o planejamento semanal de pratos. Diferente de planilhas simples, este sistema oferece persistência local, geração de PDF profissional e integração com a **Google Gemini AI** para preenchimento automático de ingredientes.

## ✨ Funcionalidades Principais

### 🧠 Inteligência Artificial (Gemini API)
- **Sugestão de Ingredientes:** Ao digitar o nome de um prato (ex: "Strogonoff"), a IA sugere automaticamente a lista de ingredientes com quantidades estimadas para 4 pessoas.
- **Estruturação de Dados:** Os ingredientes são categorizados por Quantidade, Unidade e Nome.

### 📅 Planejamento Interativo
- **Drag & Drop (Arrastar e Soltar):** Arraste uma refeição para outro dia para duplicá-la instantaneamente.
- **Células Expansíveis:** Visualize o prato e o modo de preparo diretamente no calendário.
- **Categorias Personalizáveis:** Adicione ou remova refeições (Café, Almoço, Lanche, Jantar, etc.).

### 🛒 Lista de Compras Inteligente
- **Consolidação Automática:** O sistema soma ingredientes iguais.
  - *Exemplo:* Se você usar 2 ovos na segunda e 3 na quarta, a lista final pedirá "5 un - Ovo".
- **Layout Profissional:** Lista gerada com checkboxes vetoriais e linhas zebradas para fácil leitura.

### 📄 Exportação PDF (Client-Side)
- Gera um arquivo pronto para impressão (A4).
- Inclui o **Calendário Visual** da semana.
- Inclui a **Lista de Compras** organizada em duas colunas.

### 💾 Persistência
- **Auto-save:** Todos os dados são salvos automaticamente no `localStorage` do navegador. Nada é perdido ao atualizar a página.
- **Privacidade:** Nenhum dado (além da consulta à IA) é enviado para servidores externos.

---

## 🛠️ Stack Tecnológica

*   **Frontend:** React 19, TypeScript, Vite
*   **Estilização:** Tailwind CSS
*   **Ícones:** Lucide React
*   **AI Engine:** Google Gemini SDK (`@google/genai`)
*   **PDF Engine:** jsPDF + jspdf-autotable

---

## 🚀 Como Executar

### Pré-requisitos

*   Node.js (v18+)
*   Uma chave de API do Google Gemini (obtenha em [Google AI Studio](https://aistudio.google.com/))

### Instalação

1.  Clone o repositório:
    ```bash
    git clone [https://github.com/seu-usuario/planejador-refeicoes.git](https://github.com/Julielzissimo/Planejador-de-Refeicoes.git)
    cd planejador-refeicoes
    ```

2.  Instale as dependências:
    ```bash
    npm install
    ```

3.  Configure a API Key:
    *   Crie um arquivo `.env` na raiz do projeto (ou configure no seu ambiente de build):
    ```env
    VITE_API_KEY=sua_chave_gemini_aqui
    ```
    *Nota: Se estiver usando o ambiente de desenvolvimento padrão deste projeto, a chave é injetada via `process.env.API_KEY`.*

4.  Rode o projeto:
    ```bash
    npm run dev
    ```

---

## 🎨 Layout e Design

O projeto utiliza um design system limpo baseado em tons de Esmeralda (`Emerald-500`) para transmitir frescor e saúde.

*   **Inputs:** Fundo branco com texto escuro para máximo contraste.
*   **Feedback Visual:** Efeitos de hover, loaders animados e transições suaves no Drag & Drop.
*   **Responsividade:** Funciona em desktops e dispositivos móveis (layout adaptável).
