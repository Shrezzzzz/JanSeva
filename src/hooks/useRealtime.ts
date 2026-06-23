import { useEffect, useRef } from 'react';
import { useIssueStore } from '../store/issueStore';

/** Connects to SSE endpoint for live issue status updates */
export function useRealtime(issueId?: string) {
  const { updateIssue } = useIssueStore();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!issueId) return;
    const url = `/api/issues/${issueId}/events`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        updateIssue(issueId, data);
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, [issueId, updateIssue]);
}

/** Global SSE stream for new issues being reported nearby */
export function useGlobalRealtime() {
  const { addIssue } = useIssueStore();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/events');
    esRef.current = es;

    es.addEventListener('new_issue', (evt) => {
      try {
        const issue = JSON.parse((evt as MessageEvent).data);
        addIssue(issue);
      } catch { /* ignore */ }
    });

    es.onerror = () => es.close();
    return () => es.close();
  }, [addIssue]);
}
