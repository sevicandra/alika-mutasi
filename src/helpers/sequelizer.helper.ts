import { OrderItem } from "sequelize";

export const sortBuilder = (sort?: string): OrderItem[] => {
  const sorts: OrderItem[] = [];

  if (!sort || sort.trim().length === 0) return sorts;

  sort.split(",").forEach((item: string) => {
    item = item.trim();
    if (!item) return; // Skip empty items

    let direction: "ASC" | "DESC" = "ASC";

    // Check prefix minus untuk DESC
    if (item.startsWith("-")) {
      direction = "DESC";
      item = item.substring(1);
    }

    // Split by colon untuk unlimited nesting
    const parts = item
      .split(":")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (parts.length === 0) return;

    sorts.push([...parts, direction] as OrderItem);
  });

  return sorts;
};
