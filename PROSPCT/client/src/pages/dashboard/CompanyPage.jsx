import CompanyHeader from "../../components/company/CompanyHeader";
import CompanySidebar from "../../components/company/CompanySidebar";
import CompanyContainer from "../../components/company/CompanyContainer";
import MainLayout from "../../components/layout/MainLayout";

function CompanyPage() {
  return (
    <MainLayout>
      <section className="text-[#000000a6] text-sm w-full h-[calc(100vh-64px)] overflow-hidden flex flex-col">
        <CompanyHeader />

        <div
          id="Company-section-div w-full"
          className="flex bg-[#f7f8fa] flex-1 overflow-hidden w-full min-h-0"
        >
          <CompanySidebar />
          <div className="flex-1 overflow-hidden min-h-0">
            <CompanyContainer />
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

export default CompanyPage;
