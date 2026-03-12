import {
  createSupportMessageAction,
  createSupportThreadAction,
  queueNotificationJobAction,
  updateSupportThreadStatusAction,
  upsertNotificationTemplateAction,
} from "@/app/admin/actions";
import { Container } from "@/components/layout/container";
import { FloatInput, FloatSelect, FloatTextarea } from "@/components/ui/float-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  listAdminNotificationJobs,
  listAdminNotificationTemplates,
  listAdminSupportMessages,
  listAdminSupportThreads,
} from "@/lib/db/crm-support";
import { formatStatusLabel } from "@/lib/utils/status-label";
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
            <FloatInput
              name="search"
              defaultValue={search}
              label="Search support subject"
            />
            <FloatSelect
              name="status"
              defaultValue={status}
              label="Status"
            >
              <option value="">All statuses</option>
              {supportThreadStatuses.map((item) => (
                <option key={item} value={item}>
                  {formatStatusLabel(item)}
                </option>
              ))}
            </FloatSelect>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full bg-walnut px-5 text-xs uppercase tracking-[0.12em] text-white"
            >
              Apply
            </button>
          </form>

          <form action={createSupportThreadAction} className="surface-panel space-y-2 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-graphite/62">Create Thread</p>
            <FloatInput
              name="subject"
              required
              label="Subject"
            />
            <FloatTextarea
              name="message"
              rows={3}
              required
              label="First message"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatSelect
                name="channel"
                defaultValue="web_chat"
                label="Channel"
              >
                {supportChannels.map((item) => (
                  <option key={item} value={item}>
                    {formatStatusLabel(item)}
                  </option>
                ))}
              </FloatSelect>
              <FloatInput
                name="customerName"
                label="Customer name"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <FloatInput
                name="customerEmail"
                type="email"
                label="Email"
              />
              <PhoneInput
                name="customerPhone"
                label="Phone"
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
                      {formatStatusLabel(thread.status)}
                    </span>
                  </div>
                  <p className="text-xs text-graphite/62">
                    {formatStatusLabel(thread.channel)}
                  </p>

                  <form action={updateSupportThreadStatusAction} className="mt-2 flex gap-2">
                    <input type="hidden" name="threadId" value={thread.id} />
                    <FloatSelect
                      name="status"
                      defaultValue={thread.status}
                      label="Status"
                      wrapperClassName="w-full"
                    >
                      {supportThreadStatuses.map((item) => (
                        <option key={item} value={item}>
                          {formatStatusLabel(item)}
                        </option>
                      ))}
                    </FloatSelect>
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
                          {formatStatusLabel(message.direction)}
                        </p>
                        <p className="mt-1 text-graphite/84">{message.message}</p>
                      </li>
                    ))
                  )}
                </ul>
                <form action={createSupportMessageAction} className="space-y-2">
                  <input type="hidden" name="threadId" value={activeThreadId} />
                  <input type="hidden" name="direction" value="outbound" />
                  <FloatTextarea
                    name="message"
                    rows={3}
                    required
                    label="Reply to customer"
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
              <FloatInput
                name="key"
                required
                label="Template key"
              />
              <FloatInput
                name="title"
                required
                label="Template title"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <FloatSelect
                  name="channel"
                  defaultValue="email"
                  label="Channel"
                >
                  {notificationChannels.map((item) => (
                    <option key={item} value={item}>
                      {formatStatusLabel(item)}
                    </option>
                  ))}
                </FloatSelect>
                <FloatSelect
                  name="trigger"
                  defaultValue="order_created"
                  label="Trigger"
                >
                  {automationTriggers.map((item) => (
                    <option key={item} value={item}>
                      {formatStatusLabel(item)}
                    </option>
                  ))}
                </FloatSelect>
              </div>
              <FloatTextarea
                name="body"
                rows={3}
                required
                label="Template body"
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
                    {template.key} | {formatStatusLabel(template.channel)} | {formatStatusLabel(template.trigger)}
                  </p>
                </li>
              ))}
            </ul>
          </article>

          <article className="surface-panel space-y-3 p-4">
            <h2 className="text-2xl text-graphite">Queue Notification Job</h2>
            <form action={queueNotificationJobAction} className="space-y-2 rounded-lg border border-graphite/12 bg-white/70 p-3">
              <FloatInput
                name="customerProfileId"
                label="Customer profile ID (optional)"
              />
              <FloatInput
                name="templateId"
                label="Template ID (optional)"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <FloatSelect
                  name="channel"
                  defaultValue="email"
                  label="Channel"
                >
                  {notificationChannels.map((item) => (
                    <option key={item} value={item}>
                      {formatStatusLabel(item)}
                    </option>
                  ))}
                </FloatSelect>
                <FloatSelect
                  name="trigger"
                  defaultValue="order_created"
                  label="Trigger"
                >
                  {automationTriggers.map((item) => (
                    <option key={item} value={item}>
                      {formatStatusLabel(item)}
                    </option>
                  ))}
                </FloatSelect>
              </div>
              <FloatInput
                name="scheduledFor"
                type="datetime-local"
                label="Scheduled for"
              />
              <FloatTextarea
                name="payloadJson"
                rows={2}
                label="Payload JSON"
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
                  <p className="font-medium text-graphite">{formatStatusLabel(job.channel)}</p>
                  <p className="text-xs text-graphite/62">
                    {formatStatusLabel(job.trigger)} | {formatStatusLabel(job.status)}
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
