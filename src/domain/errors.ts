export type DomainError = Readonly<{
  readonly kind: "domain";
  readonly code: string;
  readonly message: string;
}>;

export const domainError = (code: string, message: string): DomainError => ({
  kind: "domain",
  code,
  message,
});
