import { useEffect } from "react";
import ContactHeader from "../../components/contact/ContactHeader";
import ContactSidebar from "../../components/contact/ContactSidebar";
import ContactsContainer from "../../components/contact/ContactsContainer";
import MainLayout from "../../components/layout/MainLayout";
import useStore from "../../store/store";

function ContactPage() {
  const setContactFilter = useStore((state) => state.setContactFilter);

  useEffect(() => {
    setContactFilter("my");
  }, [setContactFilter]);

  return (
    <MainLayout>
      <section className="text-[#000000a6] text-sm">
        <ContactHeader />

        <div
          id="contacts-section-div"
          className="block overflow-hidden sm:flex bg-[#f7f8fa] overflow-y-auto"
          style={{ height: 'calc(100vh - 96px)' }}
        >
          <ContactSidebar />
          <ContactsContainer />
        </div>
      </section>
    </MainLayout>
  );
}

export default ContactPage;
