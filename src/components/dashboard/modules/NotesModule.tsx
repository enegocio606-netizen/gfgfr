import React, { useState, useEffect } from 'react';
import { getDashboardItems, createDashboardItem } from '@/services/dashboardDataService';
import { auth } from '@/firebase';

export const NotesModule = () => {
    const [notes, setNotes] = useState<any[]>([]);
    useEffect(() => { if (auth.currentUser) getDashboardItems(auth.currentUser.uid, 'notes').then(setNotes); }, []);
    
    return (
        <div className="space-y-1">
            {notes.map(n => (
                <div key={n.id} className="text-[10px] bg-slate-800 p-1 truncate">
                    {n.title || 'Sem título'}: {n.content || 'Sem conteúdo'}
                </div>
            ))}
        </div>
    );
};
