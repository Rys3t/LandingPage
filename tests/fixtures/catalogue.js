export function sampleCatalogue() {
  return {
    cloudName: "test-cloud",
    generatedAt: "2026-09-29T00:00:00Z",
    collections: [{ id: "portfolio", rootFolder: "portfolio", count: 1 }, { id: "street", rootFolder: "street", count: 0 }],
    series: [{ collection: "portfolio", name: "2026 Event", count: 1 }],
    tags: [{ collection: "portfolio", name: "portrait", count: 1 }],
    items: [{
      collection: "portfolio", publicId: "portfolio/2026 Event/photo", folder: "portfolio/2026 Event",
      series: "2026 Event", format: "jpg", width: 800, height: 1200, tags: ["portrait"],
      title: "Photo", caption: "Caption", createdAt: "2026-09-29T00:00:00Z", version: 123,
    }],
  };
}

export async function invoke(handler, path = "/api/gallery", method = "GET", headers = {}) {
  const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end(body) { this.body = body; } };
  await handler({ url: path, method, headers }, response);
  return response;
}
