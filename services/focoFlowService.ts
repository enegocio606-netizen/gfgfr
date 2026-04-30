import { db, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, Timestamp, deleteDoc, setDoc, limit, handleFirestoreError, OperationType } from '../firebase-singleton';

// Interfaces based on FocoFlow description
export interface FocoFlowTask {
    uid: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    due_date?: Timestamp;
    project_id?: string;
    priority?: 'low' | 'medium' | 'high';
    reminder_time?: number;
    created_at: any;
}

export interface FocoFlowProject {
    uid: string;
    name: string;
    description?: string;
    color?: string;
    created_at: any;
}

export interface FocoFlowTransaction {
    uid: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category?: string;
    origin_type?: string; 
    date: number; 
    paymentMethod?: string; 
    sourceAccount?: string;
    destinationAccount?: string;
    relatedPerson?: string;
    observations?: string;
    impactsEquity?: boolean;
    created_at: any;
    status?: 'pending' | 'completed';
}

export interface FocoFlowFinancialGoal {
    uid: string;
    titulo: string;
    valor_alvo: number;
    valor_atual: number;
    prazo?: number;
    categoria?: string;
    cor?: string;
    status: 'active' | 'completed' | 'abandoned';
    criado_em: number;
    id: string;
}

// --- CRUD Operations ---

// Since Assistente and FocoFlow share the same database and user IDs, 
// we use the Assistente user ID directly as the FocoFlow user ID.

