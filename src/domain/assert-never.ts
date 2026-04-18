import { domainError, type DomainError } from "#domain/errors.js";

export const unreachable = (value: never): DomainError =>
  domainError("unreachable", `Unexpected: ${String(value)}`);
