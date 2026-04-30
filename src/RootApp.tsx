import React from 'react';
import App from '../App';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { FinancialProvider } from './context/FinancialContext';

interface RootAppProps {
  user: User;
  initialUserData: Partial<UserProfile>;
  onApplyTheme?: (theme: string | undefined, customColor: string | undefined) => void;
}

const RootApp: React.FC<RootAppProps> = (props) => {
  return (
    <FinancialProvider>
      <div className="w-full h-full">
        <App {...props} />
      </div>
    </FinancialProvider>
  );
};

export default RootApp;
