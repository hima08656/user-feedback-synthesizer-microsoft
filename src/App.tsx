import React, { useState, useEffect } from 'react';
import { Navigation, NavTab } from './components/Navigation';
import { TopBar } from './components/TopBar';
import { ToastContainer, ToastMessage } from './components/Toast';
import { DashboardView } from './components/DashboardView';
import { AddFeedbackView } from './components/AddFeedbackView';
import { EmergingIssuesView } from './components/EmergingIssuesView';
import { TimelineView } from './components/TimelineView';
import { ProductChangesView } from './components/ProductChangesView';
import { TimeMachineView } from './components/TimeMachineView';
import { AskProductMemoryView } from './components/AskProductMemoryView';
import { MemoryExplorerView } from './components/MemoryExplorerView';
import { api } from './api';
import { FeedbackItem } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [bankFactCount, setBankFactCount] = useState<number>(134);
  const [totalFeedback, setTotalFeedback] = useState<number>(42);
  const [isReseeding, setIsReseeding] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Cross-view navigation context
  const [selectedFeedbackIdForExplorer, setSelectedFeedbackIdForExplorer] = useState<string | null>(null);
  const [selectedChangeIdForTimeMachine, setSelectedChangeIdForTimeMachine] = useState<string | null>(null);

  const addToast = (type: 'success' | 'warning' | 'error', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshSystemStats = async () => {
    try {
      const health = await api.getHealth();
      if (health.hindsight?.factCount !== undefined) {
        setBankFactCount(health.hindsight.factCount);
      }
      if (health.database?.feedbackCount !== undefined) {
        setTotalFeedback(health.database.feedbackCount);
      }
    } catch (err) {
      console.error('Error refreshing system stats:', err);
    }
  };

  useEffect(() => {
    refreshSystemStats();
  }, [currentTab]);

  const handleReseed = async () => {
    try {
      setIsReseeding(true);
      await api.reseedData();
      await refreshSystemStats();
      addToast('success', 'Demo Data Reset', 'Successfully restored 42 multi-channel feedback records and 3 product changes.');
      setCurrentTab('dashboard');
    } catch (err: any) {
      addToast('error', 'Reset Failed', err.message || 'Could not reset dataset');
    } finally {
      setIsReseeding(false);
    }
  };

  const handleFeedbackAdded = (item: FeedbackItem) => {
    setTotalFeedback((prev) => prev + 1);
    setBankFactCount((prev) => prev + 1);
    addToast(
      'success',
      'Feedback Ingested & Retained',
      `${item.id} (${item.feature}) saved to SQLite and committed to Hindsight Long-Term Memory.`
    );
  };

  const handleNavigateToExplorerWithFeedback = (id: string) => {
    setSelectedFeedbackIdForExplorer(id);
    setCurrentTab('explorer');
  };

  const handleNavigateToTimeMachineWithChange = (changeId: string) => {
    setSelectedChangeIdForTimeMachine(changeId);
    setCurrentTab('time-machine');
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'explorer') setSelectedFeedbackIdForExplorer(null);
          if (tab !== 'time-machine') setSelectedChangeIdForTimeMachine(null);
          setCurrentTab(tab);
        }}
        bankFactCount={bankFactCount}
        totalFeedback={totalFeedback}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <TopBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onReseed={handleReseed}
          isReseeding={isReseeding}
        />

        <main className="flex-1 overflow-y-auto bg-[#090d16]">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              onSelectFeedbackForExplorer={handleNavigateToExplorerWithFeedback}
            />
          )}

          {currentTab === 'add-feedback' && (
            <AddFeedbackView
              onFeedbackAdded={handleFeedbackAdded}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'emerging-issues' && (
            <EmergingIssuesView
              onNavigate={setCurrentTab}
              onSelectFeedbackForExplorer={handleNavigateToExplorerWithFeedback}
            />
          )}

          {currentTab === 'timeline' && (
            <TimelineView
              onNavigate={setCurrentTab}
              onSelectFeedbackForExplorer={handleNavigateToExplorerWithFeedback}
            />
          )}

          {currentTab === 'product-changes' && (
            <ProductChangesView
              onNavigateToTimeMachine={handleNavigateToTimeMachineWithChange}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'time-machine' && (
            <TimeMachineView
              initialChangeId={selectedChangeIdForTimeMachine}
              onNavigate={setCurrentTab}
              onSelectFeedbackForExplorer={handleNavigateToExplorerWithFeedback}
            />
          )}

          {currentTab === 'ask' && (
            <AskProductMemoryView
              onNavigate={setCurrentTab}
              onSelectFeedbackForExplorer={handleNavigateToExplorerWithFeedback}
            />
          )}

          {currentTab === 'explorer' && (
            <MemoryExplorerView
              initialFeedbackId={selectedFeedbackIdForExplorer}
              onNavigate={setCurrentTab}
            />
          )}
        </main>
      </div>

      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
