import { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";
import { z } from "zod";

const KRX_API = "https://krx-stock-data.agidog70.workers.dev";

function createServer() {
  const server = new McpServer({
    name: "KRX Stock Data",
    version: "1.0.0",
  });

  server.registerTool(
    "krx_stock",
    {
      description:
        "Get official KRX regular-market daily stock data for a Korean listed company. Search by 6-digit stock code or Korean company name.",
      inputSchema: z.object({
        date: z
          .string()
          .describe("Trading date in YYYYMMDD format, for example 20261001"),
        code: z
          .string()
          .optional()
          .describe("6-digit Korean stock code, for example 003490"),
        name: z
          .string()
          .optional()
          .describe("Korean company name, for example 대한항공"),
      }),
    },
    async ({ date, code, name }) => {
      if (!code && !name) {
        return {
          content: [
            {
              type: "text",
              text: "Either code or name is required.",
            },
          ],
        };
      }

      const params = new URLSearchParams({ date });

      if (code) params.set("code", code);
      if (name) params.set("name", name);

      const response = await fetch(
        `${KRX_API}/stock?${params.toString()}`
      );

      const text = await response.text();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `KRX request failed (${response.status}): ${text}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text,
          },
        ],
      };
    }
  );

  server.registerTool(
    "krx_market",
    {
      description:
        "Get official KRX regular-market daily data for all stocks in KOSPI or KOSDAQ for a specified trading date.",
      inputSchema: z.object({
        date: z
          .string()
          .describe("Trading date in YYYYMMDD format"),
        market: z
          .enum(["KOSPI", "KOSDAQ"])
          .describe("KRX market"),
      }),
    },
    async ({ date, market }) => {
      const params = new URLSearchParams({
        date,
        market,
      });

      const response = await fetch(
        `${KRX_API}/market?${params.toString()}`
      );

      const text = await response.text();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `KRX request failed (${response.status}): ${text}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text,
          },
        ],
      };
    }
  );

  return server;
}

const handler = createMcpHandler(createServer);

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return handler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
