import { FrontDeskIntakeSection } from "@/components/admin/front-desk-intake-section";
import { FrontDeskOrderCards, FrontDeskRepairCards } from "@/components/admin/front-desk-recent-cards";
import { StatusBadge } from "@/components/ui/status-badge";
import { listAdminOrders, listAdminProducts, listAdminRepairs } from "@/lib/db/admin";

type AdminFrontDeskPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminFrontDeskPage({ searchParams }: AdminFrontDeskPageProps) {
  const query = await searchParams;

  const intakeParam = query.intake;
  const intakeValue = Array.isArray(intakeParam) ? intakeParam[0] : intakeParam;
  const initialTab = intakeValue === "service" ? "service" : "order";

  const successParam = Array.isArray(query.success) ? query.success[0] : query.success;
  const successType =
    successParam === "order" ? "order" : successParam === "service" ? "service" : null;

  const [recentOrders, recentRepairs, activeProducts] = await Promise.all([
    listAdminOrders(),
    listAdminRepairs(),
    listAdminProducts({ status: "active" }),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = recentOrders.filter((o) => o.createdAt.startsWith(today)).length;
  const todayRepairs = recentRepairs.filter((r) => r.createdAt.startsWith(today)).length;

  return (
    <div className="min-w-0 max-w-[96rem] space-y-3 sm:space-y-5 lg:space-y-6">
      <header className="surface-panel flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
        <StatusBadge tone="service">Front Desk</StatusBadge>
        <h1 className="text-xl font-medium text-graphite sm:text-2xl">In-Store Intake</h1>
      </header>

      <FrontDeskIntakeSection
        activeProducts={activeProducts.map((p) => ({
          id: p.id,
          brand: p.brand,
          title: p.title,
          price: p.price,
        }))}
        initialTab={initialTab}
        successType={successType}
      />

      <section className="grid gap-3 sm:gap-5 xl:grid-cols-2">
        <article className="surface-panel p-3.5 sm:p-4 lg:p-5">
          <h2 className="text-xl font-medium text-graphite">Recent Orders</h2>
          <FrontDeskOrderCards orders={recentOrders} todayCount={todayOrders} />
        </article>

        <article className="surface-panel p-3.5 sm:p-4 lg:p-5">
          <h2 className="text-xl font-medium text-graphite">Recent Repairs</h2>
          <FrontDeskRepairCards repairs={recentRepairs} todayCount={todayRepairs} />
        </article>
      </section>
    </div>
  );
}
