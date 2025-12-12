// auth.js
// 簡易ログイン（フロントのみ）を管理する共通モジュール
(function (global) {
  const ADMIN_KEY = "soccerAdminLoggedIn";
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "0000";

  function isLoggedIn() {
    return localStorage.getItem(ADMIN_KEY) === "true";
  }

  function logout() {
    localStorage.removeItem(ADMIN_KEY);
  }

  function login(username, password) {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      localStorage.setItem(ADMIN_KEY, "true");
      return true;
    }
    return false;
  }

  function requireLogin(redirect = "index.html") {
    if (!isLoggedIn()) {
      alert("管理者ログインが必要です。");
      window.location.href = redirect;
    }
  }

  /**
   * ログインフォームの submit をフックして、成功したらコールバックを呼ぶ
   * @param {HTMLFormElement} form
   * @param {Function} onSuccess
   */
  function wireLoginForm(form, onSuccess) {
    if (!form) return;
    form.addEventListener("submit", event => {
      event.preventDefault();
      const username = form.querySelector("[name='username']")?.value?.trim();
      const password = form.querySelector("[name='password']")?.value?.trim();
      if (login(username, password)) {
        onSuccess?.();
      } else {
        alert("ユーザー名またはパスワードが違います");
      }
    });
  }

  global.SoccerAuth = {
    isLoggedIn,
    login,
    logout,
    requireLogin,
    wireLoginForm
  };
})(window);
