import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://husseinmishbak.github.io",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
]);

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin)
      ? origin
      : "https://husseinmishbak.github.io",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function reply(status: number, body: Record<string, unknown>, origin: string | null): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

async function removeFolderRecursively(admin: any, folder: string): Promise<void> {
  const bucket = admin.storage.from("student-audio");
  const limit = 1000;

  // Re-read from offset zero after every removal batch. Storage listings shrink
  // while files are deleted, so incrementing offsets can skip remaining files.
  while (true) {
    const { data, error } = await bucket.list(folder, {
      limit,
      offset: 0,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error("تعذر فحص التسجيلات الصوتية قبل الحذف.");
    if (!data?.length) return;

    const files: string[] = [];
    const folders: string[] = [];
    for (const entry of data) {
      if (!entry.name || entry.name === "." || entry.name === "..") continue;
      const path = folder ? folder + "/" + entry.name : entry.name;
      if (entry.id == null) folders.push(path);
      else files.push(path);
    }

    for (const child of folders) await removeFolderRecursively(admin, child);
    for (let i = 0; i < files.length; i += 100) {
      const { error: removeError } = await bucket.remove(files.slice(i, i + 100));
      if (removeError) throw new Error("تعذر حذف بعض التسجيلات الصوتية؛ لم يُحذف الحساب.");
    }

    if (files.length === 0 && folders.length === 0) {
      throw new Error("تعذر تحديد محتويات مجلد التسجيلات؛ لم يُحذف الحساب.");
    }
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return reply(405, { error: "استخدم طلب POST." }, origin);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    console.error("Missing required Supabase function environment variables.");
    return reply(500, { error: "خدمة حذف الحساب غير مكتملة الإعداد. يرجى التواصل مع إدارة المنصة." }, origin);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return reply(401, { error: "يجب تسجيل الدخول أولاً." }, origin);
  }
  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) {
    return reply(401, { error: "انتهت جلسة الدخول. سجّل الدخول مجدداً." }, origin);
  }

  let body: { confirmation?: string };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "طلب غير صالح." }, origin);
  }
  if (body.confirmation !== "DELETE_MY_ACCOUNT") {
    return reply(400, { error: "لم يتم تأكيد طلب حذف الحساب." }, origin);
  }

  const userId = userData.user.id;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Could not verify account role:", profileError.message);
    return reply(500, { error: "تعذر التحقق من نوع الحساب؛ لم يُحذف شيء." }, origin);
  }
  if (!profile || profile.role !== "student") {
    return reply(403, { error: "الحذف الذاتي متاح لحسابات الطلاب فقط. تواصل مع إدارة المنصة لحذف حساب المدرّس." }, origin);
  }

  // Remove all objects in the account folder before auth deletion. If any
  // storage cleanup fails, stop so account data is not half-deleted silently.
  try {
    await removeFolderRecursively(admin, userId);
  } catch (error) {
    console.error("Audio cleanup failed:", error instanceof Error ? error.message : "Unknown storage error");
    return reply(500, {
      error: error instanceof Error ? error.message : "تعذر حذف التسجيلات؛ لم يُحذف الحساب.",
    }, origin);
  }

  // Foreign keys cascade removal to profiles, progress, quiz attempts and
  // speaking submissions when the auth user is deleted.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("Auth user deletion failed:", deleteError.message);
    return reply(500, { error: "تعذر حذف الحساب. يرجى التواصل مع إدارة المنصة." }, origin);
  }
  return reply(200, { success: true, message: "تم حذف حساب الطالب وبياناته وتسجيلاته الصوتية." }, origin);
});
