export function FormMessage({ state }: { state: { error?: string; message?: string } | null }) {
  if (!state) return null;
  if (state.error)
    return (
      <p role="alert" className="rounded-[10px] bg-[#F6E3E3] px-3 py-2.5 text-sm text-[#9B1C1C]">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="rounded-[10px] bg-primary-soft px-3 py-2.5 text-sm text-primary">
        {state.message}
      </p>
    );
  return null;
}
