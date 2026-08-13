import { Link } from 'react-router-dom';
import AdminLayout from '../layout/AdminLayout';


export default function AdminComponent({children}) {

  return (
    <AdminLayout>
    <div className="w-full flex-grow">
      {children}
    </div>
    </AdminLayout>
  );
}
