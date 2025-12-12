import { FormEvent, useEffect, useState } from "react";
import { followUser, getFollowers, getFollowing, unfollowUser } from "../api";
import { Follow } from "../types";

const ProfilePage = () => {
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [targetId, setTargetId] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [fol, ing] = await Promise.all([getFollowers(), getFollowing()]);
      setFollowers(fol);
      setFollowing(ing);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleFollow = async (e: FormEvent, action: "follow" | "unfollow") => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const id = Number(targetId);
    if (!id) return;
    try {
      if (action === "follow") await followUser(id);
      else await unfollowUser(id);
      setMessage(action === "follow" ? "フォローしました" : "フォロー解除しました");
      setTargetId("");
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h2 style={{ margin: 0 }}>プロフィール</h2>
      </div>
      <div className="section" style={{ marginTop: 12 }}>
        <h4 style={{ marginTop: 0 }}>フォロー/アンフォロー</h4>
        <form className="form-grid" onSubmit={(e) => handleFollow(e, "follow")}> 
          <div>
            <label className="label">ユーザーID</label>
            <input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="例: 2" />
          </div>
          <div className="footer-actions" style={{ gridColumn: "1 / -1" }}>
            <button type="submit">フォロー</button>
            <button type="button" className="secondary" onClick={(e) => handleFollow(e, "unfollow")}>フォロー解除</button>
          </div>
        </form>
        {message && <p style={{ color: "#047857" }}>{message}</p>}
        {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      </div>

      <div className="section" style={{ marginTop: 12 }}>
        <h4 style={{ marginTop: 0 }}>フォロー中</h4>
        {following.length === 0 && <p>フォローしているユーザーはいません。</p>}
        {following.map((f) => (
          <div key={f.following.id} className="list-row">
            <span>@{f.following.username}</span>
            <small style={{ color: "#6b7280" }}>{new Date(f.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>

      <div className="section" style={{ marginTop: 12 }}>
        <h4 style={{ marginTop: 0 }}>フォロワー</h4>
        {followers.length === 0 && <p>フォロワーはいません。</p>}
        {followers.map((f) => (
          <div key={f.follower.id} className="list-row">
            <span>@{f.follower.username}</span>
            <small style={{ color: "#6b7280" }}>{new Date(f.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
