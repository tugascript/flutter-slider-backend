export const contextToUser = (ctx: Record<string, any>): number | undefined => {
  return ctx.reply?.request?.user;
};
