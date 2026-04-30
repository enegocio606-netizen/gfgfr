import React, { useState, useEffect } from 'react';
import { getDashboardItems, createDashboardItem } from '../../../../services/dashboardDataService';
import { auth } from '../../../../firebase';
import { Plus } from 'lucide-react';

export const FinanceGoals = () => {
    const [goals, setGoals] = useState<any[]>([]);
    
    useEffect(() => {
        if (auth.currentUser) {
            getDashboardItems(auth.currentUser.uid, 'financialGoals').then(setGoals);
        }
    }, []);

    const addGoal = async () => {
        if (auth.currentUser) {
            await createDashboardItem(auth.currentUser.uid, 'financialGoals', { name: 'Nova Meta', targetAmount: 1000, currentAmount: 0 });
            getDashboardItems(auth.currentUser.uid, 'financialGoals').then(setGoals);
        }
    };

    return (
        <div className="space-y-2">
            <button onClick={addGoal} className="text-cyan-400 flex items-center gap-1 hover:text-cyan-300 transition-colors">
                <Plus size={12}/> Nova Meta
            </button>
            {goals.map(g => (
                <div key={g.id} className="text-xs">
                    {g.name}: {g.currentAmount} / {g.targetAmount}
                </div>
            ))}
        </div>
    );
};
