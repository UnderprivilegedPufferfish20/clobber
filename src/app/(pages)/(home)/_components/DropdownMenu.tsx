import { ReactNode } from "react";

const DropdownMenu = ({ title, children, isOpen, onToggle }: { title: string, children: ReactNode, isOpen: boolean, onToggle: any }) => {
  return (
    <div className="relative z-50">
      <button
        className="hover:text-indigo-300 transition-colors py-2 px-1 flex items-center"
        onMouseEnter={onToggle}
        onMouseLeave={() => {}}
      >
        {title}
      </button>
      <div
        className={`absolute top-full left-0 w-80 bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 transition-all duration-300 transform origin-top ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-2'
            : 'opacity-0 scale-95 translate-y-0 pointer-events-none'
        }`}
        onMouseEnter={onToggle}
        onMouseLeave={() => setTimeout(() => onToggle(false), 100)}
      >
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DropdownMenu;