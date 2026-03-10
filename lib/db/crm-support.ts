import { createSupabaseServiceClient } from "@/lib/db/supabase/service";
import { normalizeEmail, normalizePhone } from "@/lib/utils/codes";
import type {
  AdminNotificationJob,
  AdminNotificationTemplate,
  AdminSupportMessage,
  AdminSupportThread,
} from "@/types/admin";
import type {
  AutomationTrigger,
  NotificationChannel,
  NotificationStatus,
  SupportChannel,
  SupportMessageDirection,
  SupportThreadStatus,
} from "@/types/domain";

interface ListFilterParams {
  search?: string;
  status?: string;
}

interface CreateSupportThreadInput {
  subject: string;
  message: string;
  channel: SupportChannel;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
}

interface CreateSupportMessageInput {
  threadId: string;
  direction: SupportMessageDirection;
  message: string;
  senderName?: string | null;
  senderEmail?: string | null;
  senderPhone?: string | null;
}

interface UpsertNotificationTemplateInput {
  id?: string;
  key: string;
  title: string;
  channel: NotificationChannel;
  trigger: AutomationTrigger;
  body: string;
  isActive: boolean;
}

const fallbackThreads: AdminSupportThread[] = [];
const fallbackMessages: AdminSupportMessage[] = [];
const fallbackTemplates: AdminNotificationTemplate[] = [];
const fallbackJobs: AdminNotificationJob[] = [];

const nowIso = () => new Date().toISOString();

function includesSearch(source: string, search?: string) {
  if (!search) {
    return true;
  }

  return source.toLowerCase().includes(search.toLowerCase());
}

export async function ensureCustomerProfile(input: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  defaultCountry?: string | null;
  defaultCity?: string | null;
  defaultAddress?: string | null;
}) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return null;
  }

  const normalizedEmail = input.email ? normalizeEmail(input.email) : null;
  const normalizedPhone = input.phone ? normalizePhone(input.phone) : null;

  if (!normalizedEmail && !normalizedPhone) {
    return null;
  }

  let customerKey = "";
  if (normalizedEmail) {
    customerKey = `email:${normalizedEmail}`;
  } else if (normalizedPhone) {
    customerKey = `phone:${normalizedPhone}`;
  }

  const { data: existing } = await serviceClient
    .from("customer_profiles")
    .select("id")
    .eq("customer_key", customerKey)
    .maybeSingle();

  if (existing?.id) {
    const { error: updateError } = await serviceClient
      .from("customer_profiles")
      .update({
        name: input.name ?? null,
        email: input.email ?? null,
        email_normalized: normalizedEmail,
        phone: input.phone ?? null,
        phone_normalized: normalizedPhone,
        default_country: input.defaultCountry ?? "Kosovo",
        default_city: input.defaultCity ?? null,
        default_address: input.defaultAddress ?? null,
      })
      .eq("id", existing.id as string);

    if (updateError) {
      throw new Error(updateError.message);
    }
    return existing.id as string;
  }

  const { data, error } = await serviceClient
    .from("customer_profiles")
    .insert({
      customer_key: customerKey,
      name: input.name ?? null,
      email: input.email ?? null,
      email_normalized: normalizedEmail,
      phone: input.phone ?? null,
      phone_normalized: normalizedPhone,
      default_country: input.defaultCountry ?? "Kosovo",
      default_city: input.defaultCity ?? null,
      default_address: input.defaultAddress ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create customer profile.");
  }

  return data.id as string;
}

