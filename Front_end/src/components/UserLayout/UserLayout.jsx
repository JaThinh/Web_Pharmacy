import Footer from "../Footer/Footer.jsx";
import Header from "../Header/Header.jsx";
import SupportChat from "../../pages/user/SupportChat/SupportChat.jsx";

export default function UserLayout({ children }) {
  return (
    <div className="page">
      <Header />
      <main className="container page-section">{children}</main>
      <Footer />
      <SupportChat />
    </div>
  );
}
