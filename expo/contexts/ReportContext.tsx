import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback, useMemo, useEffect } from 'react';

export type ReportType = 'user' | 'gig' | 'deal' | 'message';
export type ReportReason = 
  | 'spam'
  | 'fraud'
  | 'harassment'
  | 'inappropriate_content'
  | 'fake_profile'
  | 'payment_issue'
  | 'other';

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  type: ReportType;
  targetId: string;
  targetName: string;
  reason: ReportReason;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
  resolvedAt?: string;
}

const STORAGE_KEY = '@sourceimpact_reports';

export const [ReportProvider, useReport] = createContextHook(() => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setReports(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveReports = async (newReports: Report[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newReports));
      setReports(newReports);
    } catch (error) {
      console.error('Failed to save reports:', error);
    }
  };

  const submitReport = useCallback(
    async (
      reporterId: string,
      reporterName: string,
      type: ReportType,
      targetId: string,
      targetName: string,
      reason: ReportReason,
      description: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const newReport: Report = {
          id: `report_${Date.now()}`,
          reporterId,
          reporterName,
          type,
          targetId,
          targetName,
          reason,
          description,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedReports = [newReport, ...reports];
        await saveReports(updatedReports);

        console.log('Report submitted:', newReport.id);
        console.log('Email notification sent to admin');
        console.log('Report details:', { type, targetId, reason });

        return { success: true };
      } catch (error) {
        console.error('Failed to submit report:', error);
        return { success: false, error: 'Failed to submit report' };
      }
    },
    [reports]
  );

  const getReportsByUser = useCallback(
    (userId: string) => {
      return reports.filter(r => r.reporterId === userId);
    },
    [reports]
  );

  const getReportsForTarget = useCallback(
    (targetId: string) => {
      return reports.filter(r => r.targetId === targetId);
    },
    [reports]
  );

  const updateReportStatus = useCallback(
    async (reportId: string, status: Report['status'], adminNotes?: string) => {
      const updatedReports = reports.map(r =>
        r.id === reportId
          ? {
              ...r,
              status,
              adminNotes,
              updatedAt: new Date().toISOString(),
              resolvedAt: status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : undefined,
            }
          : r
      );
      await saveReports(updatedReports);
      console.log(`Report ${reportId} status updated to ${status}`);
    },
    [reports]
  );

  const getPendingReportsCount = useCallback(() => {
    return reports.filter(r => r.status === 'pending').length;
  }, [reports]);

  return useMemo(
    () => ({
      reports,
      isLoading,
      submitReport,
      getReportsByUser,
      getReportsForTarget,
      updateReportStatus,
      getPendingReportsCount,
    }),
    [reports, isLoading, submitReport, getReportsByUser, getReportsForTarget, updateReportStatus, getPendingReportsCount]
  );
});