export async function addCustomerActivity(input: {
  customerProfileId: string;
  activityType: string;
  referenceType?: string | null;
  referenceId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return;
  }

  const { error } = await serviceClient.from("customer_activity_timeline").insert({
    customer_profile_id: input.customerProfileId,
    activity_type: input.activityType,
    reference_type: input.referenceType ?? null,
    reference_id: input.referenceId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function incrementCustomerOrderStats(input: {
  customerProfileId: string;
  orderTotal: number;
}) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return;
  }

  const { data, error } = await serviceClient
    .from("customer_profiles")
    .select("total_orders, lifetime_value")
    .eq("id", input.customerProfileId)
    .single();

  if (error || !data) {
    return;
  }

  const { error: updateError } = await serviceClient
    .from("customer_profiles")
    .update({
      total_orders: Number(data.total_orders ?? 0) + 1,
      lifetime_value: Number(data.lifetime_value ?? 0) + input.orderTotal,
    })
    .eq("id", input.customerProfileId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function incrementCustomerRepairStats(customerProfileId: string) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return;
  }

  const { data, error } = await serviceClient
    .from("customer_profiles")
    .select("total_repairs")
    .eq("id", customerProfileId)
    .single();

  if (error || !data) {
    return;
  }

  const { error: updateError } = await serviceClient
    .from("customer_profiles")
    .update({ total_repairs: Number(data.total_repairs ?? 0) + 1 })
    .eq("id", customerProfileId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function listAdminSupportThreads({
  search,
  status,
}: ListFilterParams = {}): Promise<AdminSupportThread[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackThreads
      .filter((thread) => (status ? thread.status === status : true))
      .filter((thread) => includesSearch(thread.subject, search));
  }

  let query = serviceClient
    .from("support_threads")
    .select(
      "id, customer_profile_id, subject, channel, status, assigned_to, last_message_at, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(120);

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.ilike("subject", `%${search}%`);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    customerProfileId: (row.customer_profile_id as string | null) ?? null,
    subject: row.subject as string,
    channel: row.channel as SupportChannel,
    status: row.status as SupportThreadStatus,
    assignedTo: (row.assigned_to as string | null) ?? null,
    lastMessageAt: (row.last_message_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function listAdminSupportMessages(
  threadId: string,
): Promise<AdminSupportMessage[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackMessages
      .filter((message) => message.threadId === threadId)
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  }

  const { data, error } = await serviceClient
    .from("support_messages")
    .select(
      "id, thread_id, direction, message, sender_name, sender_email, sender_phone, created_at",
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    threadId: row.thread_id as string,
    direction: row.direction as SupportMessageDirection,
    message: row.message as string,
    senderName: (row.sender_name as string | null) ?? null,
    senderEmail: (row.sender_email as string | null) ?? null,
    senderPhone: (row.sender_phone as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function createSupportThread(
  input: CreateSupportThreadInput,
): Promise<{ threadId: string; customerProfileId: string | null }> {
  const serviceClient = createSupabaseServiceClient();
  const customerProfileId = await ensureCustomerProfile({
    name: input.customerName ?? null,
    email: input.customerEmail ?? null,
    phone: input.customerPhone ?? null,
  });

  if (!serviceClient) {
    const threadId = `support-${Date.now()}`;
    const messageId = `msg-${Date.now()}`;
    fallbackThreads.unshift({
      id: threadId,
      customerProfileId,
      subject: input.subject,
      channel: input.channel,
      status: "open",
      assignedTo: null,
      lastMessageAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    fallbackMessages.push({
      id: messageId,
      threadId,
      direction: "inbound",
      message: input.message,
      senderName: input.customerName ?? null,
      senderEmail: input.customerEmail ?? null,
      senderPhone: input.customerPhone ?? null,
      createdAt: nowIso(),
    });
    return { threadId, customerProfileId };
  }

  const { data: thread, error: threadError } = await serviceClient
    .from("support_threads")
    .insert({
      customer_profile_id: customerProfileId,
      subject: input.subject,
      channel: input.channel,
      status: "open",
      last_message_at: nowIso(),
    })
    .select("id")
    .single();

  if (threadError || !thread) {
    throw new Error(threadError?.message ?? "Failed to create support thread.");
  }

  const { error: messageError } = await serviceClient.from("support_messages").insert({
    thread_id: thread.id as string,
    direction: "inbound",
    message: input.message,
    sender_name: input.customerName ?? null,
    sender_email: input.customerEmail ?? null,
    sender_phone: input.customerPhone ?? null,
  });

  if (messageError) {
    throw new Error(messageError.message);
  }

  if (customerProfileId) {
    await addCustomerActivity({
      customerProfileId,
      activityType: "support_thread_created",
      referenceType: "support_thread",
      referenceId: thread.id as string,
      summary: input.subject,
      metadata: { channel: input.channel },
    });
  }

  return { threadId: thread.id as string, customerProfileId };
}

export async function addSupportMessage(input: CreateSupportMessageInput) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    fallbackMessages.push({
      id: `msg-${Date.now()}`,
      threadId: input.threadId,
      direction: input.direction,
      message: input.message,
      senderName: input.senderName ?? null,
      senderEmail: input.senderEmail ?? null,
      senderPhone: input.senderPhone ?? null,
      createdAt: nowIso(),
    });

    const thread = fallbackThreads.find((row) => row.id === input.threadId);
    if (thread) {
      thread.lastMessageAt = nowIso();
      thread.updatedAt = nowIso();
      if (input.direction === "outbound") {
        thread.status = "pending_customer";
      } else if (input.direction === "inbound") {
        thread.status = "open";
      }
    }
    return;
  }

  const { error: insertError } = await serviceClient.from("support_messages").insert({
    thread_id: input.threadId,
    direction: input.direction,
    message: input.message,
    sender_name: input.senderName ?? null,
    sender_email: input.senderEmail ?? null,
    sender_phone: input.senderPhone ?? null,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const statusAfterMessage: SupportThreadStatus =
    input.direction === "outbound"
      ? "pending_customer"
      : input.direction === "inbound"
        ? "open"
        : "open";

  const { error: updateError } = await serviceClient
    .from("support_threads")
    .update({
      last_message_at: nowIso(),
      status: statusAfterMessage,
    })
    .eq("id", input.threadId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function updateSupportThreadStatus(
  threadId: string,
  status: SupportThreadStatus,
) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    const thread = fallbackThreads.find((row) => row.id === threadId);
    if (thread) {
      thread.status = status;
      thread.updatedAt = nowIso();
    }
    return;
  }

  const { error } = await serviceClient
    .from("support_threads")
    .update({ status })
    .eq("id", threadId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminNotificationTemplates(): Promise<
  AdminNotificationTemplate[]
> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackTemplates;
  }

  const { data, error } = await serviceClient
    .from("notification_templates")
    .select("id, key, title, channel, trigger, body, is_active, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    key: row.key as string,
    title: row.title as string,
    channel: row.channel as NotificationChannel,
    trigger: row.trigger as AutomationTrigger,
    body: row.body as string,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}

export async function upsertAdminNotificationTemplate(
  input: UpsertNotificationTemplateInput,
) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    if (input.id) {
      const index = fallbackTemplates.findIndex((template) => template.id === input.id);
      if (index !== -1) {
        fallbackTemplates[index] = {
          ...fallbackTemplates[index],
          key: input.key,
          title: input.title,
          channel: input.channel,
          trigger: input.trigger,
          body: input.body,
          isActive: input.isActive,
          updatedAt: nowIso(),
        };
      }
      return;
    }

    fallbackTemplates.unshift({
      id: `tmpl-${Date.now()}`,
      key: input.key,
      title: input.title,
      channel: input.channel,
      trigger: input.trigger,
      body: input.body,
      isActive: input.isActive,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const payload = {
    key: input.key,
    title: input.title,
    channel: input.channel,
    trigger: input.trigger,
    body: input.body,
    is_active: input.isActive,
  };

  if (input.id) {
    const { error } = await serviceClient
      .from("notification_templates")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await serviceClient.from("notification_templates").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function queueNotificationJob(input: {
  templateId?: string | null;
  customerProfileId?: string | null;
  channel: NotificationChannel;
  trigger: AutomationTrigger;
  payload?: Record<string, unknown>;
  scheduledFor?: string | null;
}) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    fallbackJobs.unshift({
      id: `job-${Date.now()}`,
      templateId: input.templateId ?? null,
      customerProfileId: input.customerProfileId ?? null,
      channel: input.channel,
      trigger: input.trigger,
      status: "queued",
      scheduledFor: input.scheduledFor ?? nowIso(),
      sentAt: null,
      errorMessage: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return;
  }

  const { error } = await serviceClient.from("notification_jobs").insert({
    template_id: input.templateId ?? null,
    customer_profile_id: input.customerProfileId ?? null,
    channel: input.channel,
    trigger: input.trigger,
    payload: input.payload ?? {},
    scheduled_for: input.scheduledFor ?? nowIso(),
    status: "queued",
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listAdminNotificationJobs({
  status,
}: ListFilterParams = {}): Promise<AdminNotificationJob[]> {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return fallbackJobs.filter((job) => (status ? job.status === status : true));
  }

  let query = serviceClient
    .from("notification_jobs")
    .select(
      "id, template_id, customer_profile_id, channel, trigger, status, scheduled_for, sent_at, error_message, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(120);

  if (status) {
    query = query.eq("status", status as NotificationStatus);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    templateId: (row.template_id as string | null) ?? null,
    customerProfileId: (row.customer_profile_id as string | null) ?? null,
    channel: row.channel as NotificationChannel,
    trigger: row.trigger as AutomationTrigger,
    status: row.status as NotificationStatus,
    scheduledFor: row.scheduled_for as string,
    sentAt: (row.sent_at as string | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));
}
