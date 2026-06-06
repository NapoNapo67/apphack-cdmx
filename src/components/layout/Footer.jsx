export default function Footer({ projectName = 'SEDECO CDMX' }) {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="tricolor w-full" />
      <div className="text-center py-3 text-xs text-gray-400">
        Gobierno de la Ciudad de México — {projectName} &copy; {new Date().getFullYear()}
      </div>
    </footer>
  )
}
