import MainLayout from "../../components/layout/MainLayout";

import BulkVerification from "../../components/verifyComponents/BulkVerification";
import SingleVerification from "../../components/verifyComponents/SingleVerification";

const VerifyPage = () => {
  return (
    <MainLayout>
      <section id="verify-section" className="">
        <nav className="flex px-4 py-3 bg-white border-b border-gray-200 shadow section-nav">
          <div
            id="second-section-header"
            className="ml-4 text-xl font-semibold search-left lg:flex"
          >
            Verify
          </div>
        </nav>

        <div className="container flex-col items-center justify-center w-3/4 p-5 mx-auto space-y-6 lg:flex">
          <SingleVerification />
          <BulkVerification />
        </div>
      </section>
    </MainLayout>
  );
};

export default VerifyPage;
