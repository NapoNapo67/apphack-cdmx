export default function Footer({ projectName = 'AppHack' }) {
  return (
    <footer className="bg-white border-t border-gov-gris-medio mt-auto">
      <div className="tricolor w-full" />
      <div className="text-center py-3 text-xs text-gray-500">
        Gobierno de la Ciudad de México — {projectName} &copy; {new Date().getFullYear()}
      </div>
    </footer>
  )
}
