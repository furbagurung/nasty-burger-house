import type { Instrumentation } from "next";

import { reportAdminError } from "./app/lib/error-monitoring";

export function register() {}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  await reportAdminError(error, {
    source: "server",
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    metadata: {
      routerKind: context.routerKind,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
    },
  });
};
