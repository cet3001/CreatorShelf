import { createTRPCRouter, publicProcedure } from "../create-context";

export const exampleRouter = createTRPCRouter({
  hi: publicProcedure.query(() => {
    return { status: "ok", message: "CreatorShelf API is running" };
  }),
});
