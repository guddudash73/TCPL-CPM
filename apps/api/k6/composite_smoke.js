import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 10,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

const BASE = __ENV.API_BASE || "http://localhost:4000";
const TOKEN = __ENV.API_TOKEN;
const PROJECT_ID = __ENV.PROJECT_ID;

export default function () {
  if (!TOKEN)
    throw new Error("Set API_TOKEN env var with a valid Bearer token");
  const headers = { Authorization: `Bearer ${TOKEN}` };

  if (PROJECT_ID) {
    const r1 = http.get(
      `${BASE}/projects/composite/${PROJECT_ID}/with-stages`,
      { headers }
    );
    check(r1, { "with-stages 200": (res) => res.status === 200 });
  }

  const r2 = http.get(
    `${BASE}/projects/composite/search?q=&limit=10&offset=0`,
    { headers }
  );
  check(r2, { "search 200": (res) => res.status === 200 });

  sleep(1);
}
