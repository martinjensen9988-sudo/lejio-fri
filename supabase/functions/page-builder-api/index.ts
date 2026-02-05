import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { v4 as uuidv4 } from "https://deno.land/std@0.208.0/uuid/mod.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface PageRequest {
  slug: string;
  title: string;
  meta_description?: string;
}

interface BlockRequest {
  block_type: string;
  position: number;
  config: Record<string, any>;
}

// Helper to validate lessor ownership
async function validateLessorAccess(lessorId: string, token: string) {
  const jwtPayload = JSON.parse(atob(token.split('.')[1]));
  return jwtPayload.lessor_id === lessorId;
}

// GET /api/pages?lessor_id=xxx
async function getPages(req: Request) {
  const url = new URL(req.url);
  const lessorId = url.searchParams.get("lessor_id");
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!lessorId || !token || !(await validateLessorAccess(lessorId, token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const { data, error } = await supabase
    .from("fri_pages")
    .select("*")
    .eq("lessor_id", lessorId)
    .order("created_at", { ascending: false });

  if (error) return new Response(JSON.stringify(error), { status: 400 });
  return new Response(JSON.stringify(data), { status: 200 });
}

// GET /api/pages/:id
async function getPage(req: Request, pageId: string) {
  const { data: page, error: pageError } = await supabase
    .from("fri_pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (pageError) return new Response(JSON.stringify(pageError), { status: 404 });

  const { data: blocks } = await supabase
    .from("fri_page_blocks")
    .select("*")
    .eq("page_id", pageId)
    .order("position", { ascending: true });

  return new Response(JSON.stringify({ ...page, blocks }), { status: 200 });
}

// POST /api/pages
async function createPage(req: Request) {
  const { lessor_id, slug, title, meta_description } = await req.json();
  const token = req.headers.get("Authorization")?.split(" ")[1];

  if (!lessor_id || !token || !(await validateLessorAccess(lessor_id, token))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const { data, error } = await supabase.from("fri_pages").insert({
    id: uuidv4(),
    lessor_id,
    slug,
    title,
    meta_description,
    layout_json: JSON.stringify({ blocks: [] }),
  });

  if (error) return new Response(JSON.stringify(error), { status: 400 });
  return new Response(JSON.stringify(data), { status: 201 });
}

// PUT /api/pages/:id
async function updatePage(req: Request, pageId: string) {
  const { title, meta_description } = await req.json();

  const { data, error } = await supabase
    .from("fri_pages")
    .update({ title, meta_description, updated_at: new Date() })
    .eq("id", pageId);

  if (error) return new Response(JSON.stringify(error), { status: 400 });
  return new Response(JSON.stringify(data), { status: 200 });
}

// POST /api/pages/:id/blocks
async function addBlock(req: Request, pageId: string) {
  const { block_type, position, config } = (await req.json()) as BlockRequest;

  const { data, error } = await supabase.from("fri_page_blocks").insert({
    id: uuidv4(),
    page_id: pageId,
    block_type,
    position,
    config: JSON.stringify(config),
  });

  if (error) return new Response(JSON.stringify(error), { status: 400 });
  return new Response(JSON.stringify(data), { status: 201 });
}

// PUT /api/pages/:pageId/blocks/:blockId
async function updateBlock(req: Request, pageId: string, blockId: string) {
  const { block_type, position, config } = await req.json();

  const { data, error } = await supabase
    .from("fri_page_blocks")
    .update({ block_type, position, config: JSON.stringify(config) })
    .eq("id", blockId)
    .eq("page_id", pageId);

  if (error) return new Response(JSON.stringify(error), { status: 400 });
  return new Response(JSON.stringify(data), { status: 200 });
}

// DELETE /api/pages/:pageId/blocks/:blockId
async function deleteBlock(req: Request, pageId: string, blockId: string) {
  const { error } = await supabase
    .from("fri_page_blocks")
    .delete()
    .eq("id", blockId)
    .eq("page_id", pageId);

  if (error) return new Response(JSON.stringify(error), { status: 400 });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// POST /api/pages/:id/publish
async function publishPage(req: Request, pageId: string) {
  const { data, error } = await supabase
    .from("fri_pages")
    .update({ is_published: true, published_at: new Date() })
    .eq("id", pageId);

  if (error) return new Response(JSON.stringify(error), { status: 400 });
  return new Response(JSON.stringify(data), { status: 200 });
}

// GET /api/block-types
async function getBlockTypes() {
  const { data, error } = await supabase
    .from("fri_block_types")
    .select("*")
    .order("category");

  if (error) return new Response(JSON.stringify(error), { status: 400 });
  return new Response(JSON.stringify(data), { status: 200 });
}

// GET /api/templates
async function getTemplates() {
  const { data, error } = await supabase
    .from("fri_page_templates")
    .select("*")
    .eq("is_public", true)
    .order("category");

  if (error) return new Response(JSON.stringify(error), { status: 400 });
  return new Response(JSON.stringify(data), { status: 200 });
}

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // CORS
  if (method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    // Routes
    if (path === "/api/pages" && method === "GET") return await getPages(req);
    if (path === "/api/pages" && method === "POST") return await createPage(req);
    if (path === "/api/block-types") return await getBlockTypes();
    if (path === "/api/templates") return await getTemplates();

    const pageMatch = path.match(/^\/api\/pages\/([^/]+)$/);
    if (pageMatch && method === "GET") return await getPage(req, pageMatch[1]);
    if (pageMatch && method === "PUT") return await updatePage(req, pageMatch[1]);

    const publishMatch = path.match(/^\/api\/pages\/([^/]+)\/publish$/);
    if (publishMatch && method === "POST") return await publishPage(req, publishMatch[1]);

    const blockMatch = path.match(/^\/api\/pages\/([^/]+)\/blocks$/);
    if (blockMatch && method === "POST") return await addBlock(req, blockMatch[1]);

    const updateBlockMatch = path.match(/^\/api\/pages\/([^/]+)\/blocks\/([^/]+)$/);
    if (updateBlockMatch && method === "PUT") {
      return await updateBlock(req, updateBlockMatch[1], updateBlockMatch[2]);
    }
    if (updateBlockMatch && method === "DELETE") {
      return await deleteBlock(req, updateBlockMatch[1], updateBlockMatch[2]);
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
