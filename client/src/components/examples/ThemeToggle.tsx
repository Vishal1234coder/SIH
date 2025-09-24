import ThemeToggle from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Theme Toggle</h3>
      <div className="flex items-center gap-4">
        <span>Toggle dark/light mode:</span>
        <ThemeToggle />
      </div>
      <p className="text-sm text-muted-foreground">
        Click the toggle to switch between light and dark themes. The preference is saved in localStorage.
      </p>
    </div>
  );
}