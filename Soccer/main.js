// main.js
document.addEventListener("DOMContentLoaded", () => {
  // リーグごとの色設定をまとめたオブジェクト（リーグが増えてもここを増やすだけ）
  const leagueStyles = {
    J1: { label: "J1", color: "#d81b60", fillColor: "#e53935" }, // 赤系
    J2: { label: "J2", color: "#1565c0", fillColor: "#1e88e5" }, // 青系
    J3: { label: "J3", color: "#2e7d32", fillColor: "#43a047" }, // 緑系
    default: { label: "その他", color: "#6c757d", fillColor: "#adb5bd" }
  };

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
  fetch("stadiums.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("stadiums.json の読み込みに失敗しました");
      }
      return response.json();
    })
    .then(data => {
      data.forEach(stadium => {
        const { id, league, club, stadiumName, lat, lng } = stadium;

        // リーグに応じた色を設定
        const style = leagueStyles[league] || leagueStyles.default;
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

      // 初回フィルタ
      updateMarkers();

      // 凡例を地図に追加
      addLeagueLegend();
    })
    .catch(error => {
      console.error(error);
    });

  // フィルタイベント
  [filterJ1, filterJ2, filterJ3].forEach(input => {
    input.addEventListener("change", updateMarkers);
  });

  // 地図右下にリーグ凡例を追加する
  function addLeagueLegend() {
    const legend = L.control({ position: "bottomright" });
    legend.onAdd = function () {
      const div = L.DomUtil.create("div", "league-legend");
      div.innerHTML = "<h6 class='mb-1'>リーグ凡例</h6>";

      Object.keys(leagueStyles)
        .filter(key => key !== "default")
        .forEach(key => {
          const style = leagueStyles[key];
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
});
