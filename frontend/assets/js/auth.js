// frontend/assets/js/auth.js
// Gerenciamento de autenticação no front-end

import { api } from './api.js';

let pendingToken = null;
let pendingRefreshToken = null;
let pendingUser = null;

export async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  clearErrors();

  if (!email) { showFieldError('emailError', 'E-mail obrigatório.'); return; }
  if (!password) { showFieldError('passwordError', 'Senha obrigatória.'); return; }

  setLoginLoading(true);

  try {
    const result = await api.login(email, password);

    if (result.user.firstLogin) {
      // Armazena temporariamente para usar depois da troca de senha
      pendingToken = result.token;
      pendingRefreshToken = result.refreshToken;
      pendingUser = result.user;

      // Mostra o formulário de troca de senha
      document.getElementById('formLogin').style.display = 'none';
      document.getElementById('alertFirstLogin').style.display = 'block';
      document.getElementById('formChangePassword').style.display = 'block';
      document.getElementById('currentPwd').focus();
    } else {
      saveSession(result);
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    document.getElementById('loginError').textContent = error.message;
  } finally {
    setLoginLoading(false);
  }
}

async function handleChangePassword() {
  const currentPwd = document.getElementById('currentPwd').value;
  const newPwd = document.getElementById('newPwd').value;
  const confirmPwd = document.getElementById('confirmPwd').value;

  document.getElementById('newPwdError').textContent = '';
  document.getElementById('confirmPwdError').textContent = '';
  document.getElementById('changePwdError').textContent = '';

  if (newPwd !== confirmPwd) {
    document.getElementById('confirmPwdError').textContent = 'As senhas não coincidem.';
    return;
  }

  // Salva o token temporário para poder fazer a chamada autenticada
  localStorage.setItem('ec_token', pendingToken);

  try {
    await api.changePassword(currentPwd, newPwd);

    // Login concluído: salva sessão definitiva
    const updatedUser = { ...pendingUser, firstLogin: false };
    saveSession({ token: pendingToken, refreshToken: pendingRefreshToken, user: updatedUser });
    window.location.href = 'dashboard.html';
  } catch (error) {
    document.getElementById('changePwdError').textContent = error.message;
    localStorage.removeItem('ec_token');
  }
}

export function saveSession(result) {
  localStorage.setItem('ec_token', result.token);
  localStorage.setItem('ec_refresh_token', result.refreshToken);
  localStorage.setItem('ec_user', JSON.stringify(result.user));
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem('ec_user') || 'null');
  } catch {
    return null;
  }
}

export function isAdmin() {
  const user = getUser();
  return user?.role === 'ADMIN';
}

export function logout() {
  api.logout().catch(() => {});
  localStorage.removeItem('ec_token');
  localStorage.removeItem('ec_refresh_token');
  localStorage.removeItem('ec_user');
  window.location.href = 'index.html';
}

export function requireAuth() {
  const token = localStorage.getItem('ec_token');
  if (!token) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

export function initUserUI() {
  const user = getUser();
  if (!user) return;

  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  const avatarEl = document.getElementById('userAvatar');

  if (nameEl) nameEl.textContent = user.name;
  if (roleEl) roleEl.textContent = user.role === 'ADMIN' ? 'Administrador' : 'Operador';
  if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();

  // Esconde elementos admin-only para usuários normais
  if (!isAdmin()) {
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
  }
}

export function navigate(page) {
  window.location.href = page;
}

export function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}


export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ec_theme', next);
}

export function initTheme() {
  const saved = localStorage.getItem('ec_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}

// Helpers
export function setLoginLoading(loading) {
  const btn = document.getElementById('btnLogin');
  const text = document.getElementById('loginBtnText');
  const spinner = document.getElementById('loginSpinner');
  if (!btn) return;
  btn.disabled = loading;
  text.textContent = loading ? 'Entrando...' : 'Entrar';
  spinner.classList.toggle('hidden', !loading);
}

export function clearErrors() {
  ['emailError', 'passwordError', 'loginError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  document.querySelectorAll('.form-control').forEach(el => el.classList.remove('error'));
}

export function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

// Inicialização automática nas páginas autenticadas
if (!window.location.pathname.includes('index.html') &&
    window.location.pathname !== '/' &&
    !window.location.pathname.endsWith('/')) {
  requireAuth();
  initTheme();
}

// Tecla Enter no login
document.addEventListener('DOMContentLoaded', () => {
  const pwdInput = document.getElementById('password');
  if (pwdInput) {
    pwdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }

  // Inicializa UI do usuário nas páginas internas
  initUserUI();
  initTheme();
});

window.handleLogin = handleLogin;
window.logout = logout;
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.navigate = navigate;
window.handleChangePassword = handleChangePassword;