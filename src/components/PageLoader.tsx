import LoadingSpinner from "./LoadingSpinner";

interface PageLoaderProps {
  text?: string;
}

export default function PageLoader({ text = "Cargando..." }: PageLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{text}</p>
      </div>
    </div>
  );
}
