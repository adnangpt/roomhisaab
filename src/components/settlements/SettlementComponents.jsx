'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { formatCurrency, calculateNetBalances, generateSettlements, calculateExternalShares, calculateTotalLiabilities } from '@/lib/calculations';
import { useAuth } from '@/contexts/AuthContext';

export function SettlementView({ 
  period, 
  expenses, 
  members, 
  onClosePeriod, 
  onConfirmSettlement,
  onCompletePeriod,
  loading 
}) {
  const { user } = useAuth();
  const balances = calculateNetBalances(expenses, period.activeMembers);
  const settlements = generateSettlements(balances);
  const externalShares = calculateExternalShares(expenses);
  const totalLiabilities = calculateTotalLiabilities(balances, externalShares, period.activeMembers);
  
  const hasConfirmed = period.confirmedBy?.includes(user?.uid);
  const allConfirmed = period.activeMembers?.every(m => period.confirmedBy?.includes(m));
  
  const getMemberName = (id) => members.find(m => m.id === id)?.displayName || 'Unknown';

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            💰 Settlement Summary
          </h3>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Liabilities List */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              Total Net Balances (Rent + Rashan)
            </h4>
            <div className="space-y-2">
              {period.activeMembers?.map((userId) => {
                const total = totalLiabilities[userId] || 0;
                const internal = balances[userId] || 0;
                const external = externalShares[userId] || 0;
                
                return (
                  <div key={userId} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {getMemberName(userId)}
                        {userId === user?.uid && <span className="text-xs text-slate-400 ml-1">(You)</span>}
                      </span>
                      <span className={`font-bold ${total >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {total >= 0 ? '+' : ''}{formatCurrency(total)}
                      </span>
                    </div>
                    <div className="flex gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Rent: {formatCurrency(external)}</span>
                      <span>Rashan: {internal >= 0 ? '+' : ''}{formatCurrency(internal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to Settle Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              How to Settle
            </h4>
            <div className="space-y-3">
              {/* External Payments First */}
              {Object.entries(externalShares).map(([userId, amount]) => (
                amount > 0 && (
                  <div key={`ext-${userId}`} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      🏠
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {getMemberName(userId)} pays <span className="font-bold">{formatCurrency(amount)}</span>
                      </p>
                      <p className="text-[10px] text-slate-500">to Landlord (Rent/Electricity)</p>
                    </div>
                  </div>
                )
              ))}

              {/* Internal Settlements */}
              {settlements.map((s, idx) => (
                <div key={`int-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    🤝
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {getMemberName(s.from)} pays <span className="font-bold">{formatCurrency(s.amount)}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">to {getMemberName(s.to)} (Rashan/Other)</p>
                  </div>
                </div>
              ))}

              {settlements.length === 0 && Object.keys(externalShares).length === 0 && (
                <div className="text-center py-4 text-slate-500">
                  ✅ All settled! No payments needed.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent>
          {period.status === 'active' && (
            <Button 
              onClick={onClosePeriod} 
              variant="danger" 
              className="w-full"
              loading={loading}
            >
              🔒 Close Period & Settle Hisaab
            </Button>
          )}
          
          {period.status === 'closed' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Pending Confirmations
                </h4>
                <div className="flex flex-wrap gap-2">
                  {period.activeMembers?.map(memberId => (
                    <Badge 
                      key={memberId}
                      variant={period.confirmedBy?.includes(memberId) ? 'success' : 'warning'}
                    >
                      {period.confirmedBy?.includes(memberId) ? '✓' : '○'} {getMemberName(memberId)}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {!hasConfirmed && (
                <Button 
                  onClick={() => onConfirmSettlement(user?.uid)} 
                  variant="success" 
                  className="w-full"
                  loading={loading}
                >
                  ✅ Confirm My Settlement
                </Button>
              )}
              
              {hasConfirmed && !allConfirmed && (
                <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                  You've confirmed! Waiting for others...
                </div>
              )}
              
              {allConfirmed && (
                <Button 
                  onClick={onCompletePeriod} 
                  variant="primary" 
                  className="w-full"
                  loading={loading}
                >
                  🎉 Complete Period
                </Button>
              )}
            </div>
          )}
          
          {period.status === 'completed' && (
            <div className="text-center p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              ✅ This period has been completed
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function NotesSection({ notes, onAddNote, members, periodStatus, loading }) {
  const [noteText, setNoteText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const canAddNote = periodStatus !== 'active';
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    await onAddNote(noteText.trim());
    setNoteText('');
    setIsAdding(false);
  };
  
  const getMemberName = (id) => members.find(m => m.id === id)?.displayName || 'Unknown';
  
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (!canAddNote && notes.length === 0) return null;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            📝 Notes
          </h3>
          {canAddNote && !isAdding && (
            <Button size="sm" variant="ghost" onClick={() => setIsAdding(true)}>
              + Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Add a note about this period..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={loading}>
                Add Note
              </Button>
            </div>
          </form>
        )}
        
        {notes.length > 0 ? (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-slate-900 dark:text-white">{note.text}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {getMemberName(note.author)} • {formatDate(note.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          !isAdding && (
            <p className="text-center text-slate-500 py-4">
              No notes yet
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}
