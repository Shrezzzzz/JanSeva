export default function GradientOverlay() {
  return (
    <>
      {/* top fade */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white via-white/60 to-transparent z-10 pointer-events-none" />
      {/* bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white via-white/60 to-transparent z-10 pointer-events-none" />
      {/* sides */}
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white/40 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white/40 to-transparent z-10 pointer-events-none" />
    </>
  );
}
