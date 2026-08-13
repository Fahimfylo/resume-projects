import Header from "../common/header/Header";

function MainLayout({ children }) {
  return (
    <div className="h-screen bg-gray-50">
      <Header />
      <div className="main-content pt-12">{children}</div>
    </div>
  );
}

export default MainLayout;
