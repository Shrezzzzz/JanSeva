// Marker clustering is handled via a lightweight custom implementation
// since leaflet.markercluster has peer-dep issues with React 19.
// For production, replace with react-leaflet-cluster when React 19 is supported.
import type { Issue } from '../../types/issue.types';
import IssueMarker from './IssueMarker';

interface ClusterGroupProps {
  issues: Issue[];
  onSelect: (issue: Issue) => void;
}

export default function ClusterGroup({ issues, onSelect }: ClusterGroupProps) {
  return (
    <>
      {issues.map((issue) => (
        <IssueMarker key={issue.id} issue={issue} onClick={onSelect} />
      ))}
    </>
  );
}
