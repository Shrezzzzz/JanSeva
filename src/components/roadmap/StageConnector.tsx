interface StageConnectorProps {
  completed: boolean;
  progress?: number; // 0–1
}

export default function StageConnector({ completed, progress = 0 }: StageConnectorProps) {
  return (
    <div className="flex-1 h-1 rounded-full bg-[#E5E5E0] relative overflow-hidden mx-2">
      <div
        className="absolute inset-y-0 left-0 bg-[#1A6B3C] rounded-full transition-all duration-700"
        style={{ width: completed ? '100%' : `${progress * 100}%` }}
      />
    </div>
  );
}
