import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
    getFocoFlowData, 
    createFocoFlowTransaction, 
    deleteFocoFlowTransaction,
    createFocoFlowFinancialGoal,
    updateFocoFlowFinancialGoal,
    deleteFocoFlowFinancialGoal,
    createFocoFlowReminder,
    deleteFocoFlowItem,
    updateFocoFlowItem,
    createFocoFlowNote,
    createFocoFlowTask,
    createFocoFlowProject,
    getFinancialSummary,
    getMonthlyFinancialReport,
    FocoFlowTransaction,
    FocoFlowFinancialGoal,
    FocoFlowTask,
    FocoFlowProject
} from '../../services/focoFlowService';
import { auth } from '../../firebase-singleton';

export type ViewType = 
  | 'dashboard' 
  | 'tasks' 
  | 'projects' 
  | 'finance' 
  | 'goals' 
  | 'links' 
  | 'reminders' 
  | 'notes' 
  | 'ai' 
  | 'ops' 
  | 'chat';

interface FinancialContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  transactions: any[];
  goals: any[];
  reminders: any[];
  notes: any[];
  tasks: any[];
  projects: any[];
  payable: any[];
  receivable: any[];
  addTransaction: (t: any) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addGoal: (g: any) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  updateGoal: (id: string, progress: number) => Promise<void>;
  addReminder: (r: any) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminder: (id: string) => Promise<void>;
  addNote: (n: any) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addTask: (t: any) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: string) => Promise<void>;
  addProject: (p: any) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  totals: {
    balance: number;
    income: number;
    expenses: number;
    netProfit: number;
    incomeVariation: number;
    expenseVariation: number;
    balanceVariation: number;
  };
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [payable, setPayable] = useState<any[]>([]);
  const [receivable, setReceivable] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const userId = auth.currentUser?.uid;

  const refreshData = useCallback(async () => {
    if (!userId) return;

    try {
        const [
            transData, 
            goalsData, 
            remindersData, 
            notesData, 
            tasksData, 
            projectsData,
            financialSummary
        ] = await Promise.all([
            getFocoFlowData(userId, 'transacoes_financeiras_focoflow', 50),
            getFocoFlowData(userId, 'metas_financeiras_focoflow', 20),
            getFocoFlowData(userId, 'itens_focoflow', 50, 'reminder'),
            getFocoFlowData(userId, 'itens_focoflow', 50, 'note'),
            getFocoFlowData(userId, 'itens_focoflow', 50, 'task'),
            getFocoFlowData(userId, 'itens_focoflow', 20, 'project'),
            getFinancialSummary(userId)
        ]);

        setTransactions(transData.sort((a: any, b: any) => b.data - a.data));
        setGoals(goalsData);
        setReminders(remindersData);
        setNotes(notesData);
        setTasks(tasksData);
        setProjects(projectsData);
        setSummary(financialSummary);
        
        // Mocking payable/receivable for now if not explicitly in services
        setPayable([]); 
        setReceivable([]);
    } catch (error) {
        console.error("Error refreshing financial data:", error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
        refreshData();
    }
  }, [userId, refreshData]);

  const totals = useMemo(() => {
    if (summary) {
        return {
            balance: summary.realBalance,
            income: summary.income,
            expenses: summary.expense,
            netProfit: summary.income - summary.expense,
            incomeVariation: 8.2, // Mock variations for now
            expenseVariation: -2.4,
            balanceVariation: 12.5
        };
    }
    return {
      balance: 0,
      income: 0,
      expenses: 0,
      netProfit: 0,
      incomeVariation: 0,
      expenseVariation: 0,
      balanceVariation: 0
    };
  }, [summary]);

  const addTransaction = async (t: any) => {
    if (!userId) return;
    await createFocoFlowTransaction(userId, t);
    await refreshData();
  };

  const deleteTransaction = async (id: string) => {
    await deleteFocoFlowTransaction(id);
    await refreshData();
  };

  const addGoal = async (g: any) => {
    if (!userId) return;
    await createFocoFlowFinancialGoal(userId, g);
    await refreshData();
  };

  const deleteGoal = async (id: string) => {
    await deleteFocoFlowFinancialGoal(id);
    await refreshData();
  };

  const updateGoal = async (id: string, progress: number) => {
    await updateFocoFlowFinancialGoal(id, { valor_atual: progress });
    await refreshData();
  };

  const addReminder = async (r: any) => {
    if (!userId) return;
    await createFocoFlowReminder(userId, r);
    await refreshData();
  };

  const deleteReminder = async (id: string) => {
    await deleteFocoFlowItem(id);
    await refreshData();
  };

  const toggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder) {
        await updateFocoFlowItem(id, { status: reminder.status === 'completed' ? 'pending' : 'completed' });
        await refreshData();
    }
  };

  const addNote = async (n: any) => {
    if (!userId) return;
    await createFocoFlowNote(userId, n);
    await refreshData();
  };

  const deleteNote = async (id: string) => {
    await deleteFocoFlowItem(id);
    await refreshData();
  };

  const addTask = async (t: any) => {
    if (!userId) return;
    await createFocoFlowTask(userId, t);
    await refreshData();
  };

  const deleteTask = async (id: string) => {
    await deleteFocoFlowItem(id);
    await refreshData();
  };

  const updateTaskStatus = async (id: string, status: string) => {
    await updateFocoFlowItem(id, { status });
    await refreshData();
  };

  const addProject = async (p: any) => {
    if (!userId) return;
    await createFocoFlowProject(userId, p);
    await refreshData();
  };

  const deleteProject = async (id: string) => {
    await deleteFocoFlowItem(id);
    await refreshData();
  };

  return (
    <FinancialContext.Provider value={{ 
      activeView,
      setActiveView,
      transactions, 
      goals, 
      reminders,
      notes,
      tasks,
      projects,
      payable, 
      receivable, 
      addTransaction, 
      deleteTransaction, 
      addGoal,
      deleteGoal,
      updateGoal,
      addReminder,
      deleteReminder,
      toggleReminder,
      addNote,
      deleteNote,
      addTask,
      deleteTask,
      updateTaskStatus,
      addProject,
      deleteProject,
      refreshData,
      totals
    }}>
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}