export const createFocoFlowTask = async (userId: string, taskData: Partial<FocoFlowTask> & { category?: string }) => {
    const now = Date.now();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `itens_focoflow/${id}`;
    
    // Categorias que devem ser tratadas como 'task' para aparecerem na aba correta
    const taskCategories = ['task', 'tarefa', 'tarefas', 'todo', 'pendente'];
    let finalCategory = taskData.category || 'task';
    
    if (taskCategories.includes(finalCategory.toLowerCase())) {
        finalCategory = 'task';
    }

    try {
        await setDoc(doc(db, 'itens_focoflow', id), {
            uid: userId,
            'titulo': taskData.title || '',
            'descricao': taskData.description || '',
            status: taskData.status || 'todo',
            'prioridade': taskData.priority || 'medium',
            'reminder_time': taskData.reminder_time || null,
            'categoria': finalCategory,
            project_id: taskData.project_id || null,
            'criado_em': now,
            id: id
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const createFocoFlowProject = async (userId: string, projectData: Partial<FocoFlowProject>) => {
    const now = Date.now();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `itens_focoflow/${id}`;
    try {
        await setDoc(doc(db, 'itens_focoflow', id), {
            uid: userId,
            'nome': projectData.name || '',
            'descricao': projectData.description || '',
            color: projectData.color || '#3b82f6',
            'categoria': 'project',
            'criado_em': now,
            id: id
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const createFocoFlowTransaction = async (userId: string, transactionData: any) => {
    const now = Date.now();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `transacoes_financeiras_focoflow/${id}`;
    
    let transactionDate = now;
    if (transactionData.date) {
        if (typeof transactionData.date === 'number') {
            transactionDate = transactionData.date;
        } else if (typeof (transactionData.date as any).toMillis === 'function') {
            transactionDate = (transactionData.date as any).toMillis();
        } else if (transactionData.date instanceof Date) {
            transactionDate = (transactionData.date as Date).getTime();
        } else if (typeof transactionData.date === 'string') {
            // Handle ISO string from Gemini
            const parsed = new Date(transactionData.date);
            if (!isNaN(parsed.getTime())) {
                transactionDate = parsed.getTime();
            }
        }
    }

    // Determine default origin_type if not provided
    let originType = transactionData.origin_type;
    if (!originType) {
        originType = transactionData.type === 'income' ? 'receita_propria' : 'despesa_propria';
    }

    try {
        await setDoc(doc(db, 'transacoes_financeiras_focoflow', id), {
            uid: userId,
            'descricao': transactionData.description || '',
            'valor': transactionData.amount || 0,
            'tipo': transactionData.type || 'expense',
            'categoria': transactionData.category || 'Geral',
            origin_type: originType,
            'data': transactionDate,
            paymentMethod: transactionData.paymentMethod || 'money',
            sourceAccount: transactionData.sourceAccount || '',
            destinationAccount: transactionData.destinationAccount || '',
            relatedPerson: transactionData.relatedPerson || '',
            observations: transactionData.observations || '',
            impactsEquity: transactionData.impactsEquity !== undefined ? transactionData.impactsEquity : true,
            'criado_em': now,
            id: id
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const createFocoFlowReminder = async (userId: string, reminderData: any) => {
    const now = new Date();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `itens_focoflow/${id}`;
    
    let reminderTime = null;
    if (reminderData.dueDate) {
        const dateStr = reminderData.dueDate;
        // Handle HH:MM or HH:MM:SS format by assuming today's date
        if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(dateStr)) {
            const [hours, minutes, seconds] = dateStr.split(':').map(Number);
            const d = new Date();
            d.setHours(hours, minutes, seconds || 0, 0);
            
            // If the time has already passed today, set it for tomorrow
            if (d.getTime() < now.getTime()) {
                d.setDate(d.getDate() + 1);
            }
            reminderTime = d.getTime();
        } else {
            const parsedDate = new Date(dateStr);
            if (!isNaN(parsedDate.getTime())) {
                reminderTime = parsedDate.getTime();
            }
        }
    }

    try {
        await setDoc(doc(db, 'itens_focoflow', id), {
            'categoria': "reminder",
            'criado_em': now,
            id: id,
            reminderTime: reminderTime,
            'titulo': reminderData.title || "Lembrete",
            uid: userId
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const createFocoFlowLink = async (userId: string, linkData: any) => {
    const now = Date.now();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `itens_focoflow/${id}`;
    try {
        await setDoc(doc(db, 'itens_focoflow', id), {
            uid: userId,
            url: linkData.url || '',
            'titulo': linkData.title || '',
            'categoria': 'link',
            'criado_em': now,
            id: id
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const createFocoFlowYouTube = async (userId: string, youtubeData: any) => {
    const now = Date.now();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `itens_focoflow/${id}`;
    try {
        let customApiKey: string | undefined;
        try {
            const userDoc = await getDoc(doc(db, 'Usuarios', userId));
            customApiKey = userDoc.exists() ? userDoc.data()?.youtubeApiKey : undefined;
        } catch (err) {
            handleFirestoreError(err, OperationType.GET, `Usuarios/${userId}`);
        }

        let url = youtubeData.url;
        if (url && !url.startsWith('http')) {
            url = undefined;
        } else if (!url && youtubeData.title) {
            // YouTube search removed
        }

        const data: any = {
            uid: userId,
            'titulo': youtubeData.title || '',
            'categoria': 'youtube',
            'criado_em': now,
            id: id
        };
        if (url) {
            data.url = url;
        }
        await setDoc(doc(db, 'itens_focoflow', id), data);
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const createFocoFlowNote = async (userId: string, noteData: { text: string; category?: string }) => {
    const now = Date.now();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `itens_focoflow/${id}`;
    try {
        await setDoc(doc(db, 'itens_focoflow', id), {
            uid: userId,
            'titulo': noteData.text || '',
            'categoria': noteData.category || 'note',
            'criado_em': now,
            id: id
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const getFocoFlowData = async (userId: string, collectionName: string = 'itens_focoflow', limitCount: number = 20, category?: string | string[], status?: string) => {
    let q = query(
        collection(db, collectionName), 
        where('uid', '==', userId),
        limit(limitCount)
    );
    
    if (category) {
        if (Array.isArray(category)) {
            q = query(q, where('categoria', 'in', category));
        } else {
            q = query(q, where('categoria', '==', category));
        }
    }

    if (status) {
        q = query(q, where('status', '==', status));
    }
    
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, collectionName);
        return [];
    }
};

export const updateFocoFlowItem = async (id: string, data: any) => {
    const path = `itens_focoflow/${id}`;
    try {
        const itemRef = doc(db, 'itens_focoflow', id);
        await updateDoc(itemRef, {
            ...data,
            'atualizado_em': Date.now()
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
    }
};

export const deleteFocoFlowItem = async (id: string) => {
    const path = `itens_focoflow/${id}`;
    try {
        await deleteDoc(doc(db, 'itens_focoflow', id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};

export const updateFocoFlowTransaction = async (id: string, data: any) => {
    const path = `transacoes_financeiras_focoflow/${id}`;
    try {
        const transactionRef = doc(db, 'transacoes_financeiras_focoflow', id);
        await updateDoc(transactionRef, {
            ...data,
            'atualizado_em': Date.now()
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
    }
};

export const deleteFocoFlowTransaction = async (id: string) => {
    const path = `transacoes_financeiras_focoflow/${id}`;
    try {
        await deleteDoc(doc(db, 'transacoes_financeiras_focoflow', id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};

export const deleteFocoFlowAccount = async (id: string) => {
    const path = `contas_focoflow/${id}`;
    try {
        await deleteDoc(doc(db, 'contas_focoflow', id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};

export const deleteFocoFlowRecurring = async (id: string) => {
    const path = `recorrentes_focoflow/${id}`;
    try {
        await deleteDoc(doc(db, 'recorrentes_focoflow', id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};

export const deleteFocoFlowThirdParty = async (id: string) => {
    const path = `terceiros_focoflow/${id}`;
    try {
        await deleteDoc(doc(db, 'terceiros_focoflow', id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};

// --- Financial Goals ---

export const createFocoFlowFinancialGoal = async (userId: string, goalData: Partial<FocoFlowFinancialGoal>) => {
    const now = Date.now();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `metas_financeiras_focoflow/${id}`;
    try {
        await setDoc(doc(db, 'metas_financeiras_focoflow', id), {
            uid: userId,
            'titulo': goalData.titulo || '',
            'valor_alvo': goalData.valor_alvo || 0,
            'valor_atual': goalData.valor_atual || 0,
            'prazo': goalData.prazo || null,
            'categoria': goalData.categoria || 'Geral',
            'cor': goalData.cor || '#00f2ff',
            status: goalData.status || 'active',
            'criado_em': now,
            id: id
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const updateFocoFlowFinancialGoal = async (id: string, data: Partial<FocoFlowFinancialGoal>) => {
    const path = `metas_financeiras_focoflow/${id}`;
    try {
        const goalRef = doc(db, 'metas_financeiras_focoflow', id);
        await updateDoc(goalRef, {
            ...data,
            'atualizado_em': Date.now()
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
    }
};

export const deleteFocoFlowFinancialGoal = async (id: string) => {
    const path = `metas_financeiras_focoflow/${id}`;
    try {
        await deleteDoc(doc(db, 'metas_financeiras_focoflow', id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
};

// --- New Financial Operations ---

export const createFocoFlowAccount = async (userId: string, accountData: any) => {
    const now = Date.now();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `contas_focoflow/${id}`;
    try {
        await setDoc(doc(db, 'contas_focoflow', id), {
            uid: userId,
            'nome': accountData.name || '',
            'tipo': accountData.type || 'Corrente',
            bank: accountData.bank || '',
            balance: accountData.initialBalance || accountData.balance || 0,
            color: accountData.color || '#10b981',
            'criado_em': now,
            id: id
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const createFocoFlowRecurring = async (userId: string, recurringData: any) => {
    const now = Date.now();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `recorrentes_focoflow/${id}`;
    try {
        await setDoc(doc(db, 'recorrentes_focoflow', id), {
            uid: userId,
            'descricao': recurringData.description || '',
            'valor': recurringData.amount || 0,
            'tipo': recurringData.type || 'expense',
            frequency: recurringData.frequency || 'monthly',
            startDate: recurringData.startDate || now,
            nextDate: recurringData.nextDate || now,
            isActive: true,
            'criado_em': now,
            id: id
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const createFocoFlowThirdParty = async (userId: string, thirdPartyData: any) => {
    const now = Date.now();
    const id = Math.random().toString(36).substring(2, 10);
    const path = `terceiros_focoflow/${id}`;
    try {
        await setDoc(doc(db, 'terceiros_focoflow', id), {
            uid: userId,
            'nome': thirdPartyData.name || '',
            'tipo': thirdPartyData.type || 'other',
            email: thirdPartyData.email || '',
            phone: thirdPartyData.phone || '',
            document: thirdPartyData.document || '',
            contact: thirdPartyData.contact || '',
            balance: thirdPartyData.balance || 0,
            'criado_em': now,
            id: id
        });
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
    }
};

export const getFinancialSummary = async (userId: string) => {
    try {
        // Get all accounts to calculate real balance
        const accountsSnapshot = await getDocs(query(collection(db, 'contas_focoflow'), where('uid', '==', userId)));
        const accounts = accountsSnapshot.docs.map(d => d.data());
        const realBalance = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);

        // Get current month transactions
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

        const transactionsSnapshot = await getDocs(query(
            collection(db, 'transacoes_financeiras_focoflow'),
            where('uid', '==', userId),
            where('data', '>=', startOfMonth),
            where('data', '<=', endOfMonth)
        ));
        const transactions = transactionsSnapshot.docs.map(d => d.data());

        const income = transactions.filter(t => t.tipo === 'income').reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
        const expense = transactions.filter(t => t.tipo === 'expense').reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

        // Get pending transactions (A Receber / A Pagar)
        const pendingSnapshot = await getDocs(query(
            collection(db, 'transacoes_financeiras_focoflow'),
            where('uid', '==', userId),
            where('status', '==', 'pending')
        ));
        const pending = pendingSnapshot.docs.map(d => d.data());
        const toReceive = pending.filter(t => t.tipo === 'income').reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
        const toPay = pending.filter(t => t.tipo === 'expense').reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

        // Get third party balance
        const thirdPartiesSnapshot = await getDocs(query(collection(db, 'terceiros_focoflow'), where('uid', '==', userId)));
        const thirdPartiesBalance = thirdPartiesSnapshot.docs.reduce((acc, d) => acc + (Number(d.data().balance) || 0), 0);

        return {
            realBalance,
            income,
            expense,
            toReceive,
            toPay,
            thirdPartiesBalance
        };
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'financial_summary');
        return {
            realBalance: 0,
            income: 0,
            expense: 0,
            toReceive: 0,
            toPay: 0,
            thirdPartiesBalance: 0
        };
    }
};

export const getMonthlyFinancialReport = async (userId: string) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    const q = query(
        collection(db, 'transacoes_financeiras_focoflow'),
        where('uid', '==', userId),
        where('data', '>=', startOfMonth),
        where('data', '<=', endOfMonth)
    );

    try {
        const snapshot = await getDocs(q);
        const transactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as unknown as FocoFlowTransaction));

        let totalIncome = 0;
        let totalExpense = 0;
        const categoryBreakdown: { [key: string]: number } = {};

        transactions.forEach(t => {
            const amount = Number((t as any).valor) || Number((t as any).amount) || 0;
            const type = (t as any).tipo || (t as any).type;
            if (type === 'income') {
                totalIncome += amount;
            } else if (type === 'expense') {
                totalExpense += amount;
                const cat = (t as any).categoria || (t as any).category || 'Outros';
                categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amount;
            }
        });

        const balance = totalIncome - totalExpense;

        return {
            period: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            totalIncome,
            totalExpense,
            balance,
            categoryBreakdown: Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value })),
            transactionCount: transactions.length
        };
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'transacoes_financeiras_focoflow');
        return {
            period: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            categoryBreakdown: [],
            transactionCount: 0
        };
    }
};

export const getOperationalAnalysis = async (userId: string) => {
    try {
        const summary = await getFinancialSummary(userId);
        const report = await getMonthlyFinancialReport(userId);
        
        const income = summary.income;
        const expense = summary.expense;
        const balance = summary.realBalance;

        // 1. Taxa de Economia (Savings Rate)
        // (Income - Expense) / Income
        const savingsRate = income > 0 ? Math.max(0, Math.min(100, ((income - expense) / income) * 100)) : 0;

        // 2. Liquidez (Liquidity)
        // Measure of how many months of average expenses the current balance covers.
        // Goal: 6 months. 100% = 6 months coverage.
        const avgMonthlyExpense = expense || 1; // Fallback to 1 to avoid division by zero
        const liquidityMonths = balance / avgMonthlyExpense;
        const liquidityScore = Math.min(100, (liquidityMonths / 6) * 100);

        // 3. Eficiência Financeira (Financial Efficiency)
        // High if balance is growing and expense is low relative to income
        const efficiency = Math.min(100, (savingsRate * 0.7) + (liquidityScore * 0.3));

        // 4. Previsão de Câmbio (Exchange Forecast - Mocked or Real)
        // For now, let's use a stable-ish mock value that feels real
        const exchangeForecast = 85 + (Math.random() * 10); 

        // 5. Detect Inconsistencies
        const inconsistencies: string[] = [];
        
        if (balance < 0) {
            inconsistencies.push("Saldo negativo detectado. Risco de cheque especial.");
        }
        
        if (expense > income && income > 0) {
            inconsistencies.push("Despesas superaram as receitas no mês atual (Déficit operacional).");
        }

        // Check for suspicious transactions (e.g., outliers)
        const allTransactions = await getFocoFlowData(userId, 'transacoes_financeiras_focoflow', 100);
        const amounts = allTransactions.map(t => Math.abs((t as any).valor || 0));
        if (amounts.length > 5) {
            const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
            const outliers = amounts.filter(a => a > avg * 10);
            if (outliers.length > 0) {
                inconsistencies.push(`Detectadas ${outliers.length} transações com valores atípicos (outliers).`);
            }
        }

        return {
            metrics: [
                { label: 'Eficiência Financeira', value: Math.round(efficiency), color: '#00f2ff', status: efficiency > 70 ? 'OPTIMAL' : 'MONITORING' },
                { label: 'Margem de Lucro', value: Math.round(savingsRate), color: '#00ff9d', status: savingsRate > 25 ? 'RISING' : 'STABLE' },
                { label: 'Índice de Liquidez', value: Math.round(liquidityScore), color: '#8b5cf6', status: liquidityScore > 80 ? 'SECURE' : 'ADVISORY' },
                { label: 'Risco Operacional', value: Math.round(100 - efficiency), color: '#ff007f', status: efficiency > 60 ? 'CONTROLLED' : 'HIGH' },
            ],
            inconsistencies,
            details: {
                income,
                expense,
                balance: income - expense,
                savingsRate,
                liquidityMonths
            }
        };
    } catch (error) {
        console.error("Error in operational analysis:", error);
        return { metrics: [], inconsistencies: ["Erro ao processar análise operacional."] };
    }
};

export const getConversations = async (userId: string, limitCount: number = 50) => {
    const q = query(
        collection(db, 'conversas'),
        where('uid', '==', userId),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
    );
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        // Fallback for older conversations or if index isn't ready
        try {
            const qFallback = query(
                collection(db, 'conversas'),
                where('uid', '==', userId),
                limit(limitCount)
            );
            const snapshot = await getDocs(qFallback);
            return snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.updatedAt || 0) - (a.updatedAt || 0));
        } catch (e) {
            handleFirestoreError(error, OperationType.GET, 'conversas');
            return [];
        }
    }
};

export const getConversationMessages = async (conversationId: string, limitCount: number = 100) => {
    const q = query(
        collection(db, 'conversas', conversationId, 'mensagens'),
        orderBy('timestamp', 'asc'),
        limit(limitCount)
    );
    try {
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `conversas/${conversationId}/mensagens`);
        return [];
    }
};

