import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";
import { StatusBadge } from "@/components/ui/status-badge";

interface AdminPlaceholderProps {
  title: string;
  description: string;
}

export function AdminPlaceholder({ title, description }: AdminPlaceholderProps) {
  return (
    <SectionWrapper className="py-10">
      <Container>
        <div className="surface-panel p-7">
          <StatusBadge tone="service">Admin Module</StatusBadge>
          <h1 className="mt-4 text-2xl font-semibold text-graphite">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm text-graphite/75">{description}</p>
        </div>
      </Container>
    </SectionWrapper>
  );
}
