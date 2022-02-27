import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext): number | undefined => {
    if (context.getType() === 'http')
      return context.switchToHttp().getRequest().user;

    const gqlCtx = GqlExecutionContext.create(context).getContext();

    return gqlCtx.reply.request?.user ?? gqlCtx?.user;
  },
);
