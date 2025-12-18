'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { formatCurrency, calculateNetBalances, generateSettlements } from '@/lib/calculations';
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
  const balances = calculateNetBalances(expenses);
  const settlements = generateSettlements(balances);
  
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
        <CardContent className="space-y-4">
          {/* Balances */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Balances
            </h4>
            <div className="space-y-2">
              {Object.entries(balances).map(([userId, balance]) => (
                <div key={userId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="font-medium text-slate-900 dark:text-white">
                    {getMemberName(userId)}
                  </span>
                  <span className={`font-semibold ${balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Settlements */}
          {settlements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Settlements
              </h4>
              <div className="space-y-2">
                {settlements.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {getMemberName(s.from)}
                    </span>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {getMemberName(s.to)}
                    </span>
                    <span className="ml-auto font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(s.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {settlements.length === 0 && (
            <div className="text-center py-4 text-slate-500">
              ✅ All settled! No payments needed.
            </div>
          )}
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
