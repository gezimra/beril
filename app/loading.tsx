import { Container } from "@/components/layout/container";
import { SectionWrapper } from "@/components/layout/section-wrapper";

export default function GlobalLoading() {
  return (
    <SectionWrapper className="py-24">
      <Container>
        <div className="surface-panel mx-auto max-w-3xl animate-pulse p-8">
          <div className="h-3 w-36 rounded-full bg-graphite/10" />
          <div className="mt-4 h-10 w-4/5 rounded-xl bg-graphite/10" />
          <div className="mt-6 h-4 w-full rounded-full bg-graphite/8" />
          <div className="mt-3 h-4 w-11/12 rounded-full bg-graphite/8" />
          <div className="mt-3 h-4 w-9/12 rounded-full bg-graphite/8" />
        </div>
      </Container>
    </SectionWrapper>
  );
}
