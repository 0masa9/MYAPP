import { useEffect, useState } from "react";
import { fetchStatsOverview } from "../api";
import { StatsOverview } from "../types";

const AnalyticsPage = () => {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchStatsOverview();
        setStats(data);
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h2 style={{ margin: 0 }}>分析</h2>
      </div>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      <div className="card-grid" style={{ marginTop: 12 }}>
        <div className="section">
          <h3>読んだ本</h3>
          <p style={{ fontSize: 28, margin: 0 }}>{stats?.total_read ?? "-"} 冊</p>
        </div>
        <div className="section">
          <h3>読みたい本</h3>
          <p style={{ fontSize: 28, margin: 0 }}>{stats?.total_want_to_read ?? "-"} 冊</p>
        </div>
        <div className="section">
          <h3>今月読み始め</h3>
          <p style={{ fontSize: 28, margin: 0 }}>{stats?.read_this_month ?? "-"} 冊</p>
        </div>
        <div className="section">
          <h3>今月読み終わり</h3>
          <p style={{ fontSize: 28, margin: 0 }}>{stats?.finished_this_month ?? "-"} 冊</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
