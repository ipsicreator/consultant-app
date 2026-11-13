import { AcademyBridgeError, academyCors, requireAcademyUser, readAcademyJson, parseAcademyInput, generateAcademyResult } from "../server/academyBridge.js";

export default {
  async fetch(request: Request): Promise<Response> {
    let headers = new Headers({ "Vary": "Origin", "Cache-Control": "no-store" });
    try {
      headers = academyCors(request);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
      if (request.method !== "POST") { headers.set("Allow", "POST, OPTIONS"); return Response.json({ error: "지원하지 않는 요청 방식입니다." }, { status: 405, headers }); }
      await requireAcademyUser(request);
      const input = parseAcademyInput(await readAcademyJson(request));
      return Response.json(await generateAcademyResult(input), { headers });
    } catch (error) {
      const known = error instanceof AcademyBridgeError;
      return Response.json({ error: known ? error.message : "학원 분석 요청을 처리하지 못했습니다." }, { status: known ? error.status : 503, headers });
    }
  },
};
