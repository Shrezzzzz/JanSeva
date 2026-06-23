import { useCallback, useEffect } from 'react';
import { fetchIssues } from '../services/issueService';
import { useIssueStore } from '../store/issueStore';

export function useIssues(autoLoad = true) {
  const { filters, page, setIssues, appendIssues, setPage, setTotalPages, setLoading, setError, isLoading, error, issues, totalPages } = useIssueStore();

  const load = useCallback(async (reset = false) => {
    setLoading(true); setError(null);
    try {
      const currentPage = reset ? 1 : page;
      const res = await fetchIssues(filters, currentPage);
      if (reset || currentPage === 1) {
        setIssues(res.data);
      } else {
        appendIssues(res.data);
      }
      setTotalPages(res.pagination.totalPages);
      if (reset) setPage(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters, page, setIssues, appendIssues, setPage, setTotalPages, setLoading, setError]);

  const loadMore = useCallback(() => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }, [page, totalPages, setPage]);

  useEffect(() => { if (autoLoad) load(true); }, [filters, autoLoad]); // eslint-disable-line
  useEffect(() => { if (page > 1) load(); }, [page]); // eslint-disable-line

  return { issues, isLoading, error, load, loadMore, hasMore: page < totalPages };
}
