// shared.js
// サイト全体で共通利用するリーグ設定とユーティリティ

(function (global) {
  const leagueSettings = {
    J1: { label: "J1", color: "#d81b60", fillColor: "#e53935" }, // 赤系
    J2: { label: "J2", color: "#1565c0", fillColor: "#1e88e5" }, // 青系
    J3: { label: "J3", color: "#2e7d32", fillColor: "#43a047" }, // 緑系
    default: { label: "その他", color: "#6c757d", fillColor: "#adb5bd" }
  };

  /**
   * JSON を読み込む共通関数
   * @param {string} path ファイルパス
   * @param {boolean} [optional=false] true のとき失敗しても undefined を返す
   * @param {boolean} [cacheBust=false] true ならキャッシュバスターを付与（ファイルを保存したら即反映したいとき用）
   */
  async function fetchJson(path, optional = false, cacheBust = false) {
    const url = cacheBust ? addCacheBuster(path) : path;
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) {
        throw new Error(`${path} の読み込みに失敗しました`);
      }
      return await res.json();
    } catch (error) {
      if (optional) {
        console.warn(error.message);
        return undefined;
      }
      throw error;
    }
  }

  // キャッシュを避けるためのクエリ付与
  function addCacheBuster(path) {
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}t=${Date.now()}`;
  }

  global.SoccerShared = {
    leagueSettings,
    getLeagueStyle: league => leagueSettings[league] || leagueSettings.default,
    fetchJson,
    addCacheBuster
  };
})(window);
