'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createRoleApi } from '@/lib/roleApi';
import { MonthlySupportPlan, MonthlySupportDue, MonthlySupportDraw } from '@/types';
import { ArrowLeft, Trophy, History, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

const contributorId = (member: MonthlySupportPlan['members'][number]): string | null => {
  const raw = member.memberId ?? member.donorId;
  if (!raw) return null;
  return typeof raw === 'string' ? raw : raw._id;
};

const contributorName = (member: MonthlySupportPlan['members'][number]): string => {
  if (member.memberId) {
    return typeof member.memberId === 'string'
      ? member.memberId
      : `${member.memberId.firstName} ${member.memberId.lastName || ''}`.trim();
  }
  if (member.donorId) {
    return typeof member.donorId === 'string' ? member.donorId : member.donorId.name;
  }
  return 'Unknown';
};

export default function SuperAdminMonthlySupportDrawPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('planId');
  const api = createRoleApi('super_admin');

  const [plan, setPlan] = useState<MonthlySupportPlan | null>(null);
  const [overdueIds, setOverdueIds] = useState<Set<string>>(new Set());
  const [draws, setDraws] = useState<MonthlySupportDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawType, setDrawType] = useState<'complete' | 'skip_next'>('complete');
  const [notes, setNotes] = useState('');
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (planId) fetchData();
  }, [planId]);

  const fetchData = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const [planRes, duesRes, drawsRes] = await Promise.all([
        api.get(`/monthly-support-plans/${planId}`),
        api.get(`/monthly-support-plans/${planId}/dues?unpaidOnly=true`),
        api.get(`/monthly-support-plans/${planId}/draws`),
      ]);
      const fetchedPlan: MonthlySupportPlan | null = planRes.data?.data || null;
      setPlan(fetchedPlan);

      const currentPeriod = new Date();
      const currentPeriodMonth = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`;
      const unpaidDues: MonthlySupportDue[] = duesRes.data?.data || [];
      const overdue = new Set(
        unpaidDues
          .filter((d) => d.periodMonth < currentPeriodMonth)
          .map((d) => (typeof d.dueForId === 'string' ? d.dueForId : d.dueForId._id))
      );
      setOverdueIds(overdue);

      setDraws(drawsRes.data?.data || []);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error fetching draw data:', error);
      toast.error('Failed to load draw data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRecordDraw = async () => {
    if (!planId || selectedIds.size === 0) return;
    const typeLabel = drawType === 'complete' ? 'deposit complete' : 'skip next payment only';
    if (!confirm(`Record ${selectedIds.size} winner(s) (${typeLabel}) for this draw of lots? This cannot be undone.`)) return;
    setRecording(true);
    try {
      const response = await api.post(`/monthly-support-plans/${planId}/draw`, {
        winnerIds: Array.from(selectedIds),
        drawType,
        notes: notes.trim() || undefined,
      });
      const winners = response.data?.data?.winners || [];
      toast.success(
        winners.length === 1 ? `${winners[0].dueForName} recorded as a winner!` : `${winners.length} winners recorded!`
      );
      setNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error recording draw:', error);
      toast.error(error.response?.data?.error || 'Failed to record draw');
    } finally {
      setRecording(false);
    }
  };

  const candidates = (plan?.members || []).filter((m) => !m.drawnAt && contributorId(m));
  const drawnCount = (plan?.members.length ?? 0) - candidates.length;

  const formatDateTime = (date: Date) =>
    new Date(date).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (!planId) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No plan selected.</p>
        <button onClick={() => router.push('/super-admin/dashboard/monthly-support')} className="text-purple-600 hover:underline mt-2">
          Back to Monthly Support
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push('/super-admin/dashboard/monthly-support')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Monthly Support
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{plan ? `Draw of Lots — ${plan.name}` : 'Draw of Lots'}</h2>
        <p className="text-gray-600">
          The draw itself happens in person — pick the name(s) that were drawn below to record the result, then choose whether the
          win completes their whole deposit or just skips their next payment.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">Loading...</div>
      ) : plan && plan.treatment !== 'liability' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          Draw of lots is only available for liability-treatment (deposit) plans, such as hall booking deposits. This plan is treatment
          &quot;{plan.treatment}&quot;.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total Contributors</p>
              <p className="text-2xl font-bold text-gray-800">{plan?.members.length ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Already Drawn</p>
              <p className="text-2xl font-bold text-green-600">{drawnCount}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Not Yet Drawn</p>
              <p className="text-2xl font-bold text-gray-800">{candidates.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-600" />
              Record a Draw Result
            </h3>
            <p className="text-sm text-gray-500 mb-4">Select whoever's name(s) were drawn in person.</p>

            {candidates.length === 0 ? (
              <p className="text-sm text-gray-500">Everyone in this plan has already completed their deposit.</p>
            ) : (
              <>
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer ${
                      drawType === 'complete' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="drawType"
                      checked={drawType === 'complete'}
                      onChange={() => setDrawType('complete')}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900">Deposit complete</span>
                      <span className="block text-xs text-gray-500">All remaining installments waived — they're done for good.</span>
                    </span>
                  </label>
                  <label
                    className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer ${
                      drawType === 'skip_next' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="drawType"
                      checked={drawType === 'skip_next'}
                      onChange={() => setDrawType('skip_next')}
                      className="mt-1 w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900">Skip next payment only</span>
                      <span className="block text-xs text-gray-500">Only their very next installment is waived — billing resumes after.</span>
                    </span>
                  </label>
                </div>

                <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {candidates.map((member) => {
                    const id = contributorId(member)!;
                    const isOverdue = overdueIds.has(id);
                    return (
                      <label
                        key={id}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(id)}
                            onChange={() => toggleSelected(id)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-900">{contributorName(member)}</span>
                        </span>
                        {isOverdue && (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Has overdue installment
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Drawn at the August feast day gathering"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">{selectedIds.size} selected</p>
                  <button
                    onClick={handleRecordDraw}
                    disabled={recording || selectedIds.size === 0}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trophy className="w-4 h-4" />
                    {recording ? 'Recording...' : 'Record Draw'}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" />
                Draw History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner(s)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {draws.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No draws recorded yet</td>
                    </tr>
                  ) : (
                    draws.map((draw) => (
                      <tr key={draw._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(draw.drawnAt)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {draw.winners.map((w) => w.dueForName).join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {draw.drawType === 'skip_next' ? (
                            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                              Skip {draw.skipPeriodMonth}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                              Deposit complete
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{draw.notes || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
