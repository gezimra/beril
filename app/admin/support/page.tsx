import {
  createSupportMessageAction,
  createSupportThreadAction,
  queueNotificationJobAction,
  updateSupportThreadStatusAction,
  upsertNotificationTemplateAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminNotificationJobs,
  listAdminNotificationTemplates,
  listAdminSupportMessages,
  listAdminSupportThreads,
} from "@/lib/db/crm-support";
import {
  automationTriggers,
  notificationChannels,
  supportChannels,
  supportThreadStatuses,
} from "@/types/domain";

type AdminSupportPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }
  return value ?? fallback;
}

export default async function AdminSupportPage({
  searchParams,
}: AdminSupportPageProps) {
  const query = await searchParams;
  const search = getQueryParam(query.search);
  const status = getQueryParam(query.status);
  const selectedThreadId = getQueryParam(query.threadId);

  const [threads, templates, jobs] = await Promise.all([
    listAdminSupportThreads({ search, status }),
    listAdminNotificationTemplates(),
    listAdminNotificationJobs(),
  ]);

  const activeThreadId = selectedThreadId || threads[0]?.id || "";
  const activeThreadMessages = activeThreadId
    ? await listAdminSupportMessages(activeThreadId)
    : [];

  return (
    <Container className="space-y-6">
      <header className="surface-panel p-6">
        <StatusBadge tone="service">Support & CRM</StatusBadge>
        <h1 className="mt-3 text-4xl text-graphite">Support Threads and Automations</h1>
        <p className="mt-2 text-sm text-graphite/74">
          Handle live chat conversations and queue customer notifications.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="space-y-4">
          <form method="get" className="surface-panel grid gap-3 p-4 sm:grid-cols-[1fr_13rem_auto]">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search support subject"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {supportThreadStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
            >
              Apply
            </button>
          </form>

          <form action={createSupportThreadAction} className="surface-panel space-y-2 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Create Thread</p>
            <input
              name="subject"
              required
              placeholder="Subject"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <textarea
              name="message"
              rows={3}
              required
              placeholder="First message"
              className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                name="channel"
                defaultValue="web_chat"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              >
                {supportChannels.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                name="customerName"
                placeholder="Customer name"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                name="customerEmail"
                type="email"
                placeholder="Email"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="customerPhone"
                placeholder="Phone"
                className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
            >
              Save Thread
            </button>
          </form>

          <div className="surface-panel space-y-2 p-4">
            <h2 className="text-2xl text-graphite">Threads</h2>
            {threads.length === 0 ? (
              <p className="text-sm text-graphite/72">No support threads.</p>
            ) : (
              threads.map((thread) => (
                <article
                  key={thread.id}
                  className="rounded-lg border border-graphite/10 bg-white/75 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`/admin/support?threadId=${thread.id}`}
                      className="text-sm font-medium text-graphite underline"
                    >
                      {thread.subject}
                    </a>
                    <span className="text-xs uppercase tracking-[0.1em] text-graphite/65">
                      {thread.status}
                    </span>
                  </div>
                  <p className="text-xs text-graphite/62">{thread.channel}</p>

                  <form action={updateSupportThreadStatusAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="threadId" value={thread.id} />
                    <select
                      name="status"
                      defaultValue={thread.status}
                      className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-xs"
                    >
                      {supportThreadStatuses.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white px-3 text-[0.65rem] uppercase tracking-[0.1em] text-graphite"
                    >
                      Save
                    </button>
                  </form>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4">
          <article className="surface-panel space-y-3 p-4">
            <h2 className="text-2xl text-graphite">Thread Messages</h2>
            {!activeThreadId ? (
              <p className="text-sm text-graphite/72">Select a thread.</p>
            ) : (
              <>
                <ul className="max-h-72 space-y-2 overflow-y-auto">
                  {activeThreadMessages.length === 0 ? (
                    <li className="text-sm text-graphite/72">No messages yet.</li>
                  ) : (
                    activeThreadMessages.map((message) => (
                      <li
                        key={message.id}
                        className="rounded-lg border border-graphite/10 bg-white/80 px-3 py-2 text-sm"
                      >
                        <p className="text-xs uppercase tracking-[0.1em] text-graphite/62">
                          {message.direction}
                        </p>
                        <p className="mt-1 text-graphite/84">{message.message}</p>
                      </li>
                    ))
                  )}
                </ul>
                <form action={createSupportMessageAction} className="space-y-2">
                  <input type="hidden" name="threadId" value={activeThreadId} />
                  <input type="hidden" name="direction" value="outbound" />
                  <textarea
                    name="message"
                    rows={3}
                    required
                    placeholder="Reply to customer"
                    className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center rounded-full bg-walnut px-4 text-xs uppercase tracking-[0.12em] text-white"
                  >
                    Send Reply
                  </button>
                </form>
              </>
            )}
          </article>

          <article className="surface-panel space-y-3 p-4">
            <h2 className="text-2xl text-graphite">Notification Templates</h2>
            <form action={upsertNotificationTemplateAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
              <input
                name="key"
                required
                placeholder="order_created_email"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="title"
                required
                placeholder="Order Created Email"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  name="channel"
                  defaultValue="email"
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  {notificationChannels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  name="trigger"
                  defaultValue="order_created"
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  {automationTriggers.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                name="body"
                rows={3}
                required
                placeholder="Template body"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-graphite/74">
                <input type="checkbox" name="isActive" defaultChecked />
                Active
              </label>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-full border border-graphite/18 bg-white px-4 text-xs uppercase tracking-[0.12em] text-graphite"
              >
                Save Template
              </button>
            </form>

            <ul className="space-y-2">
              {templates.slice(0, 6).map((template) => (
                <li
                  key={template.id}
                  className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2 text-sm"
                >
                  <p className="font-medium text-graphite">{template.title}</p>
                  <p className="text-xs text-graphite/62">
                    {template.key} | {template.channel} | {template.trigger}
                  </p>
                </li>
              ))}
            </ul>
          </article>

          <article className="surface-panel space-y-3 p-4">
            <h2 className="text-2xl text-graphite">Queue Notification Job</h2>
            <form action={queueNotificationJobAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
              <input
                name="customerProfileId"
                placeholder="Customer profile ID (optional)"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <input
                name="templateId"
                placeholder="Template ID (optional)"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  name="channel"
                  defaultValue="email"
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  {notificationChannels.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select
                  name="trigger"
                  defaultValue="order_created"
                  className="rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
                >
                  {automationTriggers.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <input
                name="scheduledFor"
                type="datetime-local"
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 text-sm"
              />
              <textarea
                name="payloadJson"
                rows={2}
                placeholder='{"orderCode":"BRL-O-2026-00001"}'
                className="w-full rounded-lg border border-graphite/18 bg-white/85 px-3 py-2 font-mono text-xs"
              />
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-full bg-mineral px-4 text-xs uppercase tracking-[0.12em] text-white"
              >
                Queue Job
              </button>
            </form>

            <ul className="space-y-2">
              {jobs.slice(0, 6).map((job) => (
                <li
                  key={job.id}
                  className="rounded-lg border border-graphite/10 bg-white/75 px-3 py-2 text-sm"
                >
                  <p className="font-medium text-graphite">{job.channel}</p>
                  <p className="text-xs text-graphite/62">
                    {job.trigger} | {job.status}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </Container>
  );
}

