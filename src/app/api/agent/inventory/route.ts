import { NextResponse } from "next/server";
import { catalog, type Product, type ThirdPartyService } from "@/lib/agent/inventory";
import { checkRateLimit, getClientId } from "@/lib/security";

/**
 * GET /api/agent/inventory — list all products and third-party services.
 * Public endpoint for marketplace discovery.
 */
export async function GET() {
  const products = catalog.listProducts();
  const services = catalog.listServices();

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      tags: p.tags,
      outputType: p.outputType,
      mayRequireExternalData: p.mayRequireExternalData,
    })),
    thirdPartyServices: services.map((s) => ({
      id: s.id,
      did: s.did,
      name: s.name,
      description: s.description,
      provider: s.provider,
      priceCredits: s.priceCredits,
      type: s.type,
      tags: s.tags,
      updatedAt: s.updatedAt,
    })),
    counts: {
      products: products.length,
      thirdPartyServices: services.length,
    },
  });
}

/**
 * POST /api/agent/inventory — add or import products / third-party services.
 * Protected by rate limiting. In production, add auth.
 *
 * Body shapes:
 *   { action: "add_product", product: Product }
 *   { action: "add_service", service: ThirdPartyService }
 *   { action: "import_services", services: ThirdPartyService[] }
 */
export async function POST(request: Request) {
  const clientId = getClientId(request);
  const rateCheck = checkRateLimit(`inventory:${clientId}`, 30, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 }
    );
  }

  const body = (await request.json()) as {
    action?: string;
    product?: Product;
    service?: ThirdPartyService;
    services?: ThirdPartyService[];
  };

  const action = body.action;

  if (action === "add_product" && body.product) {
    const p = body.product;
    if (!p.id || !p.name) {
      return NextResponse.json({ error: "Product must have id and name" }, { status: 400 });
    }
    catalog.addProduct(p);
    return NextResponse.json({ status: "ok", message: `Product "${p.name}" added`, id: p.id });
  }

  if (action === "add_service" && body.service) {
    const s = body.service;
    if (!s.id || !s.name) {
      return NextResponse.json({ error: "Service must have id and name" }, { status: 400 });
    }
    catalog.addService(s);
    return NextResponse.json({ status: "ok", message: `Service "${s.name}" added`, id: s.id });
  }

  if (action === "import_services" && Array.isArray(body.services)) {
    const count = catalog.importServices(body.services);
    return NextResponse.json({
      status: "ok",
      message: `${count} service(s) imported`,
      totalServices: catalog.listServices(false).length,
    });
  }

  return NextResponse.json(
    { error: "Unknown action. Use: add_product, add_service, or import_services" },
    { status: 400 }
  );
}
