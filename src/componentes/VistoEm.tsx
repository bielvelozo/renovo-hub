export function VistoEm({ hora }: { hora: string | null }) {
  if (!hora) return null
  return <p className="dica visto-em">visto às {hora}</p>
}
