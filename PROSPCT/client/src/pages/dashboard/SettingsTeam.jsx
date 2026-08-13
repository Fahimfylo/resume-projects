import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../utils/authServices";
import { Trash2, Loader2, Copy, Check, UserPlus, Shield, User, Mail, Link as LinkIcon, RefreshCw } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../../utils/apiConstant";
import { toast } from "react-toastify";
import useStore from "../../store/store";

const SettingsTeam = () => {
  const { user, refreshUser } = useStore();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [removingAll, setRemovingAll] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [resendingEmail, setResendingEmail] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(null);

  // Fetch user data if not available
  useEffect(() => {
    if (!user) {
      refreshUser();
    }
  }, [user, refreshUser]);

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
    return { Authorization: `Bearer ${token}` };
  };

  const fetchTeam = useCallback(async () => {
    try {
      const res = await axios.get(`${API_CONFIG.API_ENDPOINT}/api/team`, {
        headers: getAuthHeaders(),
      });
      const teamData = res.data?.[0] || null;
      setTeam(teamData);
      
      if (teamData) {
        setWorkspaceName(teamData.name || "");
        
        // Merge owner and members for display
        const ownerMember = {
          ...teamData.owner,
          role: "owner",
          status: "joined",
          isOwner: true
        };
        
        const otherMembers = (teamData.members || [])
          .filter(m => m.status !== "removed")
          .map(m => ({
          ...m,
          isOwner: false
        }));
        
        setMembers([ownerMember, ...otherMembers]);
      } else {
        setMembers([]);
      }
    } catch (err) {
      // console.error("Failed to fetch team:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleSaveWorkspaceName = async () => {
    if (!workspaceName.trim()) return;
    setSavingName(true);
    try {
      if (team) {
        // Update existing team name
        await axios.patch(
          `${API_CONFIG.API_ENDPOINT}/api/team/${team._id}/name`,
          { name: workspaceName.trim() },
          { headers: getAuthHeaders() },
        );
        toast.success("Workspace name updated");
      } else {
        // Create team if none exists
        const res = await axios.post(
          `${API_CONFIG.API_ENDPOINT}/api/team`,
          { name: workspaceName.trim() },
          { headers: getAuthHeaders() },
        );
        toast.success("Workspace created");
        setTeam(res.data);
      }
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save workspace name");
    } finally {
      setSavingName(false);
    }
  };

  const handleSendInvite = async (e) => {
    if (e) e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      const res = await axios.post(
        `${API_CONFIG.API_ENDPOINT}/api/invite/send`,
        { email },
        { headers: getAuthHeaders() },
      );
      if (res.data.emailSent) {
        setShowInviteSuccess(true);
        toast.success("Invitation sent successfully");
      } else {
        toast.warning("Invite created but email could not be sent. Share the link manually.");
        // If email failed, copy link automatically for convenience
        if (res.data.inviteLink) {
          navigator.clipboard.writeText(res.data.inviteLink);
          toast.info("Invite link copied to clipboard");
        }
      }
      setEmail("");
      fetchTeam();
      setTimeout(() => setShowInviteSuccess(false), 5000);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const handleCopyInviteLink = async (memberEmail) => {
    setCopiedEmail(memberEmail);
    try {
      const res = await axios.post(
        `${API_CONFIG.API_ENDPOINT}/api/invite/send`,
        { email: memberEmail },
        { headers: getAuthHeaders() },
      );
      if (res.data.inviteLink) {
        await navigator.clipboard.writeText(res.data.inviteLink);
        toast.success("Invite link copied!");
      }
    } catch (err) {
      toast.error("Failed to get invite link");
    } finally {
      setTimeout(() => setCopiedEmail(null), 2000);
    }
  };

  const handleResendInvite = async (memberEmail) => {
    setResendingEmail(memberEmail);
    try {
      const res = await axios.post(
        `${API_CONFIG.API_ENDPOINT}/api/invite/send`,
        { email: memberEmail },
        { headers: getAuthHeaders() },
      );
      if (res.data.emailSent) {
        toast.success("Invitation resent successfully");
      } else {
        toast.warning("Email could not be sent. Copy the link instead.");
      }
    } catch (err) {
      toast.error("Failed to resend invitation");
    } finally {
      setResendingEmail(null);
    }
  };

  const handleUpdateRole = async (memberEmail, newRole) => {
    if (!team) return;
    setUpdatingRole(memberEmail);
    try {
      await axios.patch(
        `${API_CONFIG.API_ENDPOINT}/api/team/member-role/${team._id}`,
        { email: memberEmail, role: newRole },
        { headers: getAuthHeaders() },
      );
      toast.success(`Role updated to ${newRole}`);
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update role");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemoveMember = async (memberEmail) => {
    if (!team) return;
    if (!confirm(`Remove ${memberEmail} from the team?`)) return;
    setRemoving(memberEmail);
    try {
      const encodedEmail = encodeURIComponent(memberEmail);
      await axios.delete(
        `${API_CONFIG.API_ENDPOINT}/api/team/member/${team._id}/${encodedEmail}`,
        { headers: getAuthHeaders() },
      );
      toast.success("Member removed");
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove member");
    } finally {
      setRemoving(null);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    if (!confirm('Leaving your team will log you out and delete your account. Continue?')) return;
    setLeaving(true);
    try {
      await axios.delete(
        `${API_CONFIG.API_ENDPOINT}/api/team/leave`,
        { headers: getAuthHeaders() },
      );
      toast.success('You have left the team and your account is deleted');
      // Logout and redirect to login
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to leave team');
    } finally {
      setLeaving(false);
    }
  };

  const handleRemoveAllMembers = async () => {
    if (!team) return;
    if (!confirm("Remove all members from your team?")) return;
    setRemovingAll(true);
    try {
      await axios.delete(
        `${API_CONFIG.API_ENDPOINT}/api/team/members/${team._id}/all`,
        { headers: getAuthHeaders() },
      );
      toast.success("All members removed");
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to remove all members");
    } finally {
      setRemovingAll(false);
    }
  };

  const isOwner = team?.owner?._id === user?._id || team?.owner === user?._id;

return (
    <div className="w-full max-w-5xl mx-auto bg-white border border-gray-200 rounded-sm shadow-sm font-sans min-h-[600px] flex flex-col transition-colors">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-xl text-gray-800 font-semibold">Workspace & Team</h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
          <Shield size={12} />
          {isOwner ? "Workspace Owner" : "Team Member"}
        </div>
      </div>

      <div className="p-6">
        {/* Workspace Name Section - visible to owners only */}
        {isOwner && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace settings
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Rename your workspace to help your team identify it.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder={`${user?.firstName || "User"}'s Team`}
                className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={handleSaveWorkspaceName}
                disabled={savingName || !workspaceName.trim()}
                className="px-6 py-2 bg-[#1e90ff] text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingName ? <Loader2 size={16} className="animate-spin" /> : "Update"}
              </button>
            </div>
          </div>
        )}

        {/* Invitation Section - visible to owners only */}
        {isOwner && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <UserPlus size={16} className="text-blue-500" />
              Invite team members
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Invite team members to collaborate. They will receive an email to join.{team?.maxUsers ? ` You have ${Math.max(0, team.maxUsers - 1 - (team.members || []).filter(m => m.status !== "removed").length)} seat(s) remaining.` : ''}
            </p>
            <form onSubmit={handleSendInvite} className="flex gap-3 mb-1">
              <div className="relative w-full max-w-sm">
                <div className="absolute inset-y-0 left-3 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none text-sm transition-all bg-white text-gray-900 placeholder-gray-400 ${
                    showInviteSuccess ? "border-green-500 ring-1 ring-green-500" : "border-gray-300 focus:ring-1 focus:ring-blue-500"
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={!email || sending}
                className="px-8 py-2 bg-[#1e90ff] text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-sm"
              >
                {sending ? "Sending..." : "Send Invite"}
              </button>
            </form>
            {showInviteSuccess && (
              <p className="text-green-500 text-sm font-medium mt-2 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                <Check size={14} />
                Invitation was sent successfully
              </p>
            )}
          </div>
        )}
      </div>

      {/* Conditional Content: Table or Empty State */}
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-500" size={40} />
          </div>
        ) : members.length > 0 ? (
          <>
            <div className="border-t border-gray-200 overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                      User {team?.maxUsers ? `${1 + (team.members || []).filter(m => m.status !== "removed").length}/${team.maxUsers}` : ""}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                      Role
                    </th>
                    <th className="px-6 py-4 border-b border-gray-100"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50:bg-gray-800/30 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
                            {member.firstName ? (
                              <span className="text-sm font-bold">{member.firstName[0]}{member.lastName?.[0]}</span>
                            ) : (
                              <User size={18} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {member.firstName
                                ? `${member.firstName} ${member.lastName}`
                                : member.isOwner ? "Workspace Owner" : "Pending Member"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === "joined" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {member.status === "joined" ? "Joined" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {member.isOwner ? (
                          <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Shield size={14} className="text-blue-500" />
                            Owner
                          </span>
                        ) : isOwner && member.status === "joined" ? (
                          <select
                            value={member.role}
                            onChange={(e) => handleUpdateRole(member.email, e.target.value)}
                            disabled={updatingRole === member.email}
                            className="text-sm bg-transparent border-none focus:ring-0 cursor-pointer text-gray-700 font-medium hover:text-blue-600:text-blue-400 transition-colors p-0"
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className="text-sm text-gray-500 capitalize">
                            {member.role || "Member"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {member.status === "pending" && isOwner && (
                            <>
                              <button
                                onClick={() => handleCopyInviteLink(member.email)}
                                title="Copy Invite Link"
                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-md hover:bg-blue-50:bg-blue-900/20"
                              >
                                {copiedEmail === member.email ? <Check size={18} className="text-green-500" /> : <LinkIcon size={18} />}
                              </button>
                              <button
                                onClick={() => handleResendInvite(member.email)}
                                disabled={resendingEmail === member.email}
                                title="Resend Invitation"
                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-md hover:bg-blue-50:bg-blue-900/20 disabled:opacity-50"
                              >
                                <RefreshCw size={18} className={resendingEmail === member.email ? "animate-spin" : ""} />
                              </button>
                            </>
                          )}
                          {!member.isOwner && isOwner && (
                            <button
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-red-50:bg-red-900/20 disabled:opacity-50"
                              disabled={removing === member.email}
                              onClick={() => handleRemoveMember(member.email)}
                              title="Remove Member"
                            >
                              {removing === member.email ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {isOwner && members.length > 1 && (
              <div className="p-6 border-t border-gray-100">
                <button
                className="px-4 py-2 border border-red-200 text-red-500 text-xs font-semibold uppercase tracking-wider rounded-md hover:bg-red-50:bg-red-900/10 disabled:opacity-50 transition-all flex items-center gap-2"
                disabled={removingAll}
                onClick={handleRemoveAllMembers}
              >
                {removingAll ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Remove all members
              </button>
              </div>
            )}
          </>
        ) : (
          /* Empty State Illustration */
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                <UserPlus size={48} />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Start building your team
            </h2>
            <p className="text-gray-500 mt-2 max-w-xs text-center text-sm">
              Invite your colleagues to collaborate on leads and share subscription benefits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsTeam;
