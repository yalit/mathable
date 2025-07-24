//@ts-ignore
export function classnames(...classes): string {
  return classes.filter(Boolean).join(" ");
}
