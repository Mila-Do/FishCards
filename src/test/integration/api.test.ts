import { describe, it, expect, beforeEach } from "vitest";
import { server } from "../__mocks__/server";
import { http, HttpResponse } from "msw";

// Example API client function
async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

async function createUser(userData: { name: string; email: string }) {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    throw new Error("Failed to create user");
  }

  return response.json();
}

describe("API Integration Tests", () => {
  beforeEach(() => {
    // Reset handlers before each test for isolation
    server.resetHandlers();
  });

  describe("fetchUserData", () => {
    it("should fetch user data successfully", async () => {
      // Arrange - Mock API response
      const mockUser = {
        id: "123",
        name: "John Doe",
        email: "john@example.com",
      };

      server.use(
        http.get("/api/users/123", () => {
          return HttpResponse.json(mockUser);
        })
      );

      // Act
      const result = await fetchUserData("123");

      // Assert
      expect(result).toEqual(mockUser);
    });

    it("should handle API errors", async () => {
      // Arrange - Mock error response
      server.use(
        http.get("/api/users/456", () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      // Act & Assert
      await expect(fetchUserData("456")).rejects.toThrow("Failed to fetch user data");
    });
  });

  describe("createUser", () => {
    it("should create user successfully", async () => {
      // Arrange
      const newUser = { name: "Jane Doe", email: "jane@example.com" };
      const createdUser = { id: "789", ...newUser };

      server.use(
        http.post("/api/users", async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual(newUser);

          return HttpResponse.json(createdUser, { status: 201 });
        })
      );

      // Act
      const result = await createUser(newUser);

      // Assert
      expect(result).toEqual(createdUser);
    });

    it("should handle validation errors", async () => {
      // Arrange
      const invalidUser = { name: "", email: "invalid-email" };

      server.use(
        http.post("/api/users", () => {
          return HttpResponse.json({ error: "Validation failed" }, { status: 400 });
        })
      );

      // Act & Assert
      await expect(createUser(invalidUser)).rejects.toThrow("Failed to create user");
    });
  });
});
