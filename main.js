// main.js
document.addEventListener("DOMContentLoaded", () => {
  const { leagueSettings, getLeagueStyle, fetchJson } = window.SoccerShared;

  // 地図初期化（日本の真ん中あたり）
  const map = L.map("map").setView([36.2048, 138.2529], 5);

  // OSM タイルレイヤー
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  // マーカーを保持する配列
  const markers = [];

  // チェックボックス
  const filterJ1 = document.getElementById("filterJ1");
  const filterJ2 = document.getElementById("filterJ2");
  const filterJ3 = document.getElementById("filterJ3");
  const adminButton = document.getElementById("adminButton");
  const refreshButton = document.getElementById("refreshButton");

  // フィルタ関数
  function updateMarkers() {
    const showJ1 = filterJ1.checked;
    const showJ2 = filterJ2.checked;
    const showJ3 = filterJ3.checked;

    markers.forEach(entry => {
      const league = entry.league;
      const marker = entry.marker;

      let visible = false;
      if (league === "J1" && showJ1) visible = true;
      if (league === "J2" && showJ2) visible = true;
      if (league === "J3" && showJ3) visible = true;

      if (visible) {
        // まだ地図に無ければ追加
        if (!map.hasLayer(marker)) {
          marker.addTo(map);
        }
      } else {
        // 表示しないときは削除
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      }
    });
  }

  // JSON からスタジアムデータ取得
  loadStadiums();

  // フィルタイベント
  [filterJ1, filterJ2, filterJ3].forEach(input => {
    input.addEventListener("change", updateMarkers);
  });

  // 管理者ボタン：ログイン済みなら直接 admin へ、未ログインならモーダルを開く
  if (adminButton) {
    const loginModalEl = document.getElementById("loginModal");
    const loginForm = document.getElementById("loginForm");
    const loginModal = loginModalEl ? new bootstrap.Modal(loginModalEl) : null;

    function handleLoginSuccess() {
      loginModal?.hide();
      window.location.href = "admin.html";
    }

    window.SoccerAuth?.wireLoginForm(loginForm, handleLoginSuccess);

    adminButton.addEventListener("click", event => {
      if (window.SoccerAuth?.isLoggedIn()) {
        window.location.href = "admin.html";
      } else {
        // data-bs-toggle の挙動と合わせてログインモーダルを明示的に開く
        event.preventDefault();
        loginModal?.show();
      }
    });
  }

  // データ再読込（ファイル保存直後に反映したいとき用）
  refreshButton?.addEventListener("click", () => {
    loadStadiums(true);
  });

  // 地図右下にリーグ凡例を追加する
  function addLeagueLegend() {
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "league-legend");
      div.innerHTML = "<h6 class='mb-1'>リーグ凡例</h6>";

      Object.keys(leagueSettings)
        .filter(key => key !== "default")
        .forEach(key => {
          const style = leagueSettings[key];
          const item = document.createElement("div");
          item.className = "legend-item";
          item.innerHTML = `
            <span class="legend-color" style="background:${style.color}"></span>
            <span class="legend-label">${style.label}</span>
          `;
          div.appendChild(item);
        });
      return div;
    };

    legend.addTo(map);
  }

  // スタジアムデータを読み込み直し、マーカーを更新
  function loadStadiums(cacheBust = false) {
    fetchJson("stadiums.json", false, cacheBust)
      .then(data => {
        // 既存マーカーを削除
        markers.forEach(entry => {
          if (map.hasLayer(entry.marker)) {
            map.removeLayer(entry.marker);
          }
        });
        markers.length = 0;

        data.forEach(stadium => {
          const { id, league, club, stadiumName, lat, lng } = stadium;

          // リーグに応じた色を設定
          const style = getLeagueStyle(league);
          const marker = L.circleMarker([lat, lng], {
            radius: 9,
            color: style.color,
            fillColor: style.fillColor,
            fillOpacity: 0.9,
            weight: 2,
            title: club
          });

          // ポップアップとクリック遷移
          marker.bindPopup(`
            <div>
              <strong>${club}</strong><br>
              ${stadiumName}<br>
              <span class="badge" style="background-color:${style.color}">${league}</span>
            </div>
          `);
          marker.on("click", () => {
            // チーム詳細ページへ遷移
            window.location.href = `team.html?id=${encodeURIComponent(id)}`;
          });

          markers.push({
            league,
            marker
          });
        });

        // フィルタと凡例
        updateMarkers();
        addLeagueLegend();
      })
      .catch(error => {
        console.error(error);
      });
  }
});
