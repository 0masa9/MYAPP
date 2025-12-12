import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

const NavBar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const links = [
    { to: "/books", label: "本棚" },
    { to: "/calendar", label: "カレンダー" },
    { to: "/analytics", label: "分析" },
    { to: "/chat", label: "チャット" },
    { to: "/profile", label: "プロフィール" },
    { to: "/help", label: "使い方" },
  ];
  return (
    <nav className="navbar">
      <div className="nav-left">
        <strong>Book Memory</strong>
      </div>
      <div className="nav-links">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className={location.pathname.startsWith(link.to) ? "active" : ""}>
            {link.label}
          </Link>
        ))}
      </div>
      <div className="nav-right">
        <button className="secondary" onClick={logout}>ログアウト</button>
      </div>
    </nav>
  );
};

export default NavBar;
