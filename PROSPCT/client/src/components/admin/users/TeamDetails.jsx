import { useEffect, useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import AdminComponent from '../AdminComponent';
import API_CONFIG from '../../../utils/apiConstant';
import { Trash2 } from 'lucide-react';

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function TeamDetails() {
  const { id } = useParams(); // ownerId
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [removingMember, setRemovingMember] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const token = Cookies.get('adminAccessToken');
      try {
        const res = await axios.get(`${BASE_URL}/api/admin/users/teams/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam(res.data.team);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch team');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleRemoveMember = async (memberEmail) => {
    if (!confirm(`Remove ${memberEmail} from team?`)) return;
    setRemovingMember(memberEmail);
    const token = Cookies.get('adminAccessToken');
    try {
      await axios.delete(`${BASE_URL}/api/admin/users/teams/${team._id}/member/${encodeURIComponent(memberEmail)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Member removed');
      // refresh
      const res = await axios.get(`${BASE_URL}/api/admin/users/teams/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setTeam(res.data.team);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  if (loading) return <AdminComponent><div className="p-6">Loading...</div></AdminComponent>;

  if (!team) return <AdminComponent><div className="p-6">Team not found</div></AdminComponent>;

  const usedSeats = (team.members || []).filter(m => m.status !== 'removed').length + 1;
  const maxUsers = team.maxUsers || (team.purchasedPlan && team.purchasedPlan.maxUsers) || 1;

  return (
    <AdminComponent>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{team.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Owner: {team.owner.firstName} {team.owner.lastName} — {team.owner.email}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">Seats: {usedSeats}/{maxUsers}</div>
            <div className="text-xs text-gray-500">Plan: {team.purchasedPlan?.name || '—'}</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {/* show owner first */}
                <tr className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{team.owner.firstName} {team.owner.lastName}</div>
                    <div className="text-xs text-gray-500">{team.owner.email}</div>
                  </td>
                  <td className="px-6 py-4"><span className="text-xs">Owner</span></td>
                  <td className="px-6 py-4">Owner</td>
                  <td className="px-6 py-4 text-right">—</td>
                </tr>
                {team.members.map((member, idx) => (
                  <tr key={idx} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{member.firstName || 'Pending'} {member.lastName || ''}</div>
                      <div className="text-xs text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs">{member.status}</span></td>
                    <td className="px-6 py-4 text-sm">{member.role}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button disabled={removingMember === member.email} onClick={() => handleRemoveMember(member.email)} className="px-3 py-1.5 border border-red-200 text-red-600 rounded text-xs">
                          {removingMember === member.email ? 'Removing...' : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminComponent>
  );
}
