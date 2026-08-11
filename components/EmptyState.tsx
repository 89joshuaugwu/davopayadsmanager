import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-full bg-davo-blue/10 flex items-center justify-center mb-4">
        <Icon size={24} className="text-davo-blue" />
      </div>
      <h3 className="text-base font-semibold text-davo-navy mb-1.5">{title}</h3>
      <p className="text-sm text-davo-muted max-w-xs mb-5">{description}</p>
      {action}
    </div>
  );
}
