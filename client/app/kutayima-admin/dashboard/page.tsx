'use client';
import { useRoleAuth } from '@/context/RoleAuthContext';
export default function Page() { const { user } = useRoleAuth(); return <div><h2 className="text-2xl font-bold mb-4">Welcome, {user?.username}!</h2><div className="bg-white p-6 rounded-lg shadow"><p className="text-gray-600">Kutayima Admin Dashboard - Manage your prayer group members.</p></div></div>; }
