// JSON.stringify doesn't escape "<", so a value containing the literal
// string "</script>" (e.g. a product name/description someone pastes into
// the admin form) would prematurely close the script tag it's injected
// into and let arbitrary HTML/script run on the page. Escaping "<" as its
// unicode form keeps the JSON valid while making that impossible.
export function jsonLdScript(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
