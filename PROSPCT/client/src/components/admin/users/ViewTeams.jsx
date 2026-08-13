import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import AdminComponent from '../AdminComponent';
import API_CONFIG from '../../../utils/apiConstant';
import { Trash2 } from 'lucide-react';

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function ViewTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const navigate = useNavigate();

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    const token = Cookies.get('adminAccessToken');
    if (!token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/users/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeams(res.data.teams || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Delete this team and remove its members?')) return;
    setRemoving(teamId);
    const token = Cookies.get('adminAccessToken');
    try {
      await axios.delete(`${BASE_URL}/api/admin/users/teams/${teamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Team deleted');
      fetchTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete team');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <AdminComponent>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Teams</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overview of all teams</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Team</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Owner</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Members</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Seats</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {teams.map((team) => {
                  const usedSeats = (team.members || []).filter(m => m.status !== 'removed').length + 1;
                  const maxUsers = team.maxUsers || (team.purchasedPlan && team.purchasedPlan.maxUsers) || 1;
                  return (
                    <tr key={team._id} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{team.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Purchased Plan: {team.purchasedPlan?.name || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => navigate(`/admin/users/teams/${team.owner._id}`)} className="text-sm text-sky-700 dark:text-sky-400 font-medium">{team.owner.firstName} {team.owner.lastName}</button>
                        <div className="text-xs text-gray-500">{team.owner.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {team.members?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-sm font-medium">Max Users: {usedSeats}/{maxUsers}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => navigate(`/admin/users/teams/${team.owner._id}`)} className="px-3 py-1.5 bg-sky-600 text-white rounded text-xs">View</button>
                          <button onClick={() => handleDeleteTeam(team._id)} disabled={removing === team._id} className="px-3 py-1.5 border border-red-200 text-red-600 rounded text-xs">
                            {removing === team._id ? 'Deleting...' : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminComponent>
  );
}
