const firebaseConfig = {
  apiKey: "AIzaSyDsLRGT9TkZ4cZflpks9Q81IqUzyRf4AoE",
  authDomain: "hawks-treinamentos.firebaseapp.com",
  projectId: "hawks-treinamentos",
  storageBucket: "hawks-treinamentos.firebasestorage.app",
  messagingSenderId: "329931330038",
  appId: "1:329931330038:web:0e9f0a96b76b34ca2237d7",
};

const cloudinaryConfig = {
  cloudName: "dn6yal7sp",
  uploadPreset: "hawks-treinamento",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const state = {
  user: null,
  userData: null,
  cards: [],
  users: [],
  pendingUsers: [],
  currentView: "loading",
  selectedCard: null,
  unsubscribers: [],
  createCardAttachments: [],
};

const COLUMNS = [
  { id: "projetos", name: "PROJETOS", color: "bg-red-600" },
  { id: "mecanica", name: "MECÂNICA", color: "bg-gray-700" },
  { id: "eletrica", name: "ELÉTRICA", color: "bg-red-700" },
  { id: "programacao", name: "PROGRAMAÇÃO", color: "bg-gray-800" },
  { id: "concluido", name: "CONCLUÍDO", color: "bg-green-700" },
];

const LABELS = [
  { id: "afazer", name: "A fazer", color: "bg-yellow-500" },
  { id: "emandamento", name: "Em andamento", color: "bg-blue-500" },
  { id: "emrevisao", name: "Em revisão", color: "bg-purple-500" },
];

const AREAS = [
  { id: "mecanica", name: "Mecânica", color: "bg-gray-600" },
  { id: "eletrica", name: "Elétrica", color: "bg-red-600" },
  { id: "programacao", name: "Programação", color: "bg-blue-600" },
];

const TIPOS_MECANICA = [
  { id: "mecanica", name: "Mecânica", color: "bg-orange-500" },
  { id: "cad", name: "CAD", color: "bg-cyan-500" },
];

const HAWK_LOGO_URL =
  "https://res.cloudinary.com/dn6yal7sp/image/upload/v1766111739/logo_lkaein.jpg";
const HAWK_LOGO = `<img src="${HAWK_LOGO_URL}" alt="Hawks Logo" class="w-full h-full object-contain rounded-full">`;

function isLate(deadline) {
  if (!deadline) return false;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  return now > deadlineDate;
}

function formatDeadline(deadline) {
  if (!deadline) return "";
  const date = new Date(deadline);
  return (
    date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " às " +
    date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  );
}

function formatDateTime(timestamp) {
  if (!timestamp) return "-";
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date.getTime())) return "-";
    return (
      date.toLocaleDateString("pt-BR") +
      " " +
      date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  } catch (e) {
    return "-";
  }
}

function getErrorMessage(code) {
  const messages = {
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/email-already-in-use": "Este email já está em uso.",
    "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
    "auth/invalid-email": "Email inválido.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente mais tarde.",
  };
  return messages[code] || "Ocorreu um erro. Tente novamente.";
}

function getAttachmentIcon(type) {
  const icons = {
    image: `<div class="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>`,
    video: `<div class="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></div>`,
    link: `<div class="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></div>`,
    raw: `<div class="w-8 h-8 bg-gray-500/20 rounded flex items-center justify-center flex-shrink-0"><svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>`,
  };
  return icons[type] || icons.raw;
}

function render() {
  const app = document.getElementById("app");
  switch (state.currentView) {
    case "loading":
      app.innerHTML = renderLoading();
      break;
    case "login":
      app.innerHTML = renderLogin();
      break;
    case "register":
      app.innerHTML = renderRegister();
      break;
    case "pending":
      app.innerHTML = renderPending();
      break;
    case "kanban":
      app.innerHTML = renderKanban();
      setupKanbanListeners();
      break;
    case "admin":
      app.innerHTML = renderAdmin();
      break;
  }
}

function renderLoading() {
  return `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            <div class="text-center">
                <div class="w-20 h-20 mx-auto mb-4">${HAWK_LOGO}</div>
                <div class="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-white text-lg font-medium">Hawks - Treinamentos</p>
                <p class="text-gray-400 text-sm">Carregando...</p>
            </div>
        </div>
    `;
}

function renderLogin() {
  return `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4">
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md card-shadow">
                <div class="text-center mb-8">
                    <div class="w-20 h-20 mx-auto mb-4">${HAWK_LOGO}</div>
                    <h1 class="text-3xl font-bold text-white">Hawks</h1>
                    <p class="text-red-500 font-semibold">Treinamentos</p>
                </div>
                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input type="email" id="loginEmail" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" placeholder="seu@email.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                        <input type="password" id="loginPassword" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" placeholder="••••••••">
                    </div>
                    <div id="loginError" class="text-red-500 text-sm hidden"></div>
                    <button type="submit" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition transform hover:scale-[1.02] active:scale-[0.98]">Entrar</button>
                </form>
                <div class="mt-6 text-center">
                    <p class="text-gray-400">Não tem conta? <button onclick="navigate('register')" class="text-red-500 hover:text-red-400 font-medium">Cadastre-se</button></p>
                </div>
            </div>
        </div>
    `;
}

function renderRegister() {
  return `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4">
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md card-shadow">
                <div class="text-center mb-8">
                    <div class="w-20 h-20 mx-auto mb-4">${HAWK_LOGO}</div>
                    <h1 class="text-3xl font-bold text-white">Criar Conta</h1>
                    <p class="text-gray-400 mt-2">Junte-se à equipe Hawks</p>
                </div>
                <form id="registerForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Nome Completo</label>
                        <input type="text" id="registerName" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" placeholder="Seu nome">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input type="email" id="registerEmail" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" placeholder="seu@email.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Senha</label>
                        <input type="password" id="registerPassword" required minlength="6" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" placeholder="Mínimo 6 caracteres">
                    </div>
                    <div id="registerError" class="text-red-500 text-sm hidden"></div>
                    <button type="submit" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition transform hover:scale-[1.02] active:scale-[0.98]">Cadastrar</button>
                </form>
                <div class="mt-6 text-center">
                    <p class="text-gray-400">Já tem conta? <button onclick="navigate('login')" class="text-red-500 hover:text-red-400 font-medium">Faça login</button></p>
                </div>
            </div>
        </div>
    `;
}

function renderPending() {
  return `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black p-4">
            <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md card-shadow text-center">
                <div class="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 pulse-red">
                    <svg class="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-white mb-4">Aguardando Aprovação</h1>
                <p class="text-gray-400 mb-6">Seu cadastro foi recebido! Um administrador irá revisar e aprovar sua conta em breve.</p>
                <div class="bg-gray-800 rounded-lg p-4 mb-6">
                    <p class="text-sm text-gray-300"><span class="font-medium text-white">${
                      state.userData?.name || "Usuário"
                    }</span><br><span class="text-gray-500">${
    state.userData?.email || ""
  }</span></p>
                </div>
                <button onclick="logout()" class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">Sair</button>
            </div>
        </div>
    `;
}

