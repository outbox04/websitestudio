import type { LucideIcon } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Card, CardContent } from "@/components/ui/Card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  upcoming: string[];
}

export function PlaceholderPage({ title, description, icon: Icon, upcoming }: PlaceholderPageProps) {
  return (
    <div className="pb-10">
      <TopBar title={title} description={description} />

      <div className="px-8">
        <Card className="animate-fade-in">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-soft">
              <Icon className="h-7 w-7 text-indigo" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Đang được xây dựng</h2>
              <p className="mt-1 max-w-md text-sm text-ink-muted">
                Giao diện và logic cho module này sẽ được triển khai ở giai đoạn tiếp theo.
                Dưới đây là những gì module sẽ làm:
              </p>
            </div>
            <ul className="mt-2 flex max-w-md flex-col gap-2 text-left text-sm text-ink-muted">
              {upcoming.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gradient" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
