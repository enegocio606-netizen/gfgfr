import React, { useState, useEffect } from 'react';
import { getRecentConversationMessages } from '@/services/conversationMemory';
import { auth } from '@/firebase';

export const IaHistoryModule = () => {
    const [history, setHistory] = useState<any[]>([]);
    useEffect(() => { 
        if (auth.currentUser) {
            getRecentConversationMessages(auth.currentUser.uid, 5).then(setHistory);
        }
    }, []);
    
    return (
        <div className="space-y-1">
            {history.map((m, i) => (
                <div key={i} className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 truncate">
                    {m.text.substring(0, 40)}...
                </div>
            ))}
        </div>
    );
};