function renderKanban() {
  const isAdmin =
    state.userData?.role === "admin" || state.userData?.role === "creator";
  return `
        <div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            <header class="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
                <div class="max-w-full mx-auto px-4 py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10">${HAWK_LOGO}</div>
                            <div>
                                <h1 class="text-xl font-bold text-white">Hawks</h1>
                                <p class="text-xs text-red-500 font-semibold">Treinamentos</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            ${
                              isAdmin
                                ? `
                                <button onclick="navigate('admin')" class="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    <span class="hidden sm:inline">Admin</span>
                                    ${
                                      state.pendingUsers.length > 0
                                        ? `<span class="bg-white text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">${state.pendingUsers.length}</span>`
                                        : ""
                                    }
                                </button>
                                <button onclick="openCreateCardModal()" class="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                                    </svg>
                                    <span class="hidden sm:inline">Nova Tarefa</span>
                                </button>
                            `
                                : ""
                            }
                            <div class="flex items-center space-x-3">
                                <div class="text-right hidden sm:block">
                                    <p class="text-sm font-medium text-white">${
                                      state.userData?.name || "Usuário"
                                    }</p>
                                    <p class="text-xs text-gray-400">${
                                      isAdmin ? "Administrador" : "Membro"
                                    }</p>
                                </div>
                                <button onclick="logout()" class="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition" title="Sair">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <main class="p-4 overflow-x-auto">
                <div class="flex space-x-4 min-w-max pb-4">
                    ${COLUMNS.map((col) => renderColumn(col)).join("")}
                </div>
            </main>
            <div id="cardModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
                <div class="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-800">
                    <div id="cardModalContent"></div>
                </div>
            </div>
            <div id="createCardModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 hidden items-center justify-center p-4 overflow-y-auto">
                <div class="bg-gray-900 rounded-2xl w-full max-w-lg border border-gray-800 my-8">
                    <div class="p-6 max-h-[85vh] overflow-y-auto scrollbar-thin">
                        <div class="flex items-center justify-between mb-6">
                            <h2 class="text-xl font-bold text-white">Nova Tarefa</h2>
                            <button onclick="closeCreateCardModal()" class="text-gray-400 hover:text-white">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <form id="createCardForm" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Título *</label>
                                <input type="text" id="cardTitle" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition" placeholder="Título da tarefa">
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-300 mb-2">Coluna *</label>
                                    <select id="cardColumn" required onchange="updateCreateFormFields()" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition">
                                        ${COLUMNS.filter(
                                          (c) => c.id !== "concluido"
                                        )
                                          .map(
                                            (c) =>
                                              `<option value="${c.id}">${c.name}</option>`
                                          )
                                          .join("")}
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-300 mb-2">Data de Entrega</label>
                                    <input type="datetime-local" id="cardDeadline" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition">
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Responsáveis *</label>
                                <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg p-3">
                                    ${state.users
                                      .filter((u) => u.approved)
                                      .map(
                                        (u) => `
                                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
                                            <input type="checkbox" name="assignees" value="${u.id}" class="w-4 h-4 accent-red-500">
                                            <span class="text-white text-sm truncate">${u.name}</span>
                                        </label>
                                    `
                                      )
                                      .join("")}
                                </div>
                            </div>
                            <div id="areasField" class="hidden">
                                <label class="block text-sm font-medium text-gray-300 mb-2">Áreas Envolvidas</label>
                                <div class="flex flex-wrap gap-2">
                                    ${AREAS.map(
                                      (area) => `
                                        <label class="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition">
                                            <input type="checkbox" name="areas" value="${area.id}" class="w-4 h-4 accent-red-500">
                                            <span class="text-white text-sm">${area.name}</span>
                                        </label>
                                    `
                                    ).join("")}
                                </div>
                            </div>
                            <div id="tipoMecanicaField" class="hidden">
                                <label class="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                                <div class="flex gap-2">
                                    ${TIPOS_MECANICA.map(
                                      (tipo) => `
                                        <label class="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition">
                                            <input type="radio" name="tipoMecanica" value="${tipo.id}" class="w-4 h-4 accent-red-500">
                                            <span class="text-white text-sm">${tipo.name}</span>
                                        </label>
                                    `
                                    ).join("")}
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                                <textarea id="cardDescription" rows="3" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition resize-none" placeholder="Detalhes da tarefa..."></textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Anexos Iniciais</label>
                                <div class="space-y-2">
                                    <div class="flex gap-2">
                                        <button type="button" onclick="triggerCreateFileUpload()" class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm flex items-center justify-center space-x-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                                            </svg>
                                            <span>Arquivo</span>
                                        </button>
                                        <button type="button" onclick="openCreateLinkModal()" class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm flex items-center justify-center space-x-2">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                                            </svg>
                                            <span>Link</span>
                                        </button>
                                    </div>
                                    <input type="file" id="createFileInput" class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onchange="handleCreateFileUpload(event)">
                                    <div id="createAttachmentsList" class="space-y-2"></div>
                                </div>
                            </div>
                            <button type="submit" class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition">Criar Tarefa</button>
                        </form>
                    </div>
                </div>
            </div>
            <div id="createLinkModal" class="fixed inset-0 bg-black/50 z-[60] hidden items-center justify-center">
                <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
                    <h3 class="text-lg font-bold text-white mb-4">Adicionar Link</h3>
                    <form id="createLinkForm" onsubmit="handleCreateAddLink(event)">
                        <input type="text" id="createLinkName" placeholder="Nome do link" required class="w-full mb-3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500">
                        <input type="url" id="createLinkUrl" placeholder="https://..." required class="w-full mb-4 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500">
                        <div class="flex space-x-3">
                            <button type="button" onclick="closeCreateLinkModal()" class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancelar</button>
                            <button type="submit" class="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Adicionar</button>
                        </div>
                    </form>
                </div>
            </div>
            <div id="editCardModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[55] hidden items-center justify-center p-4 overflow-y-auto">
                <div class="bg-gray-900 rounded-2xl w-full max-w-lg border border-gray-800 my-8">
                    <div id="editCardModalContent" class="p-6 max-h-[85vh] overflow-y-auto scrollbar-thin"></div>
                </div>
            </div>
        </div>
    `;
}

