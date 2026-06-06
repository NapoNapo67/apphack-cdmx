const VERSION = 'v1.4.0'
const BUILD   = new Date().toISOString().slice(0,10).replace(/-/g,'')

export default function Footer({ projectName = 'SEDECO CDMX' }) {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="tricolor w-full" />
      <div className="flex items-center justify-between px-4 py-2 max-w-7xl mx-auto text-xs text-gray-400">
        <span>Gobierno de la Ciudad de México — {projectName} &copy; {new Date().getFullYear()}</span>
        <span
          className="font-mono px-2 py-0.5 rounded-full border text-xs"
          style={{ borderColor:'var(--gov-guinda)', color:'var(--gov-guinda)', background:'var(--gov-guinda-claro)' }}
          title={`Build ${BUILD}`}
        >
          {VERSION}
        </span>
      </div>
    </footer>
  )
}
