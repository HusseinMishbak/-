import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}
async function removeFolderRecursively(admin: any, folder: string): Promise<void> {
  const bucket = admin.storage.from("student-audio");
  const limit = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await bucket.list(folder, { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error("تعذر فحص التسجيلات الصوتية قبل الحذف.");
    if (!data?.length) break;
    const files: string[] = [];
    const folders: string[] = [];
    for (const entry of data) {
      const path = folder ? folder + "/" + entry.name : entry.name;
      if (entry.id == null) folders.push(path);
      else files.push(path);
    }
    for (const child of folders) await removeFolderRecursively(admin, child);
    for (let i = 0; i < files.length; i += 100) {
      const { error: removeError } = await bucket.remove(files.slice(i, i + 100));
      if (removeError) throw new Error("تعذر حذف بعض التسجيلات الصوتية؛ لم يُحذف الحساب.");
    }
    if (data.length < limit) break;
    offset += data.length;
  }
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply(405, { error: "استخدم طلب POST." });
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, { error: "يجب تسجيل الدخول أولاً." });
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    console.error("Missing required Supabase function environment variables.");
    return reply(500, { error: "خدمة حذف الحساب غير مكتملة الإعداد. يرجى التواصل مع إدارة المنصة." });
  }
  const token = authorization.slice("Bearer ".length);
  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return reply(401, { error: "انتهت جلسة الدخول. سجّل الدخول مجدداً." });
  let body: { confirmation?: string };
  try { body = await req.json(); } catch { return reply(400, { error: "طلب غير صالح." }); }
  if (body.confirmation !== "DELETE_MY_ACCOUNT") return reply(400, { error: "لم يتم تأكيد طلب حذف الحساب." });
  const userId = userData.user.id;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: profile, error: profileError } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profileError) {
    console.error("Could not verify account role:", profileError.message);
    return reply(500, { error: "تعذر التحقق من نوع الحساب؛ لم يُحذف شيء." });
  }
  if (!profile || profile.role !== "student") {
    return reply(403, { error: "الحذف الذاتي متاح لحسابات الطلاب فقط. تواصل مع إدارة المنصة لحذف حساب المدرّس." });
  }
  try { await removeFolderRecursively(admin, userId); }
  catch (error) {
    console.error("Audio cleanup failed:", error);
    return reply(500, { error: error instanceof Error ? error.message : "تعذر حذف التسجيلات؛ لم يُحذف الحساب." });
  }
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("Auth user deletion failed:", deleteError.message);
    return reply(500, { error: "تعذر حذف الحساب. يرجى التواصل مع إدارة المنصة." });
  }
  return reply(200, { success: true, message: "تم حذف حساب الطالب وبياناته وتسجيلاته الصوتية." });
});