function renderColumn(column) {
  const columnCards = state.cards.filter((c) => c.column === column.id);
  return `
        <div class="w-72 flex-shrink-0">
            <div class="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden h-[calc(100vh-140px)] flex flex-col">
                <div class="${column.color} px-4 py-3 flex-shrink-0">
                    <div class="flex items-center justify-between">
                        <h2 class="font-bold text-white text-sm">${
                          column.name
                        }</h2>
                        <span class="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">${
                          columnCards.length
                        }</span>
                    </div>
                </div>
                <div class="p-2 space-y-2 flex-1 overflow-y-auto scrollbar-thin">
                    ${
                      columnCards.length === 0
                        ? `<div class="text-center py-8 text-gray-500 text-sm">Nenhuma tarefa</div>`
                        : columnCards
                            .map((card) => renderCard(card, column.id))
                            .join("")
                    }
                </div>
            </div>
        </div>
    `;
}

function renderCard(card, columnId) {
  const assignees = (card.assignedTo || [])
    .map((id) => state.users.find((u) => u.id === id))
    .filter(Boolean);
  const assigneeNames =
    assignees.map((a) => a.name?.split(" ")[0]).join(", ") || "N/A";
  const label = LABELS.find((l) => l.id === card.label) || LABELS[0];
  const tipoMecanica = TIPOS_MECANICA.find((t) => t.id === card.tipoMecanica);
  const late = card.column !== "concluido" && isLate(card.deadline);
  const totalAttachments =
    (card.initialAttachments?.length || 0) +
    (card.userAttachments?.length || 0);
  const isCompleted = columnId === "concluido";

  return `
        <div onclick="openCardModal('${
          card.id
        }')" class="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-750 transition border border-gray-700 hover:border-red-500/50 card-shadow fade-in ${
    late ? "border-l-4 border-l-red-500" : ""
  } ${isCompleted ? "border-l-4 border-l-green-500" : ""}">
            <div class="flex items-start justify-between mb-2">
                <div class="flex flex-wrap gap-1">
                    ${
                      isCompleted
                        ? `
                        <span class="bg-green-500 text-xs font-medium px-2 py-0.5 rounded text-white flex items-center">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Concluído
                        </span>
                    `
                        : `<span class="${label.color} text-xs font-medium px-2 py-0.5 rounded text-white">${label.name}</span>`
                    }
                    ${
                      columnId === "mecanica" && tipoMecanica
                        ? `<span class="${tipoMecanica.color} text-xs font-medium px-2 py-0.5 rounded text-white">${tipoMecanica.name}</span>`
                        : ""
                    }
                    ${
                      late
                        ? `<span class="bg-red-600 text-xs font-medium px-2 py-0.5 rounded text-white late-badge">ATRASADO</span>`
                        : ""
                    }
                </div>
            </div>
            <h3 class="font-semibold text-white text-sm mb-2 line-clamp-2">${
              card.title
            }</h3>
            ${
              columnId === "projetos" && card.areasEnvolvidas?.length > 0
                ? `
                <div class="flex flex-wrap gap-1 mb-2">
                    ${card.areasEnvolvidas
                      .map((areaId) => {
                        const area = AREAS.find((a) => a.id === areaId);
                        return area
                          ? `<span class="${area.color} text-xs px-2 py-0.5 rounded text-white">${area.name}</span>`
                          : "";
                      })
                      .join("")}
                </div>
            `
                : ""
            }
            ${
              card.deadline
                ? `
                <div class="flex items-center space-x-1 text-xs ${
                  late ? "text-red-400" : "text-gray-400"
                } mb-2">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    <span>${formatDeadline(card.deadline)}</span>
                </div>
            `
                : ""
            }
            <div class="flex items-center justify-between text-xs text-gray-400">
                <div class="flex items-center space-x-1 truncate">
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    <span class="truncate">${assigneeNames}</span>
                </div>
                <div class="flex items-center space-x-2 flex-shrink-0">
                    ${
                      totalAttachments > 0
                        ? `
                        <span class="flex items-center">
                            <svg class="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                            </svg>
                            ${totalAttachments}
                        </span>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
    `;
}

function renderCardModalContent(card) {
  const assignees = (card.assignedTo || [])
    .map((id) => state.users.find((u) => u.id === id))
    .filter(Boolean);
  const creator = state.users.find((u) => u.id === card.createdBy);
  const label = LABELS.find((l) => l.id === card.label) || LABELS[0];
  const tipoMecanica = TIPOS_MECANICA.find((t) => t.id === card.tipoMecanica);
  const isAssigned = (card.assignedTo || []).includes(state.user?.uid);
  const isAdmin =
    state.userData?.role === "admin" || state.userData?.role === "creator";
  const canEdit = isAssigned || isAdmin;
  const late = card.column !== "concluido" && isLate(card.deadline);
  const initialAttachments = card.initialAttachments || [];
  const userAttachments = card.userAttachments || [];
  const isCompleted = card.column === "concluido";

  return `
        <div class="relative">
            <div class="bg-red-600 h-2"></div>
            <div class="absolute top-4 right-4 flex items-center space-x-2 z-10">
                ${
                  isAdmin && !isCompleted
                    ? `
                    <button onclick="openEditCardModal('${card.id}')" class="text-gray-400 hover:text-white" title="Editar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                `
                    : ""
                }
                <button onclick="closeCardModal()" class="text-gray-400 hover:text-white">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-8px)] scrollbar-thin">
                <div class="mb-4">
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${
                          !isCompleted
                            ? `<span class="${label.color} text-xs font-medium px-2 py-1 rounded text-white">${label.name}</span>`
                            : ""
                        }
                        ${
                          card.column === "mecanica" && tipoMecanica
                            ? `<span class="${tipoMecanica.color} text-xs font-medium px-2 py-1 rounded text-white">${tipoMecanica.name}</span>`
                            : ""
                        }
                        ${
                          isCompleted
                            ? `
                            <span class="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded flex items-center">
                                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                Concluído
                            </span>
                        `
                            : ""
                        }
                        ${
                          late
                            ? `<span class="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded late-badge">ATRASADO</span>`
                            : ""
                        }
                    </div>
                    <h2 class="text-xl font-bold text-white">${card.title}</h2>
                </div>
                ${
                  card.deadline
                    ? `
                    <div class="mb-4 flex items-center space-x-2 ${
                      late ? "text-red-400" : "text-gray-400"
                    }">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <span class="text-sm">Entrega: ${formatDeadline(
                          card.deadline
                        )} ${late ? "(ATRASADO)" : ""}</span>
                    </div>
                `
                    : ""
                }
                ${
                  card.column === "projetos" && card.areasEnvolvidas?.length > 0
                    ? `
                    <div class="mb-4">
                        <h3 class="text-xs font-medium text-gray-400 mb-2">Áreas Envolvidas</h3>
                        <div class="flex flex-wrap gap-2">
                            ${card.areasEnvolvidas
                              .map((areaId) => {
                                const area = AREAS.find((a) => a.id === areaId);
                                return area
                                  ? `<span class="${area.color} text-sm px-3 py-1 rounded text-white">${area.name}</span>`
                                  : "";
                              })
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }
                <div class="grid grid-cols-2 gap-3 mb-4">
                    <div class="bg-gray-800 rounded-lg p-3">
                        <p class="text-xs text-gray-400 mb-1">Criado por</p>
                        <p class="text-white font-medium text-sm">${
                          creator?.name || "Desconhecido"
                        }</p>
                        <p class="text-xs text-gray-500">${formatDateTime(
                          card.createdAt
                        )}</p>
                    </div>
                    <div class="bg-gray-800 rounded-lg p-3">
                        <p class="text-xs text-gray-400 mb-1">Responsáveis</p>
                        <div class="flex flex-wrap gap-1">
                            ${
                              assignees.length > 0
                                ? assignees
                                    .map(
                                      (a) =>
                                        `<span class="text-white text-sm bg-gray-700 px-2 py-0.5 rounded">${
                                          a.name?.split(" ")[0]
                                        }</span>`
                                    )
                                    .join("")
                                : '<span class="text-gray-500 text-sm">Ninguém</span>'
                            }
                        </div>
                    </div>
                </div>
                ${
                  card.description
                    ? `
                    <div class="mb-4">
                        <h3 class="text-xs font-medium text-gray-400 mb-2">Descrição</h3>
                        <p class="text-gray-300 bg-gray-800 rounded-lg p-3 text-sm whitespace-pre-wrap">${card.description}</p>
                    </div>
                `
                    : ""
                }
                ${
                  canEdit && card.column !== "concluido"
                    ? `
                    <div class="mb-4 space-y-3">
                        <div>
                            <h3 class="text-xs font-medium text-gray-400 mb-2">Etiqueta</h3>
                            <div class="flex flex-wrap gap-2">
                                ${LABELS.map(
                                  (l) => `
                                    <button onclick="updateCardLabel('${
                                      card.id
                                    }', '${l.id}')" class="${
                                    l.id === card.label
                                      ? l.color + " ring-2 ring-white"
                                      : "bg-gray-700 hover:bg-gray-600"
                                  } text-white text-sm font-medium px-3 py-1.5 rounded transition">${
                                    l.name
                                  }</button>
                                `
                                ).join("")}
                            </div>
                        </div>
                        <div class="flex items-center justify-between bg-gray-800 rounded-lg p-3">
                            <div>
                                <p class="text-white font-medium text-sm">Marcar como concluído</p>
                                <p class="text-xs text-gray-400">Move para coluna CONCLUÍDO</p>
                            </div>
                            <button onclick="markAsDone('${
                              card.id
                            }')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition">Concluir</button>
                        </div>
                    </div>
                `
                    : ""
                }
                ${
                  initialAttachments.length > 0
                    ? `
                    <div class="mb-4">
                        <h3 class="text-xs font-medium text-gray-400 mb-2">Anexos da Tarefa (${
                          initialAttachments.length
                        })</h3>
                        <div class="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                            ${initialAttachments
                              .map((att) => renderAttachment(att))
                              .join("")}
                        </div>
                    </div>
                `
                    : ""
                }
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-xs font-medium text-gray-400">Anexos Adicionados (${
                          userAttachments.length
                        })</h3>
                        ${
                          canEdit
                            ? `
                            <div class="flex space-x-2">
                                <button onclick="openLinkModal('${card.id}')" class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded transition">+ Link</button>
                                <button onclick="triggerFileUpload('${card.id}')" class="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition">+ Arquivo</button>
                            </div>
                        `
                            : ""
                        }
                    </div>
                    <input type="file" id="fileInput" class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onchange="handleFileUpload(event)">
                    ${
                      userAttachments.length > 0
                        ? `
                        <div class="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
                            ${userAttachments
                              .map((att) => renderAttachment(att))
                              .join("")}
                        </div>
                    `
                        : '<p class="text-gray-500 text-sm">Nenhum anexo adicionado</p>'
                    }
                </div>
                ${
                  isAdmin
                    ? `
                    <div class="border-t border-gray-800 pt-3">
                        <button onclick="deleteCard('${card.id}')" class="text-red-500 hover:text-red-400 text-sm font-medium flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                            Excluir tarefa
                        </button>
                    </div>
                `
                    : ""
                }
            </div>
        </div>
        <div id="linkModal" class="fixed inset-0 bg-black/50 z-[60] hidden items-center justify-center">
            <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-bold text-white mb-4">Adicionar Link</h3>
                <form id="linkForm" onsubmit="handleAddLink(event, '${
                  card.id
                }')">
                    <input type="text" id="linkName" placeholder="Nome do link" required class="w-full mb-3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500">
                    <input type="url" id="linkUrl" placeholder="https://..." required class="w-full mb-4 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500">
                    <div class="flex space-x-3">
                        <button type="button" onclick="closeLinkModal()" class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancelar</button>
                        <button type="submit" class="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Adicionar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function renderAttachment(att) {
  let viewUrl = att.url;
  let downloadUrl = att.url;

  if (att.type !== "link" && att.url.includes("cloudinary")) {
    if (att.type === "raw") {
      downloadUrl = att.url.replace(
        "/raw/upload/",
        "/raw/upload/fl_attachment/"
      );
    } else if (att.type === "image") {
      downloadUrl = att.url.replace(
        "/image/upload/",
        "/image/upload/fl_attachment/"
      );
    } else if (att.type === "video") {
      downloadUrl = att.url.replace(
        "/video/upload/",
        "/video/upload/fl_attachment/"
      );
    }
  }

  return `
        <div class="flex items-center justify-between bg-gray-800 rounded-lg p-2">
            <div class="flex items-center space-x-2 min-w-0">
                ${getAttachmentIcon(att.type)}
                <div class="min-w-0">
                    <p class="text-white font-medium text-sm truncate">${
                      att.name
                    }</p>
                    <p class="text-xs text-gray-500 truncate">${
                      att.addedByName || "Desconhecido"
                    }</p>
                </div>
            </div>
            <div class="flex items-center space-x-1 flex-shrink-0 ml-2">
                <a href="${viewUrl}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white p-1" title="Abrir">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                </a>
                ${
                  att.type !== "link"
                    ? `
                    <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-green-400 p-1" title="Baixar">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                    </a>
                `
                    : ""
                }
            </div>
        </div>
    `;
}

function renderAdmin() {
  const isCreator = state.userData?.role === "creator";
  const pendingUsers = state.users.filter((u) => !u.approved);
  const approvedUsers = state.users.filter(
    (u) => u.approved && u.role !== "creator"
  );

  const canManageUser = (user) => {
    if (isCreator) return true;
    if (user.role === "admin" || user.role === "creator") return false;
    return true;
  };

  const getDisplayRole = (role) => {
    if (role === "creator") return "admin";
    return role;
  };

  const getRoleOptions = (user) => {
    if (isCreator) {
      return `
                <option value="user" ${
                  user.role === "user" ? "selected" : ""
                }>Membro</option>
                <option value="admin" ${
                  user.role === "admin" ? "selected" : ""
                }>Admin</option>
            `;
    } else {
      return `<option value="user" selected>Membro</option>`;
    }
  };

  return `
        <div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
            <header class="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
                <div class="max-w-6xl mx-auto px-4 py-4">
                    <div class="flex items-center space-x-4">
                        <button onclick="navigate('kanban')" class="text-gray-400 hover:text-white transition">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                        </button>
                        <div>
                            <h1 class="text-xl font-bold text-white">Painel Administrativo</h1>
                            <p class="text-xs text-gray-400">Gerenciar usuários</p>
                        </div>
                    </div>
                </div>
            </header>
            <main class="max-w-6xl mx-auto px-4 py-8">
                <div class="mb-8">
                    <h2 class="text-lg font-bold text-white mb-4 flex items-center">
                        <span class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                        Pendentes (${pendingUsers.length})
                    </h2>
                    ${
                      pendingUsers.length === 0
                        ? `<div class="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500">Nenhum usuário aguardando aprovação</div>`
                        : `
                        <div class="grid gap-4">
                            ${pendingUsers
                              .map(
                                (user) => `
                                <div class="bg-gray-900 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between fade-in">
                                    <div class="flex items-center space-x-4">
                                        <div class="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                                            <span class="text-yellow-500 font-bold text-lg">${
                                              user.name
                                                ?.charAt(0)
                                                ?.toUpperCase() || "?"
                                            }</span>
                                        </div>
                                        <div>
                                            <p class="text-white font-medium">${
                                              user.name
                                            }</p>
                                            <p class="text-gray-400 text-sm">${
                                              user.email
                                            }</p>
                                        </div>
                                    </div>
                                    <div class="flex space-x-2">
                                        <button onclick="approveUser('${
                                          user.id
                                        }')" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition">Aprovar</button>
                                        <button onclick="rejectUser('${
                                          user.id
                                        }')" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition">Recusar</button>
                                    </div>
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                    `
                    }
                </div>
                <div>
                    <h2 class="text-lg font-bold text-white mb-4 flex items-center">
                        <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        Ativos (${approvedUsers.length})
                    </h2>
                    <div class="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-800">
                                    <tr>
                                        <th class="text-left text-xs font-medium text-gray-400 uppercase px-4 py-3">Usuário</th>
                                        <th class="text-left text-xs font-medium text-gray-400 uppercase px-4 py-3">Cargo</th>
                                        <th class="text-right text-xs font-medium text-gray-400 uppercase px-4 py-3">Ações</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-800">
                                    ${approvedUsers
                                      .map((user) => {
                                        const canManage = canManageUser(user);
                                        const isCurrentUser =
                                          user.id === state.user?.uid;
                                        const displayRole =
                                          user.role === "admin"
                                            ? "Administrador"
                                            : "Membro";

                                        return `
                                            <tr class="hover:bg-gray-800/50 transition">
                                                <td class="px-4 py-3">
                                                    <div class="flex items-center space-x-3">
                                                        <div class="w-8 h-8 ${
                                                          user.role === "admin"
                                                            ? "bg-red-500/20"
                                                            : "bg-gray-700"
                                                        } rounded-full flex items-center justify-center">
                                                            <span class="${
                                                              user.role ===
                                                              "admin"
                                                                ? "text-red-500"
                                                                : "text-gray-400"
                                                            } font-bold text-sm">${
                                          user.name?.charAt(0)?.toUpperCase() ||
                                          "?"
                                        }</span>
                                                        </div>
                                                        <div>
                                                            <p class="text-white font-medium text-sm">${
                                                              user.name
                                                            }</p>
                                                            <p class="text-gray-500 text-xs">${
                                                              user.email
                                                            }</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="px-4 py-3">
                                                    ${
                                                      canManage &&
                                                      !isCurrentUser
                                                        ? `
                                                        <select onchange="updateUserRole('${
                                                          user.id
                                                        }', this.value)" class="bg-gray-800 border border-gray-700 text-white text-sm rounded px-2 py-1 focus:outline-none focus:border-red-500">
                                                            ${getRoleOptions(
                                                              user
                                                            )}
                                                        </select>
                                                    `
                                                        : `
                                                        <span class="text-gray-400 text-sm">${displayRole}</span>
                                                    `
                                                    }
                                                </td>
                                                <td class="px-4 py-3 text-right">
                                                    ${
                                                      isCurrentUser
                                                        ? '<span class="text-gray-500 text-sm">Você</span>'
                                                        : canManage
                                                        ? `<button onclick="removeUser('${user.id}')" class="text-red-500 hover:text-red-400 text-sm">Remover</button>`
                                                        : '<span class="text-gray-600 text-sm">-</span>'
                                                    }
                                                </td>
                                            </tr>
                                        `;
                                      })
                                      .join("")}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    `;
}

