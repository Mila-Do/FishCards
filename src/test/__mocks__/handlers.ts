import { http, HttpResponse } from "msw";

export const handlers = [
  // Example API endpoint mock
  http.get("/api/test", () => {
    return HttpResponse.json({
      message: "Mock response",
      success: true,
    });
  }),

  // Example POST endpoint
  http.post("/api/test", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        message: "Created successfully",
        data: body,
      },
      { status: 201 }
    );
  }),

  // Add more handlers here as needed
  // http.get('/api/users', () => { ... }),
  // http.post('/api/auth/login', () => { ... }),
];