function navigate(view) {
  state.currentView = view;
  render();
  setupEventListeners();
}

function setupEventListeners() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  const registerForm = document.getElementById("registerForm");
  if (registerForm) registerForm.addEventListener("submit", handleRegister);
  const createCardForm = document.getElementById("createCardForm");
  if (createCardForm)
    createCardForm.addEventListener("submit", handleCreateCard);
}

function setupKanbanListeners() {
  setupEventListeners();
  updateCreateFormFields();
}

function updateCreateFormFields() {
  const column = document.getElementById("cardColumn")?.value;
  const areasField = document.getElementById("areasField");
  const tipoMecanicaField = document.getElementById("tipoMecanicaField");
  if (areasField) areasField.classList.toggle("hidden", column !== "projetos");
  if (tipoMecanicaField)
    tipoMecanicaField.classList.toggle("hidden", column !== "mecanica");
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const errorDiv = document.getElementById("loginError");
  try {
    errorDiv.classList.add("hidden");
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    errorDiv.textContent = getErrorMessage(error.code);
    errorDiv.classList.remove("hidden");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const errorDiv = document.getElementById("registerError");
  try {
    errorDiv.classList.add("hidden");
    let isFirstUser = false;
    try {
      const usersSnapshot = await db.collection("users").limit(1).get();
      isFirstUser = usersSnapshot.size === 0;
    } catch (e) {
      isFirstUser = false;
    }
    const credential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    await db
      .collection("users")
      .doc(credential.user.uid)
      .set({
        name: name,
        email: email,
        role: isFirstUser ? "creator" : "user",
        approved: isFirstUser,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
  } catch (error) {
    errorDiv.textContent = getErrorMessage(error.code);
    errorDiv.classList.remove("hidden");
  }
}

async function logout() {
  state.unsubscribers.forEach((unsub) => unsub());
  state.unsubscribers = [];
  await auth.signOut();
  state.user = null;
  state.userData = null;
  state.cards = [];
  state.users = [];
  navigate("login");
}

function openCreateCardModal() {
  state.createCardAttachments = [];
  const modal = document.getElementById("createCardModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  updateCreateFormFields();
  renderCreateAttachments();
}

function closeCreateCardModal() {
  const modal = document.getElementById("createCardModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.getElementById("createCardForm").reset();
  state.createCardAttachments = [];
}

async function handleCreateCard(e) {
  e.preventDefault();
  const title = document.getElementById("cardTitle").value;
  const column = document.getElementById("cardColumn").value;
  const deadline = document.getElementById("cardDeadline").value || null;
  const description = document.getElementById("cardDescription").value;
  const assigneesCheckboxes = document.querySelectorAll(
    'input[name="assignees"]:checked'
  );
  const assignedTo = Array.from(assigneesCheckboxes).map((cb) => cb.value);
  if (assignedTo.length === 0) {
    alert("Selecione pelo menos um responsável.");
    return;
  }
  const areasCheckboxes = document.querySelectorAll(
    'input[name="areas"]:checked'
  );
  const areasEnvolvidas = Array.from(areasCheckboxes).map((cb) => cb.value);
  const tipoMecanicaRadio = document.querySelector(
    'input[name="tipoMecanica"]:checked'
  );
  const tipoMecanica = tipoMecanicaRadio?.value || null;
  try {
    const cardData = {
      title: title,
      column: column,
      assignedTo: assignedTo,
      description: description,
      deadline: deadline,
      label: "afazer",
      done: false,
      initialAttachments: state.createCardAttachments,
      userAttachments: [],
      createdBy: state.user.uid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (column === "projetos" && areasEnvolvidas.length > 0) {
      cardData.areasEnvolvidas = areasEnvolvidas;
    }
    if (column === "mecanica" && tipoMecanica) {
      cardData.tipoMecanica = tipoMecanica;
    }
    await db.collection("cards").add(cardData);
    closeCreateCardModal();
  } catch (error) {
    alert("Erro ao criar tarefa. Tente novamente.");
  }
}

function openCardModal(cardId) {
  const card = state.cards.find((c) => c.id === cardId);
  if (!card) return;
  state.selectedCard = card;
  const modal = document.getElementById("cardModal");
  const content = document.getElementById("cardModalContent");
  content.innerHTML = renderCardModalContent(card);
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeCardModal() {
  const modal = document.getElementById("cardModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  state.selectedCard = null;
}

async function updateCardLabel(cardId, labelId) {
  try {
    await db.collection("cards").doc(cardId).update({
      label: labelId,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    alert("Erro ao atualizar etiqueta.");
  }
}

async function markAsDone(cardId) {
  try {
    await db.collection("cards").doc(cardId).update({
      done: true,
      column: "concluido",
      label: null,
      completedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    closeCardModal();
  } catch (error) {
    alert("Erro ao concluir tarefa.");
  }
}

let editCardAttachments = [];

function openEditCardModal(cardId) {
  const card = state.cards.find((c) => c.id === cardId);
  if (!card) return;
  editCardAttachments = [...(card.initialAttachments || [])];
  closeCardModal();
  const modal = document.getElementById("editCardModal");
  const content = document.getElementById("editCardModalContent");
  content.innerHTML = renderEditCardForm(card);
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  updateEditFormFields(card.column);
}

function closeEditCardModal() {
  const modal = document.getElementById("editCardModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  editCardAttachments = [];
}

function renderEditCardForm(card) {
  return `
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-white">Editar Tarefa</h2>
            <button onclick="closeEditCardModal()" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
        <form id="editCardForm" onsubmit="handleEditCard(event, '${
          card.id
        }')" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Título *</label>
                <input type="text" id="editCardTitle" value="${
                  card.title
                }" required class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Coluna *</label>
                    <select id="editCardColumn" required onchange="updateEditFormFields(this.value)" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition">
                        ${COLUMNS.filter((c) => c.id !== "concluido")
                          .map(
                            (c) =>
                              `<option value="${c.id}" ${
                                card.column === c.id ? "selected" : ""
                              }>${c.name}</option>`
                          )
                          .join("")}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Data de Entrega</label>
                    <input type="datetime-local" id="editCardDeadline" value="${
                      card.deadline || ""
                    }" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Responsáveis *</label>
                <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-gray-800 border border-gray-700 rounded-lg p-3">
                    ${state.users
                      .filter((u) => u.approved)
                      .map(
                        (u) => `
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
                            <input type="checkbox" name="editAssignees" value="${
                              u.id
                            }" ${
                          (card.assignedTo || []).includes(u.id)
                            ? "checked"
                            : ""
                        } class="w-4 h-4 accent-red-500">
                            <span class="text-white text-sm truncate">${
                              u.name
                            }</span>
                        </label>
                    `
                      )
                      .join("")}
                </div>
            </div>
            <div id="editAreasField" class="${
              card.column === "projetos" ? "" : "hidden"
            }">
                <label class="block text-sm font-medium text-gray-300 mb-2">Áreas Envolvidas</label>
                <div class="flex flex-wrap gap-2">
                    ${AREAS.map(
                      (area) => `
                        <label class="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition">
                            <input type="checkbox" name="editAreas" value="${
                              area.id
                            }" ${
                        (card.areasEnvolvidas || []).includes(area.id)
                          ? "checked"
                          : ""
                      } class="w-4 h-4 accent-red-500">
                            <span class="text-white text-sm">${area.name}</span>
                        </label>
                    `
                    ).join("")}
                </div>
            </div>
            <div id="editTipoMecanicaField" class="${
              card.column === "mecanica" ? "" : "hidden"
            }">
                <label class="block text-sm font-medium text-gray-300 mb-2">Tipo</label>
                <div class="flex gap-2">
                    ${TIPOS_MECANICA.map(
                      (tipo) => `
                        <label class="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-700 transition">
                            <input type="radio" name="editTipoMecanica" value="${
                              tipo.id
                            }" ${
                        card.tipoMecanica === tipo.id ? "checked" : ""
                      } class="w-4 h-4 accent-red-500">
                            <span class="text-white text-sm">${tipo.name}</span>
                        </label>
                    `
                    ).join("")}
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea id="editCardDescription" rows="3" class="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition resize-none">${
                  card.description || ""
                }</textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Anexos da Tarefa</label>
                <div class="space-y-2">
                    <div class="flex gap-2">
                        <button type="button" onclick="triggerEditFileUpload()" class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm flex items-center justify-center space-x-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                            </svg>
                            <span>Arquivo</span>
                        </button>
                        <button type="button" onclick="openEditLinkModal()" class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm flex items-center justify-center space-x-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                            </svg>
                            <span>Link</span>
                        </button>
                    </div>
                    <input type="file" id="editFileInput" class="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onchange="handleEditFileUpload(event)">
                    <div id="editAttachmentsList" class="space-y-2">
                        ${renderEditAttachments()}
                    </div>
                </div>
            </div>
            <div class="flex space-x-3">
                <button type="button" onclick="closeEditCardModal()" class="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition">Cancelar</button>
                <button type="submit" class="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition">Salvar</button>
            </div>
        </form>
        <div id="editLinkModal" class="fixed inset-0 bg-black/50 z-[70] hidden items-center justify-center">
            <div class="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-bold text-white mb-4">Adicionar Link</h3>
                <form onsubmit="handleEditAddLink(event)">
                    <input type="text" id="editLinkName" placeholder="Nome do link" required class="w-full mb-3 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500">
                    <input type="url" id="editLinkUrl" placeholder="https://..." required class="w-full mb-4 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500">
                    <div class="flex space-x-3">
                        <button type="button" onclick="closeEditLinkModal()" class="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">Cancelar</button>
                        <button type="submit" class="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Adicionar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function updateEditFormFields(column) {
  const areasField = document.getElementById("editAreasField");
  const tipoMecanicaField = document.getElementById("editTipoMecanicaField");
  if (areasField) areasField.classList.toggle("hidden", column !== "projetos");
  if (tipoMecanicaField)
    tipoMecanicaField.classList.toggle("hidden", column !== "mecanica");
}

function renderEditAttachments() {
  if (editCardAttachments.length === 0)
    return '<p class="text-gray-500 text-sm">Nenhum anexo</p>';
  return editCardAttachments
    .map(
      (att, idx) => `
        <div class="flex items-center justify-between bg-gray-800 rounded-lg p-2">
            <div class="flex items-center space-x-2 min-w-0">
                ${getAttachmentIcon(att.type)}
                <span class="text-white text-sm truncate">${att.name}</span>
            </div>
            <button type="button" onclick="removeEditAttachment(${idx})" class="text-red-500 hover:text-red-400 flex-shrink-0 ml-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `
    )
    .join("");
}

function removeEditAttachment(idx) {
  editCardAttachments.splice(idx, 1);
  document.getElementById("editAttachmentsList").innerHTML =
    renderEditAttachments();
}

function triggerEditFileUpload() {
  document.getElementById("editFileInput").click();
}

async function handleEditFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryConfig.uploadPreset);
    let resourceType = "auto";
    if (file.type.startsWith("image/")) resourceType = "image";
    else if (file.type.startsWith("video/")) resourceType = "video";
    else resourceType = "raw";
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    const data = await response.json();
    if (data.secure_url) {
      editCardAttachments.push({
        name: file.name,
        url: data.secure_url,
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
          ? "video"
          : "raw",
        size: file.size,
        addedBy: state.user.uid,
        addedByName: state.userData.name,
        addedAt: new Date().toISOString(),
      });
      document.getElementById("editAttachmentsList").innerHTML =
        renderEditAttachments();
    }
    event.target.value = "";
  } catch (error) {
    alert("Erro ao fazer upload.");
  }
}

function openEditLinkModal() {
  const modal = document.getElementById("editLinkModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeEditLinkModal() {
  const modal = document.getElementById("editLinkModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function handleEditAddLink(event) {
  event.preventDefault();
  const name = document.getElementById("editLinkName").value;
  const url = document.getElementById("editLinkUrl").value;
  editCardAttachments.push({
    name: name,
    url: url,
    type: "link",
    addedBy: state.user.uid,
    addedByName: state.userData.name,
    addedAt: new Date().toISOString(),
  });
  document.getElementById("editAttachmentsList").innerHTML =
    renderEditAttachments();
  closeEditLinkModal();
  document.getElementById("editLinkName").value = "";
  document.getElementById("editLinkUrl").value = "";
}

async function handleEditCard(event, cardId) {
  event.preventDefault();
  const title = document.getElementById("editCardTitle").value;
  const column = document.getElementById("editCardColumn").value;
  const deadline = document.getElementById("editCardDeadline").value || null;
  const description = document.getElementById("editCardDescription").value;
  const assigneesCheckboxes = document.querySelectorAll(
    'input[name="editAssignees"]:checked'
  );
  const assignedTo = Array.from(assigneesCheckboxes).map((cb) => cb.value);
  if (assignedTo.length === 0) {
    alert("Selecione pelo menos um responsável.");
    return;
  }
  const areasCheckboxes = document.querySelectorAll(
    'input[name="editAreas"]:checked'
  );
  const areasEnvolvidas = Array.from(areasCheckboxes).map((cb) => cb.value);
  const tipoMecanicaRadio = document.querySelector(
    'input[name="editTipoMecanica"]:checked'
  );
  const tipoMecanica = tipoMecanicaRadio?.value || null;
  try {
    const updateData = {
      title: title,
      column: column,
      assignedTo: assignedTo,
      description: description,
      deadline: deadline,
      initialAttachments: editCardAttachments,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
    if (column === "projetos") {
      updateData.areasEnvolvidas = areasEnvolvidas;
    } else {
      updateData.areasEnvolvidas = firebase.firestore.FieldValue.delete();
    }
    if (column === "mecanica") {
      updateData.tipoMecanica = tipoMecanica;
    } else {
      updateData.tipoMecanica = firebase.firestore.FieldValue.delete();
    }
    await db.collection("cards").doc(cardId).update(updateData);
    closeEditCardModal();
  } catch (error) {
    alert("Erro ao atualizar tarefa.");
  }
}

async function deleteCard(cardId) {
  if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
  try {
    await db.collection("cards").doc(cardId).delete();
    closeCardModal();
  } catch (error) {
    alert("Erro ao excluir tarefa.");
  }
}

function triggerCreateFileUpload() {
  document.getElementById("createFileInput").click();
}

async function handleCreateFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryConfig.uploadPreset);
    let resourceType = "auto";
    if (file.type.startsWith("image/")) resourceType = "image";
    else if (file.type.startsWith("video/")) resourceType = "video";
    else resourceType = "raw";
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    const data = await response.json();
    if (data.secure_url) {
      state.createCardAttachments.push({
        name: file.name,
        url: data.secure_url,
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
          ? "video"
          : "raw",
        size: file.size,
        addedBy: state.user.uid,
        addedByName: state.userData.name,
        addedAt: new Date().toISOString(),
      });
      renderCreateAttachments();
    }
    event.target.value = "";
  } catch (error) {
    alert("Erro ao fazer upload.");
  }
}

function openCreateLinkModal() {
  const modal = document.getElementById("createLinkModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeCreateLinkModal() {
  const modal = document.getElementById("createLinkModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function handleCreateAddLink(event) {
  event.preventDefault();
  const name = document.getElementById("createLinkName").value;
  const url = document.getElementById("createLinkUrl").value;
  state.createCardAttachments.push({
    name: name,
    url: url,
    type: "link",
    addedBy: state.user.uid,
    addedByName: state.userData.name,
    addedAt: new Date().toISOString(),
  });
  renderCreateAttachments();
  closeCreateLinkModal();
  document.getElementById("createLinkName").value = "";
  document.getElementById("createLinkUrl").value = "";
}

function renderCreateAttachments() {
  const list = document.getElementById("createAttachmentsList");
  if (!list) return;
  if (state.createCardAttachments.length === 0) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = state.createCardAttachments
    .map(
      (att, idx) => `
        <div class="flex items-center justify-between bg-gray-800 rounded-lg p-2">
            <div class="flex items-center space-x-2 min-w-0">
                ${getAttachmentIcon(att.type)}
                <span class="text-white text-sm truncate">${att.name}</span>
            </div>
            <button type="button" onclick="removeCreateAttachment(${idx})" class="text-red-500 hover:text-red-400 flex-shrink-0 ml-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        </div>
    `
    )
    .join("");
}

function removeCreateAttachment(idx) {
  state.createCardAttachments.splice(idx, 1);
  renderCreateAttachments();
}

let currentUploadCardId = null;

function triggerFileUpload(cardId) {
  currentUploadCardId = cardId;
  document.getElementById("fileInput").click();
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file || !currentUploadCardId) return;
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryConfig.uploadPreset);
    let resourceType = "auto";
    if (file.type.startsWith("image/")) resourceType = "image";
    else if (file.type.startsWith("video/")) resourceType = "video";
    else resourceType = "raw";
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    const data = await response.json();
    if (data.secure_url) {
      const card = state.cards.find((c) => c.id === currentUploadCardId);
      const userAttachments = card.userAttachments || [];
      userAttachments.push({
        name: file.name,
        url: data.secure_url,
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
          ? "video"
          : "raw",
        size: file.size,
        addedBy: state.user.uid,
        addedByName: state.userData.name,
        addedAt: new Date().toISOString(),
      });
      await db.collection("cards").doc(currentUploadCardId).update({
        userAttachments: userAttachments,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      openCardModal(currentUploadCardId);
    }
    event.target.value = "";
  } catch (error) {
    alert("Erro ao fazer upload.");
  }
}

function openLinkModal(cardId) {
  currentUploadCardId = cardId;
  const modal = document.getElementById("linkModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeLinkModal() {
  const modal = document.getElementById("linkModal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

async function handleAddLink(event, cardId) {
  event.preventDefault();
  const name = document.getElementById("linkName").value;
  const url = document.getElementById("linkUrl").value;
  try {
    const card = state.cards.find((c) => c.id === cardId);
    const userAttachments = card.userAttachments || [];
    userAttachments.push({
      name: name,
      url: url,
      type: "link",
      addedBy: state.user.uid,
      addedByName: state.userData.name,
      addedAt: new Date().toISOString(),
    });
    await db.collection("cards").doc(cardId).update({
      userAttachments: userAttachments,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    closeLinkModal();
    openCardModal(cardId);
  } catch (error) {
    alert("Erro ao adicionar link.");
  }
}

async function approveUser(userId) {
  try {
    await db.collection("users").doc(userId).update({ approved: true });
  } catch (error) {
    alert("Erro ao aprovar usuário.");
  }
}

async function rejectUser(userId) {
  if (!confirm("Recusar este usuário?")) return;
  try {
    await db.collection("users").doc(userId).delete();
  } catch (error) {
    alert("Erro ao recusar usuário.");
  }
}

async function updateUserRole(userId, role) {
  const isCreator = state.userData?.role === "creator";
  const targetUser = state.users.find((u) => u.id === userId);
  if (
    !isCreator &&
    (targetUser?.role === "admin" || targetUser?.role === "creator")
  ) {
    alert("Você não tem permissão para alterar o cargo deste usuário.");
    return;
  }
  if (!isCreator && role === "admin") {
    alert("Você não tem permissão para promover usuários a administrador.");
    return;
  }
  try {
    await db.collection("users").doc(userId).update({ role: role });
  } catch (error) {
    alert("Erro ao atualizar cargo.");
  }
}

async function removeUser(userId) {
  const isCreator = state.userData?.role === "creator";
  const targetUser = state.users.find((u) => u.id === userId);
  if (
    !isCreator &&
    (targetUser?.role === "admin" || targetUser?.role === "creator")
  ) {
    alert("Você não tem permissão para remover este usuário.");
    return;
  }
  if (!confirm("Remover este usuário?")) return;
  try {
    await db.collection("users").doc(userId).update({ approved: false });
  } catch (error) {
    alert("Erro ao remover usuário.");
  }
}

function setupRealtimeListeners() {
  state.unsubscribers.forEach((unsub) => unsub());
  state.unsubscribers = [];
  const cardsUnsub = db
    .collection("cards")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      state.cards = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (state.selectedCard) {
        const updatedCard = state.cards.find(
          (c) => c.id === state.selectedCard.id
        );
        if (updatedCard) {
          state.selectedCard = updatedCard;
          const content = document.getElementById("cardModalContent");
          if (content) content.innerHTML = renderCardModalContent(updatedCard);
        }
      }
      if (state.currentView === "kanban") render();
    });
  state.unsubscribers.push(cardsUnsub);
  const usersUnsub = db.collection("users").onSnapshot((snapshot) => {
    state.users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    state.pendingUsers = state.users.filter((u) => !u.approved);
    if (state.user) {
      const currentUserData = state.users.find((u) => u.id === state.user.uid);
      if (currentUserData) {
        const wasApproved = state.userData?.approved;
        state.userData = currentUserData;
        if (
          !wasApproved &&
          currentUserData.approved &&
          state.currentView === "pending"
        ) {
          navigate("kanban");
          return;
        }
      }
    }
    if (state.currentView === "kanban" || state.currentView === "admin")
      render();
  });
  state.unsubscribers.push(usersUnsub);
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    state.user = user;
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc.exists) {
      state.userData = { id: user.uid, ...userDoc.data() };
      if (!state.userData.approved) {
        navigate("pending");
      } else {
        setupRealtimeListeners();
        navigate("kanban");
      }
    } else {
      const usersCount = (await db.collection("users").limit(1).get()).size;
      await db
        .collection("users")
        .doc(user.uid)
        .set({
          name: user.displayName || user.email.split("@")[0],
          email: user.email,
          role: usersCount === 0 ? "admin" : "user",
          approved: usersCount === 0,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      const newUserDoc = await db.collection("users").doc(user.uid).get();
      state.userData = { id: user.uid, ...newUserDoc.data() };
      if (state.userData.approved) {
        setupRealtimeListeners();
        navigate("kanban");
      } else {
        navigate("pending");
      }
    }
  } else {
    state.user = null;
    state.userData = null;
    navigate("login");
  }
});

render();
